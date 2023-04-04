import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/": [
    "",
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
    
    //"slides",
  ],
});
