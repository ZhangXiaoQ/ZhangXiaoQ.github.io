---
title: CentOS8安装 erlang 和 RabbitMQ
icon: line
order: 1
category:
  - RabbitMQ
tag:
  - CentOS
  - erlang

---

最近正好用到了消息队列中的 RabbitMQ ,今天就先来个前味菜，总结一下它在 centos 内的安装。

> 环境：CentOS 8.0 64位

## 安装 erlang

由于 rabbitmq 是基于 erlang 语言开发的，所以必须先安装 erlang 。

#### 安装依赖

```
yum -y install gcc glibc-devel make ncurses-devel openssl-devel xmlto perl wget gtk2-devel binutils-devel
```

#### 下载

[erlang官网](https://www.erlang.org/downloads)

下载安装包

```
 wget  http://erlang.org/download/otp_src_21.3.tar.gz
```

> 会比较慢，请耐心等待

如果下载过程中退出了，可以使用

```
wget -c http://erlang.org/download/otp_src_21.3.tar.gz
```

来进行断点续传

#### 解压

```
tar -zxvf otp_src_21.3.tar.gz
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e18dd7971a744e57a86a1850727e9b83~tplv-k3u1fbpfcp-zoom-1.image)

遇到这个问题，没找到为什么，但是并未影响后续的安装

#### 移走

```
mv otp_src_21.3 /usr/local/soft/
```

> 这个路径自己定义，后续的安装对应好即可

#### 切换目录

```
cd /usr/local/soft/otp_src_21.3/
```

#### 创建即将安装的目录

```
mkdir ../erlang
```

#### 配置安装路径

```
./configure --prefix=/usr/local/soft/erlang
```

如果遇到这个错 你就假装没看到 ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/511572c9278c4f9d91dac70f862d316b~tplv-k3u1fbpfcp-zoom-1.image)

#### 安装

```
make install
```

查看一下是否安装成功

```
ll /usr/local/soft/erlang/bin
```

#### 添加环境变量

```
echo 'export PATH=$PATH:/usr/local/soft/erlang/bin' >> /etc/profile
```

#### 刷新环境变量

```
source /etc/profile
```

#### 甩一条命令

```
erl
```

瞬间进入了一个未知的世界 ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/132dba3ca9974448be4137b09578b044~tplv-k3u1fbpfcp-zoom-1.image)

在里面输入`halt().`命令退出来（那个点号别忘记） ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/329607a079394cd2b3ae566c2080a8c4~tplv-k3u1fbpfcp-zoom-1.image)

至此，erlang 的安装就已经完成了，接下来安装 RabbitMQ。

## 安装 RabbitMQ

需要查看 erlang 支持的 rabbitmq 版本号

-   [版本对照地址](https://www.rabbitmq.com/which-erlang.html)

#### 下载

-   [下载地址](https://www.rabbitmq.com/install-generic-unix.html)

切换到 `/root` 下下载

```
wget https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.7.14/rabbitmq-server-generic-unix-3.7.14.tar.xz
```

#### 解压

第一次解压

```
xz -d rabbitmq-server-generic-unix-3.7.14.tar.xz
```

第二次解压

```
tar -xvf rabbitmq-server-generic-unix-3.7.14.tar 
```

#### 移走

```
mv rabbitmq_server-3.7.14/ /usr/local/soft 
```

#### 配置环境变量

```
echo 'export PATH=$PATH:/usr/local/soft/rabbitmq_server-3.7.14/sbin' >> /etc/profile
```

#### 刷新环境变量

```
source /etc/profile
```

#### 启动命令

进入 sbin 目录

```
cd /usr/local/soft/rabbitmq_server-3.7.14/sbin
```

启动：

```
rabbitmq-server -detached
```

> 提示：Warning: PID file not written; -detached was passed.

查看状态命令：

```
rabbitmqctl status
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e30e5c50669149b79426133841ec2036~tplv-k3u1fbpfcp-zoom-1.image)

停止命令：

```
rabbitmqctl stop
```

> 我的防火墙时关闭的，并且开放了端口 15672 。

#### 开启web插件

```
rabbitmq-plugins enable rabbitmq_management
```

访问：http://127.0.0.1:15672/

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7af8d781517e49f387d71046f93de5f4~tplv-k3u1fbpfcp-zoom-1.image)

> 默认账号密码：guest guest（这个账号只允许本机访问）

#### 用户管理

查看所有用户

```
rabbitmqctl list_users
```

添加一个用户

```
rabbitmqctl add_user cheetah 123456
```

> 其中 cheetah 为用户名，123456 为密码，可自定义。

配置权限

```
rabbitmqctl set_permissions -p "/" cheetah ".*" ".*" ".*"
```

查看用户权限

```
rabbitmqctl list_user_permissions cheetah
```

设置tag

```
rabbitmqctl set_user_tags cheetah administrator
```

删除用户

```
rabbitmqctl delete_user guest 
```

> 安全起见，删除默认用户

## 登陆

配置好用户之后重启一下 rabbitMQ 然后就可以用新账号进行登陆 

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/66274b10d43442ba9fb3acd75629e68b~tplv-k3u1fbpfcp-zoom-1.image)