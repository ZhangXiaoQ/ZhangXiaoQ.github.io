## 一、此组件解决了什么问题

### [#](http://gfcoe.qingdao.gongfuqd.com/java/components/docs/feign-spring-boot-starter.html#_1、集成官方的openfeign-starter)1、集成官方的openfeign starter

有针对性的简单封装了官方open feign starter，简化客户端使用

### [#](http://gfcoe.qingdao.gongfuqd.com/java/components/docs/feign-spring-boot-starter.html#_2、解决本地测试feign调用问题)2、解决本地测试feign调用问题

微服务之间调用的时候，由于pass平台上注册到nacos上的是172的docker内网地址，本地服务访问开发环境或者测试环境的微服务会失败，通过该组件，可以方便的手动指定远端地址，实现正常的feign调用自测。

![注册到nacos上的都是内网172地址](https://hd-oss.cosmoplat.com/hdCosmo58:gfcoe/public/2023/01/17/006645e7-6a1e-4470-9679-c696168dacb0.png)注册到nacos上的都是内网172地址

### [#](http://gfcoe.qingdao.gongfuqd.com/java/components/docs/feign-spring-boot-starter.html#_3、解决feignclient配置冗余的问题)3、解决FeignClient配置冗余的问题

每个Feign客户端的配置如下所示



```java
@RequestMapping("/user")
@FeignClient("user-service")
public interface UserApi {

    @GetMapping("/detail")
    UserInfo userDetail(@RequestParam("userId") String userId);
}
```

实际上每个微服务暴露出来的接口FeignClient都是一样的，统一在一个地方配置就好。

此功能待开发

## [#](http://gfcoe.qingdao.gongfuqd.com/java/components/docs/feign-spring-boot-starter.html#二、使用方式)二、使用方式

引入依赖



```xml
<dependency>
    <groupId>com.cosmoplat.gfqd</groupId>
    <artifactId>feign-spring-boot-starter</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

在配置文件中新增配置



```yaml
feign:
  manual:
    enabled: true
    serviceIds:
      serviceA: http://www.google.com
      serviceB: http://www.baidu.com
```

enabled为true时serviceIds配置生效；enabled为false时serviceIds配置失效，走原生的feign starter逻辑。

[feign manual开关关闭，走服务发现逻辑，feign调用失败](https://hd-oss.cosmoplat.com/hdCosmo58:gfcoe/public/2023/02/02/6b39487b-8766-42dd-85ca-96c9664e8c62.mp4)

feign manual开关关闭，走服务发现逻辑，feign调用失败

[feign manual开关打开，不走服务发现逻辑，feign调用成功](https://hd-oss.cosmoplat.com/hdCosmo58:gfcoe/public/2023/02/02/3e32a975-1ac0-4298-b6df-b0b55654ddc7.mp4)

feign manual开关打开，不走服务发现逻辑，feign调用成功

相关信息

这里可配合[内部网关](http://gfcoe.qingdao.gongfuqd.com/java/archetype/docs/gateway/inner-gateway-archetype.html)使用，方便本地自测



```yaml
feign:
  manual:
    enabled: false
    serviceIds:
      icp-portal-bms: http://10.206.65.136:27424/icp-portal-bms
```

这里的地址`http://10.206.65.136:27424/icp-portal-bms`分为两部分，`http://10.206.65.136:27424`是网关地址和端口号，`icp-portal-bms`是服务名

## [#](http://gfcoe.qingdao.gongfuqd.com/java/components/docs/feign-spring-boot-starter.html#三、实现原理)三、实现原理

当`feign.manual.enabled`为true的时候，会触发手动手动创建FeignClient的流程，参考文档：[https://docs.spring.io/spring-cloud-openfeign/docs/2.2.9.RELEASE/reference/html/#creating-feign-clients-manuallyopen in new window](https://docs.spring.io/spring-cloud-openfeign/docs/2.2.9.RELEASE/reference/html/#creating-feign-clients-manually) 示例代码如下所示：



```java
@Import(FeignClientsConfiguration.class)
class FooController {

    private FooClient fooClient;

    private FooClient adminClient;

        @Autowired
    public FooController(Decoder decoder, Encoder encoder, Client client, Contract contract) {
        this.fooClient = Feign.builder().client(client)
                .encoder(encoder)
                .decoder(decoder)
                .contract(contract)
                .requestInterceptor(new BasicAuthRequestInterceptor("user", "user"))
                .target(FooClient.class, "https://PROD-SVC");

        this.adminClient = Feign.builder().client(client)
                .encoder(encoder)
                .decoder(decoder)
                .contract(contract)
                .requestInterceptor(new BasicAuthRequestInterceptor("admin", "admin"))
                .target(FooClient.class, "https://PROD-SVC");
    }
}
```

通过替换手动创建Client过程中的某些组件，可以实现特定的功能

- 通过指定DefaultClient实现默认的http调用；通过指定RibbonClient实现服务发现和负载均衡
- 通过指定拦截器实现拦截器应用
- 通过指定FeignBuilderCustomizer实现FeignBuilder定制化
- ......

为了方便使用，参考了`org.springframework.cloud.openfeign.FeignClientsRegistrar`实现了指定包扫描、创建BeanDefinitions等功能，简化了部分开发。

流程图如下：

![利用springboot扩展点实现手动注册](https://hd-oss.cosmoplat.com/hdCosmo58:gfcoe/public/2023/01/17/273f6a51-85df-4226-9c9a-3c8271067d9a.png)利用springboot扩展点实现手动注册