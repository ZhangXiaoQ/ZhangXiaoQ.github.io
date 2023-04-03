---
title: JVM 之类加载子系统
icon: storage
order: 2
category:
  - JVM
tag:
  - JVM
  - 类的加载过程
  - 双亲委派机制

---

> 通篇文章都是以`HotSpot JVM`为例

上篇文章中我们知道了`JVM`是个啥？本篇文章就让我们来了解一下类加载子系统（`ClassLoader`）—— 负责从文件系统或者网络中加载`Class`字节码文件，并将加载的类信息（DNA元数据模版，jvm会根据这个模版实例化出n个一模一样的实例）存放于“方法区”(接下来的文章中会做具体的介绍)中。`ClassLoader`只负责文件的加载，而文件是否可以运行，则由执行引擎（`Exection Engine`，接下来的文章中会做具体的介绍）决定。

下图是类加载子系统构造图：

![类加载子系统](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7050aeb6468a426e82810b2f44eb1d48~tplv-k3u1fbpfcp-zoom-1.image)

## 类的加载过程
![类加载过程](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/414462e8a92c43bbb6a1e29f420ce010~tplv-k3u1fbpfcp-zoom-1.image)

### 加载（Loading）

**加载流程**
1. 通过一个类的全限定名获取定义此类的二进制字节流；
2. 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构；
3. 在内存中生成一个代表这个类的`java.lang.Class`对象，作为方法区这个类的各种数据的访问入口。

**加载`.class`文件的方式**
- 从本地系统中直接加载；
- 通过网络获取，典型场景：`Web Applet`；
- 从zip压缩包中读取，成为日后`jar`、`war`格式的基础；
- 运行时计算生成，使用最多的是：动态代理技术；
- 由其他文件生成，典型场景：`jsp`应用；
- 从专有数据库中提取`.class`文件，比较少见；
- 从加密文件中读取，典型的防`Class`文件被反编译的保护措施。

### 链接（Linking）

**（1）验证（Verify）**
- 目的是保证`Class`文件的字节流中包含的信息符合当前虚拟机的要求，保证被加载类的正确性，不会危害虚拟机的自身安全。
- 主要分为四种验证方式：文件格式验证、元数据验证、字节码验证、符号引用验证。

文件格式验证：主要验证字节流是否符合Class文件格式规范，并且能被当前的虚拟机加载处理。例如：主、次版本号是否在当前虚拟机处理的范围之内。常量池中是否有不被支持的常量类型。指向常量的中的索引值是否存在不存在的常量或不符合类型的常量。

元数据验证：对字节码描述的信息进行语义的分析，分析是否符合java的语言语法的规范。

字节码验证：最重要的验证环节，分析数据流和控制，确定语义是合法的，符合逻辑的。主要的针对元数据验证后对方法体的验证。保证类方法在运行时不会有危害出现。

符号引用验证：主要是针对符号引用转换为直接引用的时候，是会延伸到第三解析阶段，主要去确定访问类型等涉及到引用的情况，主要是要保证引用一定会被访问到，不会出现类等无法访问的问题。

> `java`虚拟机字节码文件起始编码CAFEBABE（使用`Binary Viewer`软件）

**（2）准备（Prepare）**
- 为类变量（静态变量）分配内存并且设置该类变量的默认初始值，即零值。
```
public class HelloWord{
  //准备阶段：a=0 -> 初始化阶段：a=1
  private static int a = 1;
  
  public static void main(){
    System.out.println(a);
  }
}

```
- 这里不包含`final`修饰的`static`，因为`final`在编译的时候就会分配了，准备阶段会显示初始化；
- 这里不会为实例变量（new的对象）分配初始化，类变量会分配在方法区中，而实例变量是会随着对象一起分配到`java`堆中。

**（3）解析（Resolve）**

将常量池内的符号引用（符号引用就是一组符号来描述所引用的目标）转换为直接引用（直接引用就是直接指向目标的指针、相对偏移量或一个简洁定位到目标的句柄）的过程。事实上，解析操作往往会伴随着`JVM`在执行完初始化之后再执行。解析动作主要针对类或接口、字段、类方法、方法类型等。对应常量池中的`CONSTANT_Class_info`、`CONSTANT_Fieldref_info`、`CONSTANT_Methodref_info`等。
>解析的执行过程等后边讲到字节码文件时再做具体解释。

### 初始化（Initialization）

- 初始化阶段就是执行类构造器方法 `<clinit>()`的过程。此方法不需要定义，是`javac`编译器自动收集类中的所有`类变量`的赋值动作和`静态代码块`中的语句合并而来。构造器方法中的指令按语句在源文件中出现的顺序执行。`<clinit>()`不同于类的构造器，构造器是虚拟机视角下的`<init>()`。
- 若该类具有父类，JVM会保证子类的`<clinit>()`执行前，父类的`<clinit>()`已经执行完毕。
- 虚拟机必须保证一个类的`<clinit>()`方法在多线程下被同步加锁。
  

**样例：**
![初始化阶段加载顺序](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/52046877e3df4be7a24a62d934f76c61~tplv-k3u1fbpfcp-zoom-1.image)
![字节码阅读器插件](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9180e34eef694f70992795e24488be04~tplv-k3u1fbpfcp-zoom-1.image)

在未定义前进行调用会导致“非法前向引用”错误
![非法的前向引用](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2cb34be724e546b3b48ce9494ad7b145~tplv-k3u1fbpfcp-zoom-1.image)

#### 类的初始化时机

java程序对类的使用方式可以分为两种：

**1. 主动使用**
 - 创建类的实例
 - 访问某个类或接口的静态变量，或者对该静态变量赋值
 - 调用类的静态方法
 - 反射
 - 初始化一个类的子类
 - Java虚拟机启动被标明为启动类的类
 - JDK 7 开始提供的动态语言支持：`java.lang.invoke.MethodHandle`实例的解析结果，`REF_getStatic`、`REF_putStatic`、`REF_invokeStatic`句柄对应的类没有初始化，则初始化。

**2. 被动使用**：除了以上七种情况，其他都被看作是类的被动使用，都不会导致类的初始化。

## 类的加载器

### 加载器分类
JVM支持两种类型的类加载器，分别为引导类加载器（`Bootstrap ClassLoader`）和自定义加载器（`User-Defined ClassLoader`），他们之间不是继承关系，而是包含关系。
![加载器类图](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/72623f923f0945a39898624d745f9624~tplv-k3u1fbpfcp-zoom-1.image)

**引导类加载器**

引导类加载器又称为启动类加载器，该类是使用`C/C++`语言实现的，嵌套在`JVM`内部。它用来加载`Java`的核心类库（`JAVA_HOME/jre/lib/rt.jar`、`resources.jar`或`sun.boot.class.path`路径下的内容），用于提供`jvm`自身需要的类，出于安全考虑，`Bootstrap`启动类只加载包名为`java`、`javax`、`sun`等开头的类。它并不继承自`java.lang.ClassLoader`，没有父加载器。

```java
//String属于java的核心类库--->使用引导类加载器进行加载
ClassLoader classLoader1 = String.class.getClassLoader();
System.out.println(classLoader1);//null
```

**自定义加载器**

自定义加载器是指所有派生于抽象类`CLassLoader`的类加载器，它分为扩展类加载器、应用程序（系统）加载器、用户自定义加载器。

（1）扩展类加载器

java语言编写，由`sun.misc.Launcher.ExtClassLoader`实现。其父类加载器为启动类加载器，从`java.ext.dirs`系统属性所指定的目录中加载类库，或从`jdk`的安装目录的`jre/lib/ext`子目录（扩展目录）下加载类库。如果用户创建的`jar`放在此目录下，也会自动由扩展类加载器加载。

（2）系统加载器

java语言编写，由`sun.misc.Launcher.AppClassLoader`实现。父类加载器为扩展类加载器，负责加载环境变量`classpath`或系统属性，`java.class.path`指定路径下的类库。该类加载是程序中默认的类加载器。

```java
//获取系统类加载器
ClassLoader systemClassLoader = ClassLoader.getSystemClassLoader();
System.out.println(systemClassLoader);//sun.misc.Launcher$AppClassLoader@18b4aac2

//获取其上层：扩展类加载器
ClassLoader extClassLoader = systemClassLoader.getParent();
System.out.println(extClassLoader);//sun.misc.Launcher$ExtClassLoader@4554617c

//获取引导类加载器
ClassLoader bootstrapClassLoader = extClassLoader.getParent();
System.out.println(bootstrapClassLoader);//null
```

（3）用户自定义加载器

开发人员可以通过继承抽象类`java.lang.ClassLoader`，并实现`findClass()`方法来实现自定义类加载器。在编写自定义类加载器时，如果没有太过于复杂的需求，可以直接继承`URLClassLoader`类，这样就可以避免自己去编写`findClass()`方法及其获取字节码流的方式，使自定义类加载器编写更加简洁。 
```java

//用户自定义类：默认使用系统类加载器进行加载
ClassLoader classLoader = ClassLoaderTest.class.getClassLoader();
System.out.println(classLoader);//sun.misc.Launcher$AppClassLoader@18b4aac2

```

为什么要自定义加载器？
- 隔离加载类；
- 修改类加载方式；
- 扩展加载源；
- 防止源码泄漏；


### ClassLoader的获取与API

**获取**

1. 获取当前类的`ClassLoader`：`clazz.getClassLoader()`;
2. 获取当前线程上下文的`ClassLoader`：`Thread.currentThread().getContextClassLoader()`;
3. 获取系统的`ClassLoader`：`ClassLoader.getSystemClassLoader()`;
4. 获取调用者的`ClassLoader`：`DriverManager.getCallerClassLoader()`;

**API**

- Class loadClass(String name) ：name参数指定类装载器需要装载类的名字，必须使用全限定类名，如：`com.smart.bean.Car`。该方法有一个重载方法 `loadClass(String name,boolean resolve)``，`resolve`参数告诉类装载时候需要解析该类，在初始化之前，因考虑进行类解析的工作，但并不是所有的类都需要解析。如果JVM只需要知道该类是否存在或找出该类的超类，那么就不需要进行解析。
- Class defineClass(String name,byte[] b,int len)：将类文件的字节数组转换成JVM内部的`java.lang.Class`对象。字节数组可以从本地文件系统、远程网络获取。参数name为字节数组对应的全限定类名。
- Class findSystemClass(String name)：从本地文件系统加载`Class`文件。如果本地系统不存在该`Class`文件。则抛出`ClassNotFoundException`异常。该方法是JVM默认使用的装载机制
- Class findLoadedClass(String name)：调用该方法来查看`ClassLoader`是否已载入某个类。如果已载入，那么返回`java.lang.Class`对象；否则返回`null`。如果强行装载某个已存在的类，那么则抛出链接错误。
- ClassLoader getParent()：获取类装载器的父装载器。除根装载器外，所有的类装载器都有且仅有一个父装载器。`ExtClassLoader`的父装载器是根装载器，因为根装载器非`java`语言编写，所以无法获取，将返回`null`。

### 双亲委派机制

`Java`虚拟机对`class`文件采用的是按需加载的方式，也就是说当需要使用该类时才会将它的`class`文件加载到内存生成`class`对象。而且加载某个类的`class`文件时，`Java`虚拟机采用的是双亲委派模式，即把请求交由父类处理，它是一种任务委派模式。

#### 工作原理

![双亲委派原理](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/38d53cfba5cc4ec8840652222d8c102c~tplv-k3u1fbpfcp-zoom-1.image)

如果一个类加载器收到了类加载请求，它并不会自己先去加载，而是把这个请求委托给父类的加载器去执行。如果父类加载器还存在其父类加载器，则进一步向上委托，依次递归，请求最终将到达顶层的启动类加载器。如果父类加载器可以完成类加载任务，就成功返回，倘若父类加载器无法完成此加载任务，子加载器才会尝试自己去加载，这就是双亲委派模式。

#### 优势

- 避免类的重复加载，当父亲已经加载了该类时，就没有必要子`ClassLoader`再加载一次。
- 保护程序安全，防止核心API被随意篡改。举例代码截图如下
![自定义String类](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/40350527758646dc964ced1976c78f1c~tplv-k3u1fbpfcp-zoom-1.image)

如图所示，我们创建`java.lang.String`类，当在加载自定义类的时候会先使用引导类加载器加载，而引导类加载器在加载的过程中会先加载`jdk`自带的文件（`rt.jar`包中的`java/lang/String.class`）。报错信息说没有`main`方法，就是因为加载的是`rt.jar`包下的`String`类。这样我们就能保证对`java`的核心源代码进行保护，这就是**沙箱安全机制**。由此可知`JVM`中判断两个`Class`对象是否是同一个类存在两个必要条件：一是类的完整类名必须保持一致，包括包名；二是加载该类的类加载器必须相同。

#### 对类加载器的引用

`JVM`必须知道一个类是由启动类加载器还是用户类加载器加载的，如果一个类是由用户类加载器加载的，那么`jvm`会将这个类加载器的一个引用作为类信息的一部分保存到方法区中，当解析一个类到另一个类的引用的时候，`jvm`需要保证两个类的类加载器是相同的。