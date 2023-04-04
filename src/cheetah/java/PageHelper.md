---
title: PageHelper 原理深度剖析
icon: java
order: 1
category:
  - java
tag:
  - Redis
  - CentOS
  - 安装部署
---

相信大家在开发过程中都用到过数据分页吧，那么问题来了，说出你平时用到的几种分页方式吧？而我在平时的工作中用到最多的应该属PageHelper 这个分页插件了，此处附上官网地址：<https://pagehelper.github.io/>

## 集成

首先我们来说一下如何集成和使用它吧（以`Springboot`为例）

### 引入依赖

```xml
<dependency>
	<groupId>com.github.pagehelper</groupId>
	<artifactId>pagehelper-spring-boot-starter</artifactId>
	<version>1.3.0</version>
</dependency>
```

### 引入配置

```yml
pagehelper:
  helperDialect: mysql
  reasonable: true
  supportMethodsArguments: true
  params: count=countSql
```

**参数解释**

1. helperDialect ：分页插件会自动检测当前的数据库链接，自动选择合适的分页方式。 你可以配置 `helperDialect` 属性来指定分页插件使用哪种方言。配置时，可以使用下面的缩写值：`oracle , mysql , mariadb , sqlite , hsqldb , postgresql , db2 , sqlserver , informix , h2 , sqlserver2012 , derby`

   > 特别注意：使用 `SqlServer2012` 数据库时，需要手动指定为 `sqlserver2012`，否则会使用 `SqlServer2005` 的方式进行分页。 你也可以实现 `AbstractHelperDialect` ，然后配置该属性为实现类的全限定名称即可使用自定义的实现方法。

2. reasonable ：分页合理化参数，默认值为 `false` 。当该参数设置为 `true` 时， `pageNum<=0` 时会查询第一页， `pageNum>pages` （超过总数时），会查询最后一页。默认 `false` 时，直接根据参数进行查询。

3. supportMethodsArguments ：支持通过 `Mapper` 接口参数来传递分页参数，默认值 `false` ，分页插件会从查询方法的参数值中，自动根据上面 `params` 配置的字段中取值，查找到合适的值时就会自动分页。

4. params ：为了支持 `startPage(Object params)`方法，增加了该参数来配置参数映射，用于从对象中根据属性名取值， 可以配置 `pageNum,pageSize,count,pageSizeZero,reasonable`，不配置映射的用默认值， 默认值为 `pageNum=pageNum;pageSize=pageSize;count=countSql;reasonable=reasonable;pageSizeZero= pageSizeZero` 。

**其他参数**

* offsetAsPageNum ：默认值为 `false` ，该参数对使用 `RowBounds` 作为分页参数时有效。 当该参数设置为 `true` 时，会将 `RowBounds` 中的 `offset` 参数当成 `pageNum` 使用，可以用页码和页面大小两个参数进行分页。
* rowBoundsWithCount ：默认值为 `false`，该参数对使用 `RowBounds` 作为分页参数时有效。当该参数设置为 `true`时，使用 `RowBounds` 分页会进行 count 查询。
* pageSizeZero ：默认值为 `false` ，当该参数设置为 `true` 时，如果 `pageSize=0`或者 `RowBounds.limit = 0` 就会查询出全部的结果（相当于没有执行分页查询，但是返回结果仍然是 `Page` 类型）。
* autoRuntimeDialect ：默认值为 `false` 。设置为 `true` 时，允许在运行时根据多数据源自动识别对应方言的分页 （不支持自动选择 `sqlserver2012` ，只能使用 `sqlserver` ）
* closeConn ：默认值为 `true` 。当使用运行时动态数据源或没有设置 `helperDialect` 属性自动获取数据库类型时，会自动获取一个数据库连接， 通过该属性来设置是否关闭获取的这个连接，默认 `true` 关闭，设置为 `false` 后，不会关闭获取的连接，这个参数的设置要根据自己选择的数据源来决定。

### 使用方法

```java
@PostMapping("/list")
public PageInfo<ProductInfo> list(@RequestBody BasePage basePage){
	PageHelper.startPage(basePage.getPageNum(),basePage.getPageSize());
	List<ProductInfo> list = productInfoService.list(Wrappers.emptyWrapper());
	PageInfo<ProductInfo> productInfoPageInfo = new PageInfo<>(list);
	return productInfoPageInfo;
}
```

**返回结果**

```json
{
    "total": 3,
    "list": [
        {
            "id": 1,
            "name": "从你的全世界路过",
            "price": 32.0000,
            "createDate": "2020-11-21T21:26:12",
            "updateDate": "2021-03-27T22:17:39"
        },
        {
            "id": 2,
            "name": "乔布斯传",
            "price": 25.0000,
            "createDate": "2020-11-21T21:26:42",
            "updateDate": "2021-03-27T22:17:42"
        }
    ],
    "pageNum": 1,
    "pageSize": 2,
    "size": 2,
    "startRow": 1,
    "endRow": 2,
    "pages": 2,
    "prePage": 0,
    "nextPage": 2,
    "isFirstPage": true,
    "isLastPage": false,
    "hasPreviousPage": false,
    "hasNextPage": true,
    "navigatePages": 8,
    "navigatepageNums": [
        1,
        2
    ],
    "navigateFirstPage": 1,
    "navigateLastPage": 2
}
```

## 如何实现

### ThreadLocal

`ThreadLocal`是什么？有哪些使用场景？

`ThreadLocal`是`Java`提供的用来存储线程中局部变量的类，线程局部变量是局限于线程内部的变量，属于线程自身所有，不被多个线程间共享，通过`get`和`set`方法就可以得到当前线程对应的值。

`Java`提供`ThreadLocal`类来支持线程局部变量，是一种实现线程安全的方式。但是在管理环境下（如 `web`服务器）使用线程局部变量的时候要特别小心，在这种情况下，工作线程的生命周期比任何应用变量的生命周期都要长。任何线程局部变量一旦在工作完成后没有释放，`Java`应用就存在内存泄露的风险。

**对比**

* `Synchronized`是通过线程等待，牺牲时间来解决访问冲突
* `ThreadLocal`是通过每个线程单独一份存储空间，牺牲空间来解决冲突，并且相比于`Synchronized`，`ThreadLocal`具有线程隔离的效果，只有在线程内才能获取到对应的值，线程外则不能访问到想要的值。

### 应用

看一下`ThreadLocal`在`PageHelper`中的应用（直接上代码）

```java
/**
* 分页调用的最终方法
**/
public static <E> Page<E> startPage(int pageNum, int pageSize, boolean count,
                                    Boolean reasonable, Boolean pageSizeZero) {
    Page<E> page = new Page<E>(pageNum, pageSize, count);
    page.setReasonable(reasonable);
    page.setPageSizeZero(pageSizeZero);
    //当已经执行过orderBy的时候
    Page<E> oldPage = getLocalPage();
    if (oldPage != null && oldPage.isOrderByOnly()) {
        page.setOrderBy(oldPage.getOrderBy());
    }
    setLocalPage(page);
    return page;
}

//里边最重要的就是Page<E> oldPage = getLocalPage();和setLocalPage(page);方法，他俩是看当前线程中的
//ThreadLocal.ThreadLocalMap中是否存在该page对象，若存在直接取出，若不存在则设置一个，我们以第一个为例继续深入


protected static final ThreadLocal<Page> LOCAL_PAGE = new ThreadLocal<Page>();
/**
 * 获取 Page 参数
 * @return
 */
public static <T> Page<T> getLocalPage() {
    return LOCAL_PAGE.get();
}

public T get() {
    //获取当前线程
    Thread t = Thread.currentThread();
    //获取当前线程中的ThreadLocalMap
    ThreadLocalMap map = getMap(t);//ThreadLocal.ThreadLocalMap threadLocals = null;
    if (map != null) {
        //getEntry(ThreadLocal<?> key)源码在下边
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();//=> t.threadLocals = new ThreadLocalMap(this, firstValue);
}

private Entry getEntry(ThreadLocal<?> key) {
    //通过hashCode与length位运算确定出一个索引值i，这个i就是被存储在table数组中的位置
    int i = key.threadLocalHashCode & (table.length - 1);
    Entry e = table[i];
    if (e != null && e.get() == key)
        return e;
    else
        return getEntryAfterMiss(key, i, e);
}

static class Entry extends WeakReference<ThreadLocal<?>> {
    /** The value associated with this ThreadLocal. */
    Object value;

    Entry(ThreadLocal<?> k, Object v) {
        super(k);
        value = v;
    }
}
```

### 总结

我们发现在 Thread 中维护着类型为`ThreadLocal.ThreadLocalMap`的一个参数`threadLocals`，可以把它看作是一个特殊的`map`，它的`key`是`threadLocal`的`threadLocalHashCode`，`value`是我们设置的 page 信息，其实它底下维护了一个大小为16的环形的`table`数组，它的负载因子为2/3，我们的数据就存在这个`table`中的`Entry`对象中。

### 知识点

1、这里之所以设置为`WeakReference`，是因为如果这里使用普通的 key-value 形式来定义存储结构，实质上就会造成节点的生命周期与线程强绑定，只要线程没有销毁，那么节点在GC分析中一直处于可达状态，没办法被回收，而程序本身也无法判断是否可以清理节点。弱引用是Java中四档引用的第三档，比软引用更加弱一些，如果一个对象没有强引用链可达，那么一般活不过下一次GC。当某个`ThreadLocal`已经没有强引用可达，则随着它被垃圾回收，在`ThreadLocalMap`里对应的`Entry`的键值会失效，这为`ThreadLocalMap`本身的垃圾清理提供了便利。

2、对于某一`ThreadLocal`来讲，他的索引值i是确定的，在不同线程之间访问时访问的是不同的`table`数组的同一位置即都为table\[i]，只不过这个不同线程之间的table是独立的。

3、对于同一线程的不同`ThreadLocal`来讲，这些`ThreadLocal`实例共享一个`table`数组，然后每个`ThreadLocal`实例在`table`中的索引i是不同的。

## 实际拦截

一说到 sql 的拦截功能，大家应该会想到`Mybatis`的拦截器吧。`Mybatis`拦截器可以对下面4种对象进行拦截：

* Executor：mybatis的内部执行器，作为调度核心负责调用StatementHandler操作数据库，并把结果集通过ResultSetHandler进行自动映射
* StatementHandler： 封装了JDBC Statement操作，是sql语法的构建器，负责和数据库进行交互执行sql语句
* ParameterHandler：作为处理sql参数设置的对象，主要实现读取参数和对PreparedStatement的参数进行赋值
* ResultSetHandler：处理Statement执行完成后返回结果集的接口对象，mybatis通过它把ResultSet集合映射成实体对象

估计你也猜到了，`PageHelper`也是用的`mybatis`的拦截器进行分页的，接下来就让我们看下代码吧。

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7dcdc8445485429a93a176e025b38e9b~tplv-k3u1fbpfcp-zoom-1.image)

```java
//只关注关键代码
@Override
public Object intercept(Invocation invocation) throws Throwable {
    try {
        ...
            
        resultList = ExecutorUtil.pageQuery(dialect, executor,
                                            ms, parameter, rowBounds, resultHandler, boundSql, cacheKey);
        ...
    	}
}


public static <E> List<E> pageQuery(Dialect dialect, Executor executor, MappedStatement ms, Object parameter,
                                        RowBounds rowBounds, ResultHandler resultHandler,
                                        BoundSql boundSql, CacheKey cacheKey) throws SQLException {
        //判断是否需要进行分页查询
        if (dialect.beforePage(ms, parameter, rowBounds)) {
            //生成分页的缓存 key
            CacheKey pageKey = cacheKey;
            //处理参数对象
            parameter = dialect.processParameterObject(ms, parameter, boundSql, pageKey);
            ...
        }
}
```

获取到`ThreadLocal`中的`page`对象

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/355e932726674ab180112e906f720820~tplv-k3u1fbpfcp-zoom-1.image)

```java
@Override
public Object processParameterObject(MappedStatement ms, Object parameterObject, BoundSql boundSql, CacheKey pageKey) {
     ...
     return processPageParameter(ms, paramMap, page, boundSql, pageKey);
 }
```

将分页数据放进参数中，然后执行分页的逻辑

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/179b2f50745345f7acc18255f8abfdfd~tplv-k3u1fbpfcp-zoom-1.image)

这样我们就可以完成分页了。
