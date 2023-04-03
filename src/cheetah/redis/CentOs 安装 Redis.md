---
title: CentOs 安装 Redis
icon: workingDirectory
order: 1
category:
  - Redis
tag:
  - Redis
  - CentOS
  - 安装部署
---

一提到 Redis，相信大家都不会感到陌生吧。今天就让我们在阿里云上安装一下 Redis，为以后使用它做个准备。

### 下载

- 下载页面：https://redis.io/   
- 下载命令：`wget http://download.redis.io/releases/redis-5.0.7.tar.gz`

### 解压

`tar -xzvf redis-5.0.7.tar.gz `


### 准备编译

- 请在操作前确认 gcc 是否已安装：`gcc -v`，如未安装，可以执行这个命令安装：`yum install gcc`
- 请在操作前确认 tcl 是否已安装如未安装，可以执行这个命令安装：`yum install tcl`

### 编译

```sh
[root@localhost source]# cd redis-5.0.7/
[root@localhost redis-5.0.7]# make MALLOC=libc
```

make 后加 MALLOC 的参数的原因：避免提示找不到 `jemalloc/jemalloc.h`


### 测试编译

```sh
[root@localhost redis-5.0.7]# make test
```


如果看到以下字样：表示无错误：`\o/ All tests passed without errors!`

### 安装

```sh
[root@localhost redis-5.0.7]# mkdir /usr/local/soft/redis5   ##可分步创建
[root@localhost redis-5.0.7]# cd /usr/local/soft/redis5/
[root@localhost redis5]# mkdir bin
[root@localhost redis5]# mkdir conf
[root@localhost redis5]# cd bin/
```

> find / -name redis-cli 查找文件位置

```sh
[root@localhost bin]# cp /root/redis-5.0.7/src/redis-cli ./
[root@localhost bin]# cp /root/redis-5.0.7/src/redis-server ./
[root@localhost bin]# cd ../conf/
[root@localhost conf]# cp /root/redis-5.0.7/redis.conf ./
```


### 配置

```sh
[root@localhost conf]# vi redis.conf
```

设置以下两个地方: 

```sh
# daemonize no 
 daemonize yes  
# maxmemory <bytes>
maxmemory 128MB 
```

说明：分别是以 daemon 方式独立运行   / 内存的最大使用限制


### 运行

```sh
[root@localhost conf]# /usr/local/soft/redis5/bin/redis-server /usr/local/soft/redis5/conf/redis.conf
```

### 检查端口是否在使用中

```sh
[root@localhost conf]# netstat -anp | grep 6379
tcp        0      0 127.0.0.1:6379          0.0.0.0:*               LISTEN      16073/redis-server  
```

### 查看 redis 的当前版本

```sh
[root@localhost conf]# /usr/local/soft/redis5/bin/redis-server -v

Redis server v=5.0.7 sha=00000000:0 malloc=libc bits=64 build=8e31d2ed9a4c9593
```

### systemd 方式启动和管理

1. 编辑 service 文件

```sh
[root@localhost conf]# vim /lib/systemd/system/redis.service
```

2. service 文件内容

```sh
[Unit]Description=RedisAfter=network.target
[Service]Type=forkingPIDFile=/var/run/redis_6379.pidExecStart=/usr/local/soft/redis5/bin/redis-server /usr/local/soft/redis5/conf/redis.confExecReload=/bin/kill -s HUP $MAINPIDExecStop=/bin/kill -s QUIT $MAINPIDPrivateTmp=true
[Install]WantedBy=multi-user.target
```

3. 重载系统服务

```sh
[root@localhost conf]# systemctl daemon-reload
```

4. 用来管理 redis

```sh
启动
systemctl start redis    
查看状态
systemctl status redis
使开机启动
systemctl enable redis
```

### 查看本地 centos 的版本

```sh
[root@localhost lib]# cat /etc/redhat-release 
CentOS Linux release 8.1.1911 (Core) 
```

### 客户端连接 redis

1. 阿里云得设置 redis.conf 中的 bind 后跟着的 127.0.0.1 修改为 0.0.0.0，重启 redis；
2. 开放端口：开放服务器的端口号，步骤如下：
   - 打开实例列表，点击“ 更多”按钮，选择“ 网络和安全组 ”中的“安全组配置”；
   - 选择 “安全组列表” tab 页面，点击 “配置规则”按钮，点击 “快速添加”按钮，勾选“Redis（6379）”；
   - 点击 “确定”之后就可以正常连接了；
3. 给 redis 设置连接密码：
   - 查找到`# requirepass foobared` 注释去掉并写入要设置的密码，例如： `requirepass 123456`
4. redis 启动之后测试是否可以连接命令

```sh
./redis-cli -h 127.0.0.1 -p 6379
127.0.0.1:6379> auth 123456//此处是你的密码
```

**注意：** 如果是阿里云的话一定要设置密码，否则很可能被矿机程序注入定时任务，用你的服务器挖矿，阿里云一直会有信息提示你。