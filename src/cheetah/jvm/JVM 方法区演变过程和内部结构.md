---
title: JVM 方法区演变过程和内部结构
icon: storage
order: 8
category:
  - JVM
tag:
  - JVM
  - 总结

---

之前我们已经了解过“运行时数据区”的程序计数器、虚拟机栈、本地方法栈和堆空间，今天我们就来了解一下最后一个模块——方法区。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b7be6491a06242b3aeb6102f5b5fa3d4~tplv-k3u1fbpfcp-zoom-1.image)

## 简介
创建对象时内存分配简图

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f4730bc3ccc34c50950528ccb5095f1b~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8df920da87a448f0bf62af1c4922b617~tplv-k3u1fbpfcp-zoom-1.image)

《Java虚拟机规范》中明确说明：“尽管所有的方法区在逻辑上属于堆的一部分，但一些简单的实现可能不会选择去进行垃圾收集或者进行压缩。”

虽然 Java 虚拟机规范把方法区描述为堆的一个逻辑部分，但是它却有一个别名叫做 Non-Heap（非堆），目的应该是与 Java 堆区分开来。所以，方法区可以看作是一块**独立**于 Java 堆的内存空间。

方法区与 Java 堆一样，是各个线程共享的内存区域。方法区在 JVM 启动时就会被创建，并且它的实际的物理内存空间是可以**不连续**的，关闭 JVM 就会释放这个区域的内存。

## 永久代、元空间

《java虚拟机规范》对如何实现方法区，不做统一要求。例如：BEA JRockit/IBM J9 中不存在永久代的概念。而对于 HotSpot 来说，在 jdk7 及以前，习惯上把方法区的实现称为**永久代**，而从 jdk8 开始，使用**元空间**取代了永久代。

> 方法区是 Java 虚拟机规范中的概念，而永久代和元空间是 HotSpot 虚拟机对方法区的一种实现。通俗点讲：如果把方法区比作接口的话，那永久代和元空间可以比作实现该接口的实现类。

### 直接内存

永久代、元空间并不只是名字变了，内部结构也进行了调整。永久代使用的是 JVM 的内存，而元空间使用的是本地的直接内存。

直接内存并不是 JVM 运行时数据区的一部分，因此不会受到 Java 堆的限制。但是它会受到本机总内存大小以及处理器寻址空间的限制，所以如果这部分内存也被频繁的使用，依然会导致 OOM 错误的出现。

### 方法区的大小

方法区的大小是可以进行设置的，可以选择固定大小也可以进行扩展。

#### jdk7 及以前

```xml
-XX:PermSize=N //方法区 (永久代) 初始分配空间，默认值为 20.75M
-XX:MaxPermSize=N //方法区 (永久代) 最大可分配空间。32位机器默认是64M，64位机器默认是82M
```

#### jdk8及以后

默认值依赖于平台，windows下：

```xml
-XX:MetaspaceSize=N //方法区 (元空间) 初始分配空间，如果未指定此标志，则元空间将根据运行时的应用程序需求动态地重新调整大小。
-XX:MaxMetaspaceSize=N //方法区 (元空间) 最大可分配空间，默认值为 -1，即没有限制
```

与永久代很大的不同就是，如果不指定大小的话，随着更多类的创建，虚拟机会耗尽所有可用的系统内存。

方法区的大小决定了系统可以保存多少个类，如果系统定义了太多的类，比如：加载大量的第三方 jar 包、Tomcat 部署的工程过多、大量动态生成反射类等都会导致方法区溢出，抛出内存溢出错误。

- 永久代：OutOfMemoryError:PermGen space
- 元空间：OutOfMemoryError:Metaspace

**至于如何解决 OOM 异常，将在以后的文章中讲解！**

### jvisualvm

我们可以通过 JDK 自带的 **jvisualvm** 工具来查看程序加载的类文件：

**例**

```java
public class MethodAreaDemo1 {
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

运行程序，可以看到一个简单的程序就需要加载这么多的类文件。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cc4c68b548b047bb851b7a4271c92508~tplv-k3u1fbpfcp-zoom-1.image)


### 高水位线

对于一个64位的服务器端 JVM 来说，`XX：MetaspaceSize=21` 就是初始的高水位线，一旦触及这个水位线，Full GC 将会被触发并卸载没用的类（即这些类对应的类加载器不再存活），然后这个高水位线将会重置。

新的高水位线的值取决于 GC 后释放了多少元空间：

- 如果释放的空间不足，那么在不超过 MaxMetaspaceSize 时，适当提高该值；
- 如果释放空间过多，则适当降低该值。

> 如果初始化的高水位线设置过低，高水位线调整情况会发生很多次。通过垃圾回收器的日志可以观察到 Full GC 多次调用。为了避免频繁地GC，建议将 `-XX ：MetaspaceSize` 设置为一个相对较高的值。

## 内部结构

《深入理解Java虚拟机》书中对方法区存储内容描述如下：它用于存储已被虚拟机加载的类型信息、常量、静态变量、即时编译器编译后的代码缓存等。接下来我们就一起来看一下它的内部结构。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0a92b104dc494b71a6b1037eaf9da3f9~tplv-k3u1fbpfcp-zoom-1.image)


### 类型信息

对每个加载的类型（ 类 class、接口 interface、枚举 enum、注解 annotation），JVM 必须在方法区中存储以下类型信息：

1. 这个类型的完整有效名称（全名=包名.类名）
2. 这个类型直接父类的完整有效名（对于 interface 或是 java. lang.Object ，都没有父类）
3. 这个类型的修饰符（ public ， abstract， final 的某个子集）
4. 这个类型直接接口的一个有序列表

### 域（Field）信息

- JVM必须在方法区中保存类型的所有域（field，也称为属性）的相关信息以及域的声明顺序；
- 域的相关信息包括：域名称、 域类型、域修饰符（public， private，protected， static， final， volatile， transient 的某个子集）

### 方法（Method）信息

JVM 必须保存所有方法的以下信息，同域信息一样包括声明顺序：

- 方法名称
- 方法的返回类型（或void）
- 方法参数的数量和类型（按顺序）
- 方法的修饰符（public， private， protected， static， final，synchronized， native ， abstract 的一个子集）
- 方法的字节码（bytecodes）、操作数栈、局部变量表及大小（ abstract 和 native 方法除外）
- 异常表（ abstract 和 native 方法除外）每个异常处理的开始位置、结束位置、代码处理在程序计数器中的偏移地址、被捕获的异常类的常量池索引

### non-final 的类变量

- 静态变量和类关联在一起，随着类的加载而加载，他们成为类数据在逻辑上的一部分
- 类变量被类的所有实例所共享，即使没有类实例你也可以访问它。

我们可以通过例子来查看：

```java
public class MethodAreaDemo2 {
    public static void main(String[] args) {
        Order order = null;
        order.hello();
        System.out.println(order.count);
    }
}

class Order {
    public static int count = 1;
    public static final int number = 2;

    public static void hello() {
        System.out.println("hello!");
    }
}
```

运行结果为：

```java
hello!
1
```

可以打开 IDEA 的 Terminal 窗口，在 MethodAreaDemo2.class 所在的路径下，输入 `javap -v -p MethodAreaDemo2.class` 命令

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f49d9665959e49bf9d0ffa10e365fe08~tplv-k3u1fbpfcp-zoom-1.image)


通过图片我们可以看出被声明为 final 的类变量的处理方法是不一样的，全局常量在编译的时候就被分配了。

### 运行时常量池

说到运行时常量池，我们先来了解一下什么是常量池表。

#### 常量池表

一个有效的字节码文件中除了包含类的版本信息、字段、方法以及接口等描述信息外，还包含一项信息那就是常量池表（Constant Pool Table），里边存储着**数量值**、**字符串值**、**类引用**、**字段引用**和**方法引用**。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/15654ae18d5b44e999cff046192dce72~tplv-k3u1fbpfcp-zoom-1.image)


#### 为什么字节码文件需要常量池？

java 源文件中的类、接口，编译后会产生一个字节码文件。而字节码文件需要数据支持，通常这种数据会很大，以至于不能直接存放到字节码中。换一种方式，可以将指向这些数据的**符号引用**存到字节码文件的常量池中，这样字节码只需使用常量池就可以在运行时通过**动态链接**找到相应的数据并使用。

#### 运行时常量池

运行时常量池（ `Runtime Constant Pool`）是方法区的一部分，类加载器加载字节码文件时，将常量池表加载进方法区的运行时常量池。运行时常量池中包含多种不同的常量，包括编译期就已经明确的数值字面量，也包括到运行期解析后才能够获得的方法或者字段引用。此时不再是常量池中的符号地址了，这里换为**真实**地址。

> 运行时常量池，相对于 Class 文件常量池的另一重要特征是：具备动态性，比如 `String.intern()`。

## 演进细节

针对的是 **Hotspot** 的虚拟机：

- jdk1.6 及之前：有**永久代** ，静态变量存放在永久代上；
- jdk1.7：有**永久代**，但已经逐步“去永久代”，字符串常量池、静态变量移除，保存在堆中；
- jdk1.8及之后： 无永久代，类型信息、字段、方法、常量保存在本地内存的**元空间**，但字符串常量池、静态变量仍在堆中；

### 演变示例图
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bcf5de4bcd274c7b89084808dbad8d8f~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/53fec06fd16b465f98949f4ab130398c~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/53543513dbd041dca1568337c08d99df~tplv-k3u1fbpfcp-zoom-1.image)



### 为什么要将永久代替换为元空间呢?

1. 永久代使用的是 JVM 的内存，受 JVM 设置的内存大小限制；元空间使用的是本地直接内存，它的最大可分配空间是系统可用内存的空间。因为元空间里存放的是类的**元数据**，所以随着内存空间的增大，能加载的类就更多了，相应的溢出的机率会大大减小。
2. 在 JDK8，合并 HotSpot 和 JRockit 的代码时，JRockit 从来没有一个叫永久代的东西，合并之后就没有必要额外的设置这么一个永久代的地方了。
3. 对永久代进行调优是很困难的。

### StringTable 为什么要调整

因为永久代的回收效率很低，在 full gc 的时候才会触发。而 full GC 是老年代的空间不足、永久代不足时才会触发。这就导致了`StringTable` 回收效率不高。而我们开发中会有大量的字符串被创建，回收效率低，导致永久代内存不足。放到堆里，能及时回收内存。

## 垃圾回收

相对而言，垃圾收集行为在这个区域是比较少出现的，但并非数据进入方法区后就“永久存在”了。方法区的垃圾收集主要回收两部分内容：常量池中废奔的**常量**和不再使用的**类型**。

方法区内常量池中主要存放字面量和符号引用两大类常量：

- 字面量比较接近 Java 语言层次的常量概念，如文本字符串、被声明为 final 的常量值等。
- 符号引用则属于编译原理方面的概念，包括类和接口的全限定名、字段的名称和描述符、方法的名称和描述符。

HotSpot 虚拟机对常量池的回收策略是很明确的，只要常量池中的常量没有被任何地方引用，就可以被回收。

### 类型判定

判定一个常量是否“废弃”还是相对简单，而要判定一个类型是否属于“不再被使用的类”的条件就比较苛刻了。需要同时满足下面三个条件：

- 该类所有的**实例**都已经被回收，也就是 Java 堆中不存在该类及其任何派生子类的实例；
- 加载该类的**类加载器**已经被回收，这个条件除非是经过精心设计的可替换类加载器的场景，如OSGi、JSP的重加载等，否则通常是很难达成的；
- 该类对应的 java.lang.Class 对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法。

Java 虛拟机被允许对满足上述三个条件的无用类进行回收，这里说的仅仅是“被允许”，而并不是和对象一样，没有引用了就必然会回收。
