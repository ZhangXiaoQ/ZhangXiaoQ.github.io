import{_ as n,W as s,X as a,a2 as e}from"./framework-a9f5de78.js";const p={},t=e(`<p>小时候最开心的事莫过于躺在沙发上看《西游记》了。大闹天宫、三打白骨精、真假美猴王......一幕幕精彩的故事萦绕脑海，现在想来，回味无穷。</p><p>不知道你有没有注意到这个细节：每当孙悟空到了一个新的环境需要了解本地的“风土人情”时，都会挥舞一下金箍棒，将土地召唤出来。那么你可知道，土地公公接收孙悟空召唤的原理是什么吗？</p><h2 id="事件通知机制" tabindex="-1"><a class="header-anchor" href="#事件通知机制" aria-hidden="true">#</a> 事件通知机制</h2><p>我们可以先将其理解为“<strong>事件通知机制</strong>”，即每当孙悟空将金箍棒敲在地上时，就相当于给土地发了一封 email 的通知，告诉他俺老孙来了，赶快出来接驾。当土地收到通知之后就会立即现身了。</p><p>大家都知道 Spring 已经为我们提供好了<strong>事件监听、订阅</strong>的实现，接下来我们用代码来实现一下这个场景。</p><p>首先我们要定义一个事件，来记录下孙悟空敲地的动作。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Getter</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MonkeyKingEvent</span> <span class="token keyword">extends</span> <span class="token class-name">ApplicationEvent</span> <span class="token punctuation">{</span>

    <span class="token keyword">private</span> <span class="token class-name">MonkeyKing</span> monkeyKing<span class="token punctuation">;</span>

    <span class="token keyword">public</span> <span class="token class-name">MonkeyKingEvent</span><span class="token punctuation">(</span><span class="token class-name">MonkeyKing</span> monkeyKing<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token string">&quot;monkeyKing&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>monkeyKing <span class="token operator">=</span> monkeyKing<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>其中 <code>MonkeyKing</code> 是我们定义好的孙悟空的实体类</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Data</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MonkeyKing</span> <span class="token punctuation">{</span>

    <span class="token doc-comment comment">/**
     * 是否敲地，默认为否
     **/</span>
    <span class="token keyword">private</span> <span class="token keyword">boolean</span> knockGround <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后我们需要实现 <code>ApplicationListener</code> 来监听孙悟空敲地的动作。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyGuardianListener</span> <span class="token keyword">implements</span> <span class="token class-name">ApplicationListener</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">MonkeyKingEvent</span><span class="token punctuation">&gt;</span></span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">onApplicationEvent</span><span class="token punctuation">(</span><span class="token class-name">MonkeyKingEvent</span> event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">boolean</span> knockGround <span class="token operator">=</span> event<span class="token punctuation">.</span><span class="token function">getMonkeyKing</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">isKnockGround</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span>knockGround<span class="token punctuation">)</span><span class="token punctuation">{</span>
            <span class="token class-name">MyGuardian</span><span class="token punctuation">.</span><span class="token function">appear</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token keyword">else</span><span class="token punctuation">{</span>
            <span class="token class-name">MyGuardian</span><span class="token punctuation">.</span><span class="token function">seclusion</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最后我们来验证下整个流程。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@PostMapping</span>
<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">testEvent</span><span class="token punctuation">(</span><span class="token annotation punctuation">@RequestParam</span> <span class="token keyword">boolean</span> knockGround<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">MonkeyKing</span> monkeyKing <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">MonkeyKing</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    monkeyKing<span class="token punctuation">.</span><span class="token function">setKnockGround</span><span class="token punctuation">(</span>knockGround<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token class-name">MonkeyKingEvent</span> monkeyKingEvent <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">MonkeyKingEvent</span><span class="token punctuation">(</span>monkeyKing<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">//发布孙悟空敲地的动作事件</span>
    applicationEventPublisher<span class="token punctuation">.</span><span class="token function">publishEvent</span><span class="token punctuation">(</span>monkeyKingEvent<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当我们调用<code>testEvent()</code>方法传入<code>knockGround</code>为 <code>true</code> 时，打印</p><div class="language-xml line-numbers-mode" data-ext="xml"><pre class="language-xml"><code>土地公公出现了
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>传入为<code>false</code>时，打印</p><div class="language-xml line-numbers-mode" data-ext="xml"><pre class="language-xml"><code>土地公公遁地了
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>这样我们就简单实现了“孙悟空召唤土地”的功能。你以为这样就结束了？从小老师就教导我们要“知其然，更要知其所以然”。</p><p>大家都说读源码更像是在喝咖啡，读不懂又苦又涩，读懂了浓郁醇香。为了不影响大家的好心情，这里我们就不研究它的源码了，我们直捣黄龙。</p><h2 id="观察者模式" tabindex="-1"><a class="header-anchor" href="#观察者模式" aria-hidden="true">#</a> 观察者模式</h2><p>说是<strong>事件通知机制</strong>也好，<strong>事件监听-订阅</strong>的实现也罢，其实它内部的最终实现原理依赖的是观察者模式。看到这，先不要胆怯，不要觉得设计模式晦涩难懂、久攻不下。今天我就用通俗易懂的小故事来带你重新认识一下观察者模式。</p><p>故事是这样的，上边我们只说了孙悟空敲地的动作，但是你是否还记得孙悟空将金箍棒往天上一指，便换来雷公电母、龙王等为其施法布雨？闭上双眼，与虎力大仙比试的场景仍历历在目。</p><p>由此可见，不光土地能收到孙悟空的通知，连雷公电母和龙王也是可以接收到的。在这里，我们把孙悟空比作主题，也就是大家说的被观察者和 <code>Subject</code>的概念，把雷公电母和龙王以及土地比作观察者。</p><p>以下是我们的代码逻辑：</p><p>首先，我们定义一个主题的基础类，里边会记录所有订阅该主题的观察者列表，还包含了增加、删除以及通知观察者的方法。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Subject</span> <span class="token punctuation">{</span>

    <span class="token comment">//观察者列表</span>
    <span class="token keyword">private</span> <span class="token class-name">Vector</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Observer</span><span class="token punctuation">&gt;</span></span> vector <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Vector</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * 增加观察者
     **/</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">addObserver</span><span class="token punctuation">(</span><span class="token class-name">Observer</span> observer<span class="token punctuation">)</span><span class="token punctuation">{</span>
        vector<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>observer<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  删除观察者
     **/</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">deleteObserver</span><span class="token punctuation">(</span><span class="token class-name">Observer</span> observer<span class="token punctuation">)</span><span class="token punctuation">{</span>
        vector<span class="token punctuation">.</span><span class="token function">remove</span><span class="token punctuation">(</span>observer<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     *  通知所有观察者
     **/</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">notifyObserver</span><span class="token punctuation">(</span><span class="token class-name">String</span> goldenCudgel<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">for</span><span class="token punctuation">(</span><span class="token class-name">Observer</span> observer <span class="token operator">:</span> vector<span class="token punctuation">)</span> <span class="token punctuation">{</span>
             observer<span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span>goldenCudgel<span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后，我们定义一个观察者的接口，包含观察者收到通知之后的“动作”。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">interface</span> <span class="token class-name">Observer</span> <span class="token punctuation">{</span>
    <span class="token keyword">void</span> <span class="token function">update</span><span class="token punctuation">(</span><span class="token class-name">String</span> goldenCudgel<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这时候我们再分别定义出“土地”、“雷公电母”、“龙王”的观察者实体类，实现具体的打雷下雨等动作。</p><p><strong>“雷公电母”、“龙王”等实现与“土地”类似，故此处仅展示观察者“土地”。</strong></p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyGuardianObserver</span> <span class="token keyword">implements</span> <span class="token class-name">Observer</span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">update</span><span class="token punctuation">(</span><span class="token class-name">String</span> goldenCudgel<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span><span class="token function">upGoldenCudgel</span><span class="token punctuation">(</span>goldenCudgel<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">&quot;土地公公出现了&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token keyword">boolean</span> <span class="token function">upGoldenCudgel</span><span class="token punctuation">(</span><span class="token class-name">String</span> goldenCudgel<span class="token punctuation">)</span><span class="token punctuation">{</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span><span class="token class-name">Objects</span><span class="token punctuation">.</span><span class="token function">equals</span><span class="token punctuation">(</span>goldenCudgel<span class="token punctuation">,</span><span class="token string">&quot;down&quot;</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着，我们就可以定义被观察者的具体实现类“孙悟空”了</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MonkeyKingSubject</span> <span class="token keyword">extends</span> <span class="token class-name">Subject</span><span class="token punctuation">{</span>
    
    <span class="token doc-comment comment">/**
     * 金箍棒是举起来还是放下呢？哈哈，你猜猜。。。
     **/</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">doGoldenCudgel</span><span class="token punctuation">(</span><span class="token class-name">String</span> goldenCudgel<span class="token punctuation">)</span><span class="token punctuation">{</span>
        <span class="token function">notifyObserver</span><span class="token punctuation">(</span>goldenCudgel<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最后我们来做个测试看看他们能不能响应孙悟空的通知。</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@PostMapping</span>
<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">observerTest</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
    <span class="token class-name">MonkeyKingSubject</span> subject <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">MonkeyKingSubject</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    subject<span class="token punctuation">.</span><span class="token function">addObserver</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ThunderGodObserver</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    subject<span class="token punctuation">.</span><span class="token function">addObserver</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">MyGuardianObserver</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    subject<span class="token punctuation">.</span><span class="token function">addObserver</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">DragonKingObserver</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    subject<span class="token punctuation">.</span><span class="token function">doGoldenCudgel</span><span class="token punctuation">(</span><span class="token string">&quot;up&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">&quot;我是分割线-----------------------------&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    subject<span class="token punctuation">.</span><span class="token function">doGoldenCudgel</span><span class="token punctuation">(</span><span class="token string">&quot;down&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>结果展示</p><div class="language-xml line-numbers-mode" data-ext="xml"><pre class="language-xml"><code>雷公电母发出电闪雷鸣
龙王前来下雨
我是分割线-----------------------------
土地公公出现了
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>故事的最后怎么能少的了总结呢？观察者模式与事件通知机制都是在一对多的关系中，当一个对象被修改时，则会自动通知依赖它的对象，两者之间相互独立，互相解耦，这样既省去了反复检索状态的资源消耗，也能够得到最高的反馈速度。</p><p>当然它的缺点也不容忽视：</p><ol><li>如果一个被观察者对象有很多的直接和间接的观察者的话，将所有的观察者都通知到会花费很多时间;</li><li>如果在观察者和观察目标之间有循环依赖的话，观察目标会触发它们之间进行循环调用，可能导致系统崩溃;</li><li>观察者模式没有相应的机制让观察者知道所观察的目标对象是怎么发生变化的，而仅仅只是知道观察目标发生了变化;</li></ol><p>文章的最后，照例奉上源码，后台回复 <code>event</code> 即可获取。</p>`,42),c=[t];function o(l,i){return s(),a("div",null,c)}const d=n(p,[["render",o],["__file","事件通知机制与观察者模式详细讲解.html.vue"]]);export{d as default};
