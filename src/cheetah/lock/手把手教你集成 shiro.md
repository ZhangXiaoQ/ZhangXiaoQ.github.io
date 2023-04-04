---
title: 手把手教你集成 shiro
icon: lock
order: 1
category:
  - 身份、权限校验
tag:
  - Subject
  - SecurityManager
  - Realm

---

今天阿Q给大家带来的小知识是 shiro 。不知道大家在平时的工作和学习中是否使用它进行过身份验证与鉴权呢？接下来就让阿Q带大家一起来学习并实践一下。

## Shiro简介

Apache Shiro 是一个强大且易用的 Java 安全框架，执行身份验证、授权、密码和会话管理。目前，使用 Apache Shiro 的人越来越多，因为它相当简单，对比 Spring Security，可能没有 Spring Security 做的功能强大，但是在实际工作时可能并不需要那么复杂的东西，所以使用小而简单的 Shiro 就足够了。shiro 由三大组件构成：Subject、SecurityManager、Realm。

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fc543337f5e248a78eb3ff1cb7bf7234~tplv-k3u1fbpfcp-zoom-1.image)

**Subject**：可以理解为主体或者用户，是一个抽象概念，这个用户不一定是一个具体的人，可以是与当前应用交互的任何东西。

**SecurityManager**：安全管理器，即所有与安全有关的操作都会与 SecurityManager 交互；是 Shiro 的核心，它管理着所有 Subject，且负责进行认证和授权、会话、缓存的管理。

**Realm**：域，Shiro 从 Realm 获取安全数据（如用户、角色、权限），就是说 SecurityManager 要验证用户身份，那么它需要从 Realm 获取相应的用户进行比较以确定用户身份是否合法；也需要从 Realm 得到用户相应的角色 / 权限进行验证用户是否能进行操作；可以把 Realm 看成 DataSource，即安全数据源。

总结一下，就是最简单的一个 Shiro 应用：

1. 应用代码通过 Subject 来进行认证和授权，而 Subject 又委托给 SecurityManager；
2. 我们需要给 Shiro 的 SecurityManager 注入 Realm，从而让 SecurityManager 能得到合法的用户及其权限进行判断。

接下来就让我们在代码层面继承一下shiro。首先我们要准备好环境，创建一个简单的springboot工程，配置及数据库操作这里不再赘述，有需要的可以后台私聊阿Q呦。

## 集成

### 引入shiro的依赖包

```java
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring</artifactId>
    <version>1.5.3</version>
</dependency>
```

### 自定义 Realm 进行权限认证和身份认证

```java
@Slf4j
public class CustomRealm extends AuthorizingRealm {
     @Autowired
    private SysUserInfoMapper userInfoMapper;

    /**
     *  权限认证/获取授权信息
     *  该方法只有在需要权限认证时才会进入，
     *  比如前面配置类中配置了
     *  filterChainDefinitionMap.put("/admin/**", "roles[admin]"); 的管理员角色，
     *  这时进入 /admin 时就会进入该方法来检查权限
     * @author cheetah
     * @date 2020/11/21
     * @param principals:
     * @return: org.apache.shiro.authz.AuthorizationInfo
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        log.info("————权限认证————");
        String username = (String) SecurityUtils.getSubject().getPrincipal();
        SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
        //获得该用户角色
        String role = userInfoMapper.getRole(username);
        Set<String> set = new HashSet<>();
        //需要将 role 封装到 Set 作为 info.setRoles() 的参数
        set.add(role);
        //设置该用户拥有的角色
        info.setRoles(set);
        return info;
    }

    /**
     *  身份认证/获取身份验证信息
     *  Shiro中，最终是通过 Realm 来获取应用程序中的用户、角色及权限信息的。
     *  该方法则是需要身份认证时（比如前面的 Subject.login() 方法）才会进入
     * @author cheetah
     * @date 2020/11/21
     * @param authenticationToken:  用户身份信息 token
     * @return: org.apache.shiro.authc.AuthenticationInfo
     * 返回封装了用户信息的 AuthenticationInfo 实例
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        log.info("————身份认证方法————");
        UsernamePasswordToken token = (UsernamePasswordToken) authenticationToken;
        // 从数据库获取对应用户名密码的用户
        SysUserInfo userInfo = userInfoMapper.getUserByLogin(token.getUsername());
        if (null == userInfo) {
            throw new BusinessException(CommonResultStatus.USERNAME_ERROR);
        } else if (!userInfo.getPassword().equals(new String((char[]) token.getCredentials()))) {
            throw new BusinessException(CommonResultStatus.PASSWORD_ERROR);
        }
        return new SimpleAuthenticationInfo(token.getPrincipal(), userInfo.getPassword(), getName());
    }
}
```

### 创建 ShiroConfig

将 ShiroFilterFactoryBean 交由 spring 管理；将自定义的身份认证交由 SecurityManager 管理

代码如下：

```java
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
    public ShiroFilterFactoryBean shiroFilter(){
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        // 必须设置 SecurityManager
        shiroFilterFactoryBean.setSecurityManager(securityManager());
        //设置shiro内置过滤器
        Map<String, Filter> filters = new LinkedHashMap<>();
        //增加自定义过滤器，只对需要登陆的接口进行过滤
        filters.put("authc", new CustomRolesOrAuthorizationFilter());
        //filters.put("roles", new CustomRolesOrAuthorizationFilter());
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
        //管理员，需要角色权限 “admin”
        filterChainDefinitionMap.put("/admin/**", "roles[admin]");
        //商品，需要角色权限 “user”
        //filterChainDefinitionMap.put("/productInfo/**", "roles[user]");
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
    public SecurityManager securityManager(){
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        // 设置realm.
        securityManager.setRealm(customRealm());
        return securityManager;
    }

    /**
     *  注入自定义身份认证
     * @author cheetah
     * @date 2020/11/21
     * @return: com.cheetah.shiroandjwt.config.CustomRealm
     */
    @Bean
    public CustomRealm customRealm(){
        return new CustomRealm();
    }

}
```

> **补充：**
>
> anon：无需认证（登陆）可以访问
>
> authc：必须认证才可以访问
>
> user：如果使用rememberMe的功能可以直接访问
>
> perms：该资源必须得到资源权限才可以访问
>
> role：该资源必须得到角色权限才可以访问

### 自定义过滤器

代码如下：

```java
public class CustomRolesOrAuthorizationFilter extends AuthorizationFilter{

    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) throws Exception {
        //验证用户是否登陆，若是未登陆直接返回异常信息
        Subject subject = getSubject(request, response);
        Object principal = subject.getPrincipal();
        if(principal==null){
            return false;
        }
        //获取当前访问路径所需要的角色集合
        String[] rolesArray = (String[]) mappedValue;
        //没有角色限制，可以直接访问
        if (rolesArray == null || rolesArray.length == 0) {
            //没有指定角色的话不需要进行验证，放行
            return true;
        }

        Set<String> roles = CollectionUtils.asSet(rolesArray);
        //当前subject是roles中的任意一个，则有权限访问
        for(String role : roles){
            if(subject.hasRole(role)){
                return true;
            }
        }
        return false;
    }

}
```

### 测试

接下来根据业务来测试一下 shiro 的相关功能，附上业务测试代码：登陆代码+商品列表代码

```java
@RestController
@RequestMapping("adminLogin")
public class LoginController {

    @Autowired
    private UserInfoService userInfoService;

    @PostMapping("login")
    public AjaxResult login(@RequestBody SysUserInfo userInfo){
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token = new UsernamePasswordToken(userInfo.getName(),userInfo.getPassword());
        subject.login(token);
        return AjaxResult.success("登陆成功");
    }
}


@RestController
@RequestMapping("/productInfo")
public class ProductInfoController {

    @Autowired
    private ProductInfoService productInfoService;

    @RequestMapping("/getProductList")
    public AjaxResult getProductList(){
        List<ProductInfo> list = productInfoService.getProductInfoList();
        return AjaxResult.success(list);
    }

}
```

**（1）首先验证登录：当调用subject.login(token);方法时，会走 CustomRealm 中的 doGetAuthenticationInfo() **

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/416a68fce4254d7e9ac61cea508e90cf~tplv-k3u1fbpfcp-zoom-1.image)

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a047c958747a4f119d422249db30c61e~tplv-k3u1fbpfcp-zoom-1.image)


![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dbe63bc06ea94c78b917d438c0a11af0~tplv-k3u1fbpfcp-zoom-1.image)

**你是否也有这样的疑惑呢？成功登录之后，再次请求时，服务器是如何知道已经登录，是哪个用户，是使用HttpSession还是shiro的Session的呢？**

在处理请求时，ShiroFilterFactoryBean 实现了 FactoryBean 接口，在加载 ShiroFilterFactoryBean 时实际会加载 SpringShiroFilter 并添加到应用的过滤器链中。

当有请求进来的时候，都会被 SpringShiroFilter 拦截到。Subject 值就是在 SpringShiroFilter 拦截的过程中设置到线程变量中的。SpringShiroFilter 的拦截方法中最关键的两步是 createSubject 和 bind 到 ThreadContext 里。到这里，可以理出大致的流程，用户发起请求->调用 SpringShiroFilter 的 doFilter ->创建 Subject->设置到线程变量中，方便在后面取出使用。

**创建subject可以分为以下三步：**

> * 将request、response封装成shiro的ShiroHttpServletRequest，ShiroHttpServletResponse
> * 获取session、principals的值设置到context里
> * 根据context生成Subject

**（2）shiro实际上是使用 session 来传递登陆信息的，接下来我们来看一下**

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5004b8e08a9e4b8eaa1ba5d1327ba9ed~tplv-k3u1fbpfcp-zoom-1.image)

![在这里插入图片描述](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/22ef889459694fe98d509a08ce307c2e~tplv-k3u1fbpfcp-zoom-1.image)

当我们在header中传入jsessionid参数时才能获取到访问的数据。

**（3）重点：ShiroConfig中ShiroFilterFactoryBean的讲解：**

当代码中有filterChainDefinitionMap.put("/productInfo/\*\*", “roles\[user]”);时，代表商品列表需要权限验证，此时不会去走自定义的过滤器；

而当将代码中的 filters.put(“authc”, new CustomRolesOrAuthorizationFilter());

改为 filters.put(“roles”, new CustomRolesOrAuthorizationFilter()); 时，代码会先去走该过滤器进行权限验证，isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) 中的 mappedValue 便是 roles\[user] 中括号里的集合。
