---
title: JVM 核心内存区--堆
icon: storage
order: 6
category:
  - JVM
tag:
  - 堆内存
  - 对象分配

---

端午佳节一下子就过完了，大家是不是还沉迷在假期的欢乐气氛中无法自拔？今天阿Q为大家准备了上好的“醒酒菜”——`JVM`运行时数据区的核心内存区——堆。

### 堆的概述
一般来说：
- 一个`Java`程序的运行对应一个进程；
- 一个进程对应着一个`JVM`实例（`JVM`的启动由引导类加载器加载启动），同时也对应着多个线程；
- 一个`JVM`实例拥有一个运行时数据区（`Runtime`类，为饿汉式单例类）；
- 一个运行时数据区中的堆和方法区是多线程共享的，而本地方法栈、虚拟机栈、程序计数器是线程私有的。

堆空间差不多是最大的内存空间，也是运行时数据区最重要的内存空间。堆可以处于物理上不连续的内存空间，但在逻辑上它应该被视为连续的。

在方法结束后，堆中的对象不会马上被移除，仅仅在垃圾收集的时候才会被移除。堆，是`GC`(`Garbage Collection`，垃圾收集器)执行垃圾回收的重点区域。

### 堆内存大小设置

堆一旦被创建，它的大小也就确定了，初始内存默认为电脑物理内存大小的`1/64`，最大内存默认为电脑物理内存的`1/4`，但是堆空间的大小是可以调节，接下来我们来演示一下。

#### 准备工具
`JDK`自带内存分析的工具:在已安装`JDK`的`bin`目录下找到`jvisualvm.exe`。打开该软件，下载插件`Visual GC`，一定要点击检查最新版本，否则会导致安装失败。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/64bbb779a10d4f19bb4e0415f7bb2579~tplv-k3u1fbpfcp-zoom-1.image)

安装完重启`jvisualvm`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5975dddf501a49ab8bec412614e030be~tplv-k3u1fbpfcp-zoom-1.image)

#### 代码样例

```java
public class HeapDemo {
    public static void main(String[] args) {
        System.out.println("start...");
        try {
            Thread.sleep(1000000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("end...");
    }
}
```

#### IDEA设置

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3d0206e4d9d34bb598b68332de50ec60~tplv-k3u1fbpfcp-zoom-1.image)
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/03bc9025c20e45639fa3cd7f6f147970~tplv-k3u1fbpfcp-zoom-1.image)
- `-Xms10m`用于表示堆区的起始内存为10m，等价于`-XX:InitialHeapSize`；
- `-Xmx10m`用于表示堆区的最大内存为10m，等价于`-XX:MaxHeapSize`；
- 其中`-X`是`JVM`的运行参数，`ms`是`memory start`
>通常会将`-Xms`和`-Xmx`两个参数配置相同的值，其目的就是为了能够在`java`垃圾回收机制清理完堆区后不需要重新分隔计算堆区的大小，从而提高性能。

#### 启动程序
启动程序之后去`jvisualvm`查看

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e1bdf2a4624d47a586f8e189fa075bd1~tplv-k3u1fbpfcp-zoom-1.image)

一旦堆区中的内存大小超过`-Xmx`所指定的最大内存时，将会抛出`OOM`(`Out Of MemoryError`)异常。

### 堆的分代

存储在`JVM`中的`java`对象可以被划分为两类：
- 一类是生命周期较短的瞬时对象，这类对象的创建和消亡都非常迅速；
- 另一类是生命周期非常长，在某些情况下还能与`JVM`的生命周期保持一致；

#### 堆区分代
经研究表明`70%-99%`的对象属于临时对象，为了提高`GC`的性能，`Hotspot`虚拟机又将堆区进行了进一步划分。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3ffd0872055f4ad9bed7bb6bf2826114~tplv-k3u1fbpfcp-zoom-1.image)

如图所示，堆区又分为年轻代（`YoungGen`）和老年代（`OldGen`）；其中年轻代又分为伊甸园区（`Eden`）和幸存者区（`Survivor`）；幸存者区分为幸存者0区（`Survivor0，S0`）和幸存者1区（`Survivor1，S1`），有时也叫`from`区和`to`区。

> 分代完成之后，GC时主要检测新生代`Eden`区。

**统一概念：**<br>
新生区<=>新生代<=>年轻代<br>
养老区<=>老年区<=>老年代

几乎所有的`Java`对象都是在`Eden`区被`new`出来的，有的大对象在该区存不下可直接进入老年代。绝大部分的`Java`对象都销毁在新生代了（`IBM`公司的专门研究表明，新生代80%的对象都是“朝生夕死”的）。

#### 新生代与老年代在堆结构的占比
- 默认参数`-XX:NewRatio=2`，表示新生代占1，老年代占2，新生代占整个堆的1/3；
- 可以修改`-XX:NewRatio=4`，表示新生代占1，老年代占4，新生代占整个堆的1/5;

> 该参数在开发中一般不会调整，如果生命周期长的对象偏多时可以选择调整。

#### Eden与Survivor在堆结构的占比
在`HotSpot`中，`Eden`空间和另外两个`Survivor`空间所占的比例是8：1：1（测试的时候是6：1：1），开发人员可以通过选项`-XX:SurvivorRatio`调整空间比例，如`-XX:SurvivorRatio=8`

> 可以在`cmd`中通过`jps 查询进程号-> jinfo -flag NewRatio(SurvivorRatio) + 进程号` 查询配置信息 

`-Xmn`设置新生代最大内存大小（默认就好），如果既设置了该参数，又设置了`NewRatio`的值，则以该参数设置为准。

#### 查看设置的参数
以上边的代码为例：设置启动参数`-XX:+PrintGCDetails`；可在cmd窗口中输入`jps`查询进程号，然后通过`jstat -gc 进程id`指令查看进程的内存使用情况。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0acb8f6a5a1949918eb9d87a8d7d2666~tplv-k3u1fbpfcp-zoom-1.image)

### 图解对象分配过程
#### 对象分配过程
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7da8970ce38b426185883148ccf37b71~tplv-k3u1fbpfcp-zoom-1.image)
1. new的对象先放伊甸园区，此区有大小限制；
2. 当伊甸园的空间填满时，程序继续创建对象，`JVM`的垃圾回收器将对伊甸园区进行垃圾回收（`Minor GC`，也叫`YGC`)：将伊甸园区中的不再被其他对象所引用的对象进行销毁，将未被销毁的对象移动到幸存者0区并分配`age`；
3. 然后再加载新的对象放到伊甸园区；
4. 如果再次触发垃圾回收，将此次未被销毁的对象和上一次放在幸存者0区且此次也未被销毁的对象一齐移动到幸存者一区，此时新对象的`age`为1，上次的对象的`age`加1变为2；
5. 如果再次经历垃圾回收，此时会重新放回幸存者0区，接着再去幸存者1区，`age`也随之增加；
6. 默认当`age`为15时，未被回收的对象将移动到老年区。可以通过设置参数来更改默认配置：`-XX:MaxTenuringThreshold=<N>`；该过程称为晋升（`promotion`)；
7. 在养老区，相对悠闲，当老年区内存不足时，再次触发GC（`Major GC`），进行养老区的内存清理；
8. 若养老区执行了`Major GC`之后发现依然无法进行对象的保存，就会产生`OOM`异常。

> S0，S1满时不会触发`YGC`，但是`YGC`会回收S0，S1的对象。


**总结**
- 针对幸存者s0，s1区：复制之后有交换，谁空谁是to；
- 关于垃圾回收：频繁在新生区收集，很少在养老区收集，几乎不再永久区/元空间收集。

#### 对象特殊情况分配过程
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5f65059b65584942bb177fa69acea5d0~tplv-k3u1fbpfcp-zoom-1.image)
1. 新对象申请内存，如果`Eden`放的下，则直接存入`Eden`；如果存不下则进行`YGC`；
2. `YGC`之后如果能存下则放入`Eden`，如果还存不下（为超大对象），则尝试存入`Old`区；
3. 如果`Old`区可以存放，则存入；如果不能存入，则进行`Full GC`；
4. `Full GC`之后如果可以存入`Old`区，则存入；如果内存空间还不够，则`OOM`；
5. 图右侧为`YGC`的流程图：当`YGC`之后未销毁的对象放入幸存者区，此时如果幸存者区的空间可以装下该对象，则存入幸存者区，否则，直接存入老年代；
6. 当在幸存者区的对象超过阈值时，可以晋升为老年代，未达到阈值的依旧在幸存者区复制交换。

#### 内存分配策略
针对不同年龄段的对象分配原则如下：
1. 优先分配到`Eden`；
2. 大对象直接分配到老年代：尽量避免程序中出现过多的大对象；
3. 长期存活的对象分配到老年代；
4. 动态对象年龄判断：如果`Survivor`区中相同年龄的所有对象大小的总和大于`Survivor`空间的一半，年龄大于或等于该年龄的对象可以直接进入到老年代。无需等到`MaxTenuringThreshold`中要求的年龄；

#### 数值变小原理
代码样例，设置参数:`-Xms600m，-Xmx600m`
```java
public class HeapSpaceInitial {
    public static void main(String[] args) {

        //返回Java虚拟机中的堆内存总量
        long initialMemory = Runtime.getRuntime().totalMemory() / 1024 / 1024;
        //返回Java虚拟机试图使用的最大堆内存量
        long maxMemory = Runtime.getRuntime().maxMemory() / 1024 / 1024;

        System.out.println("-Xms : " + initialMemory + "M");
        System.out.println("-Xmx : " + maxMemory + "M");
        
        try {
            Thread.sleep(1000000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
//执行结果
-Xms : 575M
-Xmx : 575M
```
明明设置的600M，怎么变成575M了呢？这是因为在堆内存存取数据时，新生代里边只有伊甸园和幸存者1区或者是幸存者2区存储对象，所以会少一个幸存者区的内存空间。

### GC
`JVM`进行`GC`时，并非每次都对新生代、老年代、方法区（永久代、元空间）这三个区域一起回收，大部分回收是指新生代。

针对`HotSpot VM`的实现，它里面的`GC`按照回收区域又分为两大种类型：一种是部分收集（`Partial GC`），一种是整堆收集（`Full GC`）

#### Partial GC
部分收集：不是完整收集整个`Java`堆的垃圾收集。其中又分为：
- 新生代收集（Minor GC/Young GC）：只是新生代的垃圾收集；
- 老年代收集（Major GC/Old GC）：只是老年代的垃圾收集；
- 混合收集（Mixed GC）：收集整个新生代以及部分老年代的垃圾收集，只有`G1 GC` （按照`region`划分新生代和老年代的数据）会有这种行为。

目前，只有`CMS GC`会有单独收集老年代的行为；很多时候`Major GC`会和`Full GC` 混淆使用，需要具体分辨是老年代回收还是整堆回收。

#### Full GC
整堆收集（`Full GC`）：整个`java`堆和方法区的垃圾收集。


#### 触发机制

##### 年轻代GC（Minor GC）触发机制

1. 当年轻代空间不足时，就会触发`Minor GC`，这里的年轻代满指的是`Eden`代满，`Survivor`满不会引发`GC`。(每次`Minor GC`会清理年轻代的内存，`Survivor`是被动`GC`，不会主动`GC`)
2. 因为`Java`对象大多都具备“朝生夕灭”的特性，所以`Minor GC`非常频繁，一般回收速度也比较快。
3. `Minor GC`会引发`STW`（`Stop The World`），暂停其他用户的线程，等垃圾回收结束，用户线程才恢复运行。

##### 老年代GC(Major GC/Full GC)触发机制

1. 指发生在老年代的`GC`，对象从老年代消失时，`Major GC`或者`Full GC`发生了；
2. 出现了`Major GC`，经常会伴随至少一次的`Minor GC`（不是绝对的，在`Parallel Scavenge`收集器的收集策略里就有直接进行`Major GC`的策略选择过程），也就是老年代空间不足时，会先尝试触发`Minor GC`。如果之后空间还不足，则触发`Major GC`；
3. `Major GC`速度一般会比`Minor GC`慢10倍以上，`STW`时间更长；
4. 如果`Major GC`后，内存还不足，就报`OOM`了。


##### Full GC触发机制

触发Full GC执行的情况有以下五种：
1. 调用`System.gc()`时，系统建议执行`Full GC`，但是不必然执行；
2. 老年代空间不足；
3. 方法区空间不足；
4. 通过`Minor GC`后进入老年代的平均大小小于老年代的可用内存；
5. 由`Eden`区，`Survivor S0`（`from`）区向`S1`（`to`）区复制时，对象大小大于`To Space`可用内存，则把该对象转存到老年代，且老年代的可用内存小于该对象大小。

> `Full GC`是开发或调优中尽量要避免的，这样暂停时间会短一些。
