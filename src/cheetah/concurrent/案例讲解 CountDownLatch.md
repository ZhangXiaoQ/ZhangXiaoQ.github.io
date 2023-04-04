---
title: 案例讲解 CountDownLatch
icon: rank
order: 3
category:
  - 并发
tag:
  - 案例
  - 源码

---

前几天我们把 [ReentrantLock的原理](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzI5MDg2NjEzNA==&action=getalbum&album_id=2627239089976950785&scene=173&from_msgid=2247489117&from_itemidx=1&count=3&nolastread=1#wechat_redirect) 进行了详细的讲解，不熟悉的同学可以翻看前文，今天我们介绍另一种基于 AQS 的同步工具——CountDownLatch。

CountDownLatch 被称为倒计时器，也叫闭锁，是 juc 包下的工具类，同时也是共享锁的一种实现。它的作用是可以让一个或多个线程等待，直到所有线程的任务都执行完之后再继续往下执行。

举个简单的例子：阿Q高中时期都是乘坐大巴往返于县城与农村，那时的司机为了利益的最大化，会在汽车满员的情况下才会发车。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/62e7418d2ee64b4ba8ced5c43dbee4d6~tplv-k3u1fbpfcp-zoom-1.image)


如果我们把乘客去车站乘车比作一个一个的线程，那 CountDownLatch 做的事就是等大家到齐之前的等待工作。

我们从源码的角度来分析下它的工作原理

**①谁来决定公交车上的座位数？**

公交车上的座位数是由汽车制造商决定的，在 CountDownLatch 中也会存在这样一个值 count，用来表示需要**等待的线程个数**。

count 值是在 CountDownLatch 的构造函数中进行初始化的

```java
public CountDownLatch(int count) {
	if (count < 0) throw new IllegalArgumentException("count < 0");
	this.sync = new Sync(count);
}

Sync(int count) {
 //设置 AQS 中的 state 为 count 值
	setState(count);
}
```

> 计数值 count 是一次性的，当它的值减为0后就不会再变化了，这也是其存在的不足之处。

**②谁来确定乘客全部到齐？**

在汽车发车前检票员会对车上的乘客数量进行清点，如果满员了就会通知司机开车。

当然也可以采用这种方法：在得知车座位数的前提下，每上来一位乘客，座位数进行减一操作。CountDownLatch 就是采用的上述方法，它的 countDown() 方法会对 state 的值执行减1操作。

让我们从源码的角度来认识一下该方法。

```java
public void countDown() {
 //释放共享锁
	sync.releaseShared(1);
}

public final boolean releaseShared(int arg) {
	if (tryReleaseShared(arg)) {
		doReleaseShared();
		return true;
	}
	return false;
}
```

先尝试释放锁，如果返回 true，则执行释放操作，反之不执行。我们分析下上边的两个方法

```java
protected boolean tryReleaseShared(int releases) {
	for (;;) {
  //获取当前等待的线程数量
		int c = getState();
  //等待线程数为0，表示没有等待线程，故不需要释放锁资源
		if (c == 0)
			return false;
  //执行减1操作
		int nextc = c-1;
  //自旋+CAS将state的属性值-1
		if (compareAndSetState(c, nextc))
			return nextc == 0;
	}
}
```

最后一步中，如果减一之后为0，则说明没有其它线程等待，需要执行释放锁操作，返回 true，反之不需要。

在开始分析 doReleaseShared()  之前，我们先来补全一下 AQS 中 waitStatus 的状态说明

- 初始化状态：0，表示当前节点在同步队列中，等待获取锁；
- CANCELLED：1，表示当前节点取消获取锁；
- SIGNAL：-1，表示后续节点等待当前节点唤醒；
- CONDITION：-2，表示当前线程正在条件等待队列中；
- PROPAGATE：-3，共享模式，前置节点唤醒后续节点后，唤醒操作无条件传播下去；

```java
/**
 * 释放锁：唤醒后续节点
 */
private void doReleaseShared() {
	for (;;) {
		Node h = head;
  //不是null 且不为尾节点，因为尾节点没有后续节点需要唤醒了
		if (h != null && h != tail) {
			int ws = h.waitStatus;
   //只有状态为 -1 才可以唤醒后续节点
			if (ws == Node.SIGNAL) {
				//将waitStatus设置为0失败会继续循环
				if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
					continue;
				unparkSuccessor(h);
			}
			//将waitStatus设置为PROPAGATE失败会继续循环
			else if (ws == 0 &&
					 !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
				continue;                
		}
		if (h == head)                   
			break;
	}
}
```

unparkSuccessor()  方法用于唤醒 AQS 中被挂起的线程，在[ReentrantLock的原理](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzI5MDg2NjEzNA==&action=getalbum&album_id=2627239089976950785&scene=173&from_msgid=2247489117&from_itemidx=1&count=3&nolastread=1#wechat_redirect)中讲过了，此处不再赘述。

小结：当线程使用 countDown() 方法时，其实是使用了 tryReleaseShared()  方法以 CAS 的操作来减少 state ,直至  state 为 0 ，进而释放锁资源，唤醒后续节点。

**③谁来发车？**

肯定是司机来发车呀，那我们的 CountDownLatch 是如何实现的呢？

CountDownLatch 中的 await() 方法，就是等待线程的总开关，当发现 state 的值为0时会释放所有的等待线程，发车了。

我们从源码角度来看下它是如何工作的

```java
public void await() throws InterruptedException {
	sync.acquireSharedInterruptibly(1);
}

public final void acquireSharedInterruptibly(int arg)
		throws InterruptedException {
 //如果线程中断了，直接抛出中断异常
	if (Thread.interrupted())
		throw new InterruptedException();
 //如果小于0，代表 state 不为0，即还有任务未执行完毕，会执行获取共享锁的操作
	if (tryAcquireShared(arg) < 0)
		doAcquireSharedInterruptibly(arg);
}

protected int tryAcquireShared(int acquires) {
	return (getState() == 0) ? 1 : -1;
}
```

我们来看看它到底是如何获取共享锁的

```java
private void doAcquireSharedInterruptibly(int arg)
	throws InterruptedException {
	//将当前线程封装成node放到队尾
	final Node node = addWaiter(Node.SHARED);
	boolean failed = true;
	try {
		for (;;) {
			final Node p = node.predecessor();
			if (p == head) {
				int r = tryAcquireShared(arg);
				//state为0，表示此时等待线程全部执行完毕，r为1。
				if (r >= 0) {
					setHeadAndPropagate(node, r);
					p.next = null;
					failed = false;
					return;
				}
			}
			//从当前node节点向前寻找有效节点，并保证有效节点的waitStatus状态为-1
			if (shouldParkAfterFailedAcquire(p, node) &&
				//挂起线程
				parkAndCheckInterrupt())
				//在拿锁的期间，如果被中断了，那么会抛出异常，取消拿锁
				throw new InterruptedException();
		}
	} finally {
		if (failed)
			//将当前节点设置为失效节点，并挂到最近的有效节点后边，上文中有图解
			cancelAcquire(node);
	}
}
```

其中最重要的就是 setHeadAndPropagate() 方法

```java
private void setHeadAndPropagate(Node node, int propagate) {
	Node h = head; 
	//将当前node设置为head，并将node的线程置为空
	setHead(node);
	if (propagate > 0 || h == null || h.waitStatus < 0 ||
		(h = head) == null || h.waitStatus < 0) {
		Node s = node.next;
		if (s == null || s.isShared())
			//释放锁：唤醒后续节点
			doReleaseShared();
	}
}
```

小结：当线程使用 await() 方法时会将当前线程封装成 node 加入AQS 队列中，如果发现 state 不为0，说明还有任务未执行完成，继续阻塞；如果 state 为0，会释放掉所有的等待线程，执行 await() 之后的数据。

**流程图了解一下**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b26299438e3b4deaad45d21394fbea4e~tplv-k3u1fbpfcp-zoom-1.image)


理论讲完了，那我们用代码来演示下上边的例子

```java
public static void main(String[] args) throws InterruptedException {
	int count = 10;
	//设置线程池并发数
	ExecutorService executorService = Executors.newFixedThreadPool(count);
	//假设大巴可以拉十个乘客，初始化state
	CountDownLatch countDownLatch = new CountDownLatch(count);
	for (int i = 0; i < count; i++) {
		final int num = i;
		executorService.execute(()->{
			try {
				Thread.sleep((long) (new Random().nextDouble() * 3000) + 1000);
				System.out.println("乘客坐在了"+ (num +1) + "号座位上");
			} catch (InterruptedException exception) {
				exception.printStackTrace();
			}finally {
				countDownLatch.countDown();
			}
		});
	}
	System.out.println("司机等待乘客上车");
	countDownLatch.await();
	System.out.println("发车了");
	executorService.shutdown();
}
```

执行结果如下：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e8481f0ddb464dfcaa3954918b705808~tplv-k3u1fbpfcp-zoom-1.image)


细心地同学肯定会问了：如果遇上刮风下雨，来坐车的人少了，那已经上车的乘客岂不是回不了家了？

当然不是了，大巴其实也是有时间观念的，即使车上的乘客不满员到了一定的时间司机也会发车的，另外还会在路上顺道稍几个人上车。那我们的 CountDownLatch 是如何实现的呢？

CountDownLatch 还提供了一个 `await(long timeout, TimeUnit unit)`方法，在一定的时间间隔内会阻塞当前线程，等待 count 个线程执行任务，一旦超出了等待时间，便会继续往下执行。

我们将上边的`countDownLatch.await();`替换为`countDownLatch.await(3, TimeUnit.SECONDS);`，执行结果如下所示

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/843d2e75680740499e83e4ca16221136~tplv-k3u1fbpfcp-zoom-1.image)


上文中的例子是 CountDownLatch 的其中一种用法，即主线程等待其他线程执行完毕之后再执行。它还有另一种用法，即实现多个线程开始执行任务的最大并行性，类似发令枪响前，运动员统一在起跑线就位的场景。

```java
public static void main(String[] args) throws InterruptedException {
	//设置线程池并发数
	ExecutorService executorService = Executors.newFixedThreadPool(10);
	CountDownLatch countDownLatch = new CountDownLatch(1);
	//一组有6名运动员
	for (int i = 0; i < 6; i++) {
		final int num = i;
		executorService.execute(()->{
			try {
				System.out.println("运动员"+ (num+1) +"等待发令枪响");
				countDownLatch.await();
				System.out.println("运动员"+ (num+1) +"开始起跑");
			} catch (InterruptedException exception) {
				exception.printStackTrace();
			}
		});
	}
	Thread.sleep(3000);
	countDownLatch.countDown();
	System.out.println("发令枪响");
	executorService.shutdown();
}
```

执行结果如下

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/005e8d80b6db4eab8f98909c3e45b6fb~tplv-k3u1fbpfcp-zoom-1.image)


说了这么多，都是样例？你有没有在项目中应用过呢？

回答当然是“Yes”了，之前的运营端有个统计页面，要求统计用户新增数量、订单数量、商品交易总额等多张表的指标值，为了提高执行速率，我就启用了多个子线程分别去统计，用 CountDownLatch 来等待它们的统计结果。
