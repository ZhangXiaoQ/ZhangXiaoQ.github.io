const e=JSON.parse('{"key":"v-7865b0b4","path":"/cheetah/redis/Redis%20%E7%9A%84%E6%8C%81%E4%B9%85%E5%8C%96%E9%85%8D%E7%BD%AE.html","title":"Redis 的持久化配置","lang":"zh-CN","frontmatter":{"title":"Redis 的持久化配置","icon":"workingDirectory","order":4,"category":["Redis"],"tag":["Redis","持久化","RDB","AOF"],"description":"前边我们已经介绍了Redis五种数据类型的命令与配置文件的基本配置，今天让我们从理论和配置两个层面来揭开Redis持久化的神秘面纱。 所谓持久化可以简单理解为将内存中的数据保存到硬盘上存储的过程。持久化之后的数据在系统重启或者宕机之后依然可以进行访问，保证了数据的安全性。 Redis有两种持久化方案，一种是快照方式（SNAPSHOTTING），简称RD...","head":[["meta",{"property":"og:url","content":"https://vuepress-theme-hope-docs-demo.netlify.app/cheetah/redis/Redis%20%E7%9A%84%E6%8C%81%E4%B9%85%E5%8C%96%E9%85%8D%E7%BD%AE.html"}],["meta",{"property":"og:site_name","content":"阿Q说代码"}],["meta",{"property":"og:title","content":"Redis 的持久化配置"}],["meta",{"property":"og:description","content":"前边我们已经介绍了Redis五种数据类型的命令与配置文件的基本配置，今天让我们从理论和配置两个层面来揭开Redis持久化的神秘面纱。 所谓持久化可以简单理解为将内存中的数据保存到硬盘上存储的过程。持久化之后的数据在系统重启或者宕机之后依然可以进行访问，保证了数据的安全性。 Redis有两种持久化方案，一种是快照方式（SNAPSHOTTING），简称RD..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2023-04-03T08:02:23.000Z"}],["meta",{"property":"article:author","content":"阿Q"}],["meta",{"property":"article:tag","content":"Redis"}],["meta",{"property":"article:tag","content":"持久化"}],["meta",{"property":"article:tag","content":"RDB"}],["meta",{"property":"article:tag","content":"AOF"}],["meta",{"property":"article:modified_time","content":"2023-04-03T08:02:23.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Redis 的持久化配置\\",\\"image\\":[\\"\\"],\\"dateModified\\":\\"2023-04-03T08:02:23.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"阿Q\\",\\"url\\":\\"https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI5MDg2NjEzNA==#wechat_redirect\\"}]}"]]},"headers":[{"level":2,"title":"RDB","slug":"rdb","link":"#rdb","children":[{"level":3,"title":"配置文件","slug":"配置文件","link":"#配置文件","children":[]},{"level":3,"title":"理论","slug":"理论","link":"#理论","children":[]}]},{"level":2,"title":"AOF","slug":"aof","link":"#aof","children":[{"level":3,"title":"配置文件","slug":"配置文件-1","link":"#配置文件-1","children":[]},{"level":3,"title":"理论","slug":"理论-1","link":"#理论-1","children":[]}]},{"level":2,"title":"对比与总结","slug":"对比与总结","link":"#对比与总结","children":[{"level":3,"title":"如何选择使用哪种持久化方式？","slug":"如何选择使用哪种持久化方式","link":"#如何选择使用哪种持久化方式","children":[]},{"level":3,"title":"AOF和RDB之间的相互作用","slug":"aof和rdb之间的相互作用","link":"#aof和rdb之间的相互作用","children":[]},{"level":3,"title":"备份redis数据","slug":"备份redis数据","link":"#备份redis数据","children":[]},{"level":3,"title":"性能建议","slug":"性能建议","link":"#性能建议","children":[]}]}],"git":{"createdTime":1680508943000,"updatedTime":1680508943000,"contributors":[{"name":"zhangxiaoQ","email":"1004387130@qq.com","commits":1}]},"readingTime":{"minutes":12.99,"words":3896},"filePathRelative":"cheetah/redis/Redis 的持久化配置.md","localizedDate":"2023年4月3日","autoDesc":true}');export{e as data};
