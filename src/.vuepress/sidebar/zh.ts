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
      text: "Redis",
	  icon: "workingDirectory",
      prefix: "cheetah/redis",
      link: "cheetah/redis",
      children: "structure",
	  collapsible: true,
    },
	{
      text: "ES",
	  icon: "autumn",
      prefix: "cheetah/es",
      link: "cheetah/es",
      children: "structure",
	  collapsible: true,
    },
    
    //"slides",
  ],
});
