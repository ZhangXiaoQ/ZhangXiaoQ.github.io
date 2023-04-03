import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
	{ 
		text: "文章", 
		icon: "discover", 
		link: "/cheetah/" 
	},
	{
		text: "Gitee",
		icon: "gitee",
		link: "https://gitee.com/zhangxiaoQ",
	},
/**  {
    text: "指南",
    icon: "creative",
    prefix: "/guide/",
    children: [
      {
        text: "Bar",
        icon: "creative",
        prefix: "bar/",
        children: ["baz", { text: "...", icon: "more", link: "" }],
      },
      {
        text: "Foo",
        icon: "config",
        prefix: "foo/",
        children: ["ray", { text: "...", icon: "more", link: "" }],
      },
    ],
  },*/
]);
