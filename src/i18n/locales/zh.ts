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
  groups: {
    list: {
      loading: "加载分组中...",
      empty: "暂无分组。",
      stats: { authors: "作者", posts: "推文", media: "媒体" },
      fetchAll: "全部抓取",
      deleteConfirm: "删除分组 \"{{name}}\" 吗？",
    },
    detail: {
      fetchAll: "全部抓取",
      groupName: "分组名称",
      descriptionPlaceholder: "描述（可选）",
      stats: { authors: "作者", posts: "推文", media: "媒体" },
      authors: "作者",
      assignExisting: "+ 指派现有",
      newAuthor: "+ 新建作者",
      usernamePlaceholder: "用户名（例如 @MixMico3）",
      addToGroup: "加入分组",
      adding: "添加中...",
      addFailed: "失败 — 用户名可能已存在。",
      ungroupedHint: "未分组作者 — 点击加入此分组",
      noUngrouped: "没有可用的未分组作者。",
      noAuthors: "此分组暂无作者。",
      removeFromGroup: "从分组移除",
    },
    form: {
      title: "新建分组",
      namePlaceholder: "分组名称",
      descriptionPlaceholder: "描述（可选）",
      create: "创建",
    },
  },
  authors: {
    list: {
      sortBy: "排序",
      sort: {
        name: "姓名",
        followers: "粉丝",
        media: "媒体",
        posts: "推文",
        recent: "最近抓取",
        status: "状态",
      },
      count: "{{count}} 位作者",
      empty: "暂无作者。",
    },
    card: {
      status: {
        active: "活跃",
        paused: "暂停",
        error: "错误",
      },
      stats: {
        followers: "粉丝",
        likes: "点赞",
        posts: "推文",
        media: "媒体",
      },
      lastFetched: "最近抓取：{{when}}",
      fetchNow: "立即抓取",
      fetching: "抓取中...",
      pause: "暂停",
      resume: "恢复",
    },
    form: {
      title: "添加作者",
      usernamePlaceholder: "用户名（例如 elonmusk）",
      displayNamePlaceholder: "显示名称（可选）",
      noGroup: "无分组",
      addFailed: "添加作者失败。用户名可能已存在。",
    },
  },
  filterBar: {
    types: {
      all: "所有类型",
      image: "图片",
      video: "视频",
      gif: "GIF",
    },
    allGroups: "所有分组",
    allAuthors: "所有作者",
  },
  mediaGrid: {
    select: "选择",
    cancel: "取消",
    selectedCount: "已选 {{count}} 项",
    deleteSelected: "删除所选",
    deleting: "删除中...",
    fileCount: "{{count}} 个文件",
    empty: "暂无媒体。",
    videoBadge: "视频",
  },
  mediaPreview: {
    mediaSection: "媒体（{{count}}）",
    viewOnX: "在 X 上查看",
  },
  tasks: {
    list: {
      fetchAllActive: "抓取所有活跃",
      starting: "启动中...",
      fetching: "抓取中...",
      empty: "暂无任务。",
    },
    progress: {
      status: {
        pending: "等待中",
        running: "运行中",
        completed: "已完成",
        error: "错误",
      },
      completedItems: "{{count}} 项",
    },
  },
  fetchActivity: {
    phases: {
      downloading: "下载中",
      processing: "处理元数据",
      saving: "写入数据库",
      done: "完成",
    },
    phaseFilesSuffix: "（{{count}} 个文件）",
    phaseItemsSuffix: "（{{count}} 项）",
    headerOne: "正在抓取 1 位作者",
    headerMany: "正在抓取 {{count}} 位作者",
    filesDownloaded: "已下载 {{count}} 个文件",
    complete: "抓取完成 — 共获取 {{count}} 项",
  },
  settings: {
    loading: "加载中...",
    fetchInterval: "抓取间隔（分钟）",
    maxConcurrent: "最大并发抓取数",
    dataDirectory: "数据目录",
    cookiesDirectory: "Cookies 目录",
  },
  auth: {
    redirectingToLogin: "正在跳转登录...",
    callback: {
      loginFailed: "登录失败",
      backToHome: "返回首页",
    },
    unauthorized: {
      title: "访问被拒绝",
      loggedInAs: "当前登录：{{name}}",
      unknownUser: "未知",
      roleRequired: "需要 <0>bot_admin</0> 角色才能访问此面板。",
      logoutAndRetry: "退出登录并尝试其他账号",
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
