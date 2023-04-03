---
title: Battle：你会TLAB，我会逃逸分析
icon: storage
order: 7
category:
  - JVM
tag:
  - TLAB
  - 栈上分配
  - 同步省略
  - 标量替换


---


“噔噔噔…”传来一阵敲门声，把我从美梦中惊醒了。

朦胧间听到有人在说话“阿Q，在家不？”

“来了来了”，推门一看，原来是“赵信”兄弟。

**赵信**：自称常山赵子龙，一把三爪长枪耍的虎虎生风，见人上去就是一枪，人送外号“菊花信”。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/89c8bb05510a493082c09e4aff3ec21d~tplv-k3u1fbpfcp-zoom-1.image)\
\


### []()TLAB

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2c89461d3f854a55935381e4c7c53f08~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0b089eac8da44ceab79cf2f896225366~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/866c7cbb5ede4624a3d88e6611617090~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/66491edc305c4fcd923926c689d02141~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd467bb2d56d497ab00e0f82ee8e3622~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6bbd9fbef3a042f791aafd0d72e20452~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a4686431daa646cab94866dcb8433dfc~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57c081ace6e54c3b8ee875141c258ab9~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4e3cc3325e864d29bb8b82b789ee0849~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8997cb1dcd6847f7aed19eaa6534940f~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9192e2db0812488bbce7d6a3c0f5640a~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5dfb0dcd4ea74f869ee39792b4b2a05c~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/948757cd92bf43f4a25a5ded1e09f479~tplv-k3u1fbpfcp-zoom-1.image)

* 尽管不是所有的对象实例都能够在`TLAB`中成功分配内存（因为它的空间比较小），但`JVM`明确是将`TLAB`作为内存分配的首选；
* 一旦对象在`TLAB`空间分配内存失败时，`JVM`就会尝试着通过使用加锁机制确保数据操作的原子性，从而直接在`Eden`空间中分配内存。\
  \


**参数设置**

* `-XX:UseTLAB`：设置是否开启`TLAB`空间；
* `-XX:TLABWasteTargetPercent`：设置`TLAB`空间所占`Eden`空间的百分比大小，默认仅占`1%`;

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ae6cfb9d7f734c9887ff5d8e66e7f0ed~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b68322832dda4a78a3aed306969271ad~tplv-k3u1fbpfcp-zoom-1.image)

### []()堆是分配对象的唯一选择吗？

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1894c8b40be54fcbbda0a1d73b44ef6d~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/63669171524a4d56b25957be087c87fb~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4432131904a44955b629c7d4a654e9db~tplv-k3u1fbpfcp-zoom-1.image)\
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0834612655ba44ffbf23982306131471~tplv-k3u1fbpfcp-watermark.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/169804ae0bf74382a4866fe6d14e8b78~tplv-k3u1fbpfcp-zoom-1.image)


1. 如果经过逃逸分析（`Escape Analysis`)后发现，一个对象并没有逃逸出方法，那么就可能被优化为栈上分配。这样就无需在堆上分配内存，也无须进行垃圾回收了。这也是最常见的堆外存储技术。
2. 基于`OpenJDK`深度定制的`TaoBaoVM`，它创新的`GCIH(GCinvisible heap)`实现了堆外分配。将生命周期较长的`Java`对象从堆中移至堆外，并且`GC`不能管理`GCIH`内部的`Java`对象，以此达到降低GC的回收频率和提升`GC`的回收效率的目的。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2ca8f838be314db9a09d8acf56b0be9d~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dc77484ba12a4dd1bca574d60650bb69~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cfa608217a1446f0907df4bd4ed97d41~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f4934e4ed8f4c0698b958f8a6a3461f~tplv-k3u1fbpfcp-zoom-1.image)

**举例一**

```java
public void method(){
    User user = new User();
    ...
    user = null;
}
```

`user`对象在方法内部声明，且在内部置为`null`，未被方法外的方法所引用，我们就说`user`对象没有发生逃逸。

它**可以**分配到栈上，并随着方法的结束，栈空间也随之移除。

**举例二**

```java
public static StringBuffer createStringBuffer(String s1,String s2){
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb;
}
```

虽然`sb`对象在方法内部被定义，但是它又作为方法的返回对象，可被其它方法调用，我们就说`sb`对象发生了逃逸。

要想不发生逃逸，可以改造为：

```java
public static String createStringBuffer(String s1,String s2){
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb.toString();
}
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c6e4ddfdb692486ab71006a9dc33c059~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/67ccf678083c4b8da5ae8d4cce109edd~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a24301dc48c45f8bc4071aae91303d0~tplv-k3u1fbpfcp-zoom-1.image)

在`JDK 6u23`版本之后，`HotSpot`中默认开启了逃逸分析。

* `-XX:DoEscapeAnalysis`：显式开启逃逸分析
* `-XX:+PrintEscapeAnalysis`：查看逃逸分析的筛选结果

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/239e6bba1b5541bca377c3a2b1c5cb36~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/70c2047a93e6442abcdb9df05f36de04~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a450a60687534386985d4e53a13b400f~tplv-k3u1fbpfcp-zoom-1.image)

#### []()栈上分配

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8115c0203ee644dcb849460b6a522569~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2510ac66a5604aaf9193f6624e5a0e15~tplv-k3u1fbpfcp-zoom-1.image)

```java
/**
 * 栈上分配测试
 * -Xmx1G -Xms1G -XX:-DoEscapeAnalysis -XX:+PrintGCDetails
 */
public class StackAllocation {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();

        for (int i = 0; i < 10000000; i++) {
            alloc();
        }
       
        long end = System.currentTimeMillis();
        System.out.println("花费的时间为： " + (end - start) + " ms");
        //为了方便查看堆内存中对象个数，线程sleep
        try {
            Thread.sleep(1000000);
        } catch (InterruptedException e1) {
            e1.printStackTrace();
        }
    }

    private static void alloc() {
        //未发生逃逸
        User user = new User();
    }

    static class User {

    }
}
```

逃逸分析默认开启，也可以手动开启：`-XX:+DoEscapeAnalysis`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ff69a8f21dd545a490710244a77d0d73~tplv-k3u1fbpfcp-zoom-1.image)

关闭逃逸分析

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d65df4f9df474d83b295b4fa5cdc9aa5~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9084699b21a84c9196f90d27bd7073e3~tplv-k3u1fbpfcp-zoom-1.image)

#### []()同步省略

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f62f1e8e1abc462f8729e452dd224c46~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ebc43f9186e74af3b9465d4c1656cd90~tplv-k3u1fbpfcp-zoom-1.image)

我们都知道线程同步的代价是相当高的，同步的后果就是降低了并发性和性能。

`JVM`为了提高性能，在动态编译同步块的时候，`JIT`编译器可以借助逃逸分析来判断同步块所使用的锁对象是否只能够被一个线程访问。

如果符合条件，那么`JIT`编译器在编译这个同步块的时候就会取消对这部分代码的同步。这个取消同步的过程就叫同步省略，也叫锁消除。

**举例**

```java
public class SynchronizedTest {
    public void method() {
        Object code = new Object();
        synchronized(code) {
            System.out.println(code);
        }
    }
    /**
    *代码中对code这个对象进行加锁，
    *但是code对象的生命周期只在method方法中
    *并不会被其他线程所访问控制，
    *所以在 JIT 编译阶段就会被优化掉。
    */
    
    //优化为
    public void method2() {
        Object code = new Object();
        System.out.println(code);
    }
}
```

> 在解释执行时这里仍然会有锁，但是经过服务端编译器的即时编译之后，这段代码就会忽略所有的同步措施而直接执行。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/074e858f2cf14d1092671f0725ee43d0~tplv-k3u1fbpfcp-zoom-1.image)

#### []()标量替换

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2af58a2bfa7e4f72abcf4f2129e23a02~tplv-k3u1fbpfcp-zoom-1.image)

* 标量：不可被进一步分解的量，如`JAVA`的基本数据类型就是标量；
* 聚合量：可以被进一步分解的量， 在`JAVA`中对象就是可以被进一步分解的聚合量。

聚合量可以分解成其它标量和聚合量。

标量替换，又名分离对象，即在`JIT`阶段，如果经过逃逸分析，发现一个对象不会被外界访问的话，那么经过`JIT`优化，就会把这个对象拆解成若干个其中包含的成员变量来替代。

**举例**

```java
public class ScalarTest {
    public static void main(String[] args) {
        alloc();   
    }
    public static void alloc(){
        Point point = new Point(1,2);
    }
}
class Point{
    private int x;
    private int y;
    public Point(int x,int y){
        this.x = x;
        this.y = y;
    }
}
//转化之后变为
public static void alloc(){
    int x = 1;
    int y = 2;
}
//Point这个聚合量经过逃逸分析后，发现他并没有逃逸，就被替换成两个标量了。
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/df08b75dfbe548c4943131f72414fdfe~tplv-k3u1fbpfcp-zoom-1.image)

> 标量替换默认开启，你也可以通过参数手动设置`-XX:+EliminateAllocations`，开启之后允许将对象打散分配到栈上，`GC`减少，执行速度提升。

#### []()常见的发生逃逸的场景

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a8d3b3206c0248449fe734e530957b5d~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4066781ccc144b83aaac71fc8ff13c73~tplv-k3u1fbpfcp-zoom-1.image)

**举例**

```java
public class EscapeAnalysis {

    public EscapeAnalysis obj;
    
     /*
    为成员属性赋值，发生逃逸
     */
    public void setObj(){
        this.obj = new EscapeAnalysis();
    }
    //思考：如果当前的obj引用声明为static的？仍然会发生逃逸。

    /*
    方法返回EscapeAnalysis对象，发生逃逸
     */
    public EscapeAnalysis getInstance(){
        return obj == null? new EscapeAnalysis() : obj;
    }
   
   
    /*
    引用成员变量的值，发生逃逸
     */
    public void useEscapeAnalysis1(){
        EscapeAnalysis e = getInstance();
        //getInstance().xxx()同样会发生逃逸
    }
    
     /*
    对象的作用域仅在当前方法中有效，没有发生逃逸
     */
    public void useEscapeAnalysis(){
        EscapeAnalysis e = new EscapeAnalysis();
    }
}
```

### []()逃逸分析并不成熟

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/699ceb051e0244ccbceeb85b47995248~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dbb883bcfc9448859c1347a3141d7123~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b360cd9b3ce4a8882c3beb4d49dadd1~tplv-k3u1fbpfcp-zoom-1.image)\
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a948e2161f8f4d10b92220374b2de16e~tplv-k3u1fbpfcp-zoom-1.image)

`1999`年就已经发表了关于逃逸分析的论文，但`JDK1.6`中才有实现，而且这项技术到如今也不是十分成熟。

其根本原因就是无法保证逃逸分析的性能提升一定能高于它的消耗，因为逃逸分析自身也需要进行一系列复杂的分析，是需要耗时的。

一个极端的例子，就是经过逃逸分析之后，发现所有对象都逃逸了，那这个逃逸分析的过程就白白浪费掉了。

> 细心的小伙伴也应该能发现，我们在抽样器中的截图其实就是在堆中分配的对象。
