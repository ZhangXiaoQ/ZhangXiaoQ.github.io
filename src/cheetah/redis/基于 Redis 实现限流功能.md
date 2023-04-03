---
title: 基于 Redis 实现限流功能
icon: workingDirectory
order: 6
category:
  - Redis
tag:
  - Redis
  - 限流
  - 注解

---

服务器上的 Redis 已经安装完成了（安装步骤见上篇文章），今天就让我们使用 Redis 来做个小功能：自定义拦截器限制访问次数，也就是限流。

### 在项目中引入 Redis

1、引入依赖

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- redis依赖commons-pool 这个依赖一定要添加 -->
<dependency>
  <groupId>org.apache.commons</groupId>
  <artifactId>commons-pool2</artifactId>
</dependency>
```

2、application.yml 配置

```xml
server:
port: 8181

spring:
redis:
  host: 127.0.0.1
  port: 6379
  timeout: 10s
  lettuce:
    pool:
    # 连接池中的最小空闲连接 默认0
      min-idle: 0
      # 连接池中的最大空闲连接 默认8
      max-idle: 8
      # 连接池最大连接数 默认8 ，负数表示没有限制
      max-active: 8
      # 连接池最大阻塞等待时间（使用负值表示没有限制） 默认-1
      max-wait: -1ms
  #选择哪个库存储，默认是0
  database: 0
  password: 123456
```

3、创建 redisConfig，引入 redisTemplate

```java
@Configuration
public class RedisConfig {
   @Bean
   public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory redisConnectionFactory) {
       RedisTemplate<String, Object> redisTemplate = new RedisTemplate<String, Object>();
       redisTemplate.setKeySerializer(new StringRedisSerializer());
       redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
       redisTemplate.setHashKeySerializer(new StringRedisSerializer());
       redisTemplate.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
       redisTemplate.setConnectionFactory(redisConnectionFactory);
       return redisTemplate;
  }
}
```

### 书写自定义注解和拦截器

1、自定义注解

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface AccessLimit {
   int seconds(); //秒数
   int maxCount(); //最大访问次数
   boolean needLogin()default true;//是否需要登录
}
```

2、创建拦截器

```java
@Component
public class FangshuaInterceptor extends HandlerInterceptorAdapter {

   @Autowired
   private RedisTemplate redisTemplate;

   @Override
   public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
       //判断请求是否属于方法的请求
       if(handler instanceof HandlerMethod){
           HandlerMethod hm = (HandlerMethod) handler;
           //获取方法中的注解,看是否有该注解
           AccessLimit accessLimit = hm.getMethodAnnotation(AccessLimit.class);
           if(accessLimit == null){
               return true;
          }
           int seconds = accessLimit.seconds();
           int maxCount = accessLimit.maxCount();
           boolean login = accessLimit.needLogin();
           String key = request.getRequestURI();
           //如果需要登录
           if(login){
               //获取登录的session进行判断，此处只是例子，不写具体的业务
               //.....
               key+=""+"1";  //这里假设用户是1,项目中是动态获取的userId
          }

           //从redis中获取用户访问的次数
           Integer count;
           if(Objects.isNull(redisTemplate.opsForValue().get(key))){
               count = 0;
          }else{
               count = (Integer) redisTemplate.opsForValue().get(key);
          }
           if(count == 0){
               redisTemplate.opsForValue().set(key,1,seconds, TimeUnit.SECONDS);
          }else if(count<maxCount){
               //key的值加1
               redisTemplate.opsForValue().increment(key);
          }else{
               //超出访问次数
               Map<String,Object> errMap=new HashMap<>();
               errMap.put("code",400);
               errMap.put("msg","请求超时，请稍后再试");
               render(response,errMap); //这里的CodeMsg是一个返回参数
               return false;
          }
      }
       return true;
  }


   private void render(HttpServletResponse response, Map<String,Object> errMap) throws Exception {
       response.setContentType("application/json;charset=UTF-8");
       OutputStream out = response.getOutputStream();
       String str = JSON.toJSONString(errMap);
       out.write(str.getBytes("UTF-8"));
       out.flush();
       out.close();
  }
}
```

3、将自定义拦截器加入到拦截器列表中

```java
@Configuration
public class WebConfig extends WebMvcConfigurerAdapter {

   @Autowired
   private FangshuaInterceptor interceptor;

   @Override
   public void addInterceptors(InterceptorRegistry registry) {
       registry.addInterceptor(interceptor);
  }
}
```

### 测试

```java
@RestController
@RequestMapping("test")
public class TestController {

   //每三十秒最多可以请求三次，不需要登录
   @AccessLimit(seconds=30, maxCount=3, needLogin=false)
   @PostMapping("/fangshua")
   public String fangshua(){
       return "成功";
  }
}
```