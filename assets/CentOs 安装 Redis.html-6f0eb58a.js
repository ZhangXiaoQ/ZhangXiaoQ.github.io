import{_ as e,W as i,X as t,Y as s,Z as a,a0 as l,a2 as o,C as c}from"./framework-a9f5de78.js";const r={},d=s("p",null,"一提到 Redis，相信大家都不会感到陌生吧。今天就让我们在阿里云上安装一下 Redis，为以后使用它做个准备。",-1),p=s("h3",{id:"下载",tabindex:"-1"},[s("a",{class:"header-anchor",href:"#下载","aria-hidden":"true"},"#"),a(" 下载")],-1),u={href:"https://redis.io/",target:"_blank",rel:"noopener noreferrer"},m=s("li",null,[a("下载命令："),s("code",null,"wget http://download.redis.io/releases/redis-5.0.7.tar.gz")],-1),h=o(`<h3 id="解压" tabindex="-1"><a class="header-anchor" href="#解压" aria-hidden="true">#</a> 解压</h3><p><code>tar -xzvf redis-5.0.7.tar.gz </code></p><h3 id="准备编译" tabindex="-1"><a class="header-anchor" href="#准备编译" aria-hidden="true">#</a> 准备编译</h3><ul><li>请在操作前确认 gcc 是否已安装：<code>gcc -v</code>，如未安装，可以执行这个命令安装：<code>yum install gcc</code></li><li>请在操作前确认 tcl 是否已安装如未安装，可以执行这个命令安装：<code>yum install tcl</code></li></ul><h3 id="编译" tabindex="-1"><a class="header-anchor" href="#编译" aria-hidden="true">#</a> 编译</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost source<span class="token punctuation">]</span><span class="token comment"># cd redis-5.0.7/</span>
<span class="token punctuation">[</span>root@localhost redis-5.0.7<span class="token punctuation">]</span><span class="token comment"># make MALLOC=libc</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>make 后加 MALLOC 的参数的原因：避免提示找不到 <code>jemalloc/jemalloc.h</code></p><h3 id="测试编译" tabindex="-1"><a class="header-anchor" href="#测试编译" aria-hidden="true">#</a> 测试编译</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost redis-5.0.7<span class="token punctuation">]</span><span class="token comment"># make test</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>如果看到以下字样：表示无错误：<code>\\o/ All tests passed without errors!</code></p><h3 id="安装" tabindex="-1"><a class="header-anchor" href="#安装" aria-hidden="true">#</a> 安装</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost redis-5.0.7<span class="token punctuation">]</span><span class="token comment"># mkdir /usr/local/soft/redis5   ##可分步创建</span>
<span class="token punctuation">[</span>root@localhost redis-5.0.7<span class="token punctuation">]</span><span class="token comment"># cd /usr/local/soft/redis5/</span>
<span class="token punctuation">[</span>root@localhost redis5<span class="token punctuation">]</span><span class="token comment"># mkdir bin</span>
<span class="token punctuation">[</span>root@localhost redis5<span class="token punctuation">]</span><span class="token comment"># mkdir conf</span>
<span class="token punctuation">[</span>root@localhost redis5<span class="token punctuation">]</span><span class="token comment"># cd bin/</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><blockquote><p>find / -name redis-cli 查找文件位置</p></blockquote><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost bin<span class="token punctuation">]</span><span class="token comment"># cp /root/redis-5.0.7/src/redis-cli ./</span>
<span class="token punctuation">[</span>root@localhost bin<span class="token punctuation">]</span><span class="token comment"># cp /root/redis-5.0.7/src/redis-server ./</span>
<span class="token punctuation">[</span>root@localhost bin<span class="token punctuation">]</span><span class="token comment"># cd ../conf/</span>
<span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># cp /root/redis-5.0.7/redis.conf ./</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="配置" tabindex="-1"><a class="header-anchor" href="#配置" aria-hidden="true">#</a> 配置</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># vi redis.conf</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>设置以下两个地方:</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment"># daemonize no </span>
 daemonize <span class="token function">yes</span>  
<span class="token comment"># maxmemory &lt;bytes&gt;</span>
maxmemory 128MB 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>说明：分别是以 daemon 方式独立运行 / 内存的最大使用限制</p><h3 id="运行" tabindex="-1"><a class="header-anchor" href="#运行" aria-hidden="true">#</a> 运行</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># /usr/local/soft/redis5/bin/redis-server /usr/local/soft/redis5/conf/redis.conf</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h3 id="检查端口是否在使用中" tabindex="-1"><a class="header-anchor" href="#检查端口是否在使用中" aria-hidden="true">#</a> 检查端口是否在使用中</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># netstat -anp | grep 6379</span>
tcp        <span class="token number">0</span>      <span class="token number">0</span> <span class="token number">127.0</span>.0.1:6379          <span class="token number">0.0</span>.0.0:*               LISTEN      <span class="token number">16073</span>/redis-server  
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="查看-redis-的当前版本" tabindex="-1"><a class="header-anchor" href="#查看-redis-的当前版本" aria-hidden="true">#</a> 查看 redis 的当前版本</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># /usr/local/soft/redis5/bin/redis-server -v</span>

Redis server <span class="token assign-left variable">v</span><span class="token operator">=</span><span class="token number">5.0</span>.7 <span class="token assign-left variable">sha</span><span class="token operator">=</span>00000000:0 <span class="token assign-left variable">malloc</span><span class="token operator">=</span>libc <span class="token assign-left variable">bits</span><span class="token operator">=</span><span class="token number">64</span> <span class="token assign-left variable">build</span><span class="token operator">=</span>8e31d2ed9a4c9593
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="systemd-方式启动和管理" tabindex="-1"><a class="header-anchor" href="#systemd-方式启动和管理" aria-hidden="true">#</a> systemd 方式启动和管理</h3><ol><li>编辑 service 文件</li></ol><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># vim /lib/systemd/system/redis.service</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><ol start="2"><li>service 文件内容</li></ol><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>Unit<span class="token punctuation">]</span>Description<span class="token operator">=</span>RedisAfter<span class="token operator">=</span>network.target
<span class="token punctuation">[</span>Service<span class="token punctuation">]</span>Type<span class="token operator">=</span>forkingPIDFile<span class="token operator">=</span>/var/run/redis_6379.pidExecStart<span class="token operator">=</span>/usr/local/soft/redis5/bin/redis-server /usr/local/soft/redis5/conf/redis.confExecReload<span class="token operator">=</span>/bin/kill <span class="token parameter variable">-s</span> HUP <span class="token variable">$MAINPIDExecStop</span><span class="token operator">=</span>/bin/kill <span class="token parameter variable">-s</span> QUIT <span class="token variable">$MAINPIDPrivateTmp</span><span class="token operator">=</span>true
<span class="token punctuation">[</span>Install<span class="token punctuation">]</span>WantedBy<span class="token operator">=</span>multi-user.target
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="3"><li>重载系统服务</li></ol><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost conf<span class="token punctuation">]</span><span class="token comment"># systemctl daemon-reload</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><ol start="4"><li>用来管理 redis</li></ol><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>启动
systemctl start redis    
查看状态
systemctl status redis
使开机启动
systemctl <span class="token builtin class-name">enable</span> redis
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="查看本地-centos-的版本" tabindex="-1"><a class="header-anchor" href="#查看本地-centos-的版本" aria-hidden="true">#</a> 查看本地 centos 的版本</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>root@localhost lib<span class="token punctuation">]</span><span class="token comment"># cat /etc/redhat-release </span>
CentOS Linux release <span class="token number">8.1</span>.1911 <span class="token punctuation">(</span>Core<span class="token punctuation">)</span> 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="客户端连接-redis" tabindex="-1"><a class="header-anchor" href="#客户端连接-redis" aria-hidden="true">#</a> 客户端连接 redis</h3><ol><li>阿里云得设置 redis.conf 中的 bind 后跟着的 127.0.0.1 修改为 0.0.0.0，重启 redis；</li><li>开放端口：开放服务器的端口号，步骤如下： <ul><li>打开实例列表，点击“ 更多”按钮，选择“ 网络和安全组 ”中的“安全组配置”；</li><li>选择 “安全组列表” tab 页面，点击 “配置规则”按钮，点击 “快速添加”按钮，勾选“Redis（6379）”；</li><li>点击 “确定”之后就可以正常连接了；</li></ul></li><li>给 redis 设置连接密码： <ul><li>查找到<code># requirepass foobared</code> 注释去掉并写入要设置的密码，例如： <code>requirepass 123456</code></li></ul></li><li>redis 启动之后测试是否可以连接命令</li></ol><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>./redis-cli <span class="token parameter variable">-h</span> <span class="token number">127.0</span>.0.1 <span class="token parameter variable">-p</span> <span class="token number">6379</span>
<span class="token number">127.0</span>.0.1:637<span class="token operator"><span class="token file-descriptor important">9</span>&gt;</span> auth <span class="token number">123456</span>//此处是你的密码
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>注意：</strong> 如果是阿里云的话一定要设置密码，否则很可能被矿机程序注入定时任务，用你的服务器挖矿，阿里云一直会有信息提示你。</p>`,40);function v(b,k){const n=c("ExternalLinkIcon");return i(),t("div",null,[d,p,s("ul",null,[s("li",null,[a("下载页面："),s("a",u,[a("https://redis.io/"),l(n)])]),m]),h])}const f=e(r,[["render",v],["__file","CentOs 安装 Redis.html.vue"]]);export{f as default};
