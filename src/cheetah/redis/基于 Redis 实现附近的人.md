---
title: 基于 Redis 实现附近的人
icon: workingDirectory
order: 8
category:
  - Redis
tag:
  - Redis
  - geo


---

前几天收到一个新的需求，需要实现类似“附近的人”的功能：根据自己当前的定位，获取距离范围内的所有任务地点。

刚看到这个需求时有点懵逼，第一想到的就是要利用地球的半径公式去计算距离，也就是把地球想成一个球体，去计算球上两点之间的距离。

可想而知，这样的方法效率会比较低，每条数据都要来与本人的坐标做计算，太过繁琐。经过大佬的指点，想到了用 redis 自带的 GEO 来实现此功能。

## 实战演习

以下是给大家准备的sql脚本

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for job_base_info
-- ----------------------------
DROP TABLE IF EXISTS `job_base_info`;
CREATE TABLE `job_base_info`  (
  `job_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `job_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '任务名称',
  `job_location` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '' COMMENT '任务地点位置经纬度-逗号隔开',
  `job_detail_address` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '任务详细地点位置',
  PRIMARY KEY (`job_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '工作任务详情基础信息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of job_base_info
-- ----------------------------
INSERT INTO `job_base_info` VALUES (1, '软件开发', '120.433576,36.139697', '青岛市崂山区海尔路1号');
INSERT INTO `job_base_info` VALUES (2, '儿童摄影', '120.420297,36.156589', '山东省青岛市李沧区书院路188号');
INSERT INTO `job_base_info` VALUES (3, '清洁家用电器', '120.025706,36.281478', '山东省青岛市胶州市福州支路232号东60米');
INSERT INTO `job_base_info` VALUES (4, '辩论学习', '120.505042,36.171247', '松岭路238号中国海洋大学内');

SET FOREIGN_KEY_CHECKS = 1;
```

废话不多说，让我们来看看具体的实现

（1）我们要在程序启动时，将数据库中的任务数据的坐标信息初始化到 redis 中（此处暂且忽略任务的增删改查对 redis 中数据的影响）

```java
@PostConstruct
public void init(){
    //首先要删除该key的所有值
    redisTemplate.delete("company-task");
    List<JobBaseInfo> jobBaseInfoList = jobBaseInfoMapper.selectList(Wrappers.emptyWrapper());
    jobBaseInfoList.stream().forEach(item->{
        String jobLocation = item.getJobLocation();
        if(StrUtil.isNotEmpty(jobLocation)){
            String[] split = jobLocation.split(",");comp
            if(split.length==2){
                //Point(经度, 纬度) 
                Point point = new Point(Double.parseDouble(split[0]),Double.parseDouble(split[1]));
                //将经纬度数据及其id存到key为“company-task”中
                redisTemplate.opsForGeo().add("company-task",point,item.getJobId());
            }
        }
    });
}
```

（2）查询当前坐标下 3km 范围内的任务地点（外加根据任务名搜索的联合查询）

```java
@Override
public List<JobBaseInfo> selectJobList(JobBaseInfoDTO jobBaseInfoDTO) {
    String jobLocation = jobBaseInfoDTO.getJobLocation();
    //距离
    Double distance = jobBaseInfoDTO.getDistance();
    List<Integer> idList = new ArrayList<>();
    if(StringUtils.isNotNull(jobLocation) && StringUtils.isNotNull(distance)){
        String[] split = jobLocation.split(",");
        if(split.length==2){
            //Point(经度, 纬度) Distance(距离量, 距离单位)
            Circle circle = new Circle(new Point(Double.parseDouble(split[0]),Double.parseDouble(split[1])),
                                       new Distance(distance, Metrics.KILOMETERS));
            //params: key, Circle 获取存储到redis中的distance范围内的所有任务地点数据
            GeoResults radius = redisTemplate.opsForGeo().radius("company-task", circle);
            List<GeoResult> contentList = radius.getContent();
            if(contentList.size()>0){
                contentList.stream().forEach(item->{
                    RedisGeoCommands.GeoLocation content = (RedisGeoCommands.GeoLocation) item.getContent();
                    idList.add((Integer) content.getName());
                });
            }
        }
    }
    jobBaseInfoDTO.setIdList(idList);
    return jobBaseInfoMapper.selectJobList(jobBaseInfoDTO);
}
```

`selectJobList(jobBaseInfoDTO)`方法的sql如下

```sql
<select id="selectJobList" resultType="com.itzyq.redislikes.model.entity.JobBaseInfo">
	select
	<include refid="Base_Column_List"></include>
	from job_base_info
	<where>
		<if test="jobName!=null and jobName!=''">
			and job_name like CONCAT("%",#{jobName},"%")
		</if>

		<if test="idList!=null and idList.size > 0 ">
			and job_id in
			<foreach collection="idList" item="id" open="(" close=")" separator=",">
				#{id}
			</foreach>
		</if>
	</where>
</select>
```

到这儿我们就已经实现了“附近的人”的功能了，接下来就让我们具体的了解一下Redis中的GEO都有哪些骚操作吧。**微信公众号回复“pSearch”获取源码呦！**

## GEO操作

Redis GEO 主要用于存储地理位置信息，并对存储的信息进行操作，该功能在 Redis 3.2 版本新增，GEO 是基于zset的一种扩展数据格式。Redis GEO 操作方法有：

- geoadd：添加地理位置的坐标。
- geopos：获取地理位置的坐标。
- geodist：计算两个位置之间的距离。
- georadius：根据用户给定的经纬度坐标来获取指定范围内的地理位置集合。
- georadiusbymember：根据储存在位置集合里面的某个地点获取指定范围内的地理位置集合。
- geohash：返回一个或多个位置对象的 geohash 值。

### geoadd

geoadd 用于存储指定的地理空间位置，可以将一个或多个经度(longitude)、纬度(latitude)、位置名称(member)添加到指定的 key 中。

geoadd 语法格式如下：

```redis
GEOADD key longitude latitude member [longitude latitude member ...]
```

以下实例中 key 为 Sicily，Palermo 和 Catania 为位置名称 ：

**实例**

```java
redis> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
redis>
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a2b2236209164a538086e39f92993ecc~tplv-k3u1fbpfcp-zoom-1.image)

### geopos

geopos 用于从给定的 key 里返回所有指定名称(member)的位置（经度和纬度），不存在的返回 nil。

geopos 语法格式如下：

```redis
GEOPOS key member [member ...]
```

实例

```java
redis> GEOPOS Sicily Palermo Catania NonExisting
1) 1) "13.36138933897018433"
  2) "38.11555639549629859"
2) 1) "15.08726745843887329"
  2) "37.50266842333162032"
3) (nil)
redis>
```

注：也可以使用zrange返回所有的位置元素而不带经纬度信息

```java
redis> ZRANGE Sicily 0 -1
1)  "Palermo"
 2)  "Catania"
redis>
```

### geodist

geodist 用于返回两个给定位置之间的距离。

geodist 语法格式如下：

```redis
GEODIST key member1 member2 [m|km|ft|mi]
```

member1 member2 为两个地理位置。

最后一个距离单位参数说明：

- m ：米，默认单位。
- km ：千米。
- mi ：英里。
- ft ：英尺。

**实例: 计算 Palermo 与 Catania 之间的距离**

```java
redis> GEODIST Sicily Palermo Catania
"166274.1516"
redis> GEODIST Sicily Palermo Catania km
"166.2742"
redis> GEODIST Sicily Palermo Catania mi
"103.3182"
redis> GEODIST Sicily Foo Bar
(nil)
redis>
```

### georadius、georadiusbymember

georadius 以给定的经纬度为中心， 返回键包含的位置元素当中， 与中心的距离不超过给定最大距离的所有位置元素。

georadiusbymember 和 GEORADIUS 命令一样， 都可以找出位于指定范围内的元素， 但是 georadiusbymember 的中心点是由给定的位置元素决定的， 而不是使用经度和纬度来决定中心点。

georadius 与 georadiusbymember 语法格式如下：

```redis
GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC] [STORE key] [STOREDIST key]
GEORADIUSBYMEMBER key member radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC] [STORE key] [STOREDIST key]
```

参数说明：

- m ：米，默认单位。
- km ：千米。
- mi ：英里。
- ft ：英尺。
- WITHDIST: 在返回位置元素的同时， 将位置元素与中心之间的距离也一并返回。
- WITHCOORD: 将位置元素的经度和维度也一并返回。
- WITHHASH: 以 52 位有符号整数的形式， 返回位置元素经过原始 geohash 编码的有序集合分值。 这个选项主要用于底层应用或者调试， 实际中的作用并不大。
- COUNT 限定返回的记录数。
- ASC: 查找结果根据距离从近到远排序。
- DESC: 查找结果根据从远到近排序。

**georadius 实例**

```java
redis> GEORADIUS Sicily 15 37 200 km WITHDIST
1) 1) "Palermo"
  2) "190.4424"
2) 1) "Catania"
  2) "56.4413"
redis> GEORADIUS Sicily 15 37 200 km WITHCOORD
1) 1) "Palermo"
  2) 1) "13.36138933897018433"
   2) "38.11555639549629859"
2) 1) "Catania"
  2) 1) "15.08726745843887329"
   2) "37.50266842333162032"
redis> GEORADIUS Sicily 15 37 200 km WITHDIST WITHCOORD
1) 1) "Palermo"
  2) "190.4424"
  3) 1) "13.36138933897018433"
   2) "38.11555639549629859"
2) 1) "Catania"
  2) "56.4413"
  3) 1) "15.08726745843887329"
   2) "37.50266842333162032"
redis>
```

**georadiusbymember 实例：**

```java
redis> GEOADD Sicily 13.583333 37.316667 "Agrigento"
(integer) 1
redis> GEORADIUSBYMEMBER Sicily Agrigento 100 km
1) "Agrigento"
2) "Palermo"
redis>
```

### geohash

Redis GEO 使用 geohash 来保存地理位置的坐标。geohash 用于获取一个或多个位置元素的 geohash 值。

geohash 语法格式如下：

```redis
GEOHASH key member [member ...]
```

实例：

```java
redis> GEOHASH Sicily Palermo Catania
1) "sqc8b49rny0"
2) "sqdtr74hyu0"
redis>
```


geo并没有提供删除指令，但根据其底层是zset实现，我们可以使用zrem对数据进行删除

```java
redis> ZREM Sicily Agrigento
"1"
redis>
```



## Redis GEO JAVA API

有了以上 GEO 的操作，我们可以在 java 中找到对应的 api

```java
/**
 *  将指定的地理空间位置（纬度、经度、名称）添加到指定的key中。
 */
//params: key, Point(经度, 纬度), 地方名称
Long addedNum = redisTemplate.opsForGeo().add("Sicily", new Point(13.361389,38.115556), "Palermo");

/**
 *  从key里返回所有给定位置元素的位置（经度和纬度）。
 */
//params: key, 地方名称...
List<Point> points = redisTemplate.opsForGeo().position("Sicily","Palermo","Catania");

/**
 *  返回两个给定位置之间的距离。
 */
//params: key, 地方名称1, 地方名称2, 距离单位
Distance distance = redisTemplate.opsForGeo()
                .distance("Sicily","Palermo","Catania", RedisGeoCommands.DistanceUnit.KILOMETERS);

/**
 * 以给定的经纬度为中心， 返回键包含的位置元素当中， 与中心的距离不超过给定最大距离的所有位置元素，并给出所有位置元素与中心的平均距离。
 */
//Point(经度, 纬度) Distance(距离量, 距离单位)
Circle circle = new Circle(new Point(13.361389,38.115556), new Distance(200, Metrics.KILOMETERS));
RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().
    //包含距离，包含经纬度，升序前五个
    includeDistance().includeCoordinates().sortAscending().limit(5);
//params: key, Circle, GeoRadiusCommandArgs
GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo()
                .radius("Sicily",circle,args);

/**
 *  以给定的城市为中心， 返回键包含的位置元素当中， 与中心的距离不超过给定最大距离的所有位置元素，并给出所有位置元素与中心的平均距离。
 */
//params: 距离量, 距离单位
Distance distance = new Distance(200,Metrics.KILOMETERS);
RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
    .includeDistance().includeCoordinates().sortAscending().limit(5);
//params: key, 地方名称, Circle, GeoRadiusCommandArgs
GeoResults<RedisGeoCommands.GeoLocation<String>>  results = redisTemplate.opsForGeo()
    .radius("Sicily","Palermo",distance,args);
     

/**
 *  返回一个或多个位置元素的 Geohash 表示
 */
//params: key, 地方名称...
List<String> results = redisTemplate.opsForGeo()
                .hash("Sicily","Palermo","Catania");
```

