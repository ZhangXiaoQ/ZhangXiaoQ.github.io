---
title: 如果还不懂如何使用 Consumer 接口，来公司我当面给你讲！
icon: java
order: 7
category:
  - java
tag:
  - consumer
  - supplier
  - function
  - predicate

---

## 背景

没错，我还在做 XXXX 项目，还在与第三方对接接口，不同的是这次是对自己业务逻辑的处理。

在开发过程中我遇到这么一个问题：

**表结构：** 一张主表A ，一张关联表B ，表 A 中存储着表 B 记录的状态。

### 场景

第一步创建主表数据，插入A表；第二步调用第三方接口插入B表同时更新A表的状态。此时大家应该都会想到在进行第二步的时候需要做好数据的幂等性。这样的话就会存在以下几种情况：

一、B表中不存在与A表关联的数据，此时需要调用第三方接口，插入B表同时更新A表的状态；

二、B表中存在与A表关联的数据；
1. A表中的状态为处理中：直接返回处理中字样；
2. A表中的状态为处理成功：直接返回成功的字样；
3. A表中的状态为处理失败：此时需要调用第三方接口，更新B表同时更新A表的状态；
   
### 代码实现

首先我是这样编写的**伪代码**
```java
B b = this.baseMapper.selectOne(queryWrapper);
if (b != null) {
	String status = b.getStatus();
	if (Objects.equals(Constants.STATUS_ING, status)){
		return "处理中";
	} else if (Objects.equals(Constants.STATUS_SUCCESS, status)){
		return "处理成功";
	}
	//失败的操作
	//请求第三方接口并解析响应结果
	......
	if (ReturnInfoEnum.SUCCESS.getCode().equals(parse.getCode())) {
        ......
            //更新B表操作
            bb.setStatus(Constants.STATUS_ING);
            mapper.updateById(bb);

            //更新A表的状态
            a.setStatus(Constants.STATUS_ING);
            aMapper.updateById(a);
	}
	
} else {
	//请求第三方接口并解析响应结果
	......
	if (ReturnInfoEnum.SUCCESS.getCode().equals(parse.getCode())) {
        ......
                //插入B表操作
		bb.setStatus(Constants.STATUS_ING);
		mapper.insert(bb);

		//更新A表的状态
		a.setStatus(Constants.STATUS_ING);
		aMapper.updateById(a);
	}
}
```
不知道细心的小伙伴是否发现，存在B表记录并且状态为“失败”的情况和不存在B表的情况除了插入B表或者更新B表的操作之外，其余的操作都是相同的。

如果我们想要将公共的部分抽取出来，发现都比较零散，还不如不抽取，但是不抽取代码又存在大量重复的代码不符合我的风格。于是我便将手伸向了 Consumer 接口。

### 更改之后的伪代码

```java
B b = this.baseMapper.selectOne(queryWrapper);
if (b != null) {
	String status = b.getStatus();
	if (Objects.equals(Constants.STATUS_ING, status)){
		return "处理中";
	} else if (Objects.equals(Constants.STATUS_SUCCESS, status)){
		return "处理成功";
	}
	//失败的操作
	getResponse(dto, response, s -> mapper.updateById(s));
} else {
	getResponse(dto, response, s -> mapper.updateById(s));
}

public void getResponse(DTO dto, Response response, Consumer<B> consumer){
	//请求第三方接口并解析响应结果
	......
	if (ReturnInfoEnum.SUCCESS.getCode().equals(parse.getCode())) {
        ......
		bb.setStatus(Constants.STATUS_ING);
	
		consumer.accept(bb);

		//更新A表的状态
		a.setStatus(Constants.STATUS_ING);
		aMapper.updateById(a);
	}
}
```
看到这，如果大家都已经看懂了，那么恭喜你，说明你对 Consumer 的使用已经全部掌握了。如果你还存在一丝丝的疑虑，那么就接着往下看，我们将介绍一下四种常见的函数式接口。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b9bd932a1451469c95bc66fb0f80341b~tplv-k3u1fbpfcp-zoom-1.image)


## 函数式接口
那什么是函数式接口呢？函数式接口是只有一个抽象方法（Object的方法除外），但是可以有多个非抽象方法的接口，它表达的是一种逻辑上的单一功能。

### @FunctionalInterface 
 `@FunctionalInterface`  注解用来表示该接口是函数式接口。它有助于及早发现函数式接口中出现的或接口继承的不适当的方法声明。

 如果接口用该注解来注释，但实际上不是函数式接口，则会在编译时报错。

### Consumer
我们一般称之为“消费者”，它表示接受单个输入参数但不返回结果的操作。不同于其它函数式接口，Consumer 预期通过副作用进行操作。

那什么又是副作用呢？说一下我所理解的副作用，副作用其实就是一个函数是否会修改它范围之外的资源，如果有就叫有副作用，反之为没有副作用。比如修改全局变量，修改输入参数所引用的对象等。

```java
@FunctionalInterface
public interface Consumer<T> {

    void accept(T t);

    default Consumer<T> andThen(Consumer<? super T> after) {
        Objects.requireNonNull(after);
        return (T t) -> { accept(t); after.accept(t); };
    }
}
```

方法解析：
- accept：对给定的参数执行此操作。
- andThen：返回一个组合的 Consumer ，依次执行此操作，然后执行after操作。如果执行任一操作会抛出异常，它将被转发到组合操作的调用者。如果执行此操作会引发异常，则不会执行after操作。
  

正如我们案例中遇到的场景，我们只需要将**要执行的逻辑方法**当作参数传入 `getResponse()` 中，然后在该方法中执行 `accept()` 方法进行消费即可。如果还不理解，我们可以把它转换为匿名内部类的调用方式。
```java
 getResponse(dto, response, new Consumer<B>() {
    @Override
    public void accept(B bb) {
      mapper.insert(bb);
    }
});
```
当调用`accept()` 方法的时候就会去调用匿名内部类的方法了，也就是我们传入 `getResponse()` 的逻辑方法。

### Supplier 
我们一般称之为“生产者”，没有参数输入，但是能返回结果，为结果的提供者。
```java
@FunctionalInterface
public interface Supplier<T> {

    /**
     *  获取一个结果
     */
    T get();
}
```

可以举个简单的例子感受下：
```java
Optional<Double> optional = Optional.empty();
optional.orElseGet(()->Math.random() );

//orElseGet 方法的源码，里边用到了 get 方法
public T orElseGet(Supplier<? extends T> other) {   
    return value != null ? value : other.get();
}
```

### Function
我把它称为“转换者”，表示接收一个参数通过处理之后返回一个结果的函数。

```java
@FunctionalInterface
public interface Function<T, R> {

    R apply(T t);

    default <V> Function<V, R> compose(Function<? super V, ? extends T> before) {
        Objects.requireNonNull(before);
        return (V v) -> apply(before.apply(v));
    }


    default <V> Function<T, V> andThen(Function<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t) -> after.apply(apply(t));
    }

   
    static <T> Function<T, T> identity() {
        return t -> t;
    }
}
```
方法解析：
- apply：将 T 类型的参数传入，经过函数表达式的计算，返回 R 类型的结果；
- compose：返回一个组合函数，先将参数应用于 before 函数，然后将结果应用于当前函数，返回最终结果。如果对任一函数的求值引发异常，则会将其转发给组合函数的调用方。
- andThen：返回一个组合函数，先将参数应用与当前函数，然后将结果应用于 after 函数，返回最终的结果。如果对任一函数的求值引发异常，则会将其转发给组合函数的调用方。
- identity：返回始终返回其输入参数的函数。

我们在 lambda 表达式中应用比较多，所以我们来简单演示下：
```java
@Data
@AllArgsConstructor
public class Teacher {
    private String name;
    private int age;
}

public class TeacherTest {
    public static void main(String[] args) {
       List<Teacher> list = Arrays.asList(
            new Teacher("张三",25),
            new Teacher("李四",28),
            new Teacher("王五",18));
      List<String> collect = list.stream().map(item -> item.getName()).collect(Collectors.toList());
      System.out.println(collect);
    }
}
```
其中 map 接收的参数就是 Function 类型， item 为传入参数，`item.getName()`  为返回处理的结果，最后输出结果为

```xml
[张三, 李四, 王五]
```

### Predicate  
我们称之为“判断者”，通过接收参数 T 来返回 boolean 的结果。

```java
@FunctionalInterface
public interface Predicate<T> {

    boolean test(T t);

    default Predicate<T> and(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) && other.test(t);
    }

 
    default Predicate<T> negate() {
        return (t) -> !test(t);
    }

 
    default Predicate<T> or(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) || other.test(t);
    }

 
    static <T> Predicate<T> isEqual(Object targetRef) {
        return (null == targetRef)
                ? Objects::isNull
                : object -> targetRef.equals(object);
    }
}
```

方法解析：
- test：接收一个参数, 判断这个参数是否匹配某种规则, 匹配成功返回true, 匹配失败则返回false；
- and：接收一个 Predicate 类型的参数，用当前函数和 other 函数逻辑与判断参数 t 是否匹配规则，成功返回true，失败返回 false 。如果当前函数返回 false，则 other 函数不进行计算。在评估 Predicate 期间引发的任何异常都会转发给调用方；
- negate：返回当前Predicate取反操作之后的Predicate；
- or：接收一个 Predicate 类型的参数，用当前函数和 other 函数 逻辑或 判断参数 t 是否匹配规则，成功返回true，失败返回 false 。如果当前函数返回 true，则 other 函数不进行计算。在评估 Predicate 期间引发的任何异常都会转发给调用方；
- isEqual： 静态方法：传入一个参数，用来生成一个 Predicate，调用test() 方法时调的 object -> targetRef.equals(object) 函数式。


相信大家在编码过程中经常会遇到该函数式接口，我们举个例子来说一下：
```java
public static void main(String[] args) {
    List<Teacher> list = Arrays.asList(
        new Teacher("张三",25),
        new Teacher("李四",28),
        new Teacher("王五",18));

    list = list.stream().filter(item -> item.getAge()>25).collect(Collectors.toList());
    list.stream().forEach(item->System.out.println(item.getName()));
}
```
其中 `filter()` 的参数为 `Predicate` 类型的，返回结果为：李四

看到这儿，我们常见的四种函数式接口就已经介绍完了。说实话，函数式接口我已经看过好几遍了，尤其是 `Consumer` 和 `Supplier`。当时只是脑子里学会了，没有应用到具体的项目中，下次再遇到的时候还是一脸懵逼，不知道大家有没有这种感受。

所以我们需要总结经验教训，一定要将代码的原理搞懂，然后多敲几遍，争取应用到自己的项目中，提升自己的编码能力。