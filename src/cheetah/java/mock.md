---
title: 获取复杂登陆的Token，Mock到底有什么神奇之处？
icon: java
order: 11
category:
  - java
tag:
  - mock
  - 测试用例

---

### 背景

今天又双叒叕被抓壮丁了，被安排进了新的项目组进行任务开发。加入新项目后的第一件事，当然是先研究下同事的代码喽。

在“学习”代码的过程中竟然惊奇的发现同事写了测试用例，对于一直使用`PostMan`来进行接口测试的我表示非常不理解，测试用例到底有什么神奇之处？

### 需求分析

带着疑问翻看了测试用例，发现同事用它来实现了管理后台登录自动生成`Token`的功能。

> 生成`Token`用`PostMan`不是也很好实现吗？何必要多此一举？

百闻不如见面，直接上图

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a182a75c3fa84f25abd423ef833c72c4~tplv-k3u1fbpfcp-zoom-1.image)


看到这张图是不是很熟悉？市面上的大部分登录界面都长这样吧。我们来简单分析下这个登录功能：

- 调用生成图片验证码接口，将生成的验证码图片返回前端，将验证码的文本保存到`Redis`缓存中；
- 调用短信验证码接口，将短信发送到对应的手机号，将验证码也保存到`Redis`缓存中；
- 调用登录接口，将填写信息进行校验，返回登录`Token`；

如果我们使用`PostMan`的话，得写三个请求才能获取到最终需要的`Token`，比较繁琐，而如果使用同事写的测试用例，可以直接运行获取到`Token`。那他是如何实现的呢？

### Mock

在了解实现之前，我们先来了解下什么是`Mock`？`Mock`的翻译是虚假的、模拟的。它的作用就是在测试环境中创建一个类的虚假对象，用来替换掉真实的对象，以达到方便测试的目的。

> 举个例子：假如你正在开发下订单的需求，此时你需要调用`B`服务来完成减积分的操作，而此时`B`服务还在开发中，你就可以`Mock`一个对象，模拟`B`服务的返回结果，根据结果来完成自己的逻辑开发。

当然，`SpringBoot`也为我们提供了`Mock`单元测试，需要引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

该依赖提供了以下类库

- `JUnit`：`JAVA`应用单元测试框架，默认依赖版本是4.12（`JUnit5`和`JUnit4`差别比较大，集成方式不同）；
- `Spring Test & Spring Boot Test`：测试支持；
- `AssertJ`：断言库，提供流式的断言支持；
- `Hamcrest`：对象匹配断言和约束组件；
- `Mockito`： `Java mock`框架；
- `JSONassert`： `JSON`断言库；
- `JsonPath`：`JSON XPath`操作类库；

### 注解

使用`Mock`之前，我们再来了解几个测试过程中用到的注解。

#### @SpringBootTest

`@SpringBootTest`为`SpringBoot`的单元测试环境提供支持。在使用`Mock`的过程中，我们会发现启动测试程序并不会占用我们的应用端口，本质上来讲就是它不会去启动服务器。

经过翻阅资料发现，它的这一特性跟它的内部属性值`webEnvironment`息息相关，它提供了四个枚举值供我们选择：

- MOCK：默认值，如果`servlet API`在类路径上，则创建一个带有模拟`servlet`环境的`WebApplicationContext`，如果`Spring WebFlux`在类路径上，则创建一个`ReactiveWebApplicationContext`，否则创建一个常规的`ApplicationContext`，该选择下不会启动嵌入式服务器；
- RANDOM_PORT：加载`WebServerApplicationContext`并提供真实的`Web`环境，启用的是随机`web`容器端口；
- DEFINED_PORT：加载`WebServerApplicationContext`并提供真实的`Web`环境，和`RANDOM_PORT`不同的是启用配置文件中定义的端口；
- NONE：通过`SpringApplication`加载`ApplicationContext`，但不提供任何`Web`环境；

> 如果测试时带有`@Transactional`注解，默认情况下每个测试方法执行完就会回滚事务。但是当`webEnvironment`设置为`RANDOM_PORT`或者`DEFINED_PORT`时，会隐式地提供真实的`servlet web`环境，此时事务是不会回滚的。

#### @RunWith(SpringRunner.class)

运行器，选择不同的`Runner`调用测试代码，此处指定用`SpringRunner`来运行。有了该注解，测试类要注入的类才能实例化到`Spring`容器中。

> `JUnit4`需要添加该注解，`JUnit5`则不需要

#### 方法注解

- @Test：使用该注解标注的`public void`方法会表示为一个测试方法；
- @BeforeClass：表示在类中的任意`public static void`方法执行之前执行；
- @AfterClass：表示在类中的任意`public static void`方法之后执行；
- @Before：表示在任意使用`@Test`注解标注的`public void`方法执行之前执行；
- @After：表示在任意使用`@Test`注解标注的`public void`方法执行之后执行；
- @Ignore：执行测试时将忽略掉此方法，如果用于修饰类，则忽略整个类；

### 实战

因为使用的是`SpringSecurity`鉴权，所以还得引入依赖

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

首先，我们先来初始化`MockMvc`对象

```java
//wac 是 WebApplicationContext 对象
MockMvc mvc = MockMvcBuilders.webAppContextSetup(wac).
                apply(springSecurity())
                .build(); 
```

#### 图形验证码

调用图形验证码接口

```java
//perform：执行一个RequestBuilders请求，会自动执行SpringMVC的流程并映射到相应的控制器执行处理
MvcResult mvcResult = mvc.perform(
    		   //模拟发送 GET 请求
                MockMvcRequestBuilders.get("/login/capture").
    				     //接受参数
                        .accept(MediaType.APPLICATION_JSON_UTF8)
    					//请求类型
                        .contentType(MediaType.APPLICATION_JSON)
                        .session(session)
        )
    			//期待的结果状态值 200
                .andExpect(MockMvcResultMatchers.status().isOk())
    			//获取方法的返回值 MvcResult
                .andReturn();
```

获取到返回结果之后进行解析，并保存到`Redis`缓存中。

#### 短信验证码

```java
mvc.perform(
    //模拟发送 POST 请求
	MockMvcRequestBuilders.post("/login/sendSmsCode")
		.accept(MediaType.APPLICATION_JSON_UTF8)
		.contentType(MediaType.APPLICATION_JSON)
		// 填充内容
		.content(JsonUtils.toString(req))
		.session(session)
)
		.andExpect(MockMvcResultMatchers.status().isOk())
		.andReturn();
```

模拟发送短信验证码接口，可以从`Redis`缓存中获取到短信验证码。

#### 登录

```java
MvcResult mResult = mvc.perform(
                MockMvcRequestBuilders.post("/login")
                        .accept(MediaType.APPLICATION_JSON_UTF8)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(JsonUtils.toString(smsLoginDto))
                        .session(session)
        )
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn();
```

我们解析返回结果就可以获取`Token`了。

为了让需要登录的接口直接使用我们生成的`Token`，我们可以把获取图形验证码、短信验证码、登录的接口放在一个方法中，用`@Before`注释，这样在调用接口之前都会去获取一下`Token`。我们再把它放到`MockHttpSession`中，使用的时候直接获取即可。

#### 测试

为了便于测试，我们将上边的方法封装成一个基础类，让使用`Token`的方法所在的类继承一下该类，就可以使用`Token`了。

```java
@Test
public void test() throws Exception {
	PageDTO req = new PageDTO();
	req.setPageSize(10);
	req.setPageNo(1);
	WrapperResult<PageInfo<PostResumeVO>> iPageWrapperResult = this.doPost(
			req,
			"/resume/mid/getPage",
			new TypeReference<WrapperResult<PageInfo<PostResumeVO>>>() {
			});
	this.outputPretty(iPageWrapperResult);
}
```

查看执行结果执行成功。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8cc75d5ffabb49a38f27e57b8943828d~tplv-k3u1fbpfcp-zoom-1.image)


当然你也可以只在`test()`方法中获取`Token`，然后用其他工具去调用接口。

看到这儿，你是不是也摩拳擦掌，想把自己获取复杂`Token`的操作改成`Mock`方式？心动不如行动！
