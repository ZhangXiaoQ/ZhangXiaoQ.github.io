---
title: Redis 的主从配置
icon: workingDirectory
order: 5
category:
  - Redis
tag:
  - 主从
  - 全量同步
  - 增量同步

---

当我在写[一上来就主从、集群、哨兵，这谁受得了](https://mp.weixin.qq.com/s/PTHg4mxE1gA_tg3XWQyWhA)的时候，好多小伙伴就迫不及待的留言想看这些模式了，今天我们就从配置文件、设计原理、面试真题三个方面来聊一聊 Redis 的主从复制。

在 Redis 复制的基础上，使用和配置**主从复制**非常简单，能使得从 Redis 服务器（下文称 replica）能精确的复制主 Redis 服务器（下文称 master）的内容。每次当 replica 和 master 之间的连接断开时， replica 会自动重连到 master 上，并且无论这期间 master 发生了什么， replica 都将尝试让自身成为 master 的精确副本。

**主从复制，从 5.0.0 版本开始，Redis 正式将 SLAVEOF  命令改名成了 REPLICAOF 命令并逐渐废弃原来的 SLAVEOF 命令**

Redis使用默认的异步复制，其特点是**低延迟**和**高性能**，是绝大多数 Redis 用例的自然复制模式。但是，replica 会异步地确认它从主 master 周期接收到的数据量。

### 主从拓扑架构
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6de70229f2e4a7d992f26aa2f456652~tplv-k3u1fbpfcp-zoom-1.image)

master 用来写操作，replicas 用来读取数据，适用于读多写少的场景。而对于写并发量较高的场景，多个从节点会导致主节点写命令的多次发送从而过度消耗网络带宽，同时也加重了 master 的负载影响服务稳定性。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5029d609ca0e4c8cba60ac7fe35098f3~tplv-k3u1fbpfcp-zoom-1.image)

replica 可以接受其它 replica 的连接。除了多个 replica 可以连接到同一个 master 之外， replica 之间也可以像层叠状的结构（cascading-like structure）连接到其他 replica 。自 Redis 4.0 起，所有的 sub-replica 将会从 master 收到完全一样的复制流。

当 master 需要多个 replica 时，为了避免对 master 的性能干扰，可以采用树状主从结构降低主节点的压力。


为了让大家对概念有更清晰的认识，我们先来看一下配置文件中主从复制的参数介绍：

## REPLICATION

### replicaof `<masterip> <masterport>`
通过设置 master 的 ip 和 port ，可以使当前的 Redis 实例成为另一台 Redis 实例的副本。在Redis启动时，它会自动从 master 进行数据同步。
- Redis 复制是异步的，可以通过修改 master 的配置，在 master 没有与给定数量的 replica 连接时，主机停止接收写入；
- 如果复制链路丢失的时间相对较短，Redis replica 可以与 master 执行部分重新同步，可以使用合理的 backlog 值来进行配置(**见下文**)；
- 复制是自动的，不需要用户干预。在网络分区后，replica 会自动尝试重新连接到 master 并与 master 重新同步；

### masterauth `<master-password>`
当 master 设置了密码保护时，replica 服务连接 master 的密码

### replica-serve-stale-data yes
当 replica 与 master 失去连接或者主从复制在进行时，replica 可以有两种不同的设置：
- replica-serve-stale-data：yes（默认值），则 replica 仍将响应客户端请求，可能会有过期数据，或者如果这是第一次同步，则数据集可能为空。
- replica-serve-stale-data：no , replica 将对所有请求命令（但不包含 INFO, replicaOF, AUTH, PING, SHUTDOWN, REPLCONF, ROLE, CONFIG, SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PUBLISH, PUBSUB, COMMAND, POST, HOST: and LATENCY）返回 **SYNC with master in progress** 的错误。

### replica-read-only
可以将 replica 配置为是否只读，yes 代表为只读状态，将会拒绝所有写入命令；no 表示可以写入。 从 Redis 2.6 之后， replica 支持只读模式且默认开启。可以在运行时使用 `CONFIG SET` 来随时开启或者关闭。

对 replica 进行写入可能有助于存储一些**临时**数据（因为写入 replica 的数据在与 master 重新同步后很容易被删除），计算慢速集或排序集操作并将其存储到本地密钥是多次观察到的可写副本的一个用例。但如果客户端由于配置错误而向其写入数据，则也可能会导致问题。

在**级联结构**中即使 replica B 节点是可写的，Sub-replica C 也不会看到 B 的写入，而是将拥有和 master A 相同的数据集。

设置为 yes 并不表示客户端用集群方式以 replica 为入口连入集群时，不可以进行 set 操作，且 set 操作的数据不会被放在 replica 的槽上，会被放到某 master 的槽上。

> 注意：只读 replica 设计的目的不是为了暴露于互联网上不受信任的客户端，它只是一个防止实例误用的保护层。默认情况下，只读副本仍会导出所有管理命令，如CONFIG、DEBUG 等。在一定程度上，可以使用`rename-command`来隐藏所有管理/危险命令，从而提高只读副本的**安全性**。

### repl-diskless-sync
复制同步策略：磁盘（disk）或套接字（socket），默认为 no 使用 disk 。

新的 replicas 和重新连接的 replicas 如果因为接收到差异而无法继续复制过程，则需要执行“完全同步”。RDB 文件从 master 传送到 replicas，传输可以通过两种不同的方式进行：
1. Disk-backed：Redis master 节点创建一个新的进程并将 RDB 文件写入**磁盘**，然后文件通过父进程增量传输给 replicas 节点；
2. Diskless：Redis master 节点创建一个新的进程并直接将 RDB 文件写入到 replicas 的 sockets 中，不写到磁盘。

- 当进行 disk-backed 复制时， RDB 文件生成完毕，多个 replicas 通过**排队**来同步 RDB 文件。
- 当进行 diskless 复制时，master 节点会等待一段时间（下边的repl-diskless-sync-delay 配置）再传输以期望会有多个 replicas 连接进来，这样 master 节点就可以**同时同步**到多个 replicas 节点。如果超出了等待时间，则需要排队，等当前的 replica 处理完成之后在进行下一个 replica 的处理。 

硬盘性能差，网络性能好的情况下 diskless 效果更佳
> 警告：无盘复制目前处于试验阶段


 ### repl-diskless-sync-delay
当启用 diskless 复制后，可以通过此选项设置 master 节点创建子进程前等待的时间，即延迟启动数据传输，目的可以在第一个 replica 就绪后，等待更多的 replica 就绪。单位为秒，默认为**5秒**。

### repl-ping-replica-period 
Replica 发送 PING 到 master 的间隔，默认值为 10 秒。

### repl-timeout
默认值60秒，此选项用于设置以下情形的 timeout 判断：
- 从 replica 节点的角度来看的 SYNC 过程中的 I/O 传输 —— 没有收到 master SYNC 传输的 rdb snapshot 数据；
- 从 replica 节点的角度来看的 master 的 timeout（如 data，pings）—— replica 没有收到master发送的数据包或者ping；
- 从 master 节点角度来看的 replica 的 timeout（如 REPLCONF ACK pings）—— master 没有收到 REPLCONF ACK 的确认信息；
需要注意的是，此选项必须大于 repl-ping-replica-period，否则在 master 和 replica 之间存在低业务量的情况下会经常发生 timeout。

### repl-disable-tcp-nodelay
master 和 replicas 节点的连接是否关掉 TCP_NODELAY 选项。 
- 如果选择“yes”，Redis 将使用更少的 TCP 数据包和更少的带宽向 replicas 发送数据。但这会增加数据在 replicas 端显示的延迟，对于使用默认配置的 Linux 内核，延迟可达40毫秒。
- 如果选择“no”，则数据出现在 replicas 端的延迟将减少，但复制将使用更多带宽。

这个实际影响的是 TCP 层的选项，里面会用 setsockopt 设置，默认为 no，表示 TCP 层会禁用 Nagle 算法，尽快将数据发出， 设置为 yes 表示 TCP 层启用 Nagle 算法，数据累积到一定程度，或者经过一定时间 TCP 层才会将其发出。

> 默认情况下，我们会针对低延迟进行优化，但在流量非常高的情况下，或者当 master 和 replicas 距离多个 hops 时，将此选项改为“yes”可能会更好。

### repl-backlog-size
设置复制的 backlog 缓冲大小，默认 1mb。backlog 是一个缓冲区，当 replica 断开一段时间连接时，它会累积 replica 数据，所以当 replica 想要再次重新连接时，一般不需要**全量同步**，只需要进行**部分同步**即可，只传递 replica 在断开连接时丢失的部分数据。

更大的 backlog 缓冲大小，意味着 replicas 断开重连后，依然可以进行续传的时间越长（支持断开更长时间）。

> backlog 缓冲只有在至少一个 replica 节点连过来的时候 master 节点才需要创建。

### repl-backlog-ttl 
当 replicas 节点断开连接后，master 节点会在一段时间后释放 backlog 缓冲区。 这个选项设置的是当**最后一个** replica 断开链接后，master 需要等待多少秒再释放缓冲区。默认3600 秒，0表示永远不释放。

>  replicas 节点永远都不会释放这个缓冲区，因为它有可能再次连接到 master 节点， 然后尝试进行 “增量同步”。


### replica-priority 
replica-priority 是 Redis 通过 INFO 接口发布的整数，默认值为 100。 当 master 节点无法正常工作后 Redis Sentinel 通过这个值来决定将哪个 replica 节点提升为 master 节点。这个数值**越小**表示**越优先**进行提升。如有三个 replica 节点其 priority 值分别为 10，100，25， Sentinel 会选择 priority 为 10 的节点进行提升。这个值为 0 表示 replica 节点永远**不能**被提升为 master 节点。


### min-replicas-to-write
### min-replicas-max-lag
```
//表示要求至少3个延迟<=10秒的副本存在
min-replicas-to-write 3  //下文中的 N
min-replicas-max-lag 10 //下文中的 M
```
从 Redis 2.8 开始，如果连接的 replica 延迟小于或等于M秒的个数少于N个（N个 replica 需要处于“online”状态），则 master 可能停止接受写入并回复 error。由于 Redis 使用异步复制，因此无法确保 replica 是否实际接收到给定的写命令，因此总会有一个数据丢失窗口。

**原理如下：**
- replica 每秒钟都会 ping master，确认已处理的复制流的数量；
- master 会记得上一次从每个 replica 都收到 ping 的时间，延迟就是根据 master 从 replica 接收的最后一次 ping 计算的；
- 用户可以配置延迟不超过最大秒数的最小 replica 数；

此选项不保证 N 个副本将接受写入，但在没有足够的副本可用的情况下，将丢失写入的暴露窗口限制在指定的秒数内。

>  N 默认值为 0，M 默认值为10。任意一个设置为 0 表示不启用此功能。


### replica-announce-ip 5.5.5.5
### replica-announce-port 1234
Redis master 可以通过不同方式列出连接上来的 replicas 节点的地址和端口。 如 Redis Sentinel 等会使用 “INFO replication” 命令来获取 replica 实例信息，master 的“ROLE“ 命令也会提供此信息。

这个信息一般来说是通过 replica 节点通过以下方式获取然后报告上来的：
- IP：通过自动识别连接到 Socket 的信息自动获取
- Port：一般来说这个值就是 replicas 节点用来接受客户端的连接的监听端口

但是，若启用了端口转发或者 NAT，可能需要其他地址和端口才能连接到 replicas 节点。 这种情况下，需要设置这两个选项，这样 replicas 就会用这两个选项设置的值覆盖默认行为获取的值，然后报告给 master 节点。 根据实际情况，你可以只设置其中某个选项，而不用两个选项都设置。

配置的介绍到这里就结束了，接下来我们把上边提到的概念串起来，聊一下主从复制的相关原理。

## 原理

### 系统的运行依靠三个主要的机制
- 当一个 master 实例和一个 replica 实例连接正常时， master 会发送一连串的命令流来保持对 replica 的更新，以便于将自身数据集的改变复制给 replica ，包括客户端的写入、key 的过期或被逐出等等。
- 当 master 和 replica 之间的连接断开之后，因为网络问题、或者是主从**意识**到连接超时， replica 重新连接上 master 并会尝试进行部分重同步。这意味着它会尝试只获取在断开连接期间内丢失的命令流。
- 当无法进行部分重同步时， replica 会请求进行全量重同步。这会涉及到一个更复杂的过程，例如 master 需要创建所有数据的快照，将之发送给 replica ，之后在数据集更改时持续发送命令流到 replica 。

### Redis 复制功能是如何工作的
每一个 `Redis master` 都有一个 `replication ID` ：这是一个较大的**伪随机字符串**，标记了一个给定的数据集。每个 master 也持有一个偏移量，master 将自己产生的复制流发送给 replica 时，发送多少个字节的数据，自身的偏移量就会增加多少，目的是当有新的操作修改自己的数据集时，它可以以此更新 replica 的状态。

> 复制偏移量即使在没有一个 replica 连接到 master 时，也会自增，所以基本上每一对给定的 `Replication ID, offset` 都会标识一个 master 数据集的确切版本。

当 replica 连接到 master 时，它使用 PSYNC 命令来发送它记录的旧的 master replication ID 和它至今为止处理的偏移量。通过这种方式， master 能够仅发送 replica 所需的增量部分。但是如果 master 的缓冲区中没有足够的 backlog 或者 replica 引用了 master 不知道的历史记录（replication ID），则会转而进行一个全量重同步：在这种情况下， replica 会得到一个完整的数据集副本，从头开始。

说到这儿，那什么是全量同步，那什么又是增量同步呢？

### 全量同步

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2835b41ef80f4d4ca6da6c0ec16ed502~tplv-k3u1fbpfcp-zoom-1.image)

1. replica 连接 master，发送 PSYNC 命令；
2. master 执行 bgsave 开启一个后台保存进程，以便于生产一个 RDB 文件。同时它开始缓冲所有从客户端接收到的新的写入命令。
3. 当后台保存完成时， master 将数据集文件传输给所有的 replica，并在发送期间继续记录被执行的写命令；
4. replica 收到 RDB 文件之后，丢弃所有的旧数据，然后加载新文件到内存；
5. replica 加载完成后，通知 master 发送所有缓冲的命令给 replica，这个过程以指令流的形式完成并且和 Redis 协议本身的格式相同；
6. replica 开始接收命令请求，并执行来自 master 缓冲区的写命令。

> 注意：SYNC 是一个旧协议，在新的 Redis 中已经不再被使用，但是仍然向后兼容。因为它不允许部分重同步，所以现在 PSYNC 被用来替代 SYNC。

正常情况下，一个全量重同步要求在磁盘上创建一个 RDB 文件，然后将它从磁盘加载进内存，然后 replica 以此进行数据同步。如果磁盘性能很低的话，这对 master 是一个压力很大的操作。Redis 2.8.18 是第一个支持无磁盘复制的版本。在此设置中，子进程直接发送 RDB 文件给 replica 的 sockets 中，无需使用磁盘作为中间储存介质。

### 增量同步
master 把命令发送给所有的 replica 的同时，还会将命令写入 backlog 缓冲区里面。

当 replica 与 master 断开连接又重新连接之后，此时要判断 replica 的偏移量与 master 的偏移量的差集有没有超过 backlog 的大小，
- 如果没有则给 replica 发送 CONTINUE，等待 master 将 backlog 中的数据发送给 replica；
- 如果超过了则返回 FULLRESYNC runid offset，replica 将 runid 保存起来，并进行全量同步；

最后我们来聊几个在面试过程中经常提到的面试题。

## 面试题

### 在主从复制过程中，关闭 master 的持久化会引发什么问题呢？
数据会从 master 和所有 replica 中被删除。我们用案例来说明一下：

1. 我们设置节点 A 为 master 并关闭它的持久化设置，设置节点 B 和 C 为 replica；
2. 当 master 崩溃时，由于系统中配置了自动重启的脚本，此时 master 会自动重启。但是由于持久化被关闭了，master 重启后其数据集合为空；
3. 此时，如果 replica 从 master 中同步数据，就会导致 replica 中的数据也会变为空集合。

因此，我们在使用 Redis 复制功能时，**强烈建议**在 master 和 replica 中启用持久化。如果因为非常慢的磁盘性能导致的延迟问题而不启用持久化时，**应该配置节点来避免重置后自动重启**。


### Redis 复制如何处理 key 的过期问题
Redis 的过期机制可以限制 key 的生存时间，该机制取决于 Redis 计算时间的能力。但是，即使使用 Lua 脚本将这些 key 变为过期的 key，Redis replicas 也能正确地复制这些 key。

为了实现这样的功能，Redis 不能依靠主从使用**同步时钟**，因为这是一个无法解决的并且会导致 race condition 和数据集不一致的问题，所以 Redis 使用三种主要的技术使过期的 key 的复制能够正确工作：
- replica 不会让 key 过期，而是等待 master 让 key 过期。当一个 master 让一个 key 到期（或由于 LRU 算法将之驱逐）时，它会合成一个 DEL 命令并传输到所有的 replica；
- 由于主驱动的原因，master 无法及时提供 DEL 命令，所以有时候 replica 的内存中仍然可能存在逻辑上已经过期的 key。为了处理这个问题，replica 使用它的逻辑时钟来报告在不违反数据一致性的前提下，读取操作的 key 不存在。用这种方法，replica 避免报告逻辑过期的 key 仍然存在。在实际应用中，使用 replica 程序进行扩展的 HTML 碎片缓存，将避免返回已经比期望的时间更早的数据项。
- 在Lua脚本执行期间，不执行任何 key 过期操作。当一个Lua脚本运行时，从概念上讲，master 中的时间是被冻结的，这样脚本运行的时候，一个给定的键要么存在要么不存在。这可以防止 key 在脚本中间过期，保证将相同的脚本发送到 replica ，从而在二者的数据集中产生相同的效果。

> 一旦一个 replica 被提升为一个 master ，它将开始独立地过期 key，而不需要任何旧 master 的帮助。
