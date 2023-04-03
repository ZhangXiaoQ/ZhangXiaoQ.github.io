import{_ as n,W as s,X as a,a2 as t}from"./framework-a9f5de78.js";const p={},e=t(`<p>服务器上的 Redis 已经安装完成了（安装步骤见上篇文章），今天就让我们使用 Redis 来做个小功能：自定义拦截器限制访问次数，也就是限流。</p><h3 id="在项目中引入-redis" tabindex="-1"><a class="header-anchor" href="#在项目中引入-redis" aria-hidden="true">#</a> 在项目中引入 Redis</h3><p>1、引入依赖</p><div class="language-xml line-numbers-mode" data-ext="xml"><pre class="language-xml"><code><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dependency</span><span class="token punctuation">&gt;</span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>groupId</span><span class="token punctuation">&gt;</span></span>org.springframework.boot<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>groupId</span><span class="token punctuation">&gt;</span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>artifactId</span><span class="token punctuation">&gt;</span></span>spring-boot-starter-data-redis<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>artifactId</span><span class="token punctuation">&gt;</span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dependency</span><span class="token punctuation">&gt;</span></span>

<span class="token comment">&lt;!-- redis依赖commons-pool 这个依赖一定要添加 --&gt;</span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dependency</span><span class="token punctuation">&gt;</span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>groupId</span><span class="token punctuation">&gt;</span></span>org.apache.commons<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>groupId</span><span class="token punctuation">&gt;</span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>artifactId</span><span class="token punctuation">&gt;</span></span>commons-pool2<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>artifactId</span><span class="token punctuation">&gt;</span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dependency</span><span class="token punctuation">&gt;</span></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>2、application.yml 配置</p><div class="language-xml line-numbers-mode" data-ext="xml"><pre class="language-xml"><code>server:
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>3、创建 redisConfig，引入 redisTemplate</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Configuration</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">RedisConfig</span> <span class="token punctuation">{</span>
   <span class="token annotation punctuation">@Bean</span>
   <span class="token keyword">public</span> <span class="token class-name">RedisTemplate</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span> <span class="token function">redisTemplate</span><span class="token punctuation">(</span><span class="token class-name">LettuceConnectionFactory</span> redisConnectionFactory<span class="token punctuation">)</span> <span class="token punctuation">{</span>
       <span class="token class-name">RedisTemplate</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span> redisTemplate <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RedisTemplate</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       redisTemplate<span class="token punctuation">.</span><span class="token function">setKeySerializer</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">StringRedisSerializer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       redisTemplate<span class="token punctuation">.</span><span class="token function">setValueSerializer</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">GenericJackson2JsonRedisSerializer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       redisTemplate<span class="token punctuation">.</span><span class="token function">setHashKeySerializer</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">StringRedisSerializer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       redisTemplate<span class="token punctuation">.</span><span class="token function">setHashValueSerializer</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">GenericJackson2JsonRedisSerializer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       redisTemplate<span class="token punctuation">.</span><span class="token function">setConnectionFactory</span><span class="token punctuation">(</span>redisConnectionFactory<span class="token punctuation">)</span><span class="token punctuation">;</span>
       <span class="token keyword">return</span> redisTemplate<span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="书写自定义注解和拦截器" tabindex="-1"><a class="header-anchor" href="#书写自定义注解和拦截器" aria-hidden="true">#</a> 书写自定义注解和拦截器</h3><p>1、自定义注解</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Retention</span><span class="token punctuation">(</span><span class="token class-name">RetentionPolicy</span><span class="token punctuation">.</span><span class="token constant">RUNTIME</span><span class="token punctuation">)</span>
<span class="token annotation punctuation">@Target</span><span class="token punctuation">(</span><span class="token class-name">ElementType</span><span class="token punctuation">.</span><span class="token constant">METHOD</span><span class="token punctuation">)</span>
<span class="token annotation punctuation">@Documented</span>
<span class="token keyword">public</span> <span class="token annotation punctuation">@interface</span> <span class="token class-name">AccessLimit</span> <span class="token punctuation">{</span>
   <span class="token keyword">int</span> <span class="token function">seconds</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">//秒数</span>
   <span class="token keyword">int</span> <span class="token function">maxCount</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">//最大访问次数</span>
   <span class="token keyword">boolean</span> <span class="token function">needLogin</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token keyword">default</span> <span class="token boolean">true</span><span class="token punctuation">;</span><span class="token comment">//是否需要登录</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>2、创建拦截器</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">FangshuaInterceptor</span> <span class="token keyword">extends</span> <span class="token class-name">HandlerInterceptorAdapter</span> <span class="token punctuation">{</span>

   <span class="token annotation punctuation">@Autowired</span>
   <span class="token keyword">private</span> <span class="token class-name">RedisTemplate</span> redisTemplate<span class="token punctuation">;</span>

   <span class="token annotation punctuation">@Override</span>
   <span class="token keyword">public</span> <span class="token keyword">boolean</span> <span class="token function">preHandle</span><span class="token punctuation">(</span><span class="token class-name">HttpServletRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">HttpServletResponse</span> response<span class="token punctuation">,</span> <span class="token class-name">Object</span> handler<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
       <span class="token comment">//判断请求是否属于方法的请求</span>
       <span class="token keyword">if</span><span class="token punctuation">(</span>handler <span class="token keyword">instanceof</span> <span class="token class-name">HandlerMethod</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
           <span class="token class-name">HandlerMethod</span> hm <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">HandlerMethod</span><span class="token punctuation">)</span> handler<span class="token punctuation">;</span>
           <span class="token comment">//获取方法中的注解,看是否有该注解</span>
           <span class="token class-name">AccessLimit</span> accessLimit <span class="token operator">=</span> hm<span class="token punctuation">.</span><span class="token function">getMethodAnnotation</span><span class="token punctuation">(</span><span class="token class-name">AccessLimit</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
           <span class="token keyword">if</span><span class="token punctuation">(</span>accessLimit <span class="token operator">==</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
               <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span>
           <span class="token keyword">int</span> seconds <span class="token operator">=</span> accessLimit<span class="token punctuation">.</span><span class="token function">seconds</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
           <span class="token keyword">int</span> maxCount <span class="token operator">=</span> accessLimit<span class="token punctuation">.</span><span class="token function">maxCount</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
           <span class="token keyword">boolean</span> login <span class="token operator">=</span> accessLimit<span class="token punctuation">.</span><span class="token function">needLogin</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
           <span class="token class-name">String</span> key <span class="token operator">=</span> request<span class="token punctuation">.</span><span class="token function">getRequestURI</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
           <span class="token comment">//如果需要登录</span>
           <span class="token keyword">if</span><span class="token punctuation">(</span>login<span class="token punctuation">)</span><span class="token punctuation">{</span>
               <span class="token comment">//获取登录的session进行判断，此处只是例子，不写具体的业务</span>
               <span class="token comment">//.....</span>
               key<span class="token operator">+=</span><span class="token string">&quot;&quot;</span><span class="token operator">+</span><span class="token string">&quot;1&quot;</span><span class="token punctuation">;</span>  <span class="token comment">//这里假设用户是1,项目中是动态获取的userId</span>
          <span class="token punctuation">}</span>

           <span class="token comment">//从redis中获取用户访问的次数</span>
           <span class="token class-name">Integer</span> count<span class="token punctuation">;</span>
           <span class="token keyword">if</span><span class="token punctuation">(</span><span class="token class-name">Objects</span><span class="token punctuation">.</span><span class="token function">isNull</span><span class="token punctuation">(</span>redisTemplate<span class="token punctuation">.</span><span class="token function">opsForValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
               count <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token keyword">else</span><span class="token punctuation">{</span>
               count <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">Integer</span><span class="token punctuation">)</span> redisTemplate<span class="token punctuation">.</span><span class="token function">opsForValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span>
           <span class="token keyword">if</span><span class="token punctuation">(</span>count <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
               redisTemplate<span class="token punctuation">.</span><span class="token function">opsForValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">set</span><span class="token punctuation">(</span>key<span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">,</span>seconds<span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">SECONDS</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token keyword">else</span> <span class="token keyword">if</span><span class="token punctuation">(</span>count<span class="token operator">&lt;</span>maxCount<span class="token punctuation">)</span><span class="token punctuation">{</span>
               <span class="token comment">//key的值加1</span>
               redisTemplate<span class="token punctuation">.</span><span class="token function">opsForValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">increment</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token keyword">else</span><span class="token punctuation">{</span>
               <span class="token comment">//超出访问次数</span>
               <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span><span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span> errMap<span class="token operator">=</span><span class="token keyword">new</span> <span class="token class-name">HashMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
               errMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;code&quot;</span><span class="token punctuation">,</span><span class="token number">400</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
               errMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span><span class="token string">&quot;请求超时，请稍后再试&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
               <span class="token function">render</span><span class="token punctuation">(</span>response<span class="token punctuation">,</span>errMap<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">//这里的CodeMsg是一个返回参数</span>
               <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span>
      <span class="token punctuation">}</span>
       <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>


   <span class="token keyword">private</span> <span class="token keyword">void</span> <span class="token function">render</span><span class="token punctuation">(</span><span class="token class-name">HttpServletResponse</span> response<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span><span class="token class-name">Object</span><span class="token punctuation">&gt;</span></span> errMap<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
       response<span class="token punctuation">.</span><span class="token function">setContentType</span><span class="token punctuation">(</span><span class="token string">&quot;application/json;charset=UTF-8&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       <span class="token class-name">OutputStream</span> out <span class="token operator">=</span> response<span class="token punctuation">.</span><span class="token function">getOutputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       <span class="token class-name">String</span> str <span class="token operator">=</span> <span class="token constant">JSON</span><span class="token punctuation">.</span><span class="token function">toJSONString</span><span class="token punctuation">(</span>errMap<span class="token punctuation">)</span><span class="token punctuation">;</span>
       out<span class="token punctuation">.</span><span class="token function">write</span><span class="token punctuation">(</span>str<span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token string">&quot;UTF-8&quot;</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       out<span class="token punctuation">.</span><span class="token function">flush</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       out<span class="token punctuation">.</span><span class="token function">close</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>3、将自定义拦截器加入到拦截器列表中</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Configuration</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">WebConfig</span> <span class="token keyword">extends</span> <span class="token class-name">WebMvcConfigurerAdapter</span> <span class="token punctuation">{</span>

   <span class="token annotation punctuation">@Autowired</span>
   <span class="token keyword">private</span> <span class="token class-name">FangshuaInterceptor</span> interceptor<span class="token punctuation">;</span>

   <span class="token annotation punctuation">@Override</span>
   <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">addInterceptors</span><span class="token punctuation">(</span><span class="token class-name">InterceptorRegistry</span> registry<span class="token punctuation">)</span> <span class="token punctuation">{</span>
       registry<span class="token punctuation">.</span><span class="token function">addInterceptor</span><span class="token punctuation">(</span>interceptor<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="测试" tabindex="-1"><a class="header-anchor" href="#测试" aria-hidden="true">#</a> 测试</h3><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@RestController</span>
<span class="token annotation punctuation">@RequestMapping</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">TestController</span> <span class="token punctuation">{</span>

   <span class="token comment">//每三十秒最多可以请求三次，不需要登录</span>
   <span class="token annotation punctuation">@AccessLimit</span><span class="token punctuation">(</span>seconds<span class="token operator">=</span><span class="token number">30</span><span class="token punctuation">,</span> maxCount<span class="token operator">=</span><span class="token number">3</span><span class="token punctuation">,</span> needLogin<span class="token operator">=</span><span class="token boolean">false</span><span class="token punctuation">)</span>
   <span class="token annotation punctuation">@PostMapping</span><span class="token punctuation">(</span><span class="token string">&quot;/fangshua&quot;</span><span class="token punctuation">)</span>
   <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">fangshua</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
       <span class="token keyword">return</span> <span class="token string">&quot;成功&quot;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,17),c=[e];function o(l,i){return s(),a("div",null,c)}const k=n(p,[["render",o],["__file","基于 Redis 实现限流功能.html.vue"]]);export{k as default};
