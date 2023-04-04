---
title: 详解 IDEA 导入 Spring 源码
icon: leaf
order: 1
category:
  - Spring
tag:
  - gradle
  - Idea

---

春节期间，有小伙伴私信我说想要研究下`Spring`的源码，想让我出一期教程来实现`IDEA`导入`Spring`源码，今天它来了~

> 版本 ：IDEA 2020.2.3 ；Spring 5.0.x ；gradle 4.4.1 ；

先从[`github`](https://github.com/spring-projects/spring-framework)上面把 `spring` 源码下载下来并解压： 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6d1ca05056cd4774beef6805f9964e05~tplv-k3u1fbpfcp-zoom-1.image)

> 切记：解压完成后不要直接用`IDEA` 打开，因为`Spring` 的源码是用 `gradle` 构建的。如果已经用`IDEA` 打开了请**删除**后重新解压。

我们找到文件夹

`spring-framework-5.0.x\gradle\wrapper`

下的 `gradle-wrapper.properties` 文件，查看里边的 `gradle` 版本，去[官网](https://gradle.org/)下载。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/235245a49c23477cb5c7cdb5090969d4~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/35ca1d6371b04d05b6e30b8a21b02b09~tplv-k3u1fbpfcp-zoom-1.image)

下载完成之后把 `gradle` 的环境变量配置一下，可以用`gradle -version` 来验证 `gradle` 是否配置成功 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/91a1c00198cf4f5b96b5dd6948d8ff98~tplv-k3u1fbpfcp-zoom-1.image)

在 `USER_HOME/.gradle/` 下面新建 `init.gradle` 文件，将国外源换成国内镜像

```yml
allprojects {
 repositories {
     def REPOSITORY_URL = 'http://maven.aliyun.com/nexus/content/groups/public/'
  all { ArtifactRepository repo ->
      if(repo instanceof MavenArtifactRepository){
       def url = repo.url.toString()
    if(url.startsWith('https://repo1.maven.org/maven2/')||url.startsWith('https://jcenter.bintray.com/')){
        project.logger.lifecycle "Repository ${repo.url} replaced by $REPOSITORY_URL."
     remove repo
    }
   }
     }
  maven {
   url REPOSITORY_URL
  }
 }
}
```

在 `spring-framework-5.0.x` 下打开`git` 的窗口执行以下命令

`./gradlew :spring-oxm:compileTestJava`

该命令的作用是将 `spring` 转成`IDEA` 可以导入的工程结构。 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8eb1d8753ddb4fb5b605f8fc1773c9ef~tplv-k3u1fbpfcp-zoom-1.image)

> 如果你新开的 `Windows` 的 `dos` 窗口，先进入源码的目录文件夹，执行命令不用加前面的`./`

配置 `IDEA` 中的 `gradle` 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5e40574434b2415fa68a94e5548c2a20~tplv-k3u1fbpfcp-zoom-1.image)

使用 `File -> open` 把 `Spring` 工程导入到 `IDEA` 中，并等待 `jar` 下载完成。

如遇报错信息： ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/abad097dad7f461cb9d92bed33744040~tplv-k3u1fbpfcp-zoom-1.image)

在 `build.gradle` 中添加

`maven { url "http://maven.aliyun.com/nexus/content/groups/public"}`

其目的就是为了换成国内的镜像（`init.gradle` 有时没有生效）

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6322ab637919479ba483bf5e89887d24~tplv-k3u1fbpfcp-zoom-1.image)

编译时报错如下： 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/07129f1e33ad4bd985c4afdf188fcb9e~tplv-k3u1fbpfcp-zoom-1.image)

原因是 `gradle` 和 `gradle` 插件版本过旧，更换更高的版本可以解决，但这个问题只是提示，不影响编译。

在 `test` 包中随便找了一个单元测试运行，成功运行 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0212c002ffee450fb72e67d033eb2220~tplv-k3u1fbpfcp-zoom-1.image)