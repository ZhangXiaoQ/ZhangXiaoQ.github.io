import{_ as n,W as a,X as e,a2 as s}from"./framework-a9f5de78.js";const c={},o=s(`<p>刚刚面试回来的B哥又在吐槽了：现在的面试官太难伺候了，放着好好的堆、栈、方法区不问，上来就让我从字节码角度给他分析一下<code>try-catch-finally</code>（以下简称TCF）的执行效率......</p><p>我觉得应该是面试官在面试的过程中看大家背的八股文都如出一辙，觉得没有问的必要，便拐着弯的考大家的理解。今天趁着B哥也在，我们就来好好总结一下TCF相关的知识点，期待下次与面试官对线五五开！</p><blockquote><p>环境准备： IntelliJ IDEA 2020.2.3、JDK 1.8.0_181</p></blockquote><h2 id="执行顺序" tabindex="-1"><a class="header-anchor" href="#执行顺序" aria-hidden="true">#</a> 执行顺序</h2><p>我们先来写一段简单的代码：</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">test1</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">int</span> x <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> x<span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
        x <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>答案是1不是2，你答对了吗？</p><p>大家都知道在TCF中，执行到<code>return</code>的时候会先去执行<code>finally</code>中的操作，然后才会返回来执行<code>return</code>，那这里为啥会是1呢？我们来反编译一下字节码文件。</p><blockquote><p>命令：javap -v xxx.class</p></blockquote><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3d0d694b4e29460cb486c7d8d3081b18~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>字节码指令晦涩难懂，那我们就用图解的方式来解释一下（我们先只看前7行指令）：首先执行 <code>int x = 1;</code></p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5f2817ea6d424623bcdafac22837de58~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>然后我们需要执行<code>try</code>中的<code>return x;</code></p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d95f5d4b7fd044cc8cb31ae100f313c0~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>此时并不是真正的返回<code>x</code>的值，而是将<code>x</code>的值存到局部变量表中作为<strong>临时存储变量</strong>进行存储，也就是对该值进行<strong>保护</strong>操作。</p><p>最后进入<code>finally</code>中执行<code>x=2;</code></p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9fd417dac7a74a6993717dffa4b358d5~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>此时虽然<code>x</code>已经被赋值为2了，但是由于刚才的保护操作，在执行真正的<code>return</code>操作时，会将被保护的<strong>临时存储变量</strong>入栈返回。</p><p>为了更好的理解上述操作，我们再来写一段简单代码：</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">test2</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">int</span> x <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> x<span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
        x <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> x<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>大家思考一下执行结果是几？答案是2不是1。</p><p>我们再来看下该程序的字节码指令</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8b395b583c984ef08f8039f21166233e~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>通过对比发现，第6行一个是<code>iload_1</code>，一个是<code>iload_0</code>，这是由什么决定的呢？原因就是我们上边提到的<strong>保护机制</strong>，当在<code>finally</code>中存在<code>return</code>语句时，保护机制便会失效，转而将变量的值入栈并返回。</p><h3 id="小结" tabindex="-1"><a class="header-anchor" href="#小结" aria-hidden="true">#</a> 小结</h3><ul><li><code>return</code>的执行优先级高于<code>finally</code>的执行优先级，但是<code>return</code>语句执行完毕之后并不会马上结束函数，而是将结果保存到<strong>栈帧</strong>中的<strong>局部变量表</strong>中，然后继续执行<code>finally</code>块中的语句；</li><li>如果<code>finally</code>块中包含<code>return</code>语句，则不会对<code>try</code>块中要返回的值进行保护，而是直接跳到<code>finally</code>语句中执行，并最后在<code>finally</code>语句中返回，返回值是在<code>finally</code>块中改变之后的值；</li></ul><h2 id="finally-为什么一定会执行" tabindex="-1"><a class="header-anchor" href="#finally-为什么一定会执行" aria-hidden="true">#</a> finally 为什么一定会执行</h2><p>细心地小伙伴应该能发现，上边的字节码指令图中第4-7行和第9-12行的字节码指令是完全一致的，那么为什么会出现重复的指令呢？</p><p>首先我们来分析一下这些重复的指令都做了些什么操作，经过分析发现它们就是<code>x = 2;return x;</code>的字节码指令，也就是<code>finally</code>代码块中的代码。由此我们有理由怀疑如果上述代码中加入<code>catch</code>代码块，<code>finally</code>代码块对应的字节码指令也会再次出现。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">test2</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">int</span> x <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> x<span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span><span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        x <span class="token operator">=</span> <span class="token number">3</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
        x <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> x<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>反编译之后</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6e61c8b09fd84944ad1f3e4633cedf1c~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>果然如我们所料，重复的字节码指令出现了三次。让我们回归到最初的问题上，为什么<code>finally</code>代码的字节码指令会重复出现三次呢？</p><p>原来是<code>JVM</code>为了保证所有异常路径和正常路径的执行流程都要执行<code>finally</code>中的代码，所以在<code>try</code>和<code>catch</code>后追加上了<code>finally</code>中的字节码指令，再加上它自己本身的指令，正好三次。这也就是为什么<code>finally</code> 一定会执行的原因。</p><h2 id="finally一定会执行吗" tabindex="-1"><a class="header-anchor" href="#finally一定会执行吗" aria-hidden="true">#</a> finally一定会执行吗？</h2><p>为什么上边已经说了<code>finally</code>中的代码一定会执行，现在还要再多此一举呢？请👇看</p><p>在正常情况下，它是一定会被执行的，但是至少存在以下三种情况，是一定不执行的：</p><ul><li><code>try</code>语句没有被执行到就返回了，这样<code>finally</code>语句就不会执行，这也说明了<code>finally</code>语句被执行的必要而非充分条件是：相应的<code>try</code>语句一定被执行到；</li><li><code>try</code>代码块中有<code>System.exit(0);</code>这样的语句，因为<code>System.exit(0);</code>是终止<code>JVM</code>的，连<code>JVM</code>都停止了，<code>finally</code>肯定不会被执行了；</li><li>守护线程会随着所有非守护线程的退出而退出，当<strong>守护线程</strong>内部的<code>finally</code>的代码还未被执行到，非守护线程终结或退出时，<code>finally</code> 肯定不会被执行；</li></ul><h2 id="tcf-的效率问题" tabindex="-1"><a class="header-anchor" href="#tcf-的效率问题" aria-hidden="true">#</a> TCF 的效率问题</h2><p>说起TCF的效率问题，我们不得不介绍一下<strong>异常表</strong>，拿上边的程序来说，反编译<code>class</code>文件后的异常表信息如下：</p><figure><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/095e0c52f68541ce9b36e6713167ca26~tplv-k3u1fbpfcp-zoom-1.image" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><ul><li>from：代表异常处理器所监控范围的起始位置；</li><li>to：代表异常处理器所监控范围的结束位置（该行不被包括在监控范围内，是前闭后开区间）；</li><li>target：指向异常处理器的起始位置；</li><li>type：代表异常处理器所捕获的异常类型；</li></ul><blockquote><p>图中每一行代表一个异常处理器</p></blockquote><h3 id="工作流程" tabindex="-1"><a class="header-anchor" href="#工作流程" aria-hidden="true">#</a> 工作流程：</h3><ol><li>触发异常时，<code>JVM</code>会从上到下遍历异常表中所有的条目；</li><li>比较触发异常的行数是否在<code>from</code>-<code>to</code>范围内；</li><li>范围匹配之后，会继续比较抛出的异常类型和异常处理器所捕获的异常类型<code>type</code>是否相同;</li><li>如果类型相同，会跳转到<code>target</code>所指向的行数开始执行；</li><li>如果类型不同，会弹出当前方法对应的<code>java</code>栈帧，并对调用者重复操作；</li><li>最坏的情况下<code>JVM</code>需要遍历该线程 <code>Java</code> 栈上所有方法的异常表；</li></ol><p>拿第一行为例：如果位于2-4行之间的命令（即<code>try</code>块中的代码）抛出了<code>Class java/lang/Exception</code>类型的异常，则跳转到第8行开始执行。</p><blockquote><p><code>8: astore_1</code>是指将抛出的异常对象保存到局部变量表中的1位置处</p></blockquote><p>从字节码指令的角度来讲，如果代码中没有异常抛出，TCF的执行时间可以忽略不计；如果代码执行过程中出现了上文中的第6条，那么随着异常表的遍历，更多的异常实例被构建出来，异常所需要的栈轨迹也在生成。</p><p>该操作会逐一访问当前线程的栈帧，记录各种调试信息，包括类名、方法名、触发异常的代码行数等等。所以执行效率会大大降低。</p><p>看到这儿，你是否对TCF有了更加深入的了解呢？下次让你对线面试官，你会五五开吗？</p>`,50),t=[o];function i(p,l){return a(),e("div",null,t)}const r=n(c,[["render",i],["__file","tryCatch.html.vue"]]);export{r as default};