---
title: 终于给老婆讲明白什么是logback了！
icon: java
order: 2
category:
  - java
tag:
  - slf4j
  - 日志门面

---

故事会迟到，但他从不会缺席。今天的故事开始了，你准备好了吗？

## 前奏
简单介绍一下我的老婆：集智慧与美貌于一身的女子——阿狸，一句“我们心有灵犀，不是吗？”让我瞬间“沦陷”。

![0阿狸.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f53a4569ce5d4ae59fed68d3e59eea47~tplv-k3u1fbpfcp-watermark.image)

**阿Q：** 老婆，还记得往年过节的时候我都送过你什么礼物吗？

**阿狸：** 当然记得呀：刚过的儿童节送了一排旺仔牛奶和一大包零食；`5·20`送了一款我喜欢的香水；女神节给我买了一个超好看的包包......

**阿Q：** 这都是今年的，那去年的还记得吗？

**阿狸：** 我想想哈：去年圣诞节买了个圣诞老人的蛋糕还有一双漂亮的高跟鞋；过生日的时候送了一束鲜花还有一个大红包；嗯......

**阿Q：** 看看，看看想不起来了吧，我就知道时间久了就记不住了，我来给你说一下吧：巴拉巴拉（露出得意的表情）。

**阿狸：** 哇塞，你真厉害，你是怎么做到的呢？

**阿Q：** 哈哈，这就不得不说一下我用到的日志了，你可听好了。

## 正题

### LogBack简介

**阿Q：** 我说的日志呢就跟咱们之前写过的日记一样，只不过它是用来记录操作系统事件的文件的集合。常见的日志框架呢有以下几种：

- JUL（Java Util Logging）
- Logback
- Log4j
- Log4j2
- JCL（Jakarta Commons Logging）
- Slf4j（Simple Logging Facade For Java）

**阿狸：** 这么多框架，该使用那个好呢？

**阿Q：** 我首推`Logback`日志框架：首先它配置比较简单，比较容易上手；其次配置比较灵活，能满足大部分项目的需求；最后性能比较好，可以异步存储日志。我觉得这也是它在市面上比较流行，项目中使用比较多的原因吧。

**阿狸：**  哦哦，那我`pick`它。

**阿Q：** `Logback`是通过`slf4j`的日志门面搭建的日志系统，门面与实现的关系了解一下。

![0门面.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d40df3e4da8a474399f4e5045c3b688f~tplv-k3u1fbpfcp-watermark.image)


接着奉上[官网地址]( http://logback.qos.ch)，它分为以下三个模块：

- logback-core：其它两个模块的基础模块；
- logback-classic：它是`log4j`的一个改良版本，同时它完整实现了`slf4j API`，你可以很方便地更换成其它日志框架（如`log4j`或者`JUL`）；
- logback-access：访问模块与`Servlet`容器集成提供通过`Http`来访问日志的功能，可以轻松地在`logback`核心之上构建自己的模块。

#### `logback`组件之间的关系 **~~可以大体了解下，实战篇更容易理解~~**：
- `Logger`作为日志的记录器，把它关联到应用的对应的`context`上后，主要用于存放日志对象，也可以定义日志类型、级别；　
- `Appender`主要用于指定日志输出的目的地，可以是控制台、文件、远程套接字服务器、`MySQL`、`PostreSQL`、 `Oracle`和其他数据库、 `JMS`和远程`UNIX Syslog`守护进程等； 　　
- `Layout`负责把事件转换成字符串，格式化的日志信息的输出。在`logback`中`Layout`对象被封装在`encoder`中；
- `Logger Context`：各个`logger`都被关联到一个 `LoggerContext`，它负责制造`logger`，也负责以树结构排列各`logger`。其他所有`logger`也通过`org.slf4j.LoggerFactory` 类的静态方法`getLogger`取得。 

> `Logger` 可以被分配的级别包括：`TRACE`、`DEBUG`、`INFO`、`WARN` 和 `ERROR`，定义于`ch.qos.logback.classic.Level`类。如果 `logger`没有被分配级别，那么它将从有被分配级别的最近的祖先那里继承级别。`root logger` 默认级别是 `DEBUG`。

级别排序为： `TRACE < DEBUG < INFO < WARN < ERROR`

### 项目实战

**阿狸：** 太啰嗦了，快点进入实战吧。

**阿Q：** `OK`，如果你创建的是普通的`maven`项目，你需要引入`pom`文件：

```xml
<!-- slf4j日志门面 -->
<dependency>
	<groupId>org.slf4j</groupId>
	<artifactId>slf4j-api</artifactId>
	<version>1.7.30</version>
</dependency>

<!-- logback日志实现 -->
<dependency>
	<groupId>ch.qos.logback</groupId>
	<artifactId>logback-classic</artifactId>
	<version>1.2.3</version>
</dependency>
```

`logback`会从 `classpath` 下依次读取以下类型的配置文件：
- logback.groovy
- logback-test.xml
- logback.xml

如果文件都不存在，`logback`用 `BasicConfigurator` 自动对自己进行配置，这会导致记录输出到控制台。

#### 基本信息配置

代码测试样例奉上：
```java
public class TestLogBack {

    private static final Logger logger = LoggerFactory.getLogger(TestLogBack.class);

    public static void main(String[] args) {
        for (int i = 0; i < 10000; i++) {

            logger.error("error");
            logger.warn("warn");
            logger.info("info");
            logger.debug("debug");
            logger.trace("trace");

        }
    }
}
```

首先我们在`resources`下创建一个`logback.xml`,然后进行配置
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<configuration>
    <!--
        配置集中管理属性
        我们可以直接改属性的 value 值
        格式：${name}
     -->

    <property name="pattern" value="[%-5level] %d{yyyy-MM-dd HH:mm:ss.SSS} %c %M %L [%thread] %m%n"/>
    <!--
        日志输出格式：
        %-5level 日志输出级别，占5位，靠左补全
        %d{yyyy-MM-dd HH:mm:ss.SSS} 时间
        %c 类的完整名称
        %M method
        %L 行号
        %thread 线程名称
        %m或者%msg 信息
        %n 换行
     -->

    <!-- 控制台日志输出的 appender -->
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <!-- 控制输出流对象 默认 System.out  我们为了测试可以改为 System.err（项目中使用 System.out ） -->
        <target>System.err</target>
        <!-- 日志消息格式配置 -->
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <pattern>${pattern}</pattern>
        </encoder>
    </appender>


    <!-- 定义日志文件保存路径属性 -->
    <property name="log_dir" value="/logs"/>

    <!-- 日志文件输出的 appender -->
    <appender name="file" class="ch.qos.logback.core.FileAppender">
        <!-- 日志文件保存路径 -->
        <file>${log_dir}/logback.log</file>
        <!--  日志消息格式配置 -->
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <pattern>${pattern}</pattern>
        </encoder>
    </appender>

    <!-- html 格式文件输出的 appender -->
    <appender name="htmlFile" class="ch.qos.logback.core.FileAppender">
        <!-- 日志文件保存路径 -->
        <file>${log_dir}/logback.html</file>
        <!-- html消息格式配置 -->
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <layout class="ch.qos.logback.classic.html.HTMLLayout">
<!--                <pattern>${pattern}</pattern>-->
                <pattern>%-5level%d{yyyy-MM-dd HH:mm:ss.SSS}%c%M%L%thread%m</pattern>
            </layout>
        </encoder>
    </appender>
  <!-- root logger 配置 -->
    <root level="ALL">
        <appender-ref ref="console"/>
        <appender-ref ref="file"/>
        <appender-ref ref="htmlFile"/>
    </root>
    
</configuration>
```

运行之后发现在控制台打印出红色字体的日志信息，在`/log`文件下有`logback.log`和`logback.html`两个日志文件，在项目中一般都只会使用`.log`结尾的日志的。

**阿狸：** 奥，你就是通过这个文件找到的吧，那每天都产生这么多行日志，找起来不是太费劲了吗？另外文件太大，打开都很费劲呀。

**阿Q：** 当然了，请接着往下看
```xml
<!-- 日志拆分和归档压缩的 appender -->
<appender name="rollFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <!-- 日志文件保存路径（拆分的话此处可以省略） -->
    <file>${log_dir}/roll_logback.log</file>
    <!-- 日志消息格式配置-->
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <pattern>${pattern}</pattern>
    </encoder>
    <!-- 指定拆分规则 -->
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <!-- 每满1M或者 每秒 产生一个新文件，%i产生0 或者 1 的文件名 ，gz为压缩，
        我们一般设置为每天产生一个文件%d{yyyy-MM-dd} -->
        <!-- 按照文件大小拆分 -->
        <maxFileSize>1MB</maxFileSize>
        <!-- 按照时间和压缩格式声明拆分的文件名 -->
        <fileNamePattern>${log_dir}/rolling.%d{yyyy-MM-dd-HH-mm-ss}.log%i.gz</fileNamePattern>
    </rollingPolicy>
</appender>

```
此时我们对测试程序加上`for`循环，循环`1w`次，发现每秒或者每超过`1M`都会产生新的文件。当然也可以在`appender`下增加过滤器，过滤需要的日志级别。
```xml

<!-- 日志级别过滤器 -->
<filter class="ch.qos.logback.classic.filter.LevelFilter">
    <!-- 日志过滤规则 -->
    <level>ERROR</level>
    <!-- 匹配时的操作：接收（记录） -->
    <onMatch>ACCEPT</onMatch>
    <!-- 不匹配时的操作：拒绝（不记录） -->
    <onMismatch>DENY</onMismatch>
</filter>
```

**阿狸：** 这样就清晰多了，那你上边提到的那个分文件的策略是怎么发现的呢？能跟我说一下你的依据吗？

**阿Q：** 好的，那就来几张图感受一下吧
1. 先打开`RollingFileAppender`,可以看到他底下有个`RollingPolicy`策略

  ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7d875e29125438b97eab0de9529ed93~tplv-k3u1fbpfcp-zoom-1.image)

2. 点进去发现它是一个接口，然后看一下它的实现类，我们找到`SizeAndTimeBasedRollingPolicy`策略看一下

  ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e70eca81f01044cfb0ca8b144f334925~tplv-k3u1fbpfcp-zoom-1.image)

  

  3.发现这个类里边就有文件大小的属性`maxFileSize`，却没有找到按照时间份文件的属性，我们进入它的父类`TimeBasedRollingPolicy`查看

  

  ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ad9b5da102a47b39e2ccdf37a160bf1~tplv-k3u1fbpfcp-zoom-1.image)

  

  4.发现里边就有该属性，翻译一下：必须在使用`TimeBasedRollingPolicy`之前设置`FileNamePattern`选项

  

  ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/230531c9662947e7bce05ca7f86e12ba~tplv-k3u1fbpfcp-zoom-1.image)

**阿狸：** 我还有一个问题，就是系统在执行时还要完成打印日志的工作，它的效率会不会很低呀？

**阿Q：** 不会的，为了提高性能，它还支持异步输出日志，这样就可以大大提高性能了。
```xml
<!-- 异步日志 -->
<appender name="async" class="ch.qos.logback.classic.AsyncAppender">
    <!-- 指定具体的appender -->
    <appender-ref ref="rollFile"/>
</appender>
```
除了上边用到的`root`，还支持自定义的`logger`呢。
```xml
<!-- 自定义logger对象
  additivity="false" 自定义的logger 对象是否继承root logger
  name 用来指定受此loger约束的某一个包或者具体的某一个类
-->
<logger name="com.aq.logback" level="info" additivity="false">
  <appender-ref ref="console"/>
</logger>
```

#### SpringBoot中使用

**阿狸：** 说到这我想起来了，你说的是普通的`maven`项目，那常用的`SpringBoot`项目也是这样使用吗？

**阿Q：** 如果是`SpringBoot`项目的话，它默认使用`slf4j`作为日志门面，`logback`作为日志实现来记录日志,所以我们不需要引入任何依赖，默认是`info`级别。
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00050900c8b948308ebb4f2e1d5cb899~tplv-k3u1fbpfcp-zoom-1.image)

我们还可以直接使用`@Slf4j`的注解来代替上边的
```java
private static final Logger logger = LoggerFactory.getLogger(TestLogBack.class);
```
引用是使用`log.info("info");`来实现。它的默认加载顺序是`logback-spring.xml`->`logback.xml`

我们可以在`application.properties`中简单配置
```properties
#指定自定义 logger 对象的日志级别
logging.level.com.itzyq.sblogback=trace

#指定控制台输出消息格式
logging.pattern.console=[%-5level] %d{yyyy-MM-dd HH:mm:ss} %c [%thread] ===== %m %n

#指定存放日志文件的具体路径(已经弃用)
#logging.file=/logs/springboot.log
#指定日志文件存放的目录，默认的文件名为spring.log
logging.file.path=/logs/springboot/
#指定日志文件的消息格式
logging.pattern.file=[%-5level] %d{yyyy-MM-dd HH:mm:ss} %c [%thread] ===== %m %n
```

因为在`properties`中配置功能有限，我们还是使用上文中的`logback.xml`来配置。

**阿狸：** 艾，那为啥不使用`logback-spring.xml`呢？

**阿Q：** `SpringBoot`中是推荐使用`logback-spring.xml`的，因为上文中是普通的`maven`项目，为了好理解就搞成`logback.xml`了。

> `logback-spring.xml`只有在`Spring`应用程序运行的时候才生效，即带有`@SpringBootApplication`注解的类启动的时候才会生效。这里我们完全可以使用它。

另外它还有个特殊的功能，可以用来解析日志的配置。
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <property name="pattern" value="[%-5level] %d{yyyy-MM-dd HH:mm:ss.SSS} %c %M %L [%thread] %m%n"/>

    <!-- 定义日志文件保存路径属性 -->
    <property name="log_dir" value="/logs"/>

    <!-- 日志文件输出的 appender -->
    <appender name="file" class="ch.qos.logback.core.FileAppender">
        <!-- 日志文件保存路径 -->
        <file>${log_dir}/logback.log</file>
        <!-- 日志消息格式配置-->
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <springProfile name="dev">
                <pattern>${pattern}</pattern>
            </springProfile>
            <springProfile name="pro">
                <pattern> %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %m%n</pattern>
            </springProfile>
        </encoder>
    </appender>

    <root level="info">
        <appender-ref ref="file"/>
    </root>

</configuration>
```
此时在`application.properties`中引入`spring.profiles.active=dev`或者`pro`可以切换测试和正式环境了，是不是很方便呀。

### Logback-access

**阿狸：** 确实是，那既然都说到这了，你能说下上边提到的`logback-access`吗？

**阿Q：** 好吧，那我就大体说一下它的配置和使用吧：`logback-access`模块与`Servlet`容器（如`Tomcat`和`jetty`）集成，已提供`HTTP`访问日志功能。我们可以使用`logback-access`模块来替换`tomcat`的访问日志;

1. 将`logback-access.jar`与`logback-core.jar` 复制到`$TOMCAT_HOME/lib/`（安装 `Tomcat` 的文件夹）目录下；

2. 修改`$TOMCAT_HOME/conf/server.xml`中的`Host`元素中添加：
```java
<Value className="ch.qos.logback.access.tomcat.LogbackValue" />
```
这一行通常嵌套在一个`<Engine>` 或 `<Host>`元素中。

3. `logback` 默认会在`$TOMCAT_HOME/conf`下查找文件`logback-access.xml`，该配置的官方地址：`http://logback.qos.ch/access.html#configuration`
```xml
<configuration>
  <!-- always a good activate OnConsoleStatusListener -->
  <statusListener class="ch.qos.logback.core.status.OnConsoleStatusListener" />  

  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>access.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>access.%d{yyyy-MM-dd}.log.zip</fileNamePattern>
    </rollingPolicy>

    <encoder>
      <!-- 日志消息表达格式 -->
      <pattern>%h %l %u [%t] "%r" %s %b "%i{Referer}" “%i{User-Agent}”</pattern>
      <pattern>combined</pattern>
    </encoder>
  </appender>
 
  <appender-ref ref="FILE" />
</configuration>
```

### 配置信息补充

**阿狸：** 讲到这就结束了吗？

**阿Q：** 因为`logback`的配置信息在上文中难以全部展示，特将具体的配置信息列出来，供大家参考学习。

  （1）根节点`configuration`，包含下面三个属性：
- scan: 当此属性设置为`true`时，配置文件如果发生改变，将会被重新加载，默认值为`true`。
- scanPeriod: 设置监测配置文件是否有修改的时间间隔，如果没有给出时间单位，默认单位是毫秒。当`scan`为`true`时，此属性生效。默认的时间间隔为1分钟。
- debug: 当此属性设置为`true`时，将打印出`logback`内部日志信息，实时查看`logback`运行状态。默认值为`false`。
```
<configuration scan="true" scanPeriod="60 seconds" debug="false"> 
</configuration>　
```
（2）`contextName`：用来设置上下文名称，每个`logger`都关联到`logger`上下文，默认上下文名称为`default`。但可以使用`contextName`设置成其他名字，用于区分不同应用程序的记录。一旦设置，不能修改。
```
<configuration scan="true" scanPeriod="60 seconds" debug="false"> 
     <contextName>myAppName</contextName> 
  </configuration>    
```


(3) `property` ：用来定义变量值，它有两个属性`name`和`value`，通过`property`定义的值会被插入到`logger`上下文中，可以使“${}”来使用变量。　　

- `name`: 变量的名称
- `value`: 的值时变量定义的值

(4) `timestamp`：获取时间戳字符串，他有两个属性`key`和`datePattern`　　　　
- `key`: 标识此`timestamp`的名字；
- `datePattern`: 设置将当前时间（解析配置文件的时间）转换为字符串的模式，遵循`java.txt.SimpleDateFormat`的格式。
```
<configuration scan="true" scanPeriod="60 seconds" debug="false"> 
    <timestamp key="bySecond" datePattern="yyyyMMdd'T'HHmmss"/> 
</configuration>
```
（5）`appender`：负责写日志的组件，它有两个必要属性`name`和`class`。`name`指定`appender`名称，`class`指定`appender`的全限定名

5.1、`ConsoleAppender` 把日志输出到控制台，有以下子节点：
- `encoder`：对日志进行格式化。
- `target`：字符串`System.out`(默认)或者`System.err`

5.2、`FileAppender`：把日志添加到文件，有以下子节点：　　　　　　
- `file`：被写入的文件名，可以是相对目录，也可以是绝对目录，如果上级目录不存在会自动创建，没有默认值。　　　　　　
- `append`：如果是 `true`，日志被追加到文件结尾，如果是 `false`，清空现存文件，默认是`true`。　　　　　　
- `encoder`：对记录事件进行格式化。　　　　　
- `prudent`：如果是 `true`，日志会被安全的写入文件，即使其他的`FileAppender`也在向此文件做写入操作，效率低，默认是 `false`。

5.3、`RollingFileAppender`：滚动记录文件，先将日志记录到指定文件，当符合某个条件时，将日志记录到其他文件。有以下子节点：　　　　　　
- `file`：被写入的文件名，可以是相对目录，也可以是绝对目录，如果上级目录不存在会自动创建，没有默认值。　　　　　　
- `append`：如果是 `true`，日志被追加到文件结尾，如果是 `false`，清空现存文件，默认是`true`。　　　　　　
- `rollingPolicy`:当发生滚动时，决定`RollingFileAppender`的行为，涉及文件移动和重命名。属性`class`定义具体的滚动策略类。

5.4、策略：
**class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy"：** 最常用的滚动策略，它根据时间来制定滚动策略，既负责滚动也负责触发滚动。
有以下子节点：

   - `fileNamePattern`：必要节点，包含文件名及“%d”转换符，`“%d”`可以包含一个`java.text.SimpleDateFormat`指定的时间格式，如：`%d{yyyy-MM}`。如果直接使用 `%d`，默认格式是 `yyyy-MM-dd`。   
   - `RollingFileAppender`的`file`子节点可有可无，通过设置`file`，可以为活动文件和归档文件指定不同位置，当前日志总是记录到`file`指定的文件（活动文件），活动文件的名字不会改变；如果没设置`file`，活动文件的名字会根据`fileNamePattern` 的值，每隔一段时间改变一次。“/”或者“\”会被当做目录分隔符。　　　　　　　　
   - `maxHistory`:可选节点，控制保留的归档文件的最大数量，超出数量就删除旧文件。
假设设置每个月滚动，且`<maxHistory>`是6，则只保存最近6个月的文件，删除之前的旧文件。注意，删除旧文件时，那些为了归档而创建的目录也会被删除。　　

**class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy"：** 查看当前活动文件的大小，如果超过指定大小会告知`RollingFileAppender` 触发当前活动文件滚动。只有一个节点:　　　　　　　　

  - `maxFileSize`:这是活动文件的大小，默认值是`10MB`。   
  - `prudent`：当为`true`时，不支持`FixedWindowRollingPolicy`。支持`TimeBasedRollingPolicy`，但是有两个限制，1不支持也不允许文件压缩，2不能设置`file`属性，必须留空。   
  - `triggeringPolicy`: 告知 `RollingFileAppender` 合适激活滚动。　
    

**class="ch.qos.logback.core.rolling.FixedWindowRollingPolicy"** 根据固定窗口算法重命名文件的滚动策略。有以下子节点：　　　　　　　　
- `minIndex`:窗口索引最小值　　　　　　　　
- `maxIndex`:窗口索引最大值，当用户指定的窗口过大时，会自动将窗口设置为12。　　　　　　　　
- `fileNamePattern`:必须包含`“%i”`例如，假设最小值和最大值分别为1和2，命名模式为 `mylog%i.log`,会产生归档文件`mylog1.log`和`mylog2.log`。还可以指定文件压缩选项，例如，`mylog%i.log.gz` 或者 没有`log%i.log.zip`
  
```xml
<configuration> 
      <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender"> 
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy"> 
          <fileNamePattern>logFile.%d{yyyy-MM-dd}.log</fileNamePattern> 
          <maxHistory>30</maxHistory> 
        </rollingPolicy> 
        <encoder> 
          <pattern>%-4relative [%thread] %-5level %logger{35} - %msg%n</pattern> 
        </encoder> 
      </appender> 

      <root level="DEBUG"> 
        <appender-ref ref="FILE" /> 
      </root> 
    </configuration>
   //上述配置表示每天生成一个日志文件，保存30天的日志文件。
```
```xml
<configuration> 
      <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender"> 
        <file>test.log</file> 

        <rollingPolicy class="ch.qos.logback.core.rolling.FixedWindowRollingPolicy"> 
          <fileNamePattern>tests.%i.log.zip</fileNamePattern> 
          <minIndex>1</minIndex> 
          <maxIndex>3</maxIndex> 
        </rollingPolicy> 

        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy"> 
          <maxFileSize>5MB</maxFileSize> 
        </triggeringPolicy> 
        <encoder> 
          <pattern>%-4relative [%thread] %-5level %logger{35} - %msg%n</pattern> 
        </encoder> 
      </appender> 

      <root level="DEBUG"> 
        <appender-ref ref="FILE" /> 
      </root> 
    </configuration>
    //上述配置表示按照固定窗口模式生成日志文件，当文件大于5MB时，生成新的日志文件。窗口大小是1到3，当保存了3个归档文件后，将覆盖最早的日志。
```

`encoder`：对记录事件进行格式化。负责两件事，一是把日志信息转换成字节数组，二是把字节数组写入到输出流。

`PatternLayoutEncoder` 是唯一有用的且默认的`encoder` ，有一个`pattern`节点，用来设置日志的输入格式。使用`“%”`加“转换符”方式，如果要输出`“%”`，则必须用`“\”`对`“\%”`进行转义。


（6）子节点`logger`：用来设置某一个包或具体的某一个类的日志打印级别、以及指定`appender`。仅有一个`name`属性，一个可选的`level`和一个可选的`additivity`（**单词一定要注意写对，好多地方都写成了addtivity**）属性。可以包含零个或多个`<appender-ref>`元素，标识这个`appender`将会添加到这个`logger`
- name：用来指定受此 `logger` 约束的某一个包或者具体的某一个类；
- level：用来设置打印级别（日志级别），大小写无关：`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `ALL` 和 `OFF`，还有一个特俗值`INHERITED`或者同义词`NULL`，代表强制执行上级的级别。如果未设置此属性，那么当前 `logger` 将会继承上级的级别。
- additivity:是否向上级`loger`传递打印信息。默认是`true`。
      

（7）子节点`root`：它也是`logger`元素，但是它是根 `logger` ,是所有`logger`的上级。只有一个`level`属性，因为`name`已经被命名为`"root"`，且已经是最上级了。同`logger`一样，可以包含零个或多个`appender-ref`元素，标识这个`appender`将会添加到这个`logger`。　　　　
- `level`: 用来设置打印级别，大小写无关：`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `ALL`和`OFF`，不能设置为`INHERITED`或者同义词`NULL`。 默认是`DEBUG`
        

 常用`logger`配置
```yml
 <!-- show parameters for hibernate sql 专为 Hibernate 定制 -->
<logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE" />
<logger name="org.hibernate.type.descriptor.sql.BasicExtractor" level="DEBUG" />
<logger name="org.hibernate.SQL" level="DEBUG" />
<logger name="org.hibernate.engine.QueryParameters" level="DEBUG" />
<logger name="org.hibernate.engine.query.HQLQueryPlan" level="DEBUG" />

<!--myibatis log configure-->
<logger name="com.apache.ibatis" level="TRACE"/>
<logger name="java.sql.Connection" level="DEBUG"/>
<logger name="java.sql.Statement" level="DEBUG"/>
<logger name="java.sql.PreparedStatement" level="DEBUG"/>
```
**阿狸：** 老公你也太贴心了，我也要用起来，记录美好的生活！

 