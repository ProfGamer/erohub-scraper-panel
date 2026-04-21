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
  dashboard: {
    stats: {
      groups: "分组",
      authors: "作者",
      posts: "推文",
      mediaFiles: "媒体文件",
    },
    topAuthors: "顶级作者",
    period: { "1d": "24时", "1w": "7天", "1m": "30天", all: "全部" },
    noDataForPeriod: "当前区间暂无数据",
    latestMedia: "最新媒体",
    storage: "存储",
    videoBadge: "视频",
    postsMediaShort: "{{posts}}推 / {{media}}媒",
  },
  pages: {
    dashboard: {
      title: "仪表盘",
    },
    authors: {
      title: "作者",
      addAuthor: "+ 添加作者",
    },
    groups: {
      title: "分组",
      newGroup: "+ 新建分组",
    },
    browse: {
      title: "浏览",
    },
    posts: {
      title: "推文",
      totalCount: "{{count}} 条推文",
      emptyState: "暂无推文。",
    },
    tasks: {
      title: "任务",
    },
    settings: {
      title: "设置",
    },
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
