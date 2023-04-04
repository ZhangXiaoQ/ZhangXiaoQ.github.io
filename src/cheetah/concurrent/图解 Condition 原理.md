---
title: 图解 Condition 原理
icon: rank
order: 2
category:
  - 并发
tag:
  - condition
  - await
  - signal

---

[20张图图解ReentrantLock加锁解锁原理](https://mp.weixin.qq.com/s/3tqBo47GtG3ljdrig2b8AA)文章一发，便引发了大家激烈的讨论，更有小伙伴前来弹窗：平时加解锁都是直接使用`Synchronized`关键字来实现的，简单好用，为啥还要引用`ReentrantLock`呢？

为了解决小伙伴的疑问，我们来对两者做个简单的比较吧：

**相同点**

两者都是“可重入锁”，即当前线程获取到锁对象之后，如果想继续获取锁对象还是可以继续获取的，只不过锁对象的计数器进行“+1”操作就可以了。

**不同点**

1.  `ReentrantLock`是基于`API`实现的，`Synchronized`是依赖于`JVM`实现的；
1.  `ReentrantLock`可以响应中断，`Synchronized`是不可以的；
1.  `ReentrantLock`可以指定是公平锁还是非公平锁，而`Synchronized`只能是非公平锁；
1.  `ReentrantLock`的`lock`是同步非阻塞，采用的是乐观并发策略，`Synchronized`是同步阻塞的，使用的是悲观并发策略；
1.  `ReentrantLock`借助`Condition`可以实现多路选择通知，`Synchronized`通过`wait()`和`notify()/notifyAll()`方法可以实现等待/通知机制（单路通知）；

综上所述，`ReentrantLock`还是有区别于`Synchronized`的使用场景的，今天我们就来聊一聊它的多路选择通知功能。

## 实战

没有实战的“纸上谈兵”都是扯淡，今天我们反其道而行，先抛出实战`Demo`。

#### 场景描述

加油站为了吸引更多的车主前来加油，在加油站投放了自动洗车机来为加油的汽车提供免费洗车服务。我们规定汽车必须按照“加油->洗车->驶离”的流程来加油，等前一辆汽车驶离之后才允许下一辆车进来加油。

#### 代码实现

首先创建锁对象并生成三个`Condition`

```
/**
 * 控制线程唤醒的标志
 */
private int flag = 1;

/**
 * 创建锁对象
 */
private Lock lock = new ReentrantLock();

/**
 * 等待队列
 * c1对应加油
 * c2对应洗车
 * c3对应开车
 */
Condition c1 = lock.newCondition();
Condition c2 =  lock.newCondition();
Condition c3 =  lock.newCondition();
```

然后声明加油、清洗、驶离的方法，并规定加完油之后去洗车并驶离加油站

```
/**
 * 汽车加油
 */
public void fuelUp(int num) {
 lock.lock();
 try {
  while (flag!=1){
   c1.await();
  }
  System.out.println("第"+num+"辆车开始加油");
  flag = 2;
  c2.signal();
 } catch (InterruptedException e) {
  e.printStackTrace();
 } finally {
  lock.unlock();
 }

}

/**
 * 汽车清洗
 */
public void carWash(int num) {
 lock.lock();
 try {
  while (flag!=2){
   c2.await();
  }
  System.out.println("第"+num+"辆车开始清洗");
  flag = 3;
  c3.signal();
 } catch (InterruptedException e) {
  e.printStackTrace();
 } finally {
  lock.unlock();
 }
}

/**
 * 驶离
 */
public void drive(int num) {
 lock.lock();
 try {
  while (flag!=3){
   c3.await();
  }
  System.out.println("第"+num+"辆车已经驶离加油站");
  flag = 1;
  c1.signal();
 } catch (InterruptedException e) {
  e.printStackTrace();
 } finally {
  lock.unlock();
 }
}
```

> 其中`await`为等待方法，`signal`为唤醒方法。

最后我们来定义`main`方法，模拟一下3辆车同时到达加油站的场景

```
public static void main(String[] args) {
 CarOperation carOperation = new CarOperation();
 //汽车加油
 new Thread(()->{
  for (int i = 1; i < 4; i++) {
   carOperation.fuelUp(i);
  }
 },"fuelUp").start();

 //汽车清洗
 new Thread(()->{
  for (int i = 1; i < 4; i++) {
   carOperation.carWash(i);
  }
 },"carRepair").start();

 //驶离
 new Thread(()->{
  for (int i = 1; i < 4; i++) {
   carOperation.drive(i);
  }
 },"drive").start();
}
```

使用是不是很丝滑？为了加深大家对`Condition`的理解，接下来我们用图解的方式分析一波`Condition`的原理~

## 图解

大家都看到了，上边的案例都是围绕`Condition`来操作的，那什么是`Condition`呢？`Condition`是一个接口，里边定义了线程等待和唤醒的方法。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/430a646614fa4b7d98f2de2334cd4716~tplv-k3u1fbpfcp-zoom-1.image)

代码中调用的`lock.newCondition()`实际调用的是`Sync`类中的`newCondition`方法，而`ConditionObject`就是`Condition`的实现类。

```
final ConditionObject newCondition() {
    return new ConditionObject();
}
```

我们发现它处于`AQS`的内部，没法直接实例化，所以需要配合`ReentrantLock`来使用。

### ConditionObject

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/77ecf1b8fadc4c5e98f83e9885d75409~tplv-k3u1fbpfcp-zoom-1.image)

`ConditionObject`内部维护了一个基于`Node`的`FIFO`单向队列，我们把它称为**等待队列**。`firstWaiter`指向首节点，`lastWaiter`指向尾节点，`Node`中的`nextWaiter`指向队列中的下一个元素，并且等待队列中节点的`waitStatus`都是-2。

了解了`ConditionObject`的数据结构之后，我们就从源码角度来图解一下`ReentrantLock`的等待/唤醒机制。

### await

首先找到`AQS`类中`await`的源码

```
public final void await() throws InterruptedException {
 if (Thread.interrupted())
  throw new InterruptedException();
 //将当前线程封装成node加入等待队列尾部
 Node node = addConditionWaiter();
 int savedState = fullyRelease(node);
 int interruptMode = 0;
    //检测此节点的线程是否在同步队上，如果不在，则说明该线程还不具备竞争锁的资格，则继续等待直到检测到此节点在同步队列上
 while (!isOnSyncQueue(node)) {
        //当node处于等待队列时，挂起当前线程。
  LockSupport.park(this);
        //如果发生了中断，则跳出循环，结束等待
  if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
   break;
 }
    //被唤醒后该节点一定会在AQS队列上，
    //之前分析过acquireQueued方法获取不到锁会继续阻塞
    //获取到了锁，中断过返回true，未中断过返回false
    //获取到锁存在中断并且不是中断唤醒的线程将中断模式设置为重新中断
 if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
  interruptMode = REINTERRUPT;
 if (node.nextWaiter != null) // clean up if cancelled
        //清除条件队列中所有状态不为 CONDITION 的结点
  unlinkCancelledWaiters();
 if (interruptMode != 0)
  reportInterruptAfterWait(interruptMode);
}
```

如果线程中断，清除中断标记并抛出异常。

#### 查看addConditionWaiter

该方法的作用是将当前线程封装成`node`加入等待队列尾部

```
private Node addConditionWaiter() {
 Node t = lastWaiter;
 if (t != null && t.waitStatus != Node.CONDITION) {
  //将不处于等待状态的结点从等待队列中移除
  unlinkCancelledWaiters();
  t = lastWaiter;
 }
 Node node = new Node(Thread.currentThread(), Node.CONDITION);
 //尾节点为空
 if (t == null)
        //将首节点指向node
  firstWaiter = node;
 else
  //将尾节点的nextWaiter指向node节点
  t.nextWaiter = node;
 //尾节点指向node
 lastWaiter = node;
 return node;
}
```

首先将t指向尾节点，如果尾节点不为空并且它的`waitStatus!=-2`，则将不处于等待状态的结点从等待队列中移除，并且将t指向新的尾节点。

将当前线程封装成`waitStatus`为-2的节点追加到等待队列尾部。

如果尾节点为空，则队列为空，将首尾节点都指向当前节点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8411665ee1bf40ca94d4043c31e64a2b~tplv-k3u1fbpfcp-zoom-1.image)

如果尾节点不为空，证明队列中有其他节点，则将当前尾节点的`nextWaiter`指向当前节点，将当前节点置为尾节点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9c42d2d01c874da9b17a446c53805342~tplv-k3u1fbpfcp-zoom-1.image)

接着我们来查看下`unlinkCancelledWaiters()`方法——将不处于等待状态的结点从等待队列中移除。

```
private void unlinkCancelledWaiters() {
 Node t = firstWaiter;
 //trail是t的前驱结点
 Node trail = null;
 while (t != null) {
  //next为t的后继结点
  Node next = t.nextWaiter;
  //如果t节点的waitStatus不为-2即失效节点
  if (t.waitStatus != Node.CONDITION) {
   t.nextWaiter = null;
   //如果t的前驱节点为空，则将首节点指向next
   if (trail == null)
    firstWaiter = next;
   else
    //t的前驱结点不为空，将前驱节点的后继指针指向next
    trail.nextWaiter = next;
   //如果next为null，则将尾节点指向t的前驱节点
   if (next == null)
    lastWaiter = trail;
  }
  else
   trail = t;
  t = next;
 }
}
```

t为当前节点，`trail`为t的前驱节点，`next`为t的后继节点。

`while`方法会从首节点顺着等待队列往后寻找`waitStatus!=-2`的节点，将当前节点的`nextWaiter`置为空。

如果当前节点的前驱节点为空，代表当前节点为首节点，则将next设置为首节点；

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a40d48e6f5bb450f9b7dda450800931c~tplv-k3u1fbpfcp-zoom-1.image)

如果不为空，则将前驱节点的`nextWaiter`指向后继节点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/081732da9025456eaffd6626e0a1e0f0~tplv-k3u1fbpfcp-zoom-1.image)

如果后继节点为空，则直接将前驱节点设置为尾节点。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6155f6519a1c466ea57c2f2097d3e596~tplv-k3u1fbpfcp-zoom-1.image)

#### 查看fullyRelease

从名字也差不多能明白该方法的作用是彻底释放锁资源。

```
final int fullyRelease(Node node) {
 //释放锁失败为true，释放锁成功为false
 boolean failed = true;
 try {
     //获取当前锁的state
  int savedState = getState();
  //释放锁成功的话
  if (release(savedState)) {
   failed = false;
   return savedState;
  } else {
   throw new IllegalMonitorStateException();
  }
 } finally {
  if (failed)
   //释放锁失败的话将节点状态置为取消
   node.waitStatus = Node.CANCELLED;
 }
}
```

最重要的就是`release`方法，而我们上文中已经讲过了，`release`执行成功的话，当前线程已经释放了锁资源。

#### 查看isOnSyncQueue

判断当前线程所在的`Node`是否在同步队列中（同步队列即`AQS`队列）。在这里有必要给大家看一下同步队列与等待队列的关系图了。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c7b47af292d3431fb05c17c9bca64c85~tplv-k3u1fbpfcp-zoom-1.image)

```
final boolean isOnSyncQueue(Node node) {
 if (node.waitStatus == Node.CONDITION || node.prev == null)
  return false;
 if (node.next != null) 
  return true;
 //node节点的next为null
 return findNodeFromTail(node);
}
```

如果当前节点的`waitStatus=-2`，说明它在等待队列中，返回`false`；如果当前节点有前驱节点，则证明它在`AQS`队列中，但是前驱节点为空，说明它是头节点，而头节点是不参与锁竞争的，也返回`false`。

如果当前节点既不在等待队列中，又不是`AQS`中的头结点且存在`next`节点，说明它存在于`AQS`中，直接返回`true`。

接着往下看，如果当前节点的`next`为空，该节点可能是`tail`节点，也可能是该节点的`next`还未赋值，所以需要从后往前遍历节点。

```
private boolean findNodeFromTail(Node node) {
 Node t = tail;
 for (;;) {
  //先用尾节点来判断，然后用队列中的节点依次来判断
  if (t == node)
   return true;
  //节点为空，说明找到头也不在AQS队列中，返回false
  if (t == null)
   return false;
  t = t.prev;
 }
}
```

在遍历过程中，如果队列中有节点等于当前节点，返回`true`；如果找到头节点也没找到，则返回`false`。

我们回到`await`的`while`循环处，如果返回`false`，说明该节点不在同步队列中，进入循环中挂起该线程。

#### 知识点补充

阿Q的理解是线程被唤醒会存在两种情况：一种是调用`signal/signalAll`唤醒线程；一种是通过线程中断信号，唤醒线程并抛出中断异常。

#### 查看checkInterruptWhileWaiting（难点）

该方法的作用是判断当前线程是否发生过中断，如果未发生中断返回`0`，如果发生了中断返回`1`或者`-1`。

```
private int checkInterruptWhileWaiting(Node node) {
 return Thread.interrupted() ?
  (transferAfterCancelledWait(node) ? THROW_IE : REINTERRUPT) :
  0;
}
```

我们来看看`transferAfterCancelledWait`方法是如果区分`1`和`-1`的

```
final boolean transferAfterCancelledWait(Node node) {
 //cas尝试将node的waitStatus设置为0
 if (compareAndSetWaitStatus(node, Node.CONDITION, 0)) {
  //将node节点由等待队列加入AQS队列
  enq(node);
  return true;
 }
 //cas失败后，看看队列是不是已经在AQS队列中，如果不在，则通过yield方法给其它线程让路
 while (!isOnSyncQueue(node))
  Thread.yield();
    //如果已经在AQS队列中，则返回false
 return false;
}
```

那什么情况下`cas`操作会成功？什么情况下又会失败呢？

当线程接收到中断信号时会被唤醒，此时`node`的`waitStatus=-2`，所以会`cas`成功，同时会将`node`从等待队列转移到`AQS`队列中。

当线程先通过`signal`唤醒后接收到中断信号，由于`signal`已经将`node`的`waitStatus`设置为-2了，所以此时会`cas`失败。

#### 举例

大家可以用下边的例子在`transferAfterCancelledWait`中打断点测试一下，相信就明了了。

```
public class CarOperation {
 //创建一个重入锁
    private Lock lock = new ReentrantLock();

    //声明等待队列
    Condition c1 = lock.newCondition();
 
    /*
     * 等待操作
     */
 public void await() {
        lock.lock();
        try {
            System.out.println("开始阻塞");
            c1.await();
            System.out.println("唤醒之后继续执行");
        } catch (InterruptedException e) {
            System.out.println("唤醒但是抛出异常了");
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

     /*
     * 唤醒操作
     */
    public void signal() {
        lock.lock();
        try {
            c1.signal();
            System.out.println("唤醒了。。。。。。。。。。。。。。");
        } finally {
            lock.unlock();
        }
    }
}
```

**中断测试**

```
public static void main(String[] args) {
 CarOperation carOperation = new CarOperation();
 Thread t1 = new Thread(()->{
        //等待，挂起线程
  carOperation.await();
 });
 t1.start();
 try {
        //模拟其它线程抢占资源执行过程
  Thread.sleep(10000);
        //发出线程中断信号
  t1.interrupt();
 } catch (InterruptedException exception) {
  exception.printStackTrace();
 }
}
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f80f8ed80734e828887628f87088e89~tplv-k3u1fbpfcp-zoom-1.image)

**先唤醒后中断测试**

```
public static void main(String[] args) {
    CarOperation carOperation = new CarOperation();
    Thread t1 = new Thread(()->{
        carOperation.await();
    });
    t1.start();
    try {
        Thread.sleep(10000);
        //先唤醒线程
        carOperation.signal();
        //后中断
        t1.interrupt();
    } catch (InterruptedException exception) {
        exception.printStackTrace();
    }
}
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/71bab64dc9ec427983d4635de5e224b7~tplv-k3u1fbpfcp-zoom-1.image)

#### 查看reportInterruptAfterWait

```
//要么抛出异常，要么重新中断。
private void reportInterruptAfterWait(int interruptMode)
 throws InterruptedException {
 if (interruptMode == THROW_IE)
  throw new InterruptedException();
 else if (interruptMode == REINTERRUPT)
  selfInterrupt();
}
```

以上就是`await`的全部内容了，我们先来做个简单的总结。

### 总结

-   将当前线程封装成`node`加入等待队列尾部；
-   彻底释放锁资源，也就是将它的同步队列节点从同步队列队首移除；
-   如果当前节点不在同步队列中，挂起当前线程；
-   自旋，直到该线程被中断或者被唤醒移动到同步队列中；
-   阻塞当前节点，直到它获取到锁资源；

如果你哪个地方存在疑问可以小窗阿Q！

### signal

接下来我们再来捋一捋唤醒的过程

```
public final void signal() {
    //当前线程是否是锁的持有者，不是的话抛出异常
 if (!isHeldExclusively())
  throw new IllegalMonitorStateException();
 Node first = firstWaiter;
 if (first != null)
        //具体的唤醒过程
  doSignal(first);
}

private void doSignal(Node first) {
 do {
        //获取头结点的下一个节点并赋值为头结点
  if ( (firstWaiter = first.nextWaiter) == null)
   lastWaiter = null;
        //将之前的头节点置为空
  first.nextWaiter = null;
        //将头结点从等待队列转移到AQS队列中，如果转移失败，则寻找下一个节点继续转移
 } while (!transferForSignal(first) &&
    (first = firstWaiter) != null);
}
```

首先将等待队列的头结点从等待队列中取出来

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1367f1e888384e7f9dcb90ad554b098d~tplv-k3u1fbpfcp-zoom-1.image)

然后执行`transferForSignal`方法进行转移

```
final boolean transferForSignal(Node node) {
 //将node的waitStatus设置为0，如果设置失败说明node的节点已经不在等待队列中了，返回false
 if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
  return false;
 //将node从等待队列转移到AQS队列，并返回node的前驱节点
 Node p = enq(node);
 //获取node前驱节点的状态
 int ws = p.waitStatus;
 //如果该节点是取消状态或者将其设置为唤醒状态失败（说明本身已经是唤醒状态了），所以可以去唤醒node节点所在的线程
 if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
  //唤醒当前节点
  LockSupport.unpark(node.thread);
 return true;
}
```

将等待队列的头结点从等待队列转移到`AQS`队列中，如果转移失败，说明该节点已被取消，直接返回`false`，然后将`first`指向新的头结点重新进行转移。如果转移成功则根据前驱节点的状态判断是否直接唤醒当前线程。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/05800509ab4b40a0ab2c3c3d0faa3149~tplv-k3u1fbpfcp-zoom-1.image)

怎么样？唤醒的逻辑是不是超级简单？我们也按例做个简单的总结。

#### 总结

从等待队列的队首开始，尝试对队首节点执行唤醒操作，如果节点已经被取消了，就尝试唤醒下一个节点。

对首节点执行唤醒操作时，首先将节点转移到同步队列，如果前驱节点的状态为**取消状态**或设置前驱节点的状态为**唤醒状态**失败，那么就立即唤醒当前节点对应的线程，否则不执行唤醒操作。

> 阿Q将持续更新`java`实战方面的文章，感兴趣的可以关注下公众号：`阿Q说代码`，也可以来技术群讨论问题呦，点赞之交值得深交！