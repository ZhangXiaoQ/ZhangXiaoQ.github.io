import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/": [
    "",
	{
      text: "Java实战",
      icon: "java",
      prefix: "cheetah/java",
	  link: "cheetah/java",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "并发",
      icon: "rank",
      prefix: "cheetah/concurrent",
	  link: "cheetah/concurrent",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "JVM",
      icon: "storage",
      prefix: "cheetah/jvm",
	  link: "cheetah/jvm",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "MySQL",
	  icon: "mysql",
      prefix: "cheetah/mysql",
      link: "cheetah/mysql",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "Spring",
	  icon: "leaf",
      prefix: "cheetah/spring",
      link: "cheetah/spring",
      children: "structure",
	  collapsible: true,
    },
    {
      text: "Redis",
	  icon: "workingDirectory",
      prefix: "cheetah/redis",
      link: "cheetah/redis",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "RabbitMQ",
	  icon: "line",
      prefix: "cheetah/rabbitmq",
      link: "cheetah/rabbitmq",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "ElasticSearch",
	  icon: "autumn",
      prefix: "cheetah/es",
      link: "cheetah/es",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "canal",
	  icon: "change",
      prefix: "cheetah/canal",
      link: "cheetah/canal",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "身份、权限认证",
	  icon: "lock",
      prefix: "cheetah/lock",
      link: "cheetah/lock",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "工具推荐",
	  icon: "tool",
      prefix: "cheetah/tool",
      link: "cheetah/tool",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "随笔",
      icon: "write",
      prefix: "cheetah/write",
	  link: "cheetah/write",
      children: "structure",
	  collapsible: true,
    },
    
    //"slides",
  ],
});
