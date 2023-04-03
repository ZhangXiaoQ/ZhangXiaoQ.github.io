---
title: 快速了解 Redis 的概念和命令
icon: workingDirectory
order: 2
category:
  - Redis
tag:
  - Redis
  - 概念
  - 命令

---

## 番外篇
继上次送书之后，好多小伙伴纷纷表示名额太少了，根本没有参与的欲望，只能默默地看着别人把书拿走。所以今天阿Q为大家准备了**更多**的名额，文末参与把书带回家。

## 概念篇
一提到`Redis`，大家听到最多的应该就是“主从”、“集群”、“哨兵”了吧。对于不太精通的同学来说，乍一听这些概念，有的人会心向往之，有的人会望而却步。今天我们先来扒一扒`Redis`的“底裤”。

### 什么是 Redis?
`Redis`是`REmote DIctionary Server`的简称，意为“远程字典服务器”。它是基于`BSD`协议的完全开源的高性能的`key-value`数据库。

它是一个单线程却性能极好的内存数据库，所有的操作都是按照顺序线性执行的，避免了不必要的上下文切换和竞争条件。

采用非阻塞`I/O`的形式进行通信，利用`Epoll`的多路复用特性，提高了`I/O`效率。

给大家提供两个官方网址：
- 中文网站：http://www.redis.cn/
- 英文网站：http://www.redis.io/

> 默认16个库:0-15，默认使用0库；统一密码，默认端口6379（九宫格的`merz`）

### Redis的特点

- **内存存储和持久化**：支持异步将内存中的数据写到硬盘上，同时不影响“取最新N个数据”的服务操作，重启的时候可以再次加载进内存
- **发布、订阅消息系统**
- **定时器、计数器**：可设定过期时间
- **数据结构多样**：支持`String`、`list`，`set`，`zset`，`hash`等多种数据结构的存储
- **数据备份**：即`master-slave`模式的数据备份
- **高性能**：读的速度是`110000`次/s，写的速度是`81000`次/s
- **原子性**：所有操作都是原子性的：单个操作是原子性的；多个操作也支持事务，通过`MULTI`和`EXEC`指令包起来

> 之前我们已经介绍过[Redis的安装](https://mp.weixin.qq.com/s/Br7SVJK88Cd-3rKmAabGDw)，此处不再赘述。

## 命令篇

### key命令
- `select db`：`db`为数字，表示切换数据库为`db`库
- `Dbsize`：查看当前数据库的`key`的数量
- `Flushdb`：清空当前库的所有`key`
- `Flushall`：清空所有库的`key`（几乎不用）
- `keys *` ：所有`key`罗列
- `exists key`：判断`key`是否存在
- `move key db`：将`key`移动到`db`库（当前库的`key`没有了），如果当前库不存在`key`，则失败；如果当前库与`db`库都存在`key`值，则不移动
- `expire key seconds`：为`key`设置过期时间
- `ttl key`：查看还有多少秒过期，-1表示永不过期，-2表示已过期
- `type key`：查看你的`key`是什么类型
- `del key`：删除`key`

> 执行命令：1生效，0不生效

### String（字符串）
一个`key`对应一个`value`，一个键最大能存储`512MB`，是二进制安全的。

#### 命令
- `SET key value`：设置`key`的值
- `GET key`：获取`key`的值
- `del key`：删除`key`
- `append key value`：如果`key`已经存在并且是一个字符串，`APPEND`命令将指定的`value`追加到该`key`原来值（`value`）的末尾
- `strlen key`：返回`key`所储存的字符串值的长度
- `getrange key start end`：返回`key`中字符串值的子字符；（0，-1）返回全部
- `setrange key offset value`：用`value`参数覆写给定`key`所储存的字符串值，从偏移量`offset`开始
- `setex key seconds value`：(set with expire)给`key`设置`value`，并在`seconds`秒后过期
- `setnx key value`：(set if not exist)先判断`key`的`value`是否存在，不存在再插入，防止覆盖
- `mset key value [key value ...]`：同时设置一个或多个`key-value`对
- `mget key1 [key2...]`：同时获取一个或者多个`key`的`value`值
- `msetnx key value [key value ...]`：同时设置一个或多个`key-value`对，当且仅当所有给定`key`都不存在（有存在，有不存在的都不存）
- `getset key value`：将给定`key`的值设为`value`，并返回`key`的旧值(`old value`)。

**一定要是数字才能进行加减**
- `incr key`：将`key`中存储的数字加一
- `decr key`：将`key`中储存的数字值减一
- `incrby key increment`：将`key`所储存的值加上给定的增量值（`increment`）
- `decrby key decrement`：将`key`所储存的值减去给定的减量值（`decrement`）

### Hash（哈希）
键值对集合，适合存储对象，类似于`java`中的`map`；每个`hash`可以存储`2^32 -1` 键值对（40多亿）

#### 命令
- `hset key field value`：将哈希表`key`中的字段`field`的值设为`value`
- `hget key field`：获取存储在哈希表中指定字段的值
- `hmset key field1 value1 [field2 value2]`：同时将多个`field-value`（域-值）对设置到哈希表`key`中 
- `hmget key field1 [field2]`：获取所有给定字段的值
- `hgetall key`：获取在哈希表中指定`key`的所有字段和值
- `hdel key field1 [field2]`：删除一个或者多个哈希表字段
- `hlen key`：获取哈希表中字段的数量
- `hexists key field`：查看哈希表`key`中，指定的字段是否存在
- `hkeys key`：获取哈希表中所有`field`的值
- `hvals key`：获取哈希表中所有`value`的值
- `hincrby key field increment`：哈希表`key`中指定字段的整数值加上增量`increment`
- `hincrbyfloat key field increment`：哈希表`key`中指定字段的浮点数值加上增量`increment`
- `hsetnx key field value`：只有在字段`field`不存在时，设置哈希表字段的值


### List（列表）
`Redis`列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）。
- `lpush`从左边（首）插入，`rpush`从右边（尾）插入
- `lpop`从左边移除元素并返回该元素，`rpop`从右边移除元素并返回该元素

列表最多可存储`2^32 - 1`元素(每个列表可存储40多亿)。

#### 命令
- `lpush key value[value...]`：将一个或多个值插入到列表头部
- `rpush key value[value...]`：将一个或多个值插入到列表尾部
- `lrange key start stop`：获取队列指定范围内的元素
- `lpop key`：移出并获取列表的第一个元素
- `rpop key`：移除列表的最后一个元素，返回值为移除的元素
- `lindex key index`：按照索引下标获得元素，也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。
- `llen key`：获取列表长度
- `lrem key count value`：删除`count`个`value`
- `ltrim key start stop`：对一个列表进行修剪(`trim`)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除（**闭区间**）
- `rpoplpush source destination`：移除列表的最后一个元素，并将该元素添加到了另一个列表并返回（尾出头入）
- `lset key index value`：将`key`的`index`位置设置为`value`
- `linsert key before/after 【point】 value`：在列表的元素前或者后插入元素

#### 性能
1. 如果键不存在，则创建新的链表；
2. 如果键已存在，新增内容；
3. 如果值全部移除，对应的键也就消失了；
4. 链表的操作头和尾效率都极高，但假如是对中间元素进行操作，效率就很惨淡了。


### Set（集合）
`Redis`的`Set`是`String`类型的无序集合，集合成员是唯一的。集合是通过哈希表（`HashTable`）实现的，所以添加、删除、查找的复杂度都是 `O(1)`。集合中最大的成员数为`2^32 - 1`( 每个集合可存储40多亿个成员)。

#### 命令
- `sadd key member[member...]`：集合中添加一个或者多个成员（无序）
- `smembers key`：返回集合中的所有成员
- `sismember key member`：判断`member`元素是否是集合`key`的成员
- `scard key`：获取集合的成员数
- `srem key member[member...]`：删除集合中的一个或者多个元素
- `srandmember key [count]`：返回集合中一个或多个随机数---------适合做挖财项目
- `spop key`：移除并返回集合中的一个随机元素
- `smove source destination member`：将`member`元素从`source`集合移动到`destination`

#### 数学集合类
- `sdiff key1 [key2]`：返回第一个集合与其他集合之间的差异
- `sinter key1 [key2]`：返回给定所有集合的交集
- `sunion key1 [key2]`：返回所有给定集合的并集


### zset(sorted set有序集合)
`Redis`的`zset`和`set`一样也是`string`类型元素的集合，且不允许重复的成员。不同的是每个元素都会关联一个`double`类型的分数。

`redis`正是通过分数来为集合中的成员进行从小到大的排序。`zset`的成员是唯一的，但分数(`score`)却可以重复。添加元素到集合，元素在集合中存在则更新对应`score`。

#### 命令
- `zadd key score1 member1 [score2 member2]`：向有序集合添加一个或者多个成员，或者更新已存在成员的分数
- `ZRANGE key start stop [WITHSCORES]`：通过索引区间返回有序集合指定区间内的成员（是否包含分数信息）
- `ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT]`：通过分数返回范围内的`member`成员（是否包含分数），其中“（”表示不包含；`limit`作用是返回限制 （`limit start count`）

**示例：**
`zrangebyscore zset01 60 （90 withscores limit 2 2`：从`zset01`中选取分数大于等于60，小于90的从第二个索引开始往后两个的成员

- `zrem key member[member...]`：移除有序集合中的一个或多个成员
- `zcard key`：获取有序集合的成员数
- `zcount key  min max`：获取有序集合的大于`min`小于`max`的成员数
- `zrank key member`：获取`member`的索引
- `zscore key member`：获取有序集合的`member`的分数

#### REV
- `ZREVRANK key member`：返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序
- `ZREVRANGE key start stop [WITHSCORES]`：通过索引返回有序集中指定区间内的成员，分数从高到低
- `ZREVRANGEBYSCORE key max min [WITHSCORES]`：返回有序集中指定分数区间内的成员，分数从高到低排序

2022年6月21日晚八点在技术群公布中奖结果，我也会私信你呦！

