const e=JSON.parse('{"key":"v-41652411","path":"/cheetah/canal/%E5%AE%9E%E7%8E%B0%E7%BC%93%E5%AD%98%E5%92%8C%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%80%E8%87%B4%E6%80%A7%E6%96%B9%E6%A1%88%E5%AE%9E%E6%88%98.html","title":"实现缓存和数据库一致性方案实战","lang":"zh-CN","frontmatter":{"title":"实现缓存和数据库一致性方案实战","icon":"change","order":2,"category":["canal"],"tag":["缓存","数据一致性"],"description":"最近不是正好在研究 canal 嘛，刚巧前两天看了一篇关于解决缓存与数据库一致性问题的文章，里边提到了一种解决方案是结合 canal 来操作的，所以阿Q就想趁热打铁，手动来实现一下。 架构 文中提到的思想是： 采用先更新数据库，后删除缓存的方式来解决并发引发的一致性问题；; 采用异步重试的方式来保证“更新数据库、删除缓存”这两步都能执行成功；; 可以采...","head":[["meta",{"property":"og:url","content":"https://vuepress-theme-hope-docs-demo.netlify.app/cheetah/canal/%E5%AE%9E%E7%8E%B0%E7%BC%93%E5%AD%98%E5%92%8C%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%80%E8%87%B4%E6%80%A7%E6%96%B9%E6%A1%88%E5%AE%9E%E6%88%98.html"}],["meta",{"property":"og:site_name","content":"阿Q说代码"}],["meta",{"property":"og:title","content":"实现缓存和数据库一致性方案实战"}],["meta",{"property":"og:description","content":"最近不是正好在研究 canal 嘛，刚巧前两天看了一篇关于解决缓存与数据库一致性问题的文章，里边提到了一种解决方案是结合 canal 来操作的，所以阿Q就想趁热打铁，手动来实现一下。 架构 文中提到的思想是： 采用先更新数据库，后删除缓存的方式来解决并发引发的一致性问题；; 采用异步重试的方式来保证“更新数据库、删除缓存”这两步都能执行成功；; 可以采..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2023-04-04T01:24:17.000Z"}],["meta",{"property":"article:author","content":"阿Q"}],["meta",{"property":"article:tag","content":"缓存"}],["meta",{"property":"article:tag","content":"数据一致性"}],["meta",{"property":"article:modified_time","content":"2023-04-04T01:24:17.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"实现缓存和数据库一致性方案实战\\",\\"image\\":[\\"\\"],\\"dateModified\\":\\"2023-04-04T01:24:17.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"阿Q\\",\\"url\\":\\"https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI5MDg2NjEzNA==#wechat_redirect\\"}]}"]]},"headers":[{"level":2,"title":"架构","slug":"架构","link":"#架构","children":[]},{"level":2,"title":"环境准备","slug":"环境准备","link":"#环境准备","children":[{"level":3,"title":"Canal 配置","slug":"canal-配置","link":"#canal-配置","children":[]},{"level":3,"title":"数据库","slug":"数据库","link":"#数据库","children":[]}]},{"level":2,"title":"实战","slug":"实战","link":"#实战","children":[{"level":3,"title":"RabbitMQ 配置","slug":"rabbitmq-配置","link":"#rabbitmq-配置","children":[]},{"level":3,"title":"商品信息入缓存","slug":"商品信息入缓存","link":"#商品信息入缓存","children":[]},{"level":3,"title":"更新数据入MQ","slug":"更新数据入mq","link":"#更新数据入mq","children":[]},{"level":3,"title":"MQ接收数据","slug":"mq接收数据","link":"#mq接收数据","children":[]}]},{"level":2,"title":"拓展","slug":"拓展","link":"#拓展","children":[]}],"git":{"createdTime":1680571457000,"updatedTime":1680571457000,"contributors":[{"name":"ZhangXiaoQ","email":"1004387130@qq.com","commits":1}]},"readingTime":{"minutes":6.67,"words":2000},"filePathRelative":"cheetah/canal/实现缓存和数据库一致性方案实战.md","localizedDate":"2023年4月4日","autoDesc":true}');export{e as data};
