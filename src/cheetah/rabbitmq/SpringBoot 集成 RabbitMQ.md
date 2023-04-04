---
title: SpringBoot 集成 RabbitMQ
icon: line
order: 2
category:
  - RabbitMQ
tag:
  - SpringBoot

---

[上文](https://mp.weixin.qq.com/s/X-TYHN4WTLHYndGkBAFcGQ)我们已经完成了`RabbitMQ`的安装，安完就要让它发挥点作用，今天就在`SpringBoot`项目里集成一下子，尝尝鲜！

在项目真正开始之前我们先来简单介绍下`RabbitMQ`的工作流程: 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/132af66868724087aab0b78b57847a0b~tplv-k3u1fbpfcp-zoom-1.image)

-   生产者往交换机中发送消息；
-   交换机通过规则绑定队列，通过路由键将消息存储到队列中；
-   消费者获取队列中的消息进行消费；

> 环境：SpringBoot 2.6.3、JDK 1.8

## 项目搭建

首先创建`SpringBoot`项目 `rabbit-mq`

1.  引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

2.  yml 文件配置

```yml
spring:
  rabbitmq:
    host: 127.0.0.1     //rabbitMQ服务地址
    port: 15672   //这个地方暂时先用我们之前配置的15672
    username: cheetah   //自己的账户名
    password: 123456    //自己的密码
```

3.  直连交换机

本项目以直连交换机为例，至于其他的交换机类型将在后文中给出详细介绍。

```java
@Configuration
public class DirectRabbitConfig {

    /**
     * 定义交换机
     **/
    @Bean
    public DirectExchange directExchange(){
        /**
         * 交换机名称
         * 持久性标志：是否持久化,默认是 true 即声明一个持久的 exchange,该exchange将在服务器重启后继续运行
         * 自动删除标志：是否自动删除，默认为 false, 如果服务器想在 exchange不再使用时删除它，则设置为 true
         **/
        return new DirectExchange("directExchange", true, false);
    }

    /**
     * 定义队列
     **/
    @Bean
    public Queue directQueue(){
        /**
         * name：队列名称
         * durable：是否持久化,默认是 true,持久化队列，会被存储在磁盘上，当消息代理重启时仍然存在
         * exclusive：是否排他，默认为 false，true则表示声明了一个排他队列（该队列将仅由声明者连接使用），如果连接关闭，则队列被删除。此参考优先级高于durable
         * autoDelete：是否自动删除， 默认是 false，true则表示当队列不再使用时，服务器删除该队列
         **/
        return new Queue("directQueue",true);
    }

    /**
     * 队列和交换机绑定
     * 设置路由键：directRouting
     **/
    @Bean
    Binding bindingDirect(){
        return BindingBuilder.bind(directQueue()).to(directExchange()).with("directRouting");
    }


}
```

4.  消息发送

```java
@RestController
public class SendMessageController {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @GetMapping("/sendMessage")
    public String sendMessage(){
        //将消息携带路由键值
        rabbitTemplate.convertAndSend("directExchange", "directRouting", "发送消息！");
        return "ok";
    }

}
```

我们先启动程序，在浏览器访问下

http://127.0.0.1:9001/sendMessage

报错如下： ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd030df138db4ac495d3b1d5725bd42d~tplv-k3u1fbpfcp-zoom-1.image)

我们之前已经给该用户分配过权限了，如果之前未分配，直接在客户端中配置： 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ff5bc42f0f554786829fe4b74978c91d~tplv-k3u1fbpfcp-zoom-1.image) ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/067748437946461f873dcbf5a38e2b40~tplv-k3u1fbpfcp-zoom-1.image)

之所以访问不到，是因为我们使用的端口号不正确 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ad35bc6e14ea4c5989e540519bc7a431~tplv-k3u1fbpfcp-zoom-1.image)

所以我们需要将端口改为 `5672`（如果是阿里云服务器实例，需要将该端口**开放权限**）

我们再来访问下

http://127.0.0.1:9001/sendMessage

请求返回"OK"，控制台输出 ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6c6bb54660347608d1b56504d23d308~tplv-k3u1fbpfcp-zoom-1.image)

客户端相关页面截图如下： 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/72cdb0160266468ab764aee648d2cb76~tplv-k3u1fbpfcp-zoom-1.image) ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/563f1c09f9cc44a8a3a4b2fb97869457~tplv-k3u1fbpfcp-zoom-1.image) ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3f88cd56c4cd491a864c6f3bbc8efd12~tplv-k3u1fbpfcp-zoom-1.image) ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/35161e20e50b464e84e0dc54566fbe9e~tplv-k3u1fbpfcp-zoom-1.image) ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5b7d5fab73fb4f4584c9b40c7b251661~tplv-k3u1fbpfcp-zoom-1.image)

5.  消息消费

```java
@Component
@RabbitListener(queues = "directQueue")//监听队列名称
public class MQReciever {

    @RabbitHandler
    public void process(String message){
        System.out.println("接收到的消息是："+ message);
    }
}
```

启动项目，发现消息已经被消费。 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b977f77838f449f9a62c8e0f184a2c9e~tplv-k3u1fbpfcp-zoom-1.image)

> 为了防止消息丢失，`RabbitMQ`增加了消息确认机制：生产者消息确认机制和消费者消息确认机制。

## 确认机制

### 生产者消息确认机制

1.  在`yml`中增加配置信息

```yml
spring:
  rabbitmq:
    #确认消息已发送到交换机(Exchange)
    publisher-confirm-type: correlated
    #确认消息已发送到队列(Queue)
    publisher-returns: true
```

> spring.rabbitmq.publisher-confirm 新版本已被弃用，现在使用 spring.rabbitmq.publisher-confirm-type = correlated 实现相同效果

2.  增加回调

```java
@Bean
public RabbitTemplate createRabbitTemplate(ConnectionFactory connectionFactory){
 RabbitTemplate rabbitTemplate = new RabbitTemplate();
 rabbitTemplate.setConnectionFactory(connectionFactory);
 //设置开启 Mandatory,才能触发回调函数,无论消息推送结果怎么样都强制调用回调函数
 rabbitTemplate.setMandatory(true);

 rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {
  @Override
  public void confirm(CorrelationData correlationData, boolean ack, String cause) {
   System.out.println("ConfirmCallback:     "+"相关数据："+correlationData);
   System.out.println("ConfirmCallback:     "+"确认情况："+ack);
   System.out.println("ConfirmCallback:     "+"原因："+cause);
  }
 });

 rabbitTemplate.setReturnsCallback(new RabbitTemplate.ReturnsCallback(){
  @Override
  public void returnedMessage(ReturnedMessage returned) {
   System.out.println("ReturnCallback:     "+"消息："+returned.getMessage());
   System.out.println("ReturnCallback:     "+"回应码："+returned.getReplyCode());
   System.out.println("ReturnCallback:     "+"回应信息："+returned.getReplyText());
   System.out.println("ReturnCallback:     "+"交换机："+returned.getExchange());
   System.out.println("ReturnCallback:     "+"路由键："+returned.getRoutingKey());
  }
 });
 return rabbitTemplate;
}
```

-   `confirm`机制是只保证消息到达`exchange`，并不保证消息可以路由到正确的`queue`
-   当前的`exchange`不存在或者指定的路由`key`路由不到才会触发`return`机制

大家可以自行演示以下情况的执行结果：

-   不存在交换机和队列
-   存在交换机，不存在队列
-   消息推送成功

### 消费者消息的确认机制

默认情况下如果一个消息被消费者正确接收则会从队列中移除。如果一个队列没被任何消费者订阅，那么这个队列中的消息会被缓存，当有消费者订阅时则会立即发送，进而从队列中移除。

消费者消息的确认机制可以分为以下3种：

1.  自动确认

`AcknowledgeMode.NONE` 默认为自动确认，不管消费者是否成功处理了消息，消息都会从队列中被移除。

2.  根据情况确认

`AcknowledgeMode.AUTO` 根据方法的执行情况来决定是否确认还是拒绝（是否重新入队列）

-   如果消息成功被消费（成功的意思是在消费的过程中没有抛出异常），则自动确认
-   当抛出`AmqpRejectAndDontRequeueException` 异常的时候，则消息会被拒绝，且消息不会重回队列
-   当抛出 `ImmediateAcknowledgeAmqpException` 异常，则消费者会被确认
-   其他的异常，则消息会被拒绝，并且该消息会重回队列，如果此时只有一个消费者监听该队列，则有发生死循环的风险，多消费端也会造成资源的极大浪费，这个在开发过程中一定要避免的。可以通过 `setDefaultRequeueRejected`（默认是`true`）去设置

可能造成消息丢失，一般是需要我们在`try-catch`捕捉异常后，**打印日志**用于追踪数据，这样找出对应数据再做后续处理。

3.  手动确认

`AcknowledgeMode.MANUAL`对于手动确认，也是我们工作中最常用到的，它的用法如下：

```java
/*
 * 肯定确认
 * deliveryTag：消息队列数据的唯一id
 * multiple：是否批量 
 * true ：一次性确认所有小于等于deliveryTag的消息
 * false：对当前消息进行确认；
 */
channel.basicAck(long deliveryTag, boolean multiple); 
```

```java
/*
 * 否定确认
 * multiple：是否批量 
 *   true：一次性拒绝所有小于deliveryTag的消息
 *   false：对当前消息进行确认；
 * requeue：被拒绝的是否重新入列，
 *   true：就是将数据重新丢回队列里，那么下次还会消费这消息；
 *   false：就是拒绝处理该消息，服务器把该消息丢掉即可。 
 */
channel.basicNack(long deliveryTag, boolean multiple, boolean requeue);
```

```java
/*
 * 用于否定确认，但与basicNack相比有一个限制,一次只能拒绝单条消息
 */
channel.basicReject(long deliveryTag, boolean requeue);  
```

### 手动确认

在yml配置中开启手动确认模式

```yml
spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: manual
```

或者在代码中开启

```java
@Configuration
public class MessageListenerConfig {

    @Autowired
    private CachingConnectionFactory connectionFactory;

    @Autowired
    private MQReciever mqReciever;//消息接收处理类

    @Bean
    public SimpleMessageListenerContainer simpleMessageListenerContainer(){
        SimpleMessageListenerContainer container = new SimpleMessageListenerContainer(connectionFactory);
        //并发使用者的数量
        container.setConcurrentConsumers(1);
        //消费者人数上限
        container.setMaxConcurrentConsumers(1);
        container.setAcknowledgeMode(AcknowledgeMode.MANUAL); // RabbitMQ默认是自动确认，这里改为手动确认消息
        //设置一个队列，此处支持设置多个
        container.setQueueNames("directQueue");
        container.setMessageListener(mqReciever);
        return container;
    }
}
```

消息消费类

```java
@Component
@RabbitListener(queues = "directQueue")//监听队列名称
public class MQReciever implements ChannelAwareMessageListener {

    @Override
    public void onMessage(Message message, Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try {
            String msg = message.toString();
            String[] msgArray = msg.split("'");//可以点进Message里面看源码,单引号直接的数据就是我们的map消息数据
            System.out.println("消费的消息内容:"+msgArray[1]);
            System.out.println("消费的主题消息来自："+message.getMessageProperties().getConsumerQueue());
            
            //业务处理
            ......
            
            channel.basicAck(deliveryTag, true);
            
        } catch (Exception e) {
            //拒绝重新入队列
            channel.basicReject(deliveryTag, false);   
            e.printStackTrace();
        }
    }
}
```

> 无ack：效率高，存在丢失大量消息的风险；有ack：效率低，不会丢消息。
