import type { en } from "./en";

export const zh = {
  common: {
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    loading: "加载中...",
    add: "添加",
    remove: "移除",
    confirm: "确认",
  },
  sidebar: {
    dashboard: "仪表盘",
    groups: "分组",
    authors: "作者",
    browse: "浏览",
    posts: "推文",
    tasks: "任务",
    settings: "设置",
    nsfw: "NSFW",
    sfw: "SFW",
    themeMode: "{{theme}} 模式",
    language: "中文 / English",
  },
} as const;

// Type check: ensure zh has the same keys/structure as en
type _Keys = keyof typeof zh extends keyof typeof en
  ? keyof typeof en extends keyof typeof zh
    ? true
    : false
  : false;
const _check: _Keys = true;
void _check;
