---
title: 总结四类 Bean 注入 Spring 的方式
icon: leaf
order: 3
category:
  - Spring
tag:
  - FactoryBean
  - BDRegistryPostProcessor

---

一提到`Spring`，大家最先想到的是啥？是`AOP`和`IOC`的两大特性？是`Spring`中`Bean`的初始化流程？还是基于`Spring`的`Spring Cloud`全家桶呢？

今天我们就从`Spring`的`IOC`特性入手，聊一聊`Spring`中把`Bean`注入`Spring`容器的几种方式。

我们先来简单了解下`IOC`的概念：`IOC`即**控制反转**，也称为**依赖注入**，是指将**对象的创建**或者**依赖关系的引用**从具体的对象控制转为框架或者`IOC`容器来完成，也就是依赖对象的获得被反转了。

> 可以简单理解为原来由我们来创建对象，现在由`Spring`来创建并控制对象。

## xml 方式

依稀记得最早接触`Spring`的时候，用的还是`SSH`框架，不知道大家对这个还有印象吗？所有的`bean`的注入得依靠`xml`文件来完成。

它的注入方式分为：`set`方法注入、构造方法注入、字段注入，而注入类型分为值类型注入（8种基本数据类型）和引用类型注入（将依赖对象注入）。

以下是`set`方法注入的简单样例

```xml
<bean name="teacher" class="org.springframework.demo.model.Teacher">
    <property name="name" value="阿Q"></property>
</bean>
```

对应的实体类代码

```java
public class Teacher {

	private String name;

	public void setName(String name) {
		this.name = name;
    }
}
```

**xml方式存在的缺点如下：**

1. `xml`文件配置起来比较麻烦，既要维护代码又要维护配置文件，开发效率低；
2. 项目中配置文件过多，维护起来比较困难；
3. 程序编译期间无法对配置项的正确性进行验证，只能在运行期发现并且出错之后不易排查；
4. 解析`xml`时，无论是将`xml`一次性装进内存，还是一行一行解析，都会占用内存资源，影响性能。

## 注解方式

随着`Spring`的发展，`Spring 2.5`开始出现了一系列注解，除了我们经常使用的@Controller、@Service、@Repository、@Component 之外，还有一些比较常用的方式，接下来我们简单了解下。

### @Configuration + @Bean

当我们需要引入第三方的`jar`包时，可以用`@Bean`注解来标注，同时需要搭配`@Configuration`来使用。

- `@Configuration`用来声明一个配置类，可以理解为`xml`的`<beans>`标签

- `@Bean` 用来声明一个`bean`，将其加入到`Spring`容器中，可以理解为`xml`的`<bean>`标签

**简单样例：将 RedisTemplate 注入 Spring**

```java
@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<String, Object>();
        ......
        return redisTemplate;
    }
}
```

### @Import

我们在翻看`Spring`源码的过程中，经常会看到`@Import`注解，它也可以用来将第三方`jar`包注入`Spring`，但是它只可以作用在**类**上。

例如在注解`EnableSpringConfigured`上就包含了`@Import`注解，用于将`SpringConfiguredConfiguration`配置文件加载进`Spring`容器。

```java
@Import(SpringConfiguredConfiguration.class)
public @interface EnableSpringConfigured {}
```

`@Import`的`value`值是一个数组，一个一个注入比较繁琐，因此我们可以搭配`ImportSelector`接口来使用，用法如下：

```java
@Configuration
@Import(MyImportSelector.class)
public class MyConfig {}

public class MyImportSelector implements ImportSelector {
	@Override
    public String[] selectImports(AnnotationMetadata annotationMetadata) {
        return new String[]{"org.springframework.demo.model.Teacher","org.springframework.demo.model.Student"};
    }
}
```

其中`selectImports`方法返回的数组就会通过`@Import`注解注入到`Spring`容器中。

无独有偶，`ImportBeanDefinitionRegistrar`接口也为我们提供了注入`bean`的方法。

```java
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy {
    ......
}
```

我们点击`AspectJAutoProxyRegistrar`类，发现它实现了`ImportBeanDefinitionRegistrar`接口，它的`registerBeanDefinitions`方法便是注入`bean`的过程，可以参考下。

如果觉得源代码比较难懂，可以看一下我们自定义的类

```java
@Configuration
@Import(value = {MyImportBeanDefinitionRegistrar.class})
public class MyConfig {}

public class MyImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata,
                                        BeanDefinitionRegistry registry) {
            RootBeanDefinition tDefinition = new RootBeanDefinition(Teacher.class);
            // 注册 Bean，并指定bean的名称和类型
            registry.registerBeanDefinition("teacher", tDefinition);
        }
    }
}
```

这样我们就把`Teacher`类注入到`Spring`容器中了。

## FactoryBean

提到`FactoryBean`，就不得不与`BeanFactory`比较一番。

- `BeanFactory` : 是 `Factory`， `IOC`容器或者对象工厂，所有的`Bean`都由它进行管理
- `FactoryBean` : 是`Bean` ，是一个能产生或者修饰对象生成的工厂 `Bean`，实现与工厂模式和修饰器模式类似

那么`FactoryBean`是如何实现`bean`注入的呢？

先定义实现了`FactoryBean`接口的类

```java
public class TeacherFactoryBean implements FactoryBean<Teacher> {

	/**
	 * 返回此工厂管理的对象实例
	 **/
	@Override
	public Teacher getObject() throws Exception {
		return new Teacher();
	}

	/**
	 * 返回此 FactoryBean 创建的对象的类型
	 **/
	@Override
	public Class<?> getObjectType() {
		return Teacher.class;
	}

}
```

然后通过 @Configuration + @Bean的方式将`TeacherFactoryBean`加入到容器中

```java
@Configuration
public class MyConfig {
	@Bean
	public TeacherFactoryBean teacherFactoryBean(){
		return new TeacherFactoryBean();
	}
}
```

注意：我们没有向容器中注入`Teacher`, 而是直接注入的`TeacherFactoryBean`，然后从容器中拿`Teacher`这个类型的`bean`，成功运行。

## BDRegistryPostProcessor

看到这个接口，不知道对于翻看过`Spring`源码的你来说熟不熟悉。如果不熟悉的话请往下看，要是熟悉的话就再看一遍吧😃。

### 源码

```java
public interface BeanDefinitionRegistryPostProcessor extends BeanFactoryPostProcessor {
    // 注册bean到spring容器中
	void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException;
}

@FunctionalInterface
public interface BeanFactoryPostProcessor {
	void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException;
}
```

`BeanFactoryPostProcessor`接口是`BeanFactory`的后置处理器，方法`postProcessBeanFactory`对`bean`的定义进行控制。今天我们重点来看看`postProcessBeanDefinitionRegistry`方法：它的参数是`BeanDefinitionRegistry`，顾名思义就是与`BeanDefinition`注册相关的。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0dec8f38407e4be28d1229dd28703ec8~tplv-k3u1fbpfcp-zoom-1.image)


通过观察该类，我们发现它里边包含了`registerBeanDefinition`方法，这个不就是我们想要的吗？为了能更好的使用该接口来达到注入`bean`的目的，我们先来看看`Spring`是如何操作此接口的。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cc817783ed144a89a74f5ac71dfc9681~tplv-k3u1fbpfcp-zoom-1.image)


看下`invokeBeanFactoryPostProcessors`方法，会发现没有实现`PriorityOrdered`和`Ordered`的`bean`（这种跟我们自定义的实现类有关）会执行以下代码。

```java
while (reiterate) {
    ......
    invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
    ......
}
```

进入该方法

```java
private static void invokeBeanDefinitionRegistryPostProcessors(
    Collection<? extends BeanDefinitionRegistryPostProcessor> postProcessors, 
    BeanDefinitionRegistry registry) {

    for (BeanDefinitionRegistryPostProcessor postProcessor : postProcessors) {
        postProcessor.postProcessBeanDefinitionRegistry(registry);
    }
}
```

会发现实现了`BeanDefinitionRegistryPostProcessor`接口的`bean`，其`postProcessBeanDefinitionRegistry`方法会被调用，也就是说如果我们自定义接口实现该接口，它的`postProcessBeanDefinitionRegistry`方法也会被执行。

### 实战

话不多说，直接上代码。自定义接口实现类

```java
public class MyBeanDefinitionRegistryPostProcessor implements BeanDefinitionRegistryPostProcessor {

	/**
	 * 初始化过程中先执行
	 **/
	@Override
	public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
		RootBeanDefinition rootBeanDefinition = new RootBeanDefinition(Teacher.class);
		//Teacher 的定义注册到spring容器中
		registry.registerBeanDefinition("teacher", rootBeanDefinition);
	}

	/**
	 * 初始化过程中后执行
	 **/
	@Override
	public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {}
}
```

启动类代码

```java
public static void main(String[] args) {
    AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
    MyBeanDefinitionRegistryPostProcessor postProcessor = new MyBeanDefinitionRegistryPostProcessor();
    //将自定义实现类加入 Spring 容器
    context.addBeanFactoryPostProcessor(postProcessor);
    context.refresh();
    Teacher bean = context.getBean(Teacher.class);
    System.out.println(bean);
}
```

启动并打印结果

```xml
org.springframework.demo.model.Teacher@2473d930
```

发现已经注入到`Spring`容器中了。
