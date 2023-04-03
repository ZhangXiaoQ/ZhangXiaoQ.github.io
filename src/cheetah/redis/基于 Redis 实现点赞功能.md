---
title: 基于 Redis 实现点赞功能
icon: workingDirectory
order: 7
category:
  - Redis
tag:
  - Redis
  - 点赞


---

提到点赞，大家一想到的是不是就是朋友圈的点赞呀？其实点赞对我们来说并不陌生，我们经常会在手机软件或者网页中看到它，今天就让我们来了解一下它的实现吧。

我们常见的设计思路大概分为两种：一种自然是用 MySQL 等数据库直接落地存储， 另外一种就是将点赞的数据保存到 Redis 等缓存里，在一定时间后刷回 MySQL 等数据库。

## 两种实现

首先我们来说一下两种方法各自的优缺点：我们以 MySQL 和 Redis 为例。

### 直接写入数据库

**优点：** 这种方法实现简单，只需完成数据库的增删改查就行；

**缺点：**  数据库读写压力大，如果遇到热门文章在短时间内被大量点赞的情况，直接操作数据库会给数据库带来巨大压力，影响效率。

### 使用 Redis 缓存

**优点：** 性能高，读写速度快，缓解数据库读写的压力；

**缺点：**  开发复杂，不能保证数据安全性即redis挂掉的时候会丢失数据， 同时不及时同步redis中的数据， 可能会在 redis 内存置换的时候被淘汰掉。不过对于点赞数据我们不需要那么精确，丢失一点数据问题不大。

## 具体实现

接下来就从以下三个方面对点赞功能做详细的介绍

- Redis 缓存设计
- 数据库设计
- 开启定时任务持久化存储到数据库

### Redis 缓存设计及实现

> Redis 的整合我们在上一篇文章中已经介绍过了，此处就不再赘述了。

我们了解到，我们在做点赞的时候需要记录以下几类数据：一类是某用户被其他用户点赞的详细记录，一类是考虑到查询与存取方便快捷，我这边采用 Hash 结构进行存储，存储结构如下：

（1）某用户被其他用户点赞的详细记录：`MAP_USER_LIKED`为键值，`被点赞用户id::点赞用户id`为filed，`1或者0`为value

（2）某用户被点赞的数量统计：`MAP_USER_LIKED_COUNT`为键值，`被点赞用户id`为filed，`count`为value

**部分代码如下：**

```java
/**
* 将用户被其他用户点赞的数据存到redis
*/
@Override
public void saveLiked2Redis(String likedUserId, String likedPostId) {
    String key = RedisKeyUtils.getLikedKey(likedUserId, likedPostId);
    redisTemplate.opsForHash().put(RedisKeyUtils.MAP_KEY_USER_LIKED,key, LikedStatusEnum.LIKE.getCode());
}

//取消点赞
@Override
public void unlikeFromRedis(String likedUserId, String likedPostId) {
    String key = RedisKeyUtils.getLikedKey(likedUserId, likedPostId);
    redisTemplate.opsForHash().put(RedisKeyUtils.MAP_KEY_USER_LIKED,key,LikedStatusEnum.UNLIKE.getCode());
}

/**
* 将被点赞用户的数量+1
*/
@Override
public void incrementLikedCount(String likedUserId) {
    redisTemplate.opsForHash().increment(RedisKeyUtils.MAP_KEY_USER_LIKED_COUNT,likedUserId,1);
}

//-1
@Override
public void decrementLikedCount(String likedUserId) {
    redisTemplate.opsForHash().increment(RedisKeyUtils.MAP_KEY_USER_LIKED_COUNT, likedUserId, -1);
}

/**
* 获取Redis中的用户点赞详情记录
*/
@Override
public List<UserLikeDetail> getLikedDataFromRedis() {
    Cursor<Map.Entry<Object,Object>> scan = redisTemplate.opsForHash().scan(RedisKeyUtils.MAP_KEY_USER_LIKED, ScanOptions.NONE);
    List<UserLikeDetail> list = new ArrayList<>();
    while (scan.hasNext()){
        Map.Entry<Object, Object> entry = scan.next();
        String key = (String) entry.getKey();
        String[] split = key.split("::");
        String likedUserId = split[0];
        String likedPostId = split[1];
        Integer value = (Integer) entry.getValue();
        //组装成 UserLike 对象
        UserLikeDetail userLikeDetail = new UserLikeDetail(likedUserId, likedPostId, value);
        list.add(userLikeDetail);
        //存到 list 后从 Redis 中删除
        redisTemplate.opsForHash().delete(RedisKeyUtils.MAP_KEY_USER_LIKED, key);
    }
    return list;
}

/**
* 获取Redis中的用户被点赞数量
*/
@Override
public List<UserLikCountDTO> getLikedCountFromRedis() {
    Cursor<Map.Entry<Object,Object>> cursor = redisTemplate.opsForHash().scan(RedisKeyUtils.MAP_KEY_USER_LIKED_COUNT, ScanOptions.NONE);
    List<UserLikCountDTO> list = new ArrayList<>();
    while(cursor.hasNext()){
        Map.Entry<Object, Object> map = cursor.next();
        String key = (String) map.getKey();
        Integer value = (Integer) map.getValue();
        UserLikCountDTO userLikCountDTO = new UserLikCountDTO(key,value);
        list.add(userLikCountDTO);
        //存到 list 后从 Redis 中删除
        redisTemplate.opsForHash().delete(RedisKeyUtils.MAP_KEY_USER_LIKED_COUNT,key);
    }
    return list;
}
```

**Redis存储结构如图**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd6b13cfc51c435884f662fd9586d0bf~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fcccd73d71fd4684b90fc9a0aeb4a6b6~tplv-k3u1fbpfcp-zoom-1.image)

### 数据库设计

这里我们可以和直接将点赞数据存到数据库一样，设计两张表：

(1)用户被其他用户点赞的详细记录:user_like_detail

```
DROP TABLE IF EXISTS `user_like_detail`;
CREATE TABLE `user_like_detail`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liked_user_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '被点赞的用户id',
  `liked_post_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '点赞的用户id',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '点赞状态，0取消，1点赞',
  `create_time` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `update_time` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `liked_user_id`(`liked_user_id`) USING BTREE,
  INDEX `liked_post_id`(`liked_post_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '用户点赞表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
```

(2)用户被点赞的数量统计:user_like_count

```
DROP TABLE IF EXISTS `user_like_count`;
CREATE TABLE `user_like_count`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `like_num` int(11) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
```

### 开启定时任务持久化存储到数据库

我们使用 Quartz 来实现定时任务，将 Redis 中的数据存储到数据库中，为了演示效果，我们可以设置一分钟或者两分钟存储一遍数据，这个视具体业务而定。在同步数据的过程中，我们首先要将 Redis 中的数据在数据库中进行查重，舍弃重复数据，这样我们的数据才会更加准确。

**部分代码如下**

```java
//同步redis的用户点赞数据到数据库
@Override
@Transactional
public void transLikedFromRedis2DB() {
    List<UserLikeDetail> list = redisService.getLikedDataFromRedis();
    list.stream().forEach(item->{
        //查重
        UserLikeDetail userLikeDetail = userLikeDetailMapper.selectOne(new LambdaQueryWrapper<UserLikeDetail>()
           .eq(UserLikeDetail::getLikedUserId, item.getLikedUserId())
           .eq(UserLikeDetail::getLikedPostId, item.getLikedPostId()));
        if (userLikeDetail == null){
            userLikeDetail = new UserLikeDetail();
            BeanUtils.copyProperties(item, userLikeDetail);
            //没有记录，直接存入
            userLikeDetail.setCreateTime(LocalDateTime.now());
            userLikeDetailMapper.insert(userLikeDetail);
        }else{
            //有记录，需要更新
            userLikeDetail.setStatus(item.getStatus());
            userLikeDetail.setUpdateTime(LocalDateTime.now());
            userLikeDetailMapper.updateById(item);
        }
    });
}

@Override
@Transactional
public void transLikedCountFromRedis2DB() {
    List<UserLikCountDTO> list = redisService.getLikedCountFromRedis();
    list.stream().forEach(item->{
        UserLikeCount user = userLikeCountMapper.selectById(item.getKey());
        //点赞数量属于无关紧要的操作，出错无需抛异常
        if (user != null){
            Integer likeNum = user.getLikeNum() + item.getValue();
            user.setLikeNum(likeNum);
            //更新点赞数量
            userLikeCountMapper.updateById(user);
        }
    });
}
```

至此我们就实现了基于 Redis 的点赞功能，我们还需要注意一点：查询用户点赞情况时，需要同时查询数据库+缓存中的数据。
