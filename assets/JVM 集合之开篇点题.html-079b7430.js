import{_ as e,W as o,X as a,a2 as c}from"./framework-a9f5de78.js";const d={},n=c(`<p>大家在平时的开发过程中是否遇到过<code>StackOverflowError</code>、<code>OutOfMemoryError</code>等类似的内存溢出错误呢？大家又是怎么解决这个问题的？再来，大家在面试过程中有没有被面试官提问过<code>jvm</code>的内部构造及如何优化的夺命连环<code>call</code>呢？今天就让我们来一探究竟，先从<code>jvm</code>的内部构造及原理说起，一步一步带大家解决<code>jvm</code>的优化问题。</p><h2 id="虚拟机简介" tabindex="-1"><a class="header-anchor" href="#虚拟机简介" aria-hidden="true">#</a> 虚拟机简介</h2><p>虚拟机（<code>Virtual Machine</code>，简称<code>VM</code>）就是一台虚拟的计算机。它是一款软件，用来执行一系列虚拟计算机指令。大体上，虚拟机可以分为系统虚拟机和程序虚拟机。</p><ul><li>大名鼎鼎的<code>visual box</code>、<code>vmware</code>就属于系统虚拟机，他们完全是对物理计算机的仿真，提供了一个可运行完整操作系统的软件平台。</li><li>程序虚拟机的代表就是<code>java</code>虚拟机（<code>jvm</code>），他专门为执行单个计算机程序而设计，在<code>java</code>虚拟机中执行的指令我们称为<code>java</code>字节码指令。</li></ul><p>无论是系统虚拟机还是程序虚拟机，在上边运行的软件都被限制于虚拟机提供的资源中。虚拟机所在的位置：硬件的操作系统之上。虚拟机与<code>JDK</code>和<code>JRE</code>的关系如图所示： <img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9967d96aa0e4467292f542f385f84bf2~tplv-k3u1fbpfcp-zoom-1.image" alt="虚拟机与和的关系" loading="lazy"></p><h2 id="架构模型" tabindex="-1"><a class="header-anchor" href="#架构模型" aria-hidden="true">#</a> 架构模型</h2><p><code>Java</code>编译器输入的指令流基本上是一种基于栈的指令集架构，另一种指令集架构则是基于寄存器的指令集架构。那么他们之间有什么区别呢？</p><p><strong>栈式架构特点：</strong></p><ul><li>设计和实现更简单，适用于资源受限的系统；</li><li>避开了寄存器的分配难题，使用零地址指令方式分配；</li><li>指令流中的指令大部分是零地址指令，其执行过程依赖于操作栈。指令集更小，编译器容易实现；</li><li>不需要硬件支持，可移植性好，更好实现跨平台。</li></ul><p><strong>寄存器架构特点：</strong></p><ul><li>典型的应用是x86的二进制指令集：比如传统的<code>PC</code>以及<code>Android</code>的<code>Davlik</code>虚拟机；</li><li>指令集架构则完全依赖于硬件，可移植性差；</li><li>性能优秀和执行更高效；</li><li>花费更小的指令去完成一项操作；</li><li>基于寄存器架构的指令集往往都以一地址指令、二地址指令和三地址指令为主。</li></ul><blockquote><p>机器指令是机器语言的一条语句，是一组有意义的二进制代码，一条机器指令通常分为两个部分：操作码和地址码。操作码指出该指令应该执行什么样的操作，代表了该指令的功能。地址码指出该指令操作的对象，给出被操作对象的地址。零地址指令指机器指令中操作数地址的个数为0，一地址指令指机器指令中操作数地址的个数为1，以此类推。</p></blockquote><p>由于跨平台性的设计，java的指令都是根据栈来设计的，不同平台的cpu架构不同，所以不能设计为基于寄存器的。</p><p><strong>举例</strong>：同样执行2+3的逻辑操作，其指令分别如下：</p><p>基于栈的计算流程（以Java虚拟机为例--idea中控制台使用<code>javap -v XXX.class</code>执行）</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code> <span class="token number">0</span><span class="token operator">:</span> iconst_2  <span class="token comment">//常量2入栈</span>
 <span class="token number">1</span><span class="token operator">:</span> istore_1  <span class="token comment">//将2从操作数栈存储到局部变量表 第1个位置</span>
 <span class="token number">2</span><span class="token operator">:</span> iconst_3  <span class="token comment">//常量3入栈</span>
 <span class="token number">3</span><span class="token operator">:</span> istore_2  <span class="token comment">//将2从操作数栈存储到局部变量表 第2个位置</span>
 <span class="token number">4</span><span class="token operator">:</span> iload_1   <span class="token comment">//位置为1的数据压入操作数栈</span>
 <span class="token number">5</span><span class="token operator">:</span> iload_2   <span class="token comment">//位置为2的数据压入操作数栈</span>
 <span class="token number">6</span><span class="token operator">:</span> iadd      <span class="token comment">//常量2，3出栈，执行相加，并将结果压入操作数栈顶</span>
 <span class="token number">7</span><span class="token operator">:</span> istore_3  <span class="token comment">//结果5存到局部变量表 第三个位置</span>
 <span class="token number">8</span><span class="token operator">:</span> <span class="token keyword">return</span>    
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>基于寄存器的计算流程：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>mov eax,2  //将eax寄存器的值设为1
add eax,3  //使eax寄存器的值加3
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="java-虚拟机的生命周期" tabindex="-1"><a class="header-anchor" href="#java-虚拟机的生命周期" aria-hidden="true">#</a> java 虚拟机的生命周期</h2><p>虚拟机的启动：Java虚拟机的启动是通过引导类加载器创建一个初始类来完成的，这个类是由虚拟机的具体实现指定的。</p><p>虚拟机的执行：虚拟机的任务是执行java程序，其真正执行的是一个叫做java虚拟机的进程。</p><p>虚拟机的退出：</p><ol><li>程序正常执行结束；</li><li>程序在执行过程中遇到了异常或者错误而异常终止；</li><li>操作系统出现错误而导致java虚拟机进程终止；</li><li>线程调用Runtime类或者System类的exit方法，或者Runtime类的halt方法，并且java安全管理器也允许这次exit或halt操作；</li><li>JNI（Java Native Interface）规范描述了用JNI Invocation API来加载或卸载java虚拟机时，java虚拟机的退出情况。</li></ol><h2 id="常见的jvm" tabindex="-1"><a class="header-anchor" href="#常见的jvm" aria-hidden="true">#</a> 常见的JVM</h2><p>如果说<code>java</code>是跨平台的语言，那<code>jvm</code>就是跨语言的平台。只要是将该语言的文件遵循<code>jvm</code>的规范编译成<code>jvm</code>可以识别的字节码文件，就可以在<code>jvm</code>上运行。<code>jvm</code>的特点：一次编译，到处运行；自动内存管理；自动垃圾回收功能。</p><p><strong>HotSpot、JRockit与J9并称三大主流JVM：</strong></p><p><code>HotSpot VM</code>：从<code>JDK1.3</code>开始使用，到现在<code>OpenJDK</code>中也在使用。采用解释器与即时编译器并存的架构，拥有成熟的热点代码探测技术和<code>GC</code>机制。所谓热点探测技术有以下两个方面的体现：一、通过计数器找到最具编译价值的代码，触发即时编译或者栈上替换功能--机器指令（<code>cpu</code>可以直接执行的指令）本地缓存；二、即时编译器和解释器协同工作，在最优化的程序响应时间与最佳执行性能之间平衡。</p><blockquote><p>前端编译器(<code>javac</code>或者<code>Eclipse JDT</code>中的增量式编译器)把<code>Java</code>代码编译成字节码，字节码是可以发送给任何平台并且能在那个平台上运行的独立于平台的代码。</p></blockquote><blockquote><p>即时编译器（<code>JIT compiler，just-in-timecompiler</code>）是一个把Java的字节码（包括需要被解释的指令的程序）转换成可以直接发送给处理器（<code>processor</code>）的指令的程序。</p></blockquote><p><code>JRockit VM</code>:最初属于<code>BEA</code>公司，2008年被<code>Oracle</code>收购。它专注于服务器端应用，所以不太关注程序的启动速度，里边不包含解析器，号称是世界上最快的<code>JVM</code>。它提供的<code>Mission Control</code>服务套件，是一组以极低的开销来监控、管理和分析生产环境中的应用程序的工具。它包括三个独立的应用程序：内存泄漏监测器（<code>Memory Leak Detector</code>）、JVM运行时分析器（<code>Runtime Analyzer</code>）和管理控制台（<code>Management Console</code>）。</p><p><code>J9 VM</code>：<code>J9</code>是<code>IBM</code>开发的一个高度模块化的<code>JVM</code>，在许多平台上，<code>IBM J9 VM</code>都只能跟<code>IBM</code>产品一起使用。2017年<code>IBM</code>发布开源的<code>OpenJ9</code>，并贡献给 <code>Eclipse</code> 基金会。</p><p><strong>非主流<code>JVM</code>介绍：</strong></p><p><code>Azul VM</code>:　是<code>Azul system</code> 公司在<code>Hot Spot</code>基础上进行的改进，是运行在其公司专有的硬件上，一个<code>Azul VM</code> 实例，都可以管理数十个<code>CPU</code>以及数百G的内存资源，而且通过巨大内存范围内，实现可控的GC事件以及垃圾回收。</p><p><code>Graal VM</code>: 是一个高性能的通用虚拟机，可以运行使用<code>JavaScript</code>，<code>Python 3</code>，<code>Ruby</code>，<code>R</code>，基于<code>JVM</code>的语言以及基于<code>LLVM</code>的语言开发的应用。<code>GraalVM</code>消除了编程语言之间的隔离性，并且通过共享运行时增强了他们的互操作性。它可以独立运行，也可以运行在<code>OpenJDK</code>，<code>Node.js</code>，<code>Oracle</code>，<code>MySQL</code>等环境中。它的口号“Run Programs Faster Anywhere”。</p><h2 id="hotspot-的整体架构图" tabindex="-1"><a class="header-anchor" href="#hotspot-的整体架构图" aria-hidden="true">#</a> HotSpot 的整体架构图</h2><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2fc50038f51b431d8a654abe10cc965f~tplv-k3u1fbpfcp-zoom-1.image" alt="HotSpot的整体架构简图" tabindex="0" loading="lazy"><figcaption>HotSpot的整体架构简图</figcaption></figure><p>如图所示为 HotSpot 的架构简图，接下来我们会按照该图的执行顺序说一下<code>JVM</code>里边的具体细节。</p>`,37),s=[n];function t(i,p){return o(),a("div",null,s)}const r=e(d,[["render",t],["__file","JVM 集合之开篇点题.html.vue"]]);export{r as default};
