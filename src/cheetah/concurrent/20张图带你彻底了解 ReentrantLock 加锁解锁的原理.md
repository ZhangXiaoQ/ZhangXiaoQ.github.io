---
title: 20张图带你彻底了解 ReentrantLock 加锁解锁的原理
icon: rank
order: 1
category:
  - 并发
tag:
  - AQS
  - 加锁
  - 解锁

---

最近是上班忙项目，下班带娃，忙的不可开交，连摸鱼的时间都没有了。今天趁假期用**图解**的方式从**源码**角度给大家说一下`ReentrantLock`加锁解锁的全过程。系好安全带，发车了。

## 简单使用

在聊它的源码之前，我们先来做个简单的使用说明。当我在`IDEA`中创建了一个简单的`Demo`之后，它会给出以下提示

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3e7b3739f1c7464cb8923ef31e7f1f7b~tplv-k3u1fbpfcp-zoom-1.image)


### 提示文字

在使用阻塞等待获取锁的方式中，必须在`try`代码块之外，并且在加锁方法与`try`代码块之间没有任何可能抛出异常的方法调用，避免加锁成功后，在`finally`中无法解锁。

- 1、如果在`lock`方法与`try`代码块之间的方法调用抛出异常，那么无法解锁，造成其它线程无法成功获取锁。
- 2、如果`lock`方法在`try`代码块之内，可能由于其它方法抛出异常，导致在`finally`代码块中，`unlock`对未加锁的对象解锁，它会调用`AQS`的`tryRelease`方法（取决于具体实现类），抛出`IllegalMonitorStateException`异常。
- 3、在`Lock`对象的`lock`方法实现中可能抛出`unchecked`异常，产生的后果与说明二相同。 

`java.concurrent.LockShouldWithTryFinallyRule.rule.desc`

还举了两个例子，正确案例如下：

```java
Lock lock = new XxxLock();
// ...
lock.lock();
try {
    doSomething();
    doOthers();
} finally {
    lock.unlock();
}
```

错误案例如下：

```java
Lock lock = new XxxLock();
// ...
try {
    // 如果在此抛出异常，会直接执行 finally 块的代码
    doSomething();
    // 不管锁是否成功，finally 块都会执行
    lock.lock();
    doOthers();

} finally {
    lock.unlock();
} 
```

## AQS 

上边的案例中加锁调用的是`lock()`方法，解锁用的是`unlock()`方法，而通过查看源码发现它们都是调用的内部静态抽象类`Sync`的相关方法。

`abstract static class Sync extends AbstractQueuedSynchronizer`

`Sync `是通过继承`AbstractQueuedSynchronizer`来实现的，没错，`AbstractQueuedSynchronizer`就是`AQS`的全称。`AQS`内部维护着一个`FIFO`的双向队列（`CLH`），`ReentrantLock`也是基于它来实现的，先来张图感受下。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b4f354c7065340f6b458e84f5c8d3067~tplv-k3u1fbpfcp-zoom-1.image)


### Node 属性

```java
//此处是 Node 的部分属性
static final class Node {
	
	//排他锁标识
	static final Node EXCLUSIVE = null;

	//如果带有这个标识，证明是失效了
	static final int CANCELLED =  1;
	
	//具有这个标识，说明后继节点需要被唤醒
	static final int SIGNAL = -1;

	//Node对象存储标识的地方
	volatile int waitStatus;

	//指向上一个节点
	volatile Node prev;

	//指向下一个节点
	volatile Node next;
	
	//当前Node绑定的线程
	volatile Thread thread;
	
	//返回前驱节点即上一个节点，如果前驱节点为空，抛出异常
	final Node predecessor() throws NullPointerException {
		Node p = prev;
		if (p == null)
			throw new NullPointerException();
		else
			return p;
	}
}
```

对于里边的`waitStatus`属性，我们需要做个解释：**（非常重要）**

- CANCELLED(1)：当前节点取消获取锁。当等待超时或被中断(响应中断)，会触发变更为此状态，进入该状态后节点状态不再变化；
- SIGNAL(-1)：后面节点等待当前节点唤醒；
- CONDITION(-2)：`Condition`中使用，当前线程阻塞在`Condition`，如果其他线程调用了`Condition`的`signal`方法，这个结点将从等待队列转移到同步队列队尾，等待获取同步锁；
- PROPAGATE(-3)：共享模式，前置节点唤醒后面节点后，唤醒操作无条件传播下去；
- 0：中间状态，当前节点后面的节点已经唤醒，但是当前节点线程还没有执行完成；

### AQS 属性

```java
// 头结点
private transient volatile Node head;

// 尾结点
private transient volatile Node tail;

//0->1 拿到锁，大于0 说明当前已经有线程占用了锁资源
private volatile int state;
```

今天我们先简单了解下`AQS`的构造以帮助大家更好的理解`ReentrantLock`，至于深层次的东西先不做展开！

## 加锁

对`AQS`的结构有了基本了解之后，我们正式进入主题——加锁。从源码中可以看出锁被分为**公平锁**和**非公平锁**。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f175e229030449baa11b462e702e1e3d~tplv-k3u1fbpfcp-zoom-1.image)


```java
/**
 * 公平锁代码
 */
final void lock() {
    acquire(1);
}

/**
 * 非公平锁代码
 */
final void lock() {
    if (compareAndSetState(0, 1))
        setExclusiveOwnerThread(Thread.currentThread());
    else
        acquire(1);
}
```

初步查看代码发现非公平锁似乎包含公平锁的逻辑，所以我们就从“非公平锁”开始。

### 非公平锁

```java
final void lock() {
    //通过 CAS 的方式尝试将 state 从0改为1，
    //如果返回 true，代表修改成功，获得锁资源;
    //如果返回false，代表修改失败，未获取锁资源
    if (compareAndSetState(0, 1))
        // 将属性exclusiveOwnerThread设置为当前线程，该属性是AQS的父类提供的
        setExclusiveOwnerThread(Thread.currentThread());
    else
        acquire(1);
}
```

> `compareAndSetState()`：底层调用的是`unsafe`的`compareAndSwapInt`，该方法是原子操作；

假设有两个线程（`t1`、`t2`）在竞争锁资源，线程1获取锁资源之后，执行`setExclusiveOwnerThread`操作，设置属性值为当前线程`t1`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/532bbe281fd34ec499e409e905697807~tplv-k3u1fbpfcp-zoom-1.image)


此时，当`t2`想要获取锁资源，调用`lock()`方法之后，执行`compareAndSetState(0, 1)`返回`false`，会走`else`执行`acquire()`方法。

### 方法查看

```java
public final void accquire(int arg) {
    // tryAcquire 再次尝试获取锁资源，如果尝试成功，返回true，尝试失败返回false
    if (!tryAcquire(arg) &&
        // 走到这，代表获取锁资源失败，需要将当前线程封装成一个Node，追加到AQS的队列中
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        // 线程中断
        selfInterrupt();
}
```

`accquire()`中涉及的方法比较多，我们将进行拆解，一个一个来分析，顺序：`tryAcquire() -> addWaiter() -> acquireQueued()`

#### 查看 tryAcquire() 方法

```java
//AQS中
protected boolean tryAcquire(int arg) {
    //AQS 是基类，具体实现在自己的类中实现，我们去查看“非公平锁”中的实现
    throw new UnsupportedOperationException();
}

//ReentrantLock 中
protected final boolean tryAcquire(int acquires) {
    return nonfairTryAcquire(acquires);
}


final boolean nonfairTryAcquire(int acquires) {
  // 获取当前线程
	final Thread current = Thread.currentThread();
  //获取AQS 的 state 
	int c = getState();
  // 如果 state 为0，代表尝试再次获取锁资源
	if (c == 0) {
    // 步骤同上：通过 CAS 的方式尝试将 state 从0改为1，
    //如果返回 true，代表修改成功，获得锁资源;
    //如果返回false，代表修改失败，未获取锁资源
		if (compareAndSetState(0, acquires)) {
      //设置属性为当前线程
			setExclusiveOwnerThread(current);
			return true;
		}
	}
  //当前占有锁资源的线程是否是当前线程，如果是则证明是可重入操作
	else if (current == getExclusiveOwnerThread()) {
    //将 state + 1
		int nextc = c + acquires;
    //为什么会小于 0 呢？因为最大值 + 1 后会将符号位的0改为1 会变成负数(可参考Integer.MAX_VALUE + 1)
		if (nextc < 0) // overflow
      //加1后小于0，超出锁可重入的最大值，抛异常
			throw new Error("Maximum lock count exceeded");
    //设置 state 状态
		setState(nextc);
		return true;
	}
	return false;
}
```

因为线程1已经获取到了锁，此时`state`为1，所以不走`nonfairTryAcquire()`的`if`。又因为当前是线程2，不是占有当前锁的线程1，所以也不会走`else if`，即`tryAcquire()`方法返回`false`。

#### 查看 addWaiter() 方法

走到本方法中，代表获取锁资源失败。`addWaiter()`将没有获取到锁资源的线程甩到队列的尾部。

```java
private Node addWaiter(Node mode) {
  //创建 Node 类，并且设置 thread 为当前线程，设置为排它锁
	Node node = new Node(Thread.currentThread(), mode);
	// 获取 AQS 中队列的尾部节点
	Node pred = tail;
  // 如果 tail == null，说明是空队列，
  // 不为 null，说明现在队列中有数据，
	if (pred != null) {
    // 将当前节点的 prev 指向刚才的尾部节点，那么当前节点应该设置为尾部节点
		node.prev = pred;
    // CAS 将 tail 节点设置为当前节点
		if (compareAndSetTail(pred, node)) {
      // 将之前尾节点的 next 设置为当前节点
			pred.next = node;
      // 返回当前节点
			return node;
		}
	}
	enq(node);
	return node;
}
```

当`tail`不为空，即队列中有数据时，我们来图解一下`pred!=null`代码块中的代码。初始化状态如下，`pred`指向尾节点，`node`指向新的节点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7fbb0fac9e43467bbce1cf508cc37e7b~tplv-k3u1fbpfcp-zoom-1.image)


`node.prev = pred;`将`node`的前驱节点设置为`pred`指向的节点

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c9399f82677b40289fccf0dd6f28a885~tplv-k3u1fbpfcp-zoom-1.image)


`compareAndSetTail(pred, node)`通过`CAS`的方式尝试将当前节点`node`设置为尾结点，此处我们假设设置成功，则`FIFO`队列的`tail`指向`node`节点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b7591657b463413e9d3f099d92197a2b~tplv-k3u1fbpfcp-zoom-1.image)


`pred.next = node;`将`pred`节点的后继节点设置为`node`节点，此时`node`节点成功进入`FIFO`队列尾部。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8f88acdcebca4022b5d5b70cb40fd972~tplv-k3u1fbpfcp-zoom-1.image)


而当`pred`为空，即队列中没有节点或将`node`节点设置为尾结点失败时，会走`enq()`方法。我们列举的例子就符合`pred`为空的情况，就让我们以例子为基础继续分析吧。

```java
//现在没人排队，我是第一个 || 前边CAS失败也会进入这个位置重新往队列尾巴去塞
private Node enq(final Node node) {
  //死循环
	for (;;) {
    //重新获取tail节点
		Node t = tail;
    // 没人排队，队列为空
		if (t == null) {
      // 初始化一个 Node 为 head，而这个head 没有意义
			if (compareAndSetHead(new Node()))
        // 将头尾都指向了这个初始化的Node，第一次循环结束
				tail = head;
		} else {
      // 有人排队，往队列尾巴塞
			node.prev = t;
      // CAS 将 tail 节点设置为当前节点
			if (compareAndSetTail(t, node)) {
        //将之前尾节点的 next 设置为当前节点
				t.next = node;
				return t;
			}
		}
	}
}
```

进入死循环，首先会走`if`方法的逻辑，通过`CAS`的方式尝试将一个新节点设置为`head`节点，然后将`tail`也指向新节点。可以看出队列中的头节点只是个初始化的节点，没有任何意义。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c12dae841a214c8e9412ab14e1db7870~tplv-k3u1fbpfcp-zoom-1.image)


继续走死循环中的代码，此时`t`不为`null`，所以会走`else`方法。将`node`的前驱节点指向`t`，通过`CAS`方式将当前节点`node`设置为尾结点，然后将`t`的后继节点指向`node`。此时线程2的节点就被成功塞入`FIFO`队列尾部。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/693d1ab383da42c19c4570ee547b4700~tplv-k3u1fbpfcp-zoom-1.image)


#### 查看 acquireQueued()方法

将已经在队列中的`node`尝试去获取锁否则挂起。

```java
final boolean acquireQueued(final Node node, int arg) {
  // 获取锁资源的标识,失败为 true，成功为 false
	boolean failed = true;
	try {
    // 线程中断的标识，中断为 true，不中断为 false
		boolean interrupted = false;
		for (;;) {
      // 获取当前节点的上一个节点
			final Node p = node.predecessor();
      //p为头节点，尝试获取锁操作
			if (p == head && tryAcquire(arg)) {
				setHead(node);
				p.next = null;
        // 将获取锁失败标识置为false
				failed = false;
        // 获取到锁资源，不会被中断
				return interrupted;
			}
      // p 不是 head 或者 没拿到锁资源，
			if (shouldParkAfterFailedAcquire(p, node) &&
        // 基于 Unsafe 的 park方法，挂起线程
				parkAndCheckInterrupt())
				interrupted = true;
		}
	} finally {
		if (failed)
			cancelAcquire(node);
	}
}
```

这里又出现了一次死循环，首先获取当前节点的前驱节点p，如果p是头节点(头节点没有意义)，说明`node`是`head`后的第一个节点，此时当前获取锁资源的线程1可能会释放锁，所以线程2可以再次尝试获取锁。

假设获取成功，证明拿到锁资源了，将`node`节点设置为`head`节点，并将`node`节点的`pre`和`thread`设置为`null`。因为拿到锁资源了，`node`节点就不需要排队了。

将头节点p的`next`置为`null`，此时p节点就不在队列中存在了，可以帮助`GC`回收(可达性分析)。`failed`设置为`false`，表明获取锁成功；`interrupted`为`false`，则线程不会中断。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/763ef4bb8192407eb0337d458938a1f8~tplv-k3u1fbpfcp-zoom-1.image)


如果p不是`head`节点或者没有拿到锁资源，会执行下边的代码，因为我们的线程1没有释放锁资源，所以线程2获取锁失败，会继续往下执行。

```java
//该方法的作用是保证上一个节点的waitStatus状态为-1（为了唤醒后继节点）
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
  //获取上一个节点的状态,该状态为-1，才会唤醒下一个节点。
	int ws = pred.waitStatus;
  // 如果上一个节点的状态是SIGNAL即-1，可以唤醒下一个节点，直接返回true
	if (ws == Node.SIGNAL)
		return true;
  // 如果上一个节点的状态大于0，说明已经失效了
	if (ws > 0) {
		do {
      // 将node 的节点与 pred 的前一个节点相关联，并将前一个节点赋值给 pred
			node.prev = pred = pred.prev;
		} while (pred.waitStatus > 0); // 一直找到小于等于0的
    // 将重新标识好的最近的有效节点的 next 指向当前节点
		pred.next = node;
	} else {
    // 小于等于0，但是不等于-1，将上一个有效节点状态修改为-1
		compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
	}
	return false;
}
```

> 只有节点的状态为-1，才会唤醒后一个节点，如果节点状态未设置，默认为0。

图解一下`ws>0`的过程，因为`ws>0`的节点为失效节点，所以`do...while`中会重复向前查找前驱节点，直到找到第一个`ws<=0`的节点为止，将`node`节点挂到该节点上。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c280229a98ea494a93ad34205fff342c~tplv-k3u1fbpfcp-zoom-1.image)


我们的`pred`是头结点且未设置状态，所以状态为0，会走`else`。通过`CAS`尝试将`pred`节点的`waitStatus`设置为-1，表明`node`节点需要被`pred`唤醒。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4e1bfff84ed64582ba270b004cd1ffae~tplv-k3u1fbpfcp-zoom-1.image)


`shouldParkAfterFailedAcquire()`返回`false`，继续执行`acquireQueued()`中的死循环。

步骤和上边一样，`node`的前驱节点还是`head`，继续尝试获取锁。如果线程1释放了锁，线程2就可以拿到，返回`true`；否则继续调用`shouldParkAfterFailedAcquire()`，因为上一步已经将前驱结点的`ws`设置为-1了，所以直接返回`true`。

执行`parkAndCheckInterrupt()`方法，通过`UNSAFE.park();`方法阻塞当前线程2。等以后执行`unpark`方法的时候，如果`node`是头节点后的第一个节点，会进入`acquireQueued()`方法中走`if (p == head && tryAcquire(arg))`的逻辑获取锁资源并结束死循环。

#### 查看cancelAcquire()方法

该方法执行的机率约等于0，为什么这么说呢？因为针对`failed`属性，只有`JVM`内部出现问题时，才可能出现异常，执行该方法。

```java
// node 为当前节点
private void cancelAcquire(Node node) {
	if (node == null)
		return;
	node.thread = null;
  // 上一个节点
	Node pred = node.prev;
  // 节点状态大于0，说明节点失效
	while (pred.waitStatus > 0)
		node.prev = pred = pred.prev;

  // 将第一个不是失效节点的后继节点声明出来
	Node predNext = pred.next;
 	// 节点状态变为失效
	node.waitStatus = Node.CANCELLED;
	// node为尾节点，cas设置pred为尾节点
	if (node == tail && compareAndSetTail(node, pred)) {
    //cas将pred的next设置为null
		compareAndSetNext(pred, predNext, null);
	} else {
		int ws;
    // 中间节点
    // 如果上一个节点不是head 节点
		if (pred != head &&
			((ws = pred.waitStatus) == Node.SIGNAL ||
        // 前边已经判断了大于0的操作，
        // pred 是需要唤醒后继节点的，所以当 waitStatus 不为 -1 时，需要将 pred 节点的 waitStatus 设置为 -1 
			 (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) &&
			pred.thread != null) {
			Node next = node.next;
			if (next != null && next.waitStatus <= 0)
        // CAS 尝试将 pred 的 next 指向当前节点的 next
				compareAndSetNext(pred, predNext, next);
		} else {
      // head 节点，唤醒后继节点
			unparkSuccessor(node);
		}

		node.next = node; // help GC
	}
}
```

执行到`while`时找到前驱节点中最近的有效节点，把当前节点`node`挂到有效节点后边，可以过滤掉当前节点前的失效节点。声明出有效节点的第一个后继无效节点`predNext`，并把当前的`node`节点状态设置为失效状态。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/174836ffc3a945fa981dbe890f09acc1~tplv-k3u1fbpfcp-zoom-1.image)


`if`中的操作：如果当前节点是尾节点，`CAS`尝试将最近的有效节点设置为尾节点，并将尾节点的`next`设置为`null`。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3c5bc4ffbe7d42cca21870335e4420a6~tplv-k3u1fbpfcp-zoom-1.image)


`else`中的操作：

如果`pred`节点不是头结点即中间节点，并且`pred`的`waitStatus`为-1或者`waitStatus<=0`，为了让`pred`节点能唤醒后继节点，需要设置为-1，并且`pred`节点的线程不为空。获取`node`节点的后继节点，如果后继节点有效，`CAS`尝试将`pred`的`next`指向`node`节点的`next`。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/09e992c569f64fffa3ec433e58be4d42~tplv-k3u1fbpfcp-zoom-1.image)


当其他节点来找有效节点的时候走当前`node`的`prev`这条线，而不是再一个一个往前找，可以提高效率。

如果是头结点则唤醒后继节点。

最后将`node`节点的`next`指向自己。

## 解锁

释放锁是不区分公平锁和非公平锁的，释放锁的核心是将`state`由大于 0 的数置为 0。废话不多说，直接上代码

```java
//释放锁方法
public void unlock() {
	sync.release(1);
}


public final boolean release(int arg) {
  //尝试释放锁资源，如果释放成功，返回true
	if (tryRelease(arg)) {
		Node h = head;
    // head 不为空且 head 的 ws 不为0（如果为0，代表后边没有其他线程挂起）
		if (h != null && h.waitStatus != 0)
      // AQS的队列中有 node 在排队，并且线程已经挂起
      // 需要唤醒被挂起的 Node
			unparkSuccessor(h);
		return true;
	}
  // 代表释放一次没有完全释放
	return false;
}
```

如果释放锁成功，需要获取`head`节点。如果头结点不为空且`waitStatus`不为0，则证明有`node`在排队，执行唤醒挂起其他`node`的操作。

### 查看tryRelease()方法

```java
protected final boolean tryRelease(int releases) {
  //获取当前锁的状态，先进行减1操作，代表释放一次锁资源
	int c = getState() - releases;
  //如果释放锁的线程不是占用锁的线程，直接抛出异常
	if (Thread.currentThread() != getExclusiveOwnerThread())
		throw new IllegalMonitorStateException();
	boolean free = false;
  // 如果 c 为0 ，代表锁完全释放了，如果不为0，代表锁之前重入了，一次没释放掉，等待下次再次执行时，再次判断
	if (c == 0) {
    // 释放锁标志为 true，代表完全释放了
		free = true;
    // 将占用互斥锁的标识置为 null
		setExclusiveOwnerThread(null);
	}
  // 设置 state 状态
	setState(c);
	return free;
}
```

我们的例子中线程1占用锁资源，线程1释放锁之后，`state`为0。进入`if`操作，将释放标志更新为`true`，将`FIFO`队列的`exclusiveOwnerThread`标志置为`null`。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8f22fed7b3af4fc799ab3d889d47a158~tplv-k3u1fbpfcp-zoom-1.image)


### 查看unparkSuccessor()方法

用于唤醒`AQS`中被挂起的线程。

```java
// 注意当前的 node 节点是 head 节点
private void unparkSuccessor(Node node) {
  //获取 head 的状态
	int ws = node.waitStatus;
	if (ws < 0)
    // CAS 将 node 的 ws 设置为0，代表当前 node 接下来会舍弃
		compareAndSetWaitStatus(node, ws, 0);

	// 获取头节点的下一个节点
	Node s = node.next;
  // 如果下一个节点为null 或者 下一个节点为失效节点，需要找到离 head 最近的有效node
	if (s == null || s.waitStatus > 0) {
		s = null;
    // 从尾节点开始往前找不等于null且不是node的节点
		for (Node t = tail; t != null && t != node; t = t.prev)
      // 如果该节点有效，则将s节点指向t节点
			if (t.waitStatus <= 0)
				s = t;
	}
  // 找到最近的node后，直接唤醒
	if (s != null)
		LockSupport.unpark(s.thread);
}
```

#### 问题解析：为什么要从尾结点往前查找呢？

因为在`addWaiter`方法中是先给`prev`指针赋值，最后才将上一个节点的`next`指针赋值，为了避免防止丢失节点或者跳过节点，必须从后往前找。

我们举例中`head`节点的状态为`-1`，通过`CAS`的方式将`head`节点的`waitStatus`设置为0。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/858bf6831a4a4e998e874eb510ede6c4~tplv-k3u1fbpfcp-zoom-1.image)


我们的头结点的后继节点是线程2所在的节点，不为`null`，所以这边会执行`unpark`操作，从上边的`acquireQueued()`内的`parkAndCheckInterrupt()`方法继续执行。

```java
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    //返回目标线程是否中断的布尔值:中断返回true，不中断返回false，且返回后会重置中断状态为未中断
    return Thread.interrupted();
}
```

因为线程2未中断，所以返回`false`。继续执行`acquireQueued()`中的死循环

```java
for (;;) {
    // 获取当前节点的上一个节点
    final Node p = node.predecessor();
    //p为头节点，尝试获取锁操作
    if (p == head && tryAcquire(arg)) {
        setHead(node);
        p.next = null;
        // 将获取锁失败标识置为false
        failed = false;
        // 获取到锁资源，不会被中断
        return interrupted;
    }
    // p 不是 head 或者 没拿到锁资源，
    if (shouldParkAfterFailedAcquire(p, node) &&
        // 基于 Unsafe 的 park方法，挂起线程
        parkAndCheckInterrupt())
        interrupted = true;
}
```

此时p是头节点，且能获取锁成功，将`exclusiveOwnerThread`设置为线程2，即线程2 获取锁资源。

将`node`节点设置为`head`节点，并将`node`节点的`pre`和`thread`设置为`null`。因为拿到锁资源了，`node`节点就不需要排队了。

将头节点p的`next`置为`null`，此时p节点就不在队列中存在了，可以帮助`GC`回收(可达性分析)。`failed`设置为`false`，表明获取锁成功；`interrupted`为`false`，则线程不会中断。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7e0b749851534954bdc55aaf9b768b27~tplv-k3u1fbpfcp-zoom-1.image)


#### 为什么被唤醒的线程要调用Thread.interrupted()清除中断标记

从上边的方法可以看出，当`parkAndCheckInterrupt()`方法返回`true`时，即`Thread.interrupted()`方法返回了`true`，也就是该线程被中断了。为了让被唤醒的线程继续执行后续获取锁的操作，就需要让中断的线程像没有被中断过一样继续往下执行，所以在返回中断标记的同时要清除中断标记，将其设置为`false`。

清除中断标记之后不代表该线程不需要中断了，所以在`parkAndCheckInterrupt()`方法返回`true`时，要自己设置一个中断标志`interrupted = true`，为的就是当获取到锁资源执行完相关的操作之后进行中断补偿，故而需要执行`selfInterrupt()`方法中断线程。

以上就是我们加锁解锁的图解过程了。最后我们再来说一下公平锁和非公平锁的区别。

## 区别

前边已经说过了，似乎非公平锁包含了公平锁的全部操作。打开公平锁的代码，我们发现`accquire()`方法中只有该方法的实现有点区别。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eddf81f7e2694f87b34699e38faf883d~tplv-k3u1fbpfcp-zoom-1.image)


`hasQueuedPredecessors()`返回`false`时才会尝试获取锁资源。该方法代码实现如下

```java
public final boolean hasQueuedPredecessors() {
    Node t = tail; 
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

- `h==t`时，队列为空，表示没人排队，可以获取锁资源；
- 队列不为空，头结点有后继节点不为空且s节点获取锁的线程是当前线程也可以获取锁资源，代表锁重入操作；

## 总结

以上就是我们的全部内容了，我们在最后再做个总结：

- 代码使用要合乎规范，避免加锁成功后，在`finally`中无法解锁；
- 理解`AQS`的`FIFO`队列以及`Node`的相关属性，尤其注意`waitStatus`的状态；
- 利用图加深对非公平锁源码的理解；
