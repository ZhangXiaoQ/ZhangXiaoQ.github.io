---
title: 面试官太难伺候？一个try-catch问出这么多花样
icon: java
order: 10
category:
  - java
tag:
  - tcf
  - 效率

---

刚刚面试回来的B哥又在吐槽了：现在的面试官太难伺候了，放着好好的堆、栈、方法区不问，上来就让我从字节码角度给他分析一下`try-catch-finally`（以下简称TCF）的执行效率......

我觉得应该是面试官在面试的过程中看大家背的八股文都如出一辙，觉得没有问的必要，便拐着弯的考大家的理解。今天趁着B哥也在，我们就来好好总结一下TCF相关的知识点，期待下次与面试官对线五五开！

> 环境准备： IntelliJ IDEA 2020.2.3、JDK 1.8.0_181

## 执行顺序

我们先来写一段简单的代码：

```java
public static int test1() {
    int x = 1;
    try {
        return x;
    } finally {
        x = 2;
    }
}
```

答案是1不是2，你答对了吗？

大家都知道在TCF中，执行到`return`的时候会先去执行`finally`中的操作，然后才会返回来执行`return`，那这里为啥会是1呢？我们来反编译一下字节码文件。

> 命令：javap -v xxx.class

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3d0d694b4e29460cb486c7d8d3081b18~tplv-k3u1fbpfcp-zoom-1.image)


字节码指令晦涩难懂，那我们就用图解的方式来解释一下（我们先只看前7行指令）：首先执行 `int x = 1;`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5f2817ea6d424623bcdafac22837de58~tplv-k3u1fbpfcp-zoom-1.image)


然后我们需要执行`try`中的`return x;` 


![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d95f5d4b7fd044cc8cb31ae100f313c0~tplv-k3u1fbpfcp-zoom-1.image)

此时并不是真正的返回`x`的值，而是将`x`的值存到局部变量表中作为**临时存储变量**进行存储，也就是对该值进行**保护**操作。

最后进入`finally`中执行`x=2;`

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9fd417dac7a74a6993717dffa4b358d5~tplv-k3u1fbpfcp-zoom-1.image)

此时虽然`x`已经被赋值为2了，但是由于刚才的保护操作，在执行真正的`return`操作时，会将被保护的**临时存储变量**入栈返回。

为了更好的理解上述操作，我们再来写一段简单代码：

```java
public static int test2() {
    int x = 1;
    try {
        return x;
    } finally {
        x = 2;
        return x;
    }
}
```

大家思考一下执行结果是几？答案是2不是1。

我们再来看下该程序的字节码指令

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8b395b583c984ef08f8039f21166233e~tplv-k3u1fbpfcp-zoom-1.image)

通过对比发现，第6行一个是`iload_1`，一个是`iload_0`，这是由什么决定的呢？原因就是我们上边提到的**保护机制**，当在`finally`中存在`return`语句时，保护机制便会失效，转而将变量的值入栈并返回。

### 小结

- `return`的执行优先级高于`finally`的执行优先级，但是`return`语句执行完毕之后并不会马上结束函数，而是将结果保存到**栈帧**中的**局部变量表**中，然后继续执行`finally`块中的语句；
- 如果`finally`块中包含`return`语句，则不会对`try`块中要返回的值进行保护，而是直接跳到`finally`语句中执行，并最后在`finally`语句中返回，返回值是在`finally`块中改变之后的值；

## finally 为什么一定会执行

细心地小伙伴应该能发现，上边的字节码指令图中第4-7行和第9-12行的字节码指令是完全一致的，那么为什么会出现重复的指令呢？

首先我们来分析一下这些重复的指令都做了些什么操作，经过分析发现它们就是`x = 2;return x;`的字节码指令，也就是`finally`代码块中的代码。由此我们有理由怀疑如果上述代码中加入`catch`代码块，`finally`代码块对应的字节码指令也会再次出现。

```java
public static int test2() {
    int x = 1;
    try {
        return x;
    } catch(Exception e) {
        x = 3;
    } finally {
        x = 2;
        return x;
    }
}
```

反编译之后

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6e61c8b09fd84944ad1f3e4633cedf1c~tplv-k3u1fbpfcp-zoom-1.image)


果然如我们所料，重复的字节码指令出现了三次。让我们回归到最初的问题上，为什么`finally`代码的字节码指令会重复出现三次呢？

原来是`JVM`为了保证所有异常路径和正常路径的执行流程都要执行`finally`中的代码，所以在`try`和`catch`后追加上了`finally`中的字节码指令，再加上它自己本身的指令，正好三次。这也就是为什么`finally` 一定会执行的原因。

## finally一定会执行吗？

为什么上边已经说了`finally`中的代码一定会执行，现在还要再多此一举呢？请👇看

在正常情况下，它是一定会被执行的，但是至少存在以下三种情况，是一定不执行的：

- `try`语句没有被执行到就返回了，这样`finally`语句就不会执行，这也说明了`finally`语句被执行的必要而非充分条件是：相应的`try`语句一定被执行到；
- `try`代码块中有`System.exit(0);`这样的语句，因为`System.exit(0);`是终止`JVM`的，连`JVM`都停止了，`finally`肯定不会被执行了；
- 守护线程会随着所有非守护线程的退出而退出，当**守护线程**内部的`finally`的代码还未被执行到，非守护线程终结或退出时，`finally` 肯定不会被执行；

## TCF 的效率问题

说起TCF的效率问题，我们不得不介绍一下**异常表**，拿上边的程序来说，反编译`class`文件后的异常表信息如下：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/095e0c52f68541ce9b36e6713167ca26~tplv-k3u1fbpfcp-zoom-1.image)

- from：代表异常处理器所监控范围的起始位置；
- to：代表异常处理器所监控范围的结束位置（该行不被包括在监控范围内，是前闭后开区间）；
- target：指向异常处理器的起始位置；
- type：代表异常处理器所捕获的异常类型；

> 图中每一行代表一个异常处理器

### 工作流程：

1. 触发异常时，`JVM`会从上到下遍历异常表中所有的条目；
2. 比较触发异常的行数是否在`from`-`to`范围内；
3. 范围匹配之后，会继续比较抛出的异常类型和异常处理器所捕获的异常类型`type`是否相同;
4. 如果类型相同，会跳转到`target`所指向的行数开始执行；
5. 如果类型不同，会弹出当前方法对应的`java`栈帧，并对调用者重复操作；
6. 最坏的情况下`JVM`需要遍历该线程 `Java` 栈上所有方法的异常表；

拿第一行为例：如果位于2-4行之间的命令（即`try`块中的代码）抛出了`Class java/lang/Exception`类型的异常，则跳转到第8行开始执行。

> `8: astore_1`是指将抛出的异常对象保存到局部变量表中的1位置处

从字节码指令的角度来讲，如果代码中没有异常抛出，TCF的执行时间可以忽略不计；如果代码执行过程中出现了上文中的第6条，那么随着异常表的遍历，更多的异常实例被构建出来，异常所需要的栈轨迹也在生成。

该操作会逐一访问当前线程的栈帧，记录各种调试信息，包括类名、方法名、触发异常的代码行数等等。所以执行效率会大大降低。

看到这儿，你是否对TCF有了更加深入的了解呢？下次让你对线面试官，你会五五开吗？
