---
title: 还在用 BeanUtils 拷贝对象？MapStruct才是王者!
icon: java
order: 5
category:
  - java
tag:
  - Mapper
  - Mapping
  - MappingTarget
---

前几天，远在北京的小伙伴在群里抛出了`“MapStruct”`的概念。对于只闻其名，未见其人的我来说，决定对其研究一番。本文我们就从 `MapStruct` 的概念出发，通过具体的代码示例来研究它的使用情况，最后与“市面上”的其它工具来做个对比！

## 官方介绍

首先我们打开 `MapStruct` 的[官网地址](http://mapstruct.org/)，映入眼帘的就是下边的三步曲：

### What is it?

`MapStruct` 是一个**代码生成器**，它基于约定优先于配置的方法大大简化了 `JavaBean` 类型之间映射的实现。生成的映射代码使用**普通方法**调用，因此速度快、类型**安全**且易于理解。

### Why?

多层应用程序通常需要在不同的对象模型（例如实体和 `DTO`）之间进行**映射**。编写这样的映射代码是一项乏味且容易出错的任务。`MapStruct` 旨在通过尽可能自动化来简化这项工作。

与其他映射框架不同，`MapStruct` 在**编译时**生成 `bean` 映射，这确保了高性能，允许快速的开发人员反馈和彻底的错误检查。

### How?

`MapStruct` 是插入 `Java` 编译器的**注释**处理器，可以在命令行构建（`Maven`、`Gradle`等）中使用，也可以在首选 `IDE` 中使用。它使用合理的默认值，但在配置或实现特殊行为时，用户可以自定义实现。


官网的解释总是咬文嚼字，晦涩难懂的，看到这你只需要记住 `MapStruct` 是用来做实体类映射——实体类拷贝 的就可以了。

> 源码地址：https://github.com/mapstruct/mapstruct
>
> 官网推荐的 Demo： https://github.com/mapstruct/mapstruct-examples

## 简单实现
我们注意到官网中有涉及到简单样例的实现，我们用2分钟来分析一波：

### 引入依赖

```xml
<dependency>
	<groupId>org.mapstruct</groupId>
	<artifactId>mapstruct-jdk8</artifactId>
	<version>1.3.0.Final</version>
</dependency>
//注解处理器，根据注解自动生成mapper的实现
<dependency>
	<groupId>org.mapstruct</groupId>
	<artifactId>mapstruct-processor</artifactId>
	<version>1.2.0.Final</version>
</dependency>
```
> 我们在编译时会报 ` java: No property named "numberOfSeats" exists in source parameter(s). Did you mean "null"?` 错误，经过查阅资料发现 `mapstruct-processor` 和 `Lombok` 的版本需要统一一下：`mapstruct-processor`：`1.2.0.Final` ， `Lombok`：`1.16.14`。

### Model 准备

 准备实体类 `Car.java` 和 数据传输类 `CarDto.java`

```java
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Car {
    private String make;
    private int numberOfSeats;
    private CarType type;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarDto {
    private String make;
    private int seatCount;
    private String type;

}
```
###  创建映射器接口

定义映射方法

```java
@Mapper
public interface CarMapper {
 
    CarMapper INSTANCE = Mappers.getMapper( CarMapper.class );

    @Mapping(source = "numberOfSeats", target = "seatCount")
    CarDto carToCarDto(Car car); 
   
}
```
**解析分析：**

- `@Mapper` 将接口标记为映射接口，并允许 `MapStruct` 处理器在编译期间启动。这里的 `@Mapper` 注解不是 `mybatis` 的注解，而是 `org.mapstruct.Mapper` 的；
- 实际映射方法 `carToCarDto()`  期望源对象 `Car` 作为参数，并返回目标对象 `CarDto` ，方法名可以自由选择；
- 对于源对象和目标对象中具有**不同名称**的属性，可以使用 `@Mapping` 注释来配置名称；
- 对于源对象和目标对象中具有**不同类型**的属性，也可以使用 `@Mapping` 注释来进行转换，比如：类型属性将从枚举类型转换为字符串；
- 一个接口中可以有多个映射方法，对于所有的这些方法，`MapStruct` 将生成一个实现；
- 该接口的实现实例可以从 `Mappers` 中获得，接口声明一个 `INSTANCE`，为客户端提供对映射器实现的访问。

### 实现类

我们可以将代码进行编译，然后会发现在 `target` 文件中生成了 `CarMapperImpl.class` 文件：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4732ea2535c147e78157eb7e147355f1~tplv-k3u1fbpfcp-zoom-1.image)


从代码中可以看出 `MapStruct` 为我们自动生成了 `set/get` 代码，并且对**枚举类**进行了特殊处理。

###  客户端

```java
@Test
public void shouldMapCarToDto() {

    Car car = new Car( "Morris", 5, CarType.SEDAN );
    CarDto carDto = CarMapper.INSTANCE.carToCarDto( car );
    System.out.println(carDto);
    
}
```
执行结果：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d6c22d64d71f4293b794a2170dcf60f6~tplv-k3u1fbpfcp-zoom-1.image)

> 小结: `MapStruct` 基于 `mapper` 接口，在**编译期**动态生成 `set/get` 代码的 `class` 文件 ，在运行时直接调用该 `class` 文件。

## MapStruct 配置

### @Mapper

我们翻开上边提到的 `Mapper` 注释的源码，该注释的解释是：将接口或抽象类标记为**映射器**，并通过 `MapStruct` 激活**该类型实现**的生成。我们找到其中的 **componentModel** 属性，默认值为 `default`，它有四种值供我们选择：
- default：映射器不使用组件模型，实例通常通过 `Mappers.getMapper（java.lang.Class）`获取;
- cdi：生成的映射器是 `application-scoped` 的`CDI bean`，可以通过 `@Inject` 获取；
- spring：生成的映射器是 `Spring bean`，可以通过 `@Autowired` 获取；
- jsr330：生成的映射器被 `@javax.inject.Named` 和 `@Singleton` 注释，可以通过 `@inject` 获取；

上边我们用的就是默认的方法，当然我们也可以用 `@Autowired` 来引入接口依赖，此处不再举例，有兴趣的小伙伴可以自己试试！

另外我们可以看下 `uses` 属性：可以通过定义其他类来完成字段转换，接下来我们来个小例子演示一下：

**1. 定义一个 CarVo.java 类**

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarVo {

    private String make;
    private int seatCount;
    private boolean type;
}
```
**2. 在 mapper 中定义一个 vo 转为 dto 的方法 `CarDto carVoToCarDto(CarVo carVo);`**

当不加 `uses` 属性时，查看编译后生成的实现类
```java
public CarDto carVoToCarDto(CarVo carVo) {
	if (carVo == null) {
		return null;
	} else {
		CarDto carDto = new CarDto();
		carDto.setMake(carVo.getMake());
		carDto.setSeatCount(carVo.getSeatCount());
		carDto.setType(String.valueOf(carVo.isType()));
		return carDto;
	}
}
```
**3. 在 `mapper` 上增加 `uses` 属性，并指定自定义的处理类，代码如下：**

```java
@Mapper(uses = {BooleanStrFormat.class})
public interface CarMapper {
    ......
}

/**
* 自定义的转换类
*/
@Component
public class BooleanStrFormat {
    public String toStr(boolean type) {
        if(type){
            return "Y";
        }else{
            return "N";
        }
    }

    public boolean toBoolean(String type) {
        if (type.equals("Y")) {
            return true;
        } else {
            return false;
        }
    }
}

/**
* 查看编译后生成的实现类
*/
public CarDto carVoToCarDto(CarVo carVo) {
	if (carVo == null) {
		return null;
	} else {
		CarDto carDto = new CarDto();
		carDto.setMake(carVo.getMake());
		carDto.setSeatCount(carVo.getSeatCount());
        //调用自定义的类中的方法
		carDto.setType(this.booleanStrFormat.toStr(carVo.isType()));
		return carDto;
	}
}
```
**4.客户端代码**

```java
@Test
public void shouldMapCarVoToDto() {

	CarVo carVo = new CarVo( "Morris", 5, false );
	CarDto carDto = CarMapper.INSTANCE.carVoToCarDto( carVo );

	System.out.println(carDto);
}
```
执行结果：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/08b2d11e89734cca88596982f848344b~tplv-k3u1fbpfcp-zoom-1.image)

### @Mapping
`@Mapping` 可以用来配置一个 `bean` 属性或枚举常量的映射，默认是将具有相同名称的属性进行映射，当然也可以用 `source`、`expression` 或者 `constant` 属性手动指定，接下来我们来分析下常用的属性值。

1. target：属性的目标名称，同一目标属性不能映射多次。如果用于映射枚举常量，则将给出常量成员的名称，在这种情况下，源枚举中的多个值可以映射到目标枚举的相同值。
2. source：属性的源名称，
- 如果带注释的方法有多个源参数，则属性名称必须使用参数名称限定，例如`“addressParam.city"`；
- 当找不到匹配的属性时，`MapStruct` 将查找匹配的参数名称；
- 当用于映射枚举常量时，将给出常量成员的名称；
- 该属性不能与 `constant` 或 `expression` 一起使用；
3. dateFormat：通过 `SimpleDateFormat` 实现 `String` 到 `Date` 日期之间相互转换。
4. numberFormat：通过 `DecimalFormat` 实现 `Number` 与 `String` 的数值格式化。
5. constant：设置指定目标属性的常量字符串，当指定的目标属性的类型为：`primitive` 或 `boxed`（例如 `Long`）时，`MapStruct` 检查是否可以将该 `primitive` 作为有效的文本分配给 `primitive` 或 `boxed` 类型。如果可能，`MapStruct` 将分配为文字；如果不可能，`MapStruct` 将尝试应用用户定义的映射方法。
另外，`MapStruct` 将常量作为字符串处理，将通过应用匹配方法、类型转换方法或内置转换来转换该值。此属性不能与 `source`、`defaultValue`、`defaultExpression` 或 `expression` 一起使用。
6. expression：是一个表达式，根据该表达式设置指定的目标属性。他的属性不能与 `source`、 `defaultValue`、`defaultExpression`、`constant` 一起使用。
7. ignore: 忽略这个字段。

我们用 `expression` 这个属性来实现一下上边用 `uses` 实现的案例：

**1. 在 mapper 中定义方法**

```java
@Mapping(target = "type", expression = "java(new com.ittest.controller.BooleanStrFormat().toStr(carVo.isType()))")
CarDto carVoToDtoWithExpression(CarVo carVo);
```
**2. 生成的实现类**

```java
@Override
public CarDto carVoToDtoWithExpression(CarVo carVo) {
	if ( carVo == null ) {
		return null;
	}

	CarDto carDto = new CarDto();

	carDto.setMake( carVo.getMake() );
	carDto.setSeatCount( carVo.getSeatCount() );

	carDto.setType( new com.ittest.controller.BooleanStrFormat().toStr(carVo.isType()) );

	return carDto;
}
```
**3. 客户端**

```java
@Test
public void mapCarVoToDtoWithExpression() {

	CarVo carVo = new CarVo( "Morris", 5, false );
	CarDto carDto = CarMapper.INSTANCE.carVoToDtoWithExpression( carVo );

	System.out.println(carDto);
}
```
运行结果：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2bf44350f97d455ba5e1bfcc4129efee~tplv-k3u1fbpfcp-zoom-1.image)


> 重要提示：枚举映射功能已被弃用，并被 `ValueMapping` 取代。它将在后续版本中删除。

### @Mappings
可以配置多个 `@Mapping`，例如
```java
@Mappings({
    @Mapping(source = "id", target = "carId"),
    @Mapping(source = "name", target = "carName"),
    @Mapping(source = "color", target = "carColor")
})
```

### @MappingTarget
用于更新已有对象，还是用例子来说明吧：

**1. 创建 BMWCar.java 类**
```java
@NoArgsConstructor
@AllArgsConstructor
@Data
public class BMWCar {
    private String make;
    private int numberOfSeats;
    private CarType type;

    private String color;
    private String price;

}
```
**2. mapper 中创建更新方法，并查看实现类**
```java
// 更新方法
void updateBwmCar(Car car, @MappingTarget BMWCar bwmCar);

// 实现类
public void updateBwmCar(Car car, BMWCar bwmCar) {
	if (car != null) {
		bwmCar.setMake(car.getMake());
		bwmCar.setNumberOfSeats(car.getNumberOfSeats());
		bwmCar.setType(car.getType());
	}
}
```
**3. 客户端代码**
```java
@Test
public void updateBwmCar() {
	Car car = new Car( "Morris", 5, CarType.SEDAN );
	BMWCar bwmCar = new BMWCar("BWM", 5, CarType.SPORTS, "RED", "50w");
	System.out.println("更新前 car:"+car.toString());
	System.out.println("更新前 BWMCar:"+bwmCar.toString());

	CarMapper.INSTANCE.updateBwmCar(car, bwmCar);

	System.out.println("更新后 car:"+car.toString());
	System.out.println("更新后 BWMCar:"+bwmCar.toString());
}
```
执行结果：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c8e6a15a4aa44d08a8dbcc01c6a48879~tplv-k3u1fbpfcp-zoom-1.image)

### 扩展：多个对象映射一个对象

**1. 准备实体类 `Benz4SMall.java` 和 `Mall4S.java`**

```java
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Mall4S {

    private String address;

    private String mobile;

}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Benz4SMall {

    private String address;
    private String mobile;
    private String make;
    private int numberOfSeats;
}
```
**2. mapper 创建转换方法并查看生成的实现类**
```java
Benz4SMall mallCarToBenzMall(Car car, Mall4S mall4S);

/**
* 实现类
*/
public Benz4SMall mallCarToBenzMall(Car car, Mall4S mall4S) {
	if (car == null && mall4S == null) {
		return null;
	} else {
		Benz4SMall benz4SMall = new Benz4SMall();
		if (car != null) {
			benz4SMall.setMake(car.getMake());
			benz4SMall.setNumberOfSeats(car.getNumberOfSeats());
		}

		if (mall4S != null) {
			benz4SMall.setAddress(mall4S.getAddress());
			benz4SMall.setMobile(mall4S.getMobile());
		}

		return benz4SMall;
	}
}

```
**3. 客户端**
```java
@Test
public void mallCarToBenzMall() {
	Car car = new Car( "Morris", 5, CarType.SEDAN );
	Mall4S mall4S = new Mall4S("北京市", "135XXXX4503");
	Benz4SMall benz4SMall = CarMapper.INSTANCE.mallCarToBenzMall(car, mall4S);
	System.out.println(benz4SMall.toString());
}
```
执行结果

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7828f5407db741af8b361979ae1f4ce8~tplv-k3u1fbpfcp-zoom-1.image)

### 深拷贝与浅拷贝

深拷贝和浅拷贝最根本的区别在于是否真正获取一个对象的复制**实体**，而不是引用。

假设 B 复制了 A ，修改 A 的时候，看 B 是否发生变化：如果 B 跟着也变了，说明是浅拷贝，**拿人手短**！（修改堆内存中的同一个值）；如果 B 没有改变，说明是深拷贝，**自食其力**！（修改堆内存中的不同的值）

MapStruct 中是**创建新的对象**，也就是**深拷贝**。


## MapStruct 与其他 Copy 的对比
我们在平时的项目中经常会使用到拷贝的功能，今天我们就将他们做一下对比，直接抛出 **ZhaoYingChao88** 大佬的实验结果：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0a0f8caf765b44bdaaa46784853311eb~tplv-k3u1fbpfcp-zoom-1.image)


输出结果：`手动Copy >Mapstuct>= cglibCopy > springBeanUtils > apachePropertyUtils > apacheBeanUtils` 可以理解为: `手工复制 > cglib > 反射 > Dozer`。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49f43496f8784390807110b2b343ec4c~tplv-k3u1fbpfcp-zoom-1.image)


根据测试结果，我们可以得出在速度方面，`MapStruct` 是最好的，执行速度是 `Apache BeanUtils` 的10倍、`Spring BeanUtils` 的 4-5倍、和 `BeanCopier` 的速度差不多。

> 总结：在大数据量级的情况下，`MapStruct` 和 `BeanCopier` 都有着较高的性能优势，其中 `MapStruct` 尤为优秀。如果你仅是在日常处理少量的对象时，选取哪个其实变得并不重要，但数据量大时建议还是使用 `MapStruct` 或 `BeanCopier` 的方式，提高接口性能。

参考链接：https://blog.csdn.net/ZYC88888/article/details/109681423?spm=1001.2014.3001.5501

> 回复“mapstruct”，即可获取源码呦！