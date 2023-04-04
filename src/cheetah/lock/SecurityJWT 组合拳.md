---
title: Security & JWT 组合拳
icon: lock
order: 3
category:
  - 身份、权限认证
tag:
  - Security
  - JWT

---

之前我们已经说过用 [Shiro和JWT](https://mp.weixin.qq.com/s/hafjwxVK2uO7JPoUSK3OPQ) 来实现身份认证和用户授权，今天我们再来说一下 **Security和JWT** 的组合拳。

## 简介

先赘述一下身份认证和用户授权：

* 用户认证（`Authentication`）：系统通过校验用户提供的用户名和密码来验证该用户是否为系统中的合法主体，即是否可以访问该系统；
* 用户授权（`Authorization`）：系统为用户分配不同的角色，以获取对应的权限，即验证该用户是否有权限执行该操作；

`Web`应用的安全性包括用户认证和用户授权两个部分，而`Spring Security`（以下简称`Security`）基于`Spring`框架，正好可以完整解决该问题。

它的真正强大之处在于它可以轻松扩展以满足自定义要求。

## 原理

`Security`可以看做是由一组`filter`过滤器链组成的权限认证。它的整个工作流程如下所示：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6e0bf5325a264c3b8dd32adfd3ee4d75~tplv-k3u1fbpfcp-zoom-1.image)

图中绿色认证方式是可以配置的，橘黄色和蓝色的位置不可更改：

* `FilterSecurityInterceptor`：最后的过滤器，它会决定当前的请求可不可以访问`Controller`
* `ExceptionTranslationFilter`：异常过滤器，接收到异常消息时会引导用户进行认证；

## 实战

### 项目准备

我们使用`Spring Boot`框架来集成。

1.`pom`文件引入的依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>

<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>

<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.4.0</version>
</dependency>

<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>

<!-- 阿里JSON解析器 -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.74</version>
</dependency>

<dependency>
    <groupId>joda-time</groupId>
    <artifactId>joda-time</artifactId>
    <version>2.10.6</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
</dependency>
```

2.`application.yml`配置

```properties
spring:
  application:
    name: securityjwt
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://127.0.0.1:3306/cheetah?characterEncoding=utf-8&useSSL=false&serverTimezone=UTC
    username: root
    password: 123456

server:
  port: 8080

mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.itcheetah.securityjwt.entity
  configuration:
    map-underscore-to-camel-case: true

rsa:
  key:
    pubKeyFile: C:\Users\Desktop\jwt\id_key_rsa.pub
    priKeyFile: C:\Users\Desktop\jwt\id_key_rsa
```

3.`SQL`文件

```sql
/**
* sys_user_info
**/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for sys_user_info
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_info`;
CREATE TABLE `sys_user_info`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;


/**
* product_info
**/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for product_info
-- ----------------------------
DROP TABLE IF EXISTS `product_info`;
CREATE TABLE `product_info`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `price` decimal(10, 4) NULL DEFAULT NULL,
  `create_date` datetime(0) NULL DEFAULT NULL,
  `update_date` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
```

### 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!--Token生成与解析-->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.9.1</version>
</dependency>
```

引入之后启动项目，会有如图所示：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6aa7c322263e4f18bdca6c2f6b8042d1~tplv-k3u1fbpfcp-zoom-1.image)

其中用户名为`user`，密码为上图中的字符串。

### SecurityConfig 类

```java
//开启全局方法安全性
@EnableGlobalMethodSecurity(prePostEnabled=true, securedEnabled=true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    //认证失败处理类
    @Autowired
    private AuthenticationEntryPointImpl unauthorizedHandler;

    //提供公钥私钥的配置类
    @Autowired
    private RsaKeyProperties prop;

    @Autowired
    private UserInfoService userInfoService;
    
    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                // CSRF禁用，因为不使用session
                .csrf().disable()
                // 认证失败处理类
                .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
                // 基于token，所以不需要session
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
                // 过滤请求
                .authorizeRequests()
                .antMatchers(
                        HttpMethod.GET,
                        "/*.html",
                        "/**/*.html",
                        "/**/*.css",
                        "/**/*.js"
                ).permitAll()
                // 除上面外的所有请求全部需要鉴权认证
                .anyRequest().authenticated()
                .and()
                .headers().frameOptions().disable();
        // 添加JWT filter
        httpSecurity.addFilter(new TokenLoginFilter(super.authenticationManager(), prop))
                .addFilter(new TokenVerifyFilter(super.authenticationManager(), prop));
    }

    //指定认证对象的来源
    public void configure(AuthenticationManagerBuilder auth) throws Exception {
        
        auth.userDetailsService(userInfoService)
        //从前端传递过来的密码就会被加密，所以从数据库
        //查询到的密码必须是经过加密的，而这个过程都是
        //在用户注册的时候进行加密的。
        .passwordEncoder(passwordEncoder());
    }

    //密码加密
    @Bean
    public BCryptPasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
```

**拦截规则**

* `anyRequest`：匹配所有请求路径
* `access`：`SpringEl`表达式结果为`true`时可以访问
* `anonymous`：匿名可以访问
* \`denyAll：用户不能访问
* `fullyAuthenticated`：用户完全认证可以访问（非`remember-me`下自动登录）
* `hasAnyAuthority`：如果有参数，参数表示权限，则其中任何一个权限可以访问
* `hasAnyRole`：如果有参数，参数表示角色，则其中任何一个角色可以访问
* `hasAuthority`：如果有参数，参数表示权限，则其权限可以访问
* `hasIpAddress`：如果有参数，参数表示`IP`地址，如果用户`IP`和参数匹配，则可以访问
* `hasRole`：如果有参数，参数表示角色，则其角色可以访问
* `permitAll`：用户可以任意访问
* `rememberMe`：允许通过`remember-me`登录的用户访问
* `authenticated`：用户登录后可访问

#### 认证失败处理类

```java
/**
 *  返回未授权
 */
@Component
public class AuthenticationEntryPointImpl implements AuthenticationEntryPoint, Serializable {

    private static final long serialVersionUID = -8970718410437077606L;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e)
            throws IOException {
        int code = HttpStatus.UNAUTHORIZED;
        String msg = "认证失败，无法访问系统资源，请先登陆";
        ServletUtils.renderString(response, JSON.toJSONString(AjaxResult.error(code, msg)));
    }
}
```

### 认证流程

#### 自定义认证过滤器

```java

public class TokenLoginFilter extends UsernamePasswordAuthenticationFilter {

    private AuthenticationManager authenticationManager;

    private RsaKeyProperties prop;

    public TokenLoginFilter(AuthenticationManager authenticationManager, RsaKeyProperties prop) {
        this.authenticationManager = authenticationManager;
        this.prop = prop;
    }

    /**
     * @author cheetah
     * @description 登陆验证
     * @date 2021/6/28 16:17
     * @Param [request, response]
     * @return org.springframework.security.core.Authentication
     **/
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        try {
            UserPojo sysUser = new ObjectMapper().readValue(request.getInputStream(), UserPojo.class);
            UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(sysUser.getUsername(), sysUser.getPassword());
            return authenticationManager.authenticate(authRequest);
        }catch (Exception e){
            try {
                response.setContentType("application/json;charset=utf-8");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                PrintWriter out = response.getWriter();
                Map resultMap = new HashMap();
                resultMap.put("code", HttpServletResponse.SC_UNAUTHORIZED);
                resultMap.put("msg", "用户名或密码错误！");
                out.write(new ObjectMapper().writeValueAsString(resultMap));
                out.flush();
                out.close();
            }catch (Exception outEx){
                outEx.printStackTrace();
            }
            throw new RuntimeException(e);
        }
    }


    /**
     * @author cheetah
     * @description 登陆成功回调
     * @date 2021/6/28 16:17
     * @Param [request, response, chain, authResult]
     * @return void
     **/
    public void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResult) throws IOException, ServletException {
        UserPojo user = new UserPojo();
        user.setUsername(authResult.getName());
        user.setRoles((List<RolePojo>)authResult.getAuthorities());
        //通过私钥进行加密：token有效期一天
        String token = JwtUtils.generateTokenExpireInMinutes(user, prop.getPrivateKey(), 24 * 60);
        response.addHeader("Authorization", "Bearer "+token);
        try {
            response.setContentType("application/json;charset=utf-8");
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            Map resultMap = new HashMap();
            resultMap.put("code", HttpServletResponse.SC_OK);
            resultMap.put("msg", "认证通过！");
            resultMap.put("token", token);
            out.write(new ObjectMapper().writeValueAsString(resultMap));
            out.flush();
            out.close();
        }catch (Exception outEx){
            outEx.printStackTrace();
        }
    }
}
```

#### 流程

`Security`默认登录路径为`/login`，当我们调用该接口时，它会调用上边的`attemptAuthentication`方法；

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b2fc7ecfc7f2418f9f74412679caa804~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dba85abc53d7468dbb7a9022f32c6011~tplv-k3u1fbpfcp-zoom-1.image)


![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/be488f922d014f17a0d357a429aeced1~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/01443b9116ae4f76a1278ac078bdc695~tplv-k3u1fbpfcp-zoom-1.image)

所以我们要自定义`UserInfoService`继承`UserDetailsService`实现`loadUserByUsername`方法；

```java
public interface UserInfoService extends UserDetailsService {

}

@Service
@Transactional
public class UserInfoServiceImpl implements UserInfoService {

    @Autowired
    private SysUserInfoMapper userInfoMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserPojo user = userInfoMapper.queryByUserName(username);
        return user;
    }
}
```

其中的`loadUserByUsername`返回的是`UserDetails`类型，所以`UserPojo`继承`UserDetails`类

```java
@Data
public class UserPojo implements UserDetails {

    private Integer id;

    private String username;

    private String password;

    private Integer status;

    private List<RolePojo> roles;

    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        //理想型返回 admin 权限，可自已处理这块
        List<SimpleGrantedAuthority> auth = new ArrayList<>();
        auth.add(new SimpleGrantedAuthority("ADMIN"));
        return auth;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    /**
     * 账户是否过期
     **/
    @JsonIgnore
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * 是否禁用
     */
    @JsonIgnore
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * 密码是否过期
     */
    @JsonIgnore
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * 是否启用
     */
    @JsonIgnore
    @Override
    public boolean isEnabled() {
        return true;
    }
}
```

当认证通过之后会在`SecurityContext`中设置`Authentication`对象，回调调用`successfulAuthentication`方法返回`token`信息，

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/023558d45e3a4f03aedda77022a0b869~tplv-k3u1fbpfcp-zoom-1.image)

#### 整体流程图如下

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3b8249968ffd4bfba5c0ed1b40315bad~tplv-k3u1fbpfcp-zoom-1.image)

### 鉴权流程

#### 自定义token过滤器

```java
public class TokenVerifyFilter extends BasicAuthenticationFilter {
    private RsaKeyProperties prop;

    public TokenVerifyFilter(AuthenticationManager authenticationManager, RsaKeyProperties prop) {
        super(authenticationManager);
        this.prop = prop;
    }

    public void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            //如果携带错误的token，则给用户提示请登录！
            chain.doFilter(request, response);
        } else {
            //如果携带了正确格式的token要先得到token
            String token = header.replace("Bearer ", "");
            //通过公钥进行解密：验证tken是否正确
            Payload<UserPojo> payload = JwtUtils.getInfoFromToken(token, prop.getPublicKey(), UserPojo.class);
            UserPojo user = payload.getUserInfo();
            if(user!=null){
                UsernamePasswordAuthenticationToken authResult = new UsernamePasswordAuthenticationToken(user.getUsername(), null, user.getAuthorities());
                //将认证信息存到安全上下文中
                SecurityContextHolder.getContext().setAuthentication(authResult);
                chain.doFilter(request, response);
            }
        }
    }
}
```

当我们访问时需要在`header`中携带`token`信息

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8c2adc22ede3453c98610e47f2ca4f8f~tplv-k3u1fbpfcp-zoom-1.image)

至于关于文中`JWT`生成`token`和`RSA`生成公钥、私钥的部分，可在源码中查看，回复“sjwt”可获取完整源码呦！
