import{_ as d,W as l,X as a,Y as i,Z as e,a0 as s,a2 as c,C as r}from"./framework-a9f5de78.js";const t={},v={href:"https://mp.weixin.qq.com/s/3tqBo47GtG3ljdrig2b8AA",target:"_blank",rel:"noopener noreferrer"},o=i("code",null,"Synchronized",-1),u=i("code",null,"ReentrantLock",-1),m=c(`<p>为了解决小伙伴的疑问，我们来对两者做个简单的比较吧：</p><p><strong>相同点</strong></p><p>两者都是“可重入锁”，即当前线程获取到锁对象之后，如果想继续获取锁对象还是可以继续获取的，只不过锁对象的计数器进行“+1”操作就可以了。</p><p><strong>不同点</strong></p><ol><li><code>ReentrantLock</code>是基于<code>API</code>实现的，<code>Synchronized</code>是依赖于<code>JVM</code>实现的；</li><li><code>ReentrantLock</code>可以响应中断，<code>Synchronized</code>是不可以的；</li><li><code>ReentrantLock</code>可以指定是公平锁还是非公平锁，而<code>Synchronized</code>只能是非公平锁；</li><li><code>ReentrantLock</code>的<code>lock</code>是同步非阻塞，采用的是乐观并发策略，<code>Synchronized</code>是同步阻塞的，使用的是悲观并发策略；</li><li><code>ReentrantLock</code>借助<code>Condition</code>可以实现多路选择通知，<code>Synchronized</code>通过<code>wait()</code>和<code>notify()/notifyAll()</code>方法可以实现等待/通知机制（单路通知）；</li></ol><p>综上所述，<code>ReentrantLock</code>还是有区别于<code>Synchronized</code>的使用场景的，今天我们就来聊一聊它的多路选择通知功能。</p><h2 id="实战" tabindex="-1"><a class="header-anchor" href="#实战" aria-hidden="true">#</a> 实战</h2><p>没有实战的“纸上谈兵”都是扯淡，今天我们反其道而行，先抛出实战<code>Demo</code>。</p><h4 id="场景描述" tabindex="-1"><a class="header-anchor" href="#场景描述" aria-hidden="true">#</a> 场景描述</h4><p>加油站为了吸引更多的车主前来加油，在加油站投放了自动洗车机来为加油的汽车提供免费洗车服务。我们规定汽车必须按照“加油-&gt;洗车-&gt;驶离”的流程来加油，等前一辆汽车驶离之后才允许下一辆车进来加油。</p><h4 id="代码实现" tabindex="-1"><a class="header-anchor" href="#代码实现" aria-hidden="true">#</a> 代码实现</h4><p>首先创建锁对象并生成三个<code>Condition</code></p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>/**
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后声明加油、清洗、驶离的方法，并规定加完油之后去洗车并驶离加油站</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>/**
 * 汽车加油
 */
public void fuelUp(int num) {
 lock.lock();
 try {
  while (flag!=1){
   c1.await();
  }
  System.out.println(&quot;第&quot;+num+&quot;辆车开始加油&quot;);
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
  System.out.println(&quot;第&quot;+num+&quot;辆车开始清洗&quot;);
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
  System.out.println(&quot;第&quot;+num+&quot;辆车已经驶离加油站&quot;);
  flag = 1;
  c1.signal();
 } catch (InterruptedException e) {
  e.printStackTrace();
 } finally {
  lock.unlock();
 }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><blockquote><p>其中<code>await</code>为等待方法，<code>signal</code>为唤醒方法。</p></blockquote><p>最后我们来定义<code>main</code>方法，模拟一下3辆车同时到达加油站的场景</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>public static void main(String[] args) {
 CarOperation carOperation = new CarOperation();
 //汽车加油
 new Thread(()-&gt;{
  for (int i = 1; i &lt; 4; i++) {
   carOperation.fuelUp(i);
  }
 },&quot;fuelUp&quot;).start();

 //汽车清洗
 new Thread(()-&gt;{
  for (int i = 1; i &lt; 4; i++) {
   carOperation.carWash(i);
  }
 },&quot;carRepair&quot;).start();

 //驶离
 new Thread(()-&gt;{
  for (int i = 1; i &lt; 4; i++) {
   carOperation.drive(i);
  }
 },&quot;drive&quot;).start();
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>使用是不是很丝滑？为了加深大家对<code>Condition</code>的理解，接下来我们用图解的方式分析一波<code>Condition</code>的原理~</p><h2 id="图解" tabindex="-1"><a class="header-anchor" href="#图解" aria-hidden="true">#</a> 图解</h2><p>大家都看到了，上边的案例都是围绕<code>Condition</code>来操作的，那什么是<code>Condition</code>呢？<code>Condition</code>是一个接口，里边定义了线程等待和唤醒的方法。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/430a646614fa4b7d98f2de2334cd4716~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>代码中调用的<code>lock.newCondition()</code>实际调用的是<code>Sync</code>类中的<code>newCondition</code>方法，而<code>ConditionObject</code>就是<code>Condition</code>的实现类。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>final ConditionObject newCondition() {
    return new ConditionObject();
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们发现它处于<code>AQS</code>的内部，没法直接实例化，所以需要配合<code>ReentrantLock</code>来使用。</p><h3 id="conditionobject" tabindex="-1"><a class="header-anchor" href="#conditionobject" aria-hidden="true">#</a> ConditionObject</h3><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/77ecf1b8fadc4c5e98f83e9885d75409~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p><code>ConditionObject</code>内部维护了一个基于<code>Node</code>的<code>FIFO</code>单向队列，我们把它称为<strong>等待队列</strong>。<code>firstWaiter</code>指向首节点，<code>lastWaiter</code>指向尾节点，<code>Node</code>中的<code>nextWaiter</code>指向队列中的下一个元素，并且等待队列中节点的<code>waitStatus</code>都是-2。</p><p>了解了<code>ConditionObject</code>的数据结构之后，我们就从源码角度来图解一下<code>ReentrantLock</code>的等待/唤醒机制。</p><h3 id="await" tabindex="-1"><a class="header-anchor" href="#await" aria-hidden="true">#</a> await</h3><p>首先找到<code>AQS</code>类中<code>await</code>的源码</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>public final void await() throws InterruptedException {
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
 if (acquireQueued(node, savedState) &amp;&amp; interruptMode != THROW_IE)
  interruptMode = REINTERRUPT;
 if (node.nextWaiter != null) // clean up if cancelled
        //清除条件队列中所有状态不为 CONDITION 的结点
  unlinkCancelledWaiters();
 if (interruptMode != 0)
  reportInterruptAfterWait(interruptMode);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果线程中断，清除中断标记并抛出异常。</p><h4 id="查看addconditionwaiter" tabindex="-1"><a class="header-anchor" href="#查看addconditionwaiter" aria-hidden="true">#</a> 查看addConditionWaiter</h4><p>该方法的作用是将当前线程封装成<code>node</code>加入等待队列尾部</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>private Node addConditionWaiter() {
 Node t = lastWaiter;
 if (t != null &amp;&amp; t.waitStatus != Node.CONDITION) {
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先将t指向尾节点，如果尾节点不为空并且它的<code>waitStatus!=-2</code>，则将不处于等待状态的结点从等待队列中移除，并且将t指向新的尾节点。</p><p>将当前线程封装成<code>waitStatus</code>为-2的节点追加到等待队列尾部。</p><p>如果尾节点为空，则队列为空，将首尾节点都指向当前节点。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8411665ee1bf40ca94d4043c31e64a2b~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>如果尾节点不为空，证明队列中有其他节点，则将当前尾节点的<code>nextWaiter</code>指向当前节点，将当前节点置为尾节点。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9c42d2d01c874da9b17a446c53805342~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>接着我们来查看下<code>unlinkCancelledWaiters()</code>方法——将不处于等待状态的结点从等待队列中移除。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>private void unlinkCancelledWaiters() {
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>t为当前节点，<code>trail</code>为t的前驱节点，<code>next</code>为t的后继节点。</p><p><code>while</code>方法会从首节点顺着等待队列往后寻找<code>waitStatus!=-2</code>的节点，将当前节点的<code>nextWaiter</code>置为空。</p><p>如果当前节点的前驱节点为空，代表当前节点为首节点，则将next设置为首节点；</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a40d48e6f5bb450f9b7dda450800931c~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>如果不为空，则将前驱节点的<code>nextWaiter</code>指向后继节点。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/081732da9025456eaffd6626e0a1e0f0~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>如果后继节点为空，则直接将前驱节点设置为尾节点。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6155f6519a1c466ea57c2f2097d3e596~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><h4 id="查看fullyrelease" tabindex="-1"><a class="header-anchor" href="#查看fullyrelease" aria-hidden="true">#</a> 查看fullyRelease</h4><p>从名字也差不多能明白该方法的作用是彻底释放锁资源。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>final int fullyRelease(Node node) {
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最重要的就是<code>release</code>方法，而我们上文中已经讲过了，<code>release</code>执行成功的话，当前线程已经释放了锁资源。</p><h4 id="查看isonsyncqueue" tabindex="-1"><a class="header-anchor" href="#查看isonsyncqueue" aria-hidden="true">#</a> 查看isOnSyncQueue</h4><p>判断当前线程所在的<code>Node</code>是否在同步队列中（同步队列即<code>AQS</code>队列）。在这里有必要给大家看一下同步队列与等待队列的关系图了。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c7b47af292d3431fb05c17c9bca64c85~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>final boolean isOnSyncQueue(Node node) {
 if (node.waitStatus == Node.CONDITION || node.prev == null)
  return false;
 if (node.next != null) 
  return true;
 //node节点的next为null
 return findNodeFromTail(node);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果当前节点的<code>waitStatus=-2</code>，说明它在等待队列中，返回<code>false</code>；如果当前节点有前驱节点，则证明它在<code>AQS</code>队列中，但是前驱节点为空，说明它是头节点，而头节点是不参与锁竞争的，也返回<code>false</code>。</p><p>如果当前节点既不在等待队列中，又不是<code>AQS</code>中的头结点且存在<code>next</code>节点，说明它存在于<code>AQS</code>中，直接返回<code>true</code>。</p><p>接着往下看，如果当前节点的<code>next</code>为空，该节点可能是<code>tail</code>节点，也可能是该节点的<code>next</code>还未赋值，所以需要从后往前遍历节点。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>private boolean findNodeFromTail(Node node) {
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在遍历过程中，如果队列中有节点等于当前节点，返回<code>true</code>；如果找到头节点也没找到，则返回<code>false</code>。</p><p>我们回到<code>await</code>的<code>while</code>循环处，如果返回<code>false</code>，说明该节点不在同步队列中，进入循环中挂起该线程。</p><h4 id="知识点补充" tabindex="-1"><a class="header-anchor" href="#知识点补充" aria-hidden="true">#</a> 知识点补充</h4><p>阿Q的理解是线程被唤醒会存在两种情况：一种是调用<code>signal/signalAll</code>唤醒线程；一种是通过线程中断信号，唤醒线程并抛出中断异常。</p><h4 id="查看checkinterruptwhilewaiting-难点" tabindex="-1"><a class="header-anchor" href="#查看checkinterruptwhilewaiting-难点" aria-hidden="true">#</a> 查看checkInterruptWhileWaiting（难点）</h4><p>该方法的作用是判断当前线程是否发生过中断，如果未发生中断返回<code>0</code>，如果发生了中断返回<code>1</code>或者<code>-1</code>。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>private int checkInterruptWhileWaiting(Node node) {
 return Thread.interrupted() ?
  (transferAfterCancelledWait(node) ? THROW_IE : REINTERRUPT) :
  0;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们来看看<code>transferAfterCancelledWait</code>方法是如果区分<code>1</code>和<code>-1</code>的</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>final boolean transferAfterCancelledWait(Node node) {
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>那什么情况下<code>cas</code>操作会成功？什么情况下又会失败呢？</p><p>当线程接收到中断信号时会被唤醒，此时<code>node</code>的<code>waitStatus=-2</code>，所以会<code>cas</code>成功，同时会将<code>node</code>从等待队列转移到<code>AQS</code>队列中。</p><p>当线程先通过<code>signal</code>唤醒后接收到中断信号，由于<code>signal</code>已经将<code>node</code>的<code>waitStatus</code>设置为-2了，所以此时会<code>cas</code>失败。</p><h4 id="举例" tabindex="-1"><a class="header-anchor" href="#举例" aria-hidden="true">#</a> 举例</h4><p>大家可以用下边的例子在<code>transferAfterCancelledWait</code>中打断点测试一下，相信就明了了。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>public class CarOperation {
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
            System.out.println(&quot;开始阻塞&quot;);
            c1.await();
            System.out.println(&quot;唤醒之后继续执行&quot;);
        } catch (InterruptedException e) {
            System.out.println(&quot;唤醒但是抛出异常了&quot;);
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
            System.out.println(&quot;唤醒了。。。。。。。。。。。。。。&quot;);
        } finally {
            lock.unlock();
        }
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>中断测试</strong></p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>public static void main(String[] args) {
 CarOperation carOperation = new CarOperation();
 Thread t1 = new Thread(()-&gt;{
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f80f8ed80734e828887628f87088e89~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p><strong>先唤醒后中断测试</strong></p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>public static void main(String[] args) {
    CarOperation carOperation = new CarOperation();
    Thread t1 = new Thread(()-&gt;{
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/71bab64dc9ec427983d4635de5e224b7~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><h4 id="查看reportinterruptafterwait" tabindex="-1"><a class="header-anchor" href="#查看reportinterruptafterwait" aria-hidden="true">#</a> 查看reportInterruptAfterWait</h4><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>//要么抛出异常，要么重新中断。
private void reportInterruptAfterWait(int interruptMode)
 throws InterruptedException {
 if (interruptMode == THROW_IE)
  throw new InterruptedException();
 else if (interruptMode == REINTERRUPT)
  selfInterrupt();
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>以上就是<code>await</code>的全部内容了，我们先来做个简单的总结。</p><h3 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h3><ul><li>将当前线程封装成<code>node</code>加入等待队列尾部；</li><li>彻底释放锁资源，也就是将它的同步队列节点从同步队列队首移除；</li><li>如果当前节点不在同步队列中，挂起当前线程；</li><li>自旋，直到该线程被中断或者被唤醒移动到同步队列中；</li><li>阻塞当前节点，直到它获取到锁资源；</li></ul><p>如果你哪个地方存在疑问可以小窗阿Q！</p><h3 id="signal" tabindex="-1"><a class="header-anchor" href="#signal" aria-hidden="true">#</a> signal</h3><p>接下来我们再来捋一捋唤醒的过程</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>public final void signal() {
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
 } while (!transferForSignal(first) &amp;&amp;
    (first = firstWaiter) != null);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>首先将等待队列的头结点从等待队列中取出来</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1367f1e888384e7f9dcb90ad554b098d~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>然后执行<code>transferForSignal</code>方法进行转移</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>final boolean transferForSignal(Node node) {
 //将node的waitStatus设置为0，如果设置失败说明node的节点已经不在等待队列中了，返回false
 if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
  return false;
 //将node从等待队列转移到AQS队列，并返回node的前驱节点
 Node p = enq(node);
 //获取node前驱节点的状态
 int ws = p.waitStatus;
 //如果该节点是取消状态或者将其设置为唤醒状态失败（说明本身已经是唤醒状态了），所以可以去唤醒node节点所在的线程
 if (ws &gt; 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
  //唤醒当前节点
  LockSupport.unpark(node.thread);
 return true;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>将等待队列的头结点从等待队列转移到<code>AQS</code>队列中，如果转移失败，说明该节点已被取消，直接返回<code>false</code>，然后将<code>first</code>指向新的头结点重新进行转移。如果转移成功则根据前驱节点的状态判断是否直接唤醒当前线程。</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/05800509ab4b40a0ab2c3c3d0faa3149~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>怎么样？唤醒的逻辑是不是超级简单？我们也按例做个简单的总结。</p><h4 id="总结-1" tabindex="-1"><a class="header-anchor" href="#总结-1" aria-hidden="true">#</a> 总结</h4><p>从等待队列的队首开始，尝试对队首节点执行唤醒操作，如果节点已经被取消了，就尝试唤醒下一个节点。</p><p>对首节点执行唤醒操作时，首先将节点转移到同步队列，如果前驱节点的状态为<strong>取消状态</strong>或设置前驱节点的状态为<strong>唤醒状态</strong>失败，那么就立即唤醒当前节点对应的线程，否则不执行唤醒操作。</p><blockquote><p>阿Q将持续更新<code>java</code>实战方面的文章，感兴趣的可以关注下公众号：<code>阿Q说代码</code>，也可以来技术群讨论问题呦，点赞之交值得深交！</p></blockquote>`,105);function b(p,f){const n=r("ExternalLinkIcon");return l(),a("div",null,[i("p",null,[i("a",v,[e("20张图图解ReentrantLock加锁解锁原理"),s(n)]),e("文章一发，便引发了大家激烈的讨论，更有小伙伴前来弹窗：平时加解锁都是直接使用"),o,e("关键字来实现的，简单好用，为啥还要引用"),u,e("呢？")]),m])}const h=d(t,[["render",b],["__file","图解 Condition 原理.html.vue"]]);export{h as default};
