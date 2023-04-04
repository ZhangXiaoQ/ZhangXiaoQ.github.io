---
title: 在 shiro 基础上整合 jwt
icon: lock
order: 2
category:
  - 身份、权限认证
tag:
  - shiro
  - jwt

---

前几天给大家讲解了一下shiro，后台一些小伙伴跑来给我留言说：“一般不都是 shiro 结合 jwt 做身份和权限验证吗？能不能再讲解一下 jwt 的用法呢？“今天阿Q就给大家讲一下 shiro 整合 jwt 做权限校验吧。

首先呢我还是要说一下 jwt 的概念：JWT 全称 Json web token , 是为了在网络应用环境间传递声明而执行的一种基于JSON 的开放标准。该 token 被设计为紧凑且安全的，特别适用于分布式站点的单点登录（SSO）场景。

JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可以增加一些额外的其它业务逻辑所必须的声明信息，该 token 也可直接被用于认证，也可被加密。

通俗点说呢，就是之前的 session 为了区分是哪个用户发来的请求，需要在服务端存储用户信息，需要消耗服务器资源。并且随着用户量的增大，势必会扩展服务器，采用分布式系统，这样的话 session 就可能就不太合适了，而我们今天说的 jwt 呢就很好地解决了单点登录问题，很容易的解决 session 共享的问题。 

话不多说，直接上整合教程（本期是在上期 shiro 的基础上进行的改造）：

## 引入依赖

在pom文件中引入jwt的依赖包

```xml
<dependency>
	<groupId>com.auth0</groupId>
	<artifactId>java-jwt</artifactId>
	<version>3.7.0</version>
</dependency>
```

## 工具类

写一个工具类用于生成签名和验证签名

```java
public class JwtUtil {

    //JWT-account
    public static final String ACCOUNT = "username";
    //JWT-currentTimeMillis
    public final static String CURRENT_TIME_MILLIS = "currentTimeMillis";
    //有效期时间2小时
    public static final long EXPIRE_TIME = 2 * 60 * 60 * 1000L;
    //秘钥
    public static final String SECRET_KEY = "shirokey";


    /**
     * 生成签名返回token
     *
     * @param account
     * @param currentTimeMillis
     * @return
     */
    public static String sign(String account, String currentTimeMillis) {
        // 帐号加JWT私钥加密
        String secret = account + SECRET_KEY;
        // 此处过期时间，单位：毫秒，在当前时间到后边的20分钟内都是有效的
        Date date = new Date(System.currentTimeMillis() + EXPIRE_TIME);
        //采用HMAC256加密
        Algorithm algorithm = Algorithm.HMAC256(secret);

        return JWT.create()
                .withClaim(ACCOUNT, account)
                .withClaim(CURRENT_TIME_MILLIS, currentTimeMillis)
                .withExpiresAt(date)
                //创建一个新的JWT，并使用给定的算法进行标记
                .sign(algorithm);
    }

    /**
     * 校验token是否正确
     *
     * @param token
     * @return
     */
    public static boolean verify(String token) {
        String secret = getClaim(token, ACCOUNT) + SECRET_KEY;
        Algorithm algorithm = Algorithm.HMAC256(secret);
        JWTVerifier verifier = JWT.require(algorithm)
                .build();
        verifier.verify(token);
        return true;
    }

    /**
     * 获得Token中的信息无需secret解密也能获得
     *
     * @param token
     * @param claim
     * @return
     */
    public static String getClaim(String token, String claim) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            return jwt.getClaim(claim).asString();
        } catch (JWTDecodeException e) {
            return null;
        }
    }

}
```

## 封装 token

封装自己的 token，用于后边校验 token 类型

```java
public class JwtToken implements AuthenticationToken {

    private final String token;

    public JwtToken(String token){
        this.token = token;
    }

    @Override
    public Object getPrincipal() {
        return token;
    }

    @Override
    public Object getCredentials() {
        return token;
    }
```

## 创建 token

我们需要在登陆时创建 token

```java
//service中的登录处理
@Override
public UserTokenDTO login(UserTokenDTO userInfo) {
    // 从数据库获取对应用户名密码的用户
    SysUserInfo uInfo = userInfoMapper.getUserByLogin(userInfo.getName());
    if (null == uInfo) {
        //用户信息不存在
        throw new BusinessException(CommonResultStatus.USERNAME_ERROR);
    } else if (!userInfo.getPassword().equals(uInfo.getPassword())) {
        //密码错误
        throw new BusinessException(CommonResultStatus.PASSWORD_ERROR);
    }
    //生成jwtToken
    userInfo.setToken(JwtUtil.sign(userInfo.getName(),String.valueOf(System.currentTimeMillis())));
    return userInfo;
}
```

## 自定义过滤器

在其他需要登录后才能访问的请求中解析 token，所以我们要自定义过滤器。

```java
public class JwtFilter extends AccessControlFilter {

    //设置请求头中需要传递的字段名
    protected static final String AUTHORIZATION_HEADER = "Access-Token";

    /**
     *  表示是否允许访问，mappedValue就是[urls]配置中拦截器参数部分，
     *  如果允许访问返回true，否则false
     * @author cheetah
     * @date 2020/11/24
     * @param request:
      * @param response:
      * @param mappedValue:
     * @return: boolean
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) throws Exception {
        return false;
    }

    /**
     *  表示当访问拒绝时是否已经处理了，
     *  如果返回true表示需要继续处理，
     *  如果返回false表示该拦截器实例已经处理了，将直接返回即可
     * @author cheetah
     * @date 2020/11/24
     * @param request:
      * @param response:
     * @return: boolean
     */
    @Override
    protected boolean onAccessDenied(ServletRequest request, ServletResponse response) throws Exception {
        HttpServletRequest req = (HttpServletRequest) request;
        // 解决跨域问题
        if(HttpMethod.OPTIONS.toString().matches(req.getMethod())) {
            return true;
        }
        if (isLoginAttempt(request, response)) {
            //生成jwt token
            JwtToken token = new JwtToken(req.getHeader(AUTHORIZATION_HEADER));
            //委托给Realm进行验证
            try {
                //调用登陆会走Realm中的身份验证方法
                getSubject(request, response).login(token);
                return true;
            } catch (Exception e) {
            }
        }else{
            throw new BusinessException(CommonResultStatus.LOGIN_ERROR);
        }
        
        return false;
    }



    /**
     *  判断是否有头部参数
     * @author cheetah
     * @date 2020/11/24
     * @param request:
      * @param response:
     * @return: boolean
     */
    protected boolean isLoginAttempt(ServletRequest request, ServletResponse response) {
        HttpServletRequest req = (HttpServletRequest) request;
        String authorization = req.getHeader(AUTHORIZATION_HEADER);
        return authorization != null;
    }

}
```

当滤器中调用 subject.login(token) 方法时，会走自定义 Realm 中的 doGetAuthenticationInfo(AuthenticationToken token) 方法来验证身份

```java
@Slf4j
public class JwtRealm extends AuthorizingRealm {

    @Autowired
    private UserInfoService userService;

    //验证是不是自己的token类型
    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof JwtToken;
    }

    /**
     *  身份验证
     * @author cheetah
     * @date 2020/11/25
     * @param token:
     * @return: org.apache.shiro.authc.AuthenticationInfo
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        String credentials = (String) token.getCredentials();
        String username = null;
        try {
            //jwt验证token
            boolean verify = JwtUtil.verify(credentials);
            if (!verify) {
                throw new AuthenticationException("Token校验不正确");
            }
            username = JwtUtil.getClaim(credentials, JwtUtil.ACCOUNT);
        } catch (Exception e) {
            throw new BusinessException(CommonResultStatus.TOKEN_CHECK_ERROR,e.getMessage());
        }

        //交给AuthenticatingRealm使用CredentialsMatcher进行密码匹配，不设置则使用默认的SimpleCredentialsMatcher
        SimpleAuthenticationInfo authenticationInfo = new SimpleAuthenticationInfo(
                username, //用户名
                credentials, //凭证
                getName()  //realm name
        );
        return authenticationInfo;
    }

    /**
     *  权限校验（次数不做过多讲解）
     * @author cheetah
     * @date 2020/11/25
     * @param principals:
     * @return: org.apache.shiro.authz.AuthorizationInfo
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
//        String username = principals.toString();
        SimpleAuthorizationInfo authorizationInfo = new SimpleAuthorizationInfo();
        //角色权限暂时不加
//        authorizationInfo.setRoles(userService.getRoles(username));
//        authorizationInfo.setStringPermissions(userService.queryPermissions(username));
        return authorizationInfo;
    }

}
```

## SecurityManager

接下来我们需要修改 ShiroConfig 文件，将自定义的 Filter 和 Realm 交由 SecurityManager 进行管理

```java
/**
此类较长，只展示部分重要代码，其余代码可在公众号“阿Q说”中回复"jwt"获取源码
**/
@Configuration
@Slf4j
public class ShiroConfig {

    /**
     *  创建ShiroFilterFactoryBean
     * @author cheetah
     * @date 2020/11/21
     * @return: org.apache.shiro.spring.web.ShiroFilterFactoryBean
     */
    @Bean
    public ShiroFilterFactoryBean shiroFilter(SecurityManager securityManager){
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        // 必须设置 SecurityManager
        shiroFilterFactoryBean.setSecurityManager(securityManager);
        //设置shiro内置过滤器
        Map<String, Filter> filters = new LinkedHashMap<>();
        //添加自定义过滤器：只对需要登陆的接口进行过滤
        filters.put("authc", new JwtFilter());
        //添加自定义过滤器：对权限进行验证
//        filters.put("roles", new CustomRolesOrAuthorizationFilter());
        shiroFilterFactoryBean.setFilters(filters);

        // setLoginUrl 如果不设置值，默认会自动寻找Web工程根目录下的"/login.jsp"页面 或 "/login" 映射
        shiroFilterFactoryBean.setLoginUrl("/adminLogin/login");
        // 设置无权限时跳转的 url;
        shiroFilterFactoryBean.setUnauthorizedUrl("/notAuth");

        // 设置拦截器
        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        //游客，开发权限
        filterChainDefinitionMap.put("/guest/**", "anon");
        //用户，需要角色权限 “user”
        filterChainDefinitionMap.put("/user/**", "roles[user]");
//        filterChainDefinitionMap.put("/productInfo/**", "roles[user]");
        //管理员，需要角色权限 “admin”
        filterChainDefinitionMap.put("/admin/**", "roles[admin]");
        //开放登陆接口
        filterChainDefinitionMap.put("/adminLogin/login", "anon");
        //其余接口一律拦截
        //主要这行代码必须放在所有权限设置的最后，不然会导致所有 url 都被拦截
        filterChainDefinitionMap.put("/**", "authc");

        shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        log.info("-------Shiro拦截器工厂类注入成功-----------");
        return shiroFilterFactoryBean;
    }

    /**
     *  注入安全管理器
     * @author cheetah
     * @date 2020/11/21
     * @return: java.lang.SecurityManager
     */
    @Bean
    public DefaultWebSecurityManager securityManager(JwtRealm jwtRealm, SubjectFactory subjectFactory,
                                                     SessionManager sessionManager,
                                                     CacheManager cacheManager) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(jwtRealm);

        //关闭shiro自带的session
        DefaultSubjectDAO subjectDAO = new DefaultSubjectDAO();
        DefaultSessionStorageEvaluator defaultSessionStorageEvaluator = new DefaultSessionStorageEvaluator();
        defaultSessionStorageEvaluator.setSessionStorageEnabled(false);
        subjectDAO.setSessionStorageEvaluator(defaultSessionStorageEvaluator);
        securityManager.setSubjectDAO(subjectDAO);
        securityManager.setSubjectFactory(subjectFactory);
        securityManager.setSessionManager(sessionManager);
        securityManager.setCacheManager(cacheManager);
        return securityManager;
    }

    /**
     *  jwt身份认证和权限校验
     * @author cheetah
     * @date 2020/11/24
     * @return: com.cheetah.shiroandjwt.jwt.JwtRealm
     */
    @Bean
    public JwtRealm jwtRealm() {
        JwtRealm jwtRealm = new JwtRealm();
        jwtRealm.setAuthenticationCachingEnabled(true);
        jwtRealm.setAuthorizationCachingEnabled(true);
        return jwtRealm;
    }
}
```

**重点：将自定义的Realm交由 SecurityManage 管理，关闭 shiro 自带的 session**

接下来我们启动成程序验证一下：当我们未登录时，请求失败，需要先**登录**

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7501ba3fbfa04192a2559028d4ed8bdf~tplv-k3u1fbpfcp-zoom-1.image)

**登录成功获取token信息**![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f33228b5f5df4a05ad4d08a0b21ffbf0~tplv-k3u1fbpfcp-zoom-1.image)

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5cba13ecdb1c457b90800076d134c237~tplv-k3u1fbpfcp-zoom-1.image)

当带着头部信息"Access-Token"访问时就可以获取信息了。
