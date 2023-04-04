import{_ as n,W as s,X as a,a2 as t}from"./framework-a9f5de78.js";const e={},p=t(`<p>前几天给大家讲解了一下shiro，后台一些小伙伴跑来给我留言说：“一般不都是 shiro 结合 jwt 做身份和权限验证吗？能不能再讲解一下 jwt 的用法呢？“今天阿Q就给大家讲一下 shiro 整合 jwt 做权限校验吧。</p><p>首先呢我还是要说一下 jwt 的概念：JWT 全称 Json web token , 是为了在网络应用环境间传递声明而执行的一种基于JSON 的开放标准。该 token 被设计为紧凑且安全的，特别适用于分布式站点的单点登录（SSO）场景。</p><p>JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可以增加一些额外的其它业务逻辑所必须的声明信息，该 token 也可直接被用于认证，也可被加密。</p><p>通俗点说呢，就是之前的 session 为了区分是哪个用户发来的请求，需要在服务端存储用户信息，需要消耗服务器资源。并且随着用户量的增大，势必会扩展服务器，采用分布式系统，这样的话 session 就可能就不太合适了，而我们今天说的 jwt 呢就很好地解决了单点登录问题，很容易的解决 session 共享的问题。</p><p>话不多说，直接上整合教程（本期是在上期 shiro 的基础上进行的改造）：</p><h2 id="引入依赖" tabindex="-1"><a class="header-anchor" href="#引入依赖" aria-hidden="true">#</a> 引入依赖</h2><p>在pom文件中引入jwt的依赖包</p><div class="language-xml line-numbers-mode" data-ext="xml"><pre class="language-xml"><code><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>dependency</span><span class="token punctuation">&gt;</span></span>
	<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>groupId</span><span class="token punctuation">&gt;</span></span>com.auth0<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>groupId</span><span class="token punctuation">&gt;</span></span>
	<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>artifactId</span><span class="token punctuation">&gt;</span></span>java-jwt<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>artifactId</span><span class="token punctuation">&gt;</span></span>
	<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>version</span><span class="token punctuation">&gt;</span></span>3.7.0<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>version</span><span class="token punctuation">&gt;</span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>dependency</span><span class="token punctuation">&gt;</span></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="工具类" tabindex="-1"><a class="header-anchor" href="#工具类" aria-hidden="true">#</a> 工具类</h2><p>写一个工具类用于生成签名和验证签名</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">JwtUtil</span> <span class="token punctuation">{</span>

    <span class="token comment">//JWT-account</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">String</span> <span class="token constant">ACCOUNT</span> <span class="token operator">=</span> <span class="token string">&quot;username&quot;</span><span class="token punctuation">;</span>
    <span class="token comment">//JWT-currentTimeMillis</span>
    <span class="token keyword">public</span> <span class="token keyword">final</span> <span class="token keyword">static</span> <span class="token class-name">String</span> <span class="token constant">CURRENT_TIME_MILLIS</span> <span class="token operator">=</span> <span class="token string">&quot;currentTimeMillis&quot;</span><span class="token punctuation">;</span>
    <span class="token comment">//有效期时间2小时</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token keyword">long</span> <span class="token constant">EXPIRE_TIME</span> <span class="token operator">=</span> <span class="token number">2</span> <span class="token operator">*</span> <span class="token number">60</span> <span class="token operator">*</span> <span class="token number">60</span> <span class="token operator">*</span> <span class="token number">1000L</span><span class="token punctuation">;</span>
    <span class="token comment">//秘钥</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">String</span> <span class="token constant">SECRET_KEY</span> <span class="token operator">=</span> <span class="token string">&quot;shirokey&quot;</span><span class="token punctuation">;</span>


    <span class="token doc-comment comment">/**
     * 生成签名返回token
     *
     * <span class="token keyword">@param</span> <span class="token parameter">account</span>
     * <span class="token keyword">@param</span> <span class="token parameter">currentTimeMillis</span>
     * <span class="token keyword">@return</span>
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">String</span> <span class="token function">sign</span><span class="token punctuation">(</span><span class="token class-name">String</span> account<span class="token punctuation">,</span> <span class="token class-name">String</span> currentTimeMillis<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 帐号加JWT私钥加密</span>
        <span class="token class-name">String</span> secret <span class="token operator">=</span> account <span class="token operator">+</span> <span class="token constant">SECRET_KEY</span><span class="token punctuation">;</span>
        <span class="token comment">// 此处过期时间，单位：毫秒，在当前时间到后边的20分钟内都是有效的</span>
        <span class="token class-name">Date</span> date <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token class-name">System</span><span class="token punctuation">.</span><span class="token function">currentTimeMillis</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">+</span> <span class="token constant">EXPIRE_TIME</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//采用HMAC256加密</span>
        <span class="token class-name">Algorithm</span> algorithm <span class="token operator">=</span> <span class="token class-name">Algorithm</span><span class="token punctuation">.</span><span class="token function">HMAC256</span><span class="token punctuation">(</span>secret<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">return</span> <span class="token constant">JWT</span><span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">withClaim</span><span class="token punctuation">(</span><span class="token constant">ACCOUNT</span><span class="token punctuation">,</span> account<span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">withClaim</span><span class="token punctuation">(</span><span class="token constant">CURRENT_TIME_MILLIS</span><span class="token punctuation">,</span> currentTimeMillis<span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">withExpiresAt</span><span class="token punctuation">(</span>date<span class="token punctuation">)</span>
                <span class="token comment">//创建一个新的JWT，并使用给定的算法进行标记</span>
                <span class="token punctuation">.</span><span class="token function">sign</span><span class="token punctuation">(</span>algorithm<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 校验token是否正确
     *
     * <span class="token keyword">@param</span> <span class="token parameter">token</span>
     * <span class="token keyword">@return</span>
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">boolean</span> <span class="token function">verify</span><span class="token punctuation">(</span><span class="token class-name">String</span> token<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">String</span> secret <span class="token operator">=</span> <span class="token function">getClaim</span><span class="token punctuation">(</span>token<span class="token punctuation">,</span> <span class="token constant">ACCOUNT</span><span class="token punctuation">)</span> <span class="token operator">+</span> <span class="token constant">SECRET_KEY</span><span class="token punctuation">;</span>
        <span class="token class-name">Algorithm</span> algorithm <span class="token operator">=</span> <span class="token class-name">Algorithm</span><span class="token punctuation">.</span><span class="token function">HMAC256</span><span class="token punctuation">(</span>secret<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">JWTVerifier</span> verifier <span class="token operator">=</span> <span class="token constant">JWT</span><span class="token punctuation">.</span><span class="token function">require</span><span class="token punctuation">(</span>algorithm<span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        verifier<span class="token punctuation">.</span><span class="token function">verify</span><span class="token punctuation">(</span>token<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 获得Token中的信息无需secret解密也能获得
     *
     * <span class="token keyword">@param</span> <span class="token parameter">token</span>
     * <span class="token keyword">@param</span> <span class="token parameter">claim</span>
     * <span class="token keyword">@return</span>
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">String</span> <span class="token function">getClaim</span><span class="token punctuation">(</span><span class="token class-name">String</span> token<span class="token punctuation">,</span> <span class="token class-name">String</span> claim<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token class-name">DecodedJWT</span> jwt <span class="token operator">=</span> <span class="token constant">JWT</span><span class="token punctuation">.</span><span class="token function">decode</span><span class="token punctuation">(</span>token<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">return</span> jwt<span class="token punctuation">.</span><span class="token function">getClaim</span><span class="token punctuation">(</span>claim<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">asString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">JWTDecodeException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="封装-token" tabindex="-1"><a class="header-anchor" href="#封装-token" aria-hidden="true">#</a> 封装 token</h2><p>封装自己的 token，用于后边校验 token 类型</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">JwtToken</span> <span class="token keyword">implements</span> <span class="token class-name">AuthenticationToken</span> <span class="token punctuation">{</span>

    <span class="token keyword">private</span> <span class="token keyword">final</span> <span class="token class-name">String</span> token<span class="token punctuation">;</span>

    <span class="token keyword">public</span> <span class="token class-name">JwtToken</span><span class="token punctuation">(</span><span class="token class-name">String</span> token<span class="token punctuation">)</span><span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>token <span class="token operator">=</span> token<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token class-name">Object</span> <span class="token function">getPrincipal</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> token<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token class-name">Object</span> <span class="token function">getCredentials</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> token<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="创建-token" tabindex="-1"><a class="header-anchor" href="#创建-token" aria-hidden="true">#</a> 创建 token</h2><p>我们需要在登陆时创建 token</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token comment">//service中的登录处理</span>
<span class="token annotation punctuation">@Override</span>
<span class="token keyword">public</span> <span class="token class-name">UserTokenDTO</span> <span class="token function">login</span><span class="token punctuation">(</span><span class="token class-name">UserTokenDTO</span> userInfo<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// 从数据库获取对应用户名密码的用户</span>
    <span class="token class-name">SysUserInfo</span> uInfo <span class="token operator">=</span> userInfoMapper<span class="token punctuation">.</span><span class="token function">getUserByLogin</span><span class="token punctuation">(</span>userInfo<span class="token punctuation">.</span><span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">null</span> <span class="token operator">==</span> uInfo<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">//用户信息不存在</span>
        <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">BusinessException</span><span class="token punctuation">(</span><span class="token class-name">CommonResultStatus</span><span class="token punctuation">.</span><span class="token constant">USERNAME_ERROR</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>userInfo<span class="token punctuation">.</span><span class="token function">getPassword</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">equals</span><span class="token punctuation">(</span>uInfo<span class="token punctuation">.</span><span class="token function">getPassword</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">//密码错误</span>
        <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">BusinessException</span><span class="token punctuation">(</span><span class="token class-name">CommonResultStatus</span><span class="token punctuation">.</span><span class="token constant">PASSWORD_ERROR</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token comment">//生成jwtToken</span>
    userInfo<span class="token punctuation">.</span><span class="token function">setToken</span><span class="token punctuation">(</span><span class="token class-name">JwtUtil</span><span class="token punctuation">.</span><span class="token function">sign</span><span class="token punctuation">(</span>userInfo<span class="token punctuation">.</span><span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token class-name">String</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span><span class="token class-name">System</span><span class="token punctuation">.</span><span class="token function">currentTimeMillis</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> userInfo<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="自定义过滤器" tabindex="-1"><a class="header-anchor" href="#自定义过滤器" aria-hidden="true">#</a> 自定义过滤器</h2><p>在其他需要登录后才能访问的请求中解析 token，所以我们要自定义过滤器。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">JwtFilter</span> <span class="token keyword">extends</span> <span class="token class-name">AccessControlFilter</span> <span class="token punctuation">{</span>

    <span class="token comment">//设置请求头中需要传递的字段名</span>
    <span class="token keyword">protected</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">String</span> <span class="token constant">AUTHORIZATION_HEADER</span> <span class="token operator">=</span> <span class="token string">&quot;Access-Token&quot;</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     *  表示是否允许访问，mappedValue就是[urls]配置中拦截器参数部分，
     *  如果允许访问返回true，否则false
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/24
     * <span class="token keyword">@param</span> <span class="token parameter">request</span>:
      * <span class="token keyword">@param</span> <span class="token parameter">response</span>:
      * <span class="token keyword">@param</span> <span class="token parameter">mappedValue</span>:
     * <span class="token keyword">@return</span>: boolean
     */</span>
    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">protected</span> <span class="token keyword">boolean</span> <span class="token function">isAccessAllowed</span><span class="token punctuation">(</span><span class="token class-name">ServletRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">ServletResponse</span> response<span class="token punctuation">,</span> <span class="token class-name">Object</span> mappedValue<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  表示当访问拒绝时是否已经处理了，
     *  如果返回true表示需要继续处理，
     *  如果返回false表示该拦截器实例已经处理了，将直接返回即可
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/24
     * <span class="token keyword">@param</span> <span class="token parameter">request</span>:
      * <span class="token keyword">@param</span> <span class="token parameter">response</span>:
     * <span class="token keyword">@return</span>: boolean
     */</span>
    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">protected</span> <span class="token keyword">boolean</span> <span class="token function">onAccessDenied</span><span class="token punctuation">(</span><span class="token class-name">ServletRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">ServletResponse</span> response<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token class-name">HttpServletRequest</span> req <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">HttpServletRequest</span><span class="token punctuation">)</span> request<span class="token punctuation">;</span>
        <span class="token comment">// 解决跨域问题</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span><span class="token class-name">HttpMethod</span><span class="token punctuation">.</span><span class="token constant">OPTIONS</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">matches</span><span class="token punctuation">(</span>req<span class="token punctuation">.</span><span class="token function">getMethod</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">isLoginAttempt</span><span class="token punctuation">(</span>request<span class="token punctuation">,</span> response<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token comment">//生成jwt token</span>
            <span class="token class-name">JwtToken</span> token <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">JwtToken</span><span class="token punctuation">(</span>req<span class="token punctuation">.</span><span class="token function">getHeader</span><span class="token punctuation">(</span><span class="token constant">AUTHORIZATION_HEADER</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token comment">//委托给Realm进行验证</span>
            <span class="token keyword">try</span> <span class="token punctuation">{</span>
                <span class="token comment">//调用登陆会走Realm中的身份验证方法</span>
                <span class="token function">getSubject</span><span class="token punctuation">(</span>request<span class="token punctuation">,</span> response<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">login</span><span class="token punctuation">(</span>token<span class="token punctuation">)</span><span class="token punctuation">;</span>
                <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span><span class="token keyword">else</span><span class="token punctuation">{</span>
            <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">BusinessException</span><span class="token punctuation">(</span><span class="token class-name">CommonResultStatus</span><span class="token punctuation">.</span><span class="token constant">LOGIN_ERROR</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        
        <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>



    <span class="token doc-comment comment">/**
     *  判断是否有头部参数
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/24
     * <span class="token keyword">@param</span> <span class="token parameter">request</span>:
      * <span class="token keyword">@param</span> <span class="token parameter">response</span>:
     * <span class="token keyword">@return</span>: boolean
     */</span>
    <span class="token keyword">protected</span> <span class="token keyword">boolean</span> <span class="token function">isLoginAttempt</span><span class="token punctuation">(</span><span class="token class-name">ServletRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">ServletResponse</span> response<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">HttpServletRequest</span> req <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">HttpServletRequest</span><span class="token punctuation">)</span> request<span class="token punctuation">;</span>
        <span class="token class-name">String</span> authorization <span class="token operator">=</span> req<span class="token punctuation">.</span><span class="token function">getHeader</span><span class="token punctuation">(</span><span class="token constant">AUTHORIZATION_HEADER</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> authorization <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当滤器中调用 subject.login(token) 方法时，会走自定义 Realm 中的 doGetAuthenticationInfo(AuthenticationToken token) 方法来验证身份</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Slf4j</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">JwtRealm</span> <span class="token keyword">extends</span> <span class="token class-name">AuthorizingRealm</span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@Autowired</span>
    <span class="token keyword">private</span> <span class="token class-name">UserInfoService</span> userService<span class="token punctuation">;</span>

    <span class="token comment">//验证是不是自己的token类型</span>
    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token keyword">boolean</span> <span class="token function">supports</span><span class="token punctuation">(</span><span class="token class-name">AuthenticationToken</span> token<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> token <span class="token keyword">instanceof</span> <span class="token class-name">JwtToken</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  身份验证
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/25
     * <span class="token keyword">@param</span> <span class="token parameter">token</span>:
     * <span class="token keyword">@return</span>: org.apache.shiro.authc.AuthenticationInfo
     */</span>
    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">protected</span> <span class="token class-name">AuthenticationInfo</span> <span class="token function">doGetAuthenticationInfo</span><span class="token punctuation">(</span><span class="token class-name">AuthenticationToken</span> token<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">AuthenticationException</span> <span class="token punctuation">{</span>
        <span class="token class-name">String</span> credentials <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">)</span> token<span class="token punctuation">.</span><span class="token function">getCredentials</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">String</span> username <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token comment">//jwt验证token</span>
            <span class="token keyword">boolean</span> verify <span class="token operator">=</span> <span class="token class-name">JwtUtil</span><span class="token punctuation">.</span><span class="token function">verify</span><span class="token punctuation">(</span>credentials<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>verify<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">AuthenticationException</span><span class="token punctuation">(</span><span class="token string">&quot;Token校验不正确&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
            username <span class="token operator">=</span> <span class="token class-name">JwtUtil</span><span class="token punctuation">.</span><span class="token function">getClaim</span><span class="token punctuation">(</span>credentials<span class="token punctuation">,</span> <span class="token class-name">JwtUtil</span><span class="token punctuation">.</span><span class="token constant">ACCOUNT</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">BusinessException</span><span class="token punctuation">(</span><span class="token class-name">CommonResultStatus</span><span class="token punctuation">.</span><span class="token constant">TOKEN_CHECK_ERROR</span><span class="token punctuation">,</span>e<span class="token punctuation">.</span><span class="token function">getMessage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token comment">//交给AuthenticatingRealm使用CredentialsMatcher进行密码匹配，不设置则使用默认的SimpleCredentialsMatcher</span>
        <span class="token class-name">SimpleAuthenticationInfo</span> authenticationInfo <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SimpleAuthenticationInfo</span><span class="token punctuation">(</span>
                username<span class="token punctuation">,</span> <span class="token comment">//用户名</span>
                credentials<span class="token punctuation">,</span> <span class="token comment">//凭证</span>
                <span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span>  <span class="token comment">//realm name</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> authenticationInfo<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  权限校验（次数不做过多讲解）
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/25
     * <span class="token keyword">@param</span> <span class="token parameter">principals</span>:
     * <span class="token keyword">@return</span>: org.apache.shiro.authz.AuthorizationInfo
     */</span>
    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">protected</span> <span class="token class-name">AuthorizationInfo</span> <span class="token function">doGetAuthorizationInfo</span><span class="token punctuation">(</span><span class="token class-name">PrincipalCollection</span> principals<span class="token punctuation">)</span> <span class="token punctuation">{</span>
<span class="token comment">//        String username = principals.toString();</span>
        <span class="token class-name">SimpleAuthorizationInfo</span> authorizationInfo <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SimpleAuthorizationInfo</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//角色权限暂时不加</span>
<span class="token comment">//        authorizationInfo.setRoles(userService.getRoles(username));</span>
<span class="token comment">//        authorizationInfo.setStringPermissions(userService.queryPermissions(username));</span>
        <span class="token keyword">return</span> authorizationInfo<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="securitymanager" tabindex="-1"><a class="header-anchor" href="#securitymanager" aria-hidden="true">#</a> SecurityManager</h2><p>接下来我们需要修改 ShiroConfig 文件，将自定义的 Filter 和 Realm 交由 SecurityManager 进行管理</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token doc-comment comment">/**
此类较长，只展示部分重要代码，其余代码可在公众号“阿Q说”中回复&quot;jwt&quot;获取源码
**/</span>
<span class="token annotation punctuation">@Configuration</span>
<span class="token annotation punctuation">@Slf4j</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ShiroConfig</span> <span class="token punctuation">{</span>

    <span class="token doc-comment comment">/**
     *  创建ShiroFilterFactoryBean
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/21
     * <span class="token keyword">@return</span>: org.apache.shiro.spring.web.ShiroFilterFactoryBean
     */</span>
    <span class="token annotation punctuation">@Bean</span>
    <span class="token keyword">public</span> <span class="token class-name">ShiroFilterFactoryBean</span> <span class="token function">shiroFilter</span><span class="token punctuation">(</span><span class="token class-name">SecurityManager</span> securityManager<span class="token punctuation">)</span><span class="token punctuation">{</span>
        <span class="token class-name">ShiroFilterFactoryBean</span> shiroFilterFactoryBean <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ShiroFilterFactoryBean</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 必须设置 SecurityManager</span>
        shiroFilterFactoryBean<span class="token punctuation">.</span><span class="token function">setSecurityManager</span><span class="token punctuation">(</span>securityManager<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//设置shiro内置过滤器</span>
        <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Filter</span><span class="token punctuation">&gt;</span></span> filters <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">LinkedHashMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//添加自定义过滤器：只对需要登陆的接口进行过滤</span>
        filters<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;authc&quot;</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">JwtFilter</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//添加自定义过滤器：对权限进行验证</span>
<span class="token comment">//        filters.put(&quot;roles&quot;, new CustomRolesOrAuthorizationFilter());</span>
        shiroFilterFactoryBean<span class="token punctuation">.</span><span class="token function">setFilters</span><span class="token punctuation">(</span>filters<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// setLoginUrl 如果不设置值，默认会自动寻找Web工程根目录下的&quot;/login.jsp&quot;页面 或 &quot;/login&quot; 映射</span>
        shiroFilterFactoryBean<span class="token punctuation">.</span><span class="token function">setLoginUrl</span><span class="token punctuation">(</span><span class="token string">&quot;/adminLogin/login&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 设置无权限时跳转的 url;</span>
        shiroFilterFactoryBean<span class="token punctuation">.</span><span class="token function">setUnauthorizedUrl</span><span class="token punctuation">(</span><span class="token string">&quot;/notAuth&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 设置拦截器</span>
        <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> filterChainDefinitionMap <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">LinkedHashMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//游客，开发权限</span>
        filterChainDefinitionMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;/guest/**&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;anon&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//用户，需要角色权限 “user”</span>
        filterChainDefinitionMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;/user/**&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;roles[user]&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">//        filterChainDefinitionMap.put(&quot;/productInfo/**&quot;, &quot;roles[user]&quot;);</span>
        <span class="token comment">//管理员，需要角色权限 “admin”</span>
        filterChainDefinitionMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;/admin/**&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;roles[admin]&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//开放登陆接口</span>
        filterChainDefinitionMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;/adminLogin/login&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;anon&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">//其余接口一律拦截</span>
        <span class="token comment">//主要这行代码必须放在所有权限设置的最后，不然会导致所有 url 都被拦截</span>
        filterChainDefinitionMap<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;/**&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;authc&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        shiroFilterFactoryBean<span class="token punctuation">.</span><span class="token function">setFilterChainDefinitionMap</span><span class="token punctuation">(</span>filterChainDefinitionMap<span class="token punctuation">)</span><span class="token punctuation">;</span>
        log<span class="token punctuation">.</span><span class="token function">info</span><span class="token punctuation">(</span><span class="token string">&quot;-------Shiro拦截器工厂类注入成功-----------&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> shiroFilterFactoryBean<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  注入安全管理器
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/21
     * <span class="token keyword">@return</span>: java.lang.SecurityManager
     */</span>
    <span class="token annotation punctuation">@Bean</span>
    <span class="token keyword">public</span> <span class="token class-name">DefaultWebSecurityManager</span> <span class="token function">securityManager</span><span class="token punctuation">(</span><span class="token class-name">JwtRealm</span> jwtRealm<span class="token punctuation">,</span> <span class="token class-name">SubjectFactory</span> subjectFactory<span class="token punctuation">,</span>
                                                     <span class="token class-name">SessionManager</span> sessionManager<span class="token punctuation">,</span>
                                                     <span class="token class-name">CacheManager</span> cacheManager<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">DefaultWebSecurityManager</span> securityManager <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">DefaultWebSecurityManager</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        securityManager<span class="token punctuation">.</span><span class="token function">setRealm</span><span class="token punctuation">(</span>jwtRealm<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">//关闭shiro自带的session</span>
        <span class="token class-name">DefaultSubjectDAO</span> subjectDAO <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">DefaultSubjectDAO</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">DefaultSessionStorageEvaluator</span> defaultSessionStorageEvaluator <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">DefaultSessionStorageEvaluator</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        defaultSessionStorageEvaluator<span class="token punctuation">.</span><span class="token function">setSessionStorageEnabled</span><span class="token punctuation">(</span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        subjectDAO<span class="token punctuation">.</span><span class="token function">setSessionStorageEvaluator</span><span class="token punctuation">(</span>defaultSessionStorageEvaluator<span class="token punctuation">)</span><span class="token punctuation">;</span>
        securityManager<span class="token punctuation">.</span><span class="token function">setSubjectDAO</span><span class="token punctuation">(</span>subjectDAO<span class="token punctuation">)</span><span class="token punctuation">;</span>
        securityManager<span class="token punctuation">.</span><span class="token function">setSubjectFactory</span><span class="token punctuation">(</span>subjectFactory<span class="token punctuation">)</span><span class="token punctuation">;</span>
        securityManager<span class="token punctuation">.</span><span class="token function">setSessionManager</span><span class="token punctuation">(</span>sessionManager<span class="token punctuation">)</span><span class="token punctuation">;</span>
        securityManager<span class="token punctuation">.</span><span class="token function">setCacheManager</span><span class="token punctuation">(</span>cacheManager<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> securityManager<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  jwt身份认证和权限校验
     * <span class="token keyword">@author</span> cheetah
     * <span class="token keyword">@date</span> 2020/11/24
     * <span class="token keyword">@return</span>: com.cheetah.shiroandjwt.jwt.JwtRealm
     */</span>
    <span class="token annotation punctuation">@Bean</span>
    <span class="token keyword">public</span> <span class="token class-name">JwtRealm</span> <span class="token function">jwtRealm</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">JwtRealm</span> jwtRealm <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">JwtRealm</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        jwtRealm<span class="token punctuation">.</span><span class="token function">setAuthenticationCachingEnabled</span><span class="token punctuation">(</span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        jwtRealm<span class="token punctuation">.</span><span class="token function">setAuthorizationCachingEnabled</span><span class="token punctuation">(</span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> jwtRealm<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>重点：将自定义的Realm交由 SecurityManage 管理，关闭 shiro 自带的 session</strong></p><p>接下来我们启动成程序验证一下：当我们未登录时，请求失败，需要先<strong>登录</strong></p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7501ba3fbfa04192a2559028d4ed8bdf~tplv-k3u1fbpfcp-zoom-1.image" alt="在这里插入图片描述" tabindex="0" loading="lazy"><figcaption>在这里插入图片描述</figcaption></figure><p><strong>登录成功获取token信息</strong><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f33228b5f5df4a05ad4d08a0b21ffbf0~tplv-k3u1fbpfcp-zoom-1.image" alt="在这里插入图片描述" loading="lazy"></p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5cba13ecdb1c457b90800076d134c237~tplv-k3u1fbpfcp-zoom-1.image" alt="在这里插入图片描述" tabindex="0" loading="lazy"><figcaption>在这里插入图片描述</figcaption></figure><p>当带着头部信息&quot;Access-Token&quot;访问时就可以获取信息了。</p>`,31),o=[p];function c(i,l){return s(),a("div",null,o)}const k=n(e,[["render",c],["__file","在 shiro 基础上整合 jwt.html.vue"]]);export{k as default};
