# i18n 双语支持 — 设计方案

**日期**: 2026-04-21
**范围**: `erohub-scraper-panel` 前端
**非范围**: 后端（`erohub-media-scraper-server`）不改动

## 目标

为前端面板引入中文（默认）与英文双语切换能力，全部前端自生成文本可翻译；用户生成内容、后端数据保留原样。

## 关键决策

| # | 决策 | 选择 |
|---|------|------|
| 1 | 默认语言 | `zh-CN` |
| 2 | Bold 模式霓虹淫语 | 不 i18n，保留原中文（氛围装饰） |
| 3 | 后端返回文本（bio / post text / 错误） | 视为数据，不翻译 |
| 4 | 语言切换入口 | Sidebar 底部第三个按钮（NSFW → Lang → Theme） |
| 5 | 翻译 key 组织 | 按组件/页面命名空间（`sidebar.dashboard` 等） |
| 6 | i18n 库 | `react-i18next` + `i18next` |
| 7 | 翻译文件格式 | TS 对象（`zh.ts` / `en.ts`），非 JSON |
| 8 | 漏翻处理 | `fallbackLng: 'en'` + dev 环境 `debug: true` 打 warn |

## 架构

### 组件划分

每个单元职责单一、边界清晰：

- `src/i18n/index.ts` — i18next 实例初始化与导出
- `src/i18n/locales/en.ts` — 英文翻译对象（key 权威源，用 `as const`）
- `src/i18n/locales/zh.ts` — 中文翻译对象，结构与 `en.ts` 完全对齐
- `src/i18n/types.ts` — 模块扩展，从 `en` 派生类型供 `useTranslation` 的 `t()` 补全
- `src/contexts/I18nContext.tsx` — 薄封装 Provider：`useI18n()` 返回 `{ lang, setLang, toggleLang }`
- `src/components/Sidebar.tsx` — 新增 Globe 图标 + 语言名按钮

### 数据流

```
用户点 Sidebar 语言按钮
  ↓
useI18n().toggleLang()
  ↓
i18n.changeLanguage(nextLang) + localStorage.setItem('erohub-lang', nextLang)
  ↓
react-i18next 触发所有 useTranslation 消费者 re-render
  ↓
t('xxx.yyy') 从新语言的 resources 取值
```

### 初始化流程

```
main.tsx 导入 ./i18n（触发 i18next.init）
  ↓
i18n.init 读 localStorage['erohub-lang']；
  若无或非 zh-CN/en，回退 zh-CN
  ↓
I18nProvider 包住 App
  ↓
任意组件 useTranslation() 或 useI18n()
```

## 翻译对象结构

### key 权威源：`src/i18n/locales/en.ts`

以下仅展示结构骨架，示例中 `/* 填充 */` 的命名空间（`groups` / `browse` / `posts` / `tasks` / `settings` / `fetchActivity` / `preview`）在 implementation 阶段按各组件实际文本逐步提取。

```ts
export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    confirm: "Confirm",
    add: "Add",
    remove: "Remove",
  },
  sidebar: {
    dashboard: "Dashboard",
    groups: "Groups",
    authors: "Authors",
    browse: "Browse",
    posts: "Posts",
    tasks: "Tasks",
    settings: "Settings",
    nsfw: "NSFW",
    sfw: "SFW",
    themeMode: "{{theme}} mode",
    language: "中文 / English",
  },
  dashboard: {
    title: "Dashboard",
    totalAuthors: "Total Authors",
    totalMedia: "Total Media",
    storage: "Storage",
    leaderboard: {
      title: "Author Leaderboard",
      period: { "1d": "1D", "1w": "1W", "1m": "1M", all: "All" },
    },
    latestMedia: "Latest Media",
  },
  authors: {
    title: "Authors",
    addAuthor: "+ Add Author",
    sortBy: "Sort by",
    sort: {
      name: "Name",
      followers: "Followers",
      media: "Media",
      posts: "Posts",
      recent: "Last Fetched",
      status: "Status",
    },
    count: "{{count}} authors",
    emptyState: "No authors yet.",
  },
  groups: { /* 填充 */ },
  browse: { /* 填充 */ },
  posts: { /* 填充 */ },
  tasks: { /* 填充 */ },
  settings: { /* 填充 */ },
  fetchActivity: { /* 填充 */ },
  preview: { /* 填充 */ },
} as const;
```

### 约定

- 全 camelCase；嵌套层级遵循 **页面/组件 → 功能块 → 具体项**
- 插值占位符统一 `{{name}}`（i18next 默认语法）
- `zh.ts` 必须与 `en.ts` 结构完全一致
- 类型派生从 `en` 出：`en` 是 key 权威源；`zh` 用 `typeof en` 约束即可

### 类型安全（`types.ts`）

```ts
import type { en } from "./locales/en";
declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}
```

→ `t("sidebar.dashbord")` 这种拼写错误在编译期就会被 TS 拦住。

## i18n 实例初始化（`src/i18n/index.ts`）

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

const LANG_KEY = "erohub-lang";

function getInitialLang(): "zh-CN" | "en" {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "zh-CN" || stored === "en") return stored;
  } catch {
    // localStorage 不可用（隐私模式）—— 忽略，走默认
  }
  return "zh-CN";
}

i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zh },
    en: { translation: en },
  },
  lng: getInitialLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  debug: import.meta.env.DEV,
});

export default i18n;
```

## I18nContext Provider（`src/contexts/I18nContext.tsx`）

```ts
import { createContext, useContext, useState, type ReactNode } from "react";
import i18n from "../i18n";

type Lang = "zh-CN" | "en";
const LANG_KEY = "erohub-lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(i18n.language as Lang);

  const setLang = (next: Lang) => {
    i18n.changeLanguage(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
  };

  const toggleLang = () => setLang(lang === "zh-CN" ? "en" : "zh-CN");

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
```

### Provider 挂载

在 `main.tsx` 中：

```tsx
import "./i18n"; // 先触发 init
import { I18nProvider } from "./contexts/I18nContext";

<I18nProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</I18nProvider>
```

## Sidebar 语言切换按钮

插入到 Sidebar 底部控件区（NSFW/SFW 之后，Theme 之前）：

```tsx
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";

const { t } = useTranslation();
const { lang, toggleLang } = useI18n();

<button
  onClick={toggleLang}
  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
  style={{ color: "var(--text-secondary)" }}
  title={t("sidebar.language")}
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={1.5}
       strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
  <span className="text-sm">{lang === "zh-CN" ? "中文" : "English"}</span>
</button>
```

三按钮垂直顺序：**NSFW/SFW → Language → Theme**。

## 组件迁移

### 迁移模式（所有组件统一手法）

```tsx
// Before
<h1>Authors</h1>

// After
import { useTranslation } from "react-i18next";
function AuthorsPage() {
  const { t } = useTranslation();
  return <h1>{t("authors.title")}</h1>;
}
```

### 优先级分层

- **P0 骨架**：`Sidebar` / `Layout` / `Dashboard` — 首屏可见
- **P1 页面壳**：`AuthorsPage` / `GroupsPage` / `BrowsePage` / `PostsPage` / `TasksPage` / `SettingsPage` 的标题、按钮
- **P2 功能组件**：`AuthorList` / `AuthorCard` / `AuthorForm` / `GroupList` / `GroupDetail` / `GroupForm` / `MediaGrid` / `MediaPreview` / `PostCard` / `TaskList` / `TaskProgress` / `Settings` / `FetchActivityBar`
- **P3 边缘**：`UnauthorizedPage` / `CallbackPage` / `FilterBar` / 错误态文案

### 排除项（不翻译）

- Bold 模式的霓虹淫语文本
- 后端返回的 `bio` / `location` / Post `text` / Author `display_name`
- 控制台 `error` / `warn`
- "EroHub" logo 品牌字
- `fmtCount` 的 K/M 后缀（国际化惯例保留英文）

## 错误处理

| 场景 | 行为 |
|------|------|
| 翻译 key 缺失 | `fallbackLng: 'en'` 兜底；dev 下 `debug: true` 打 warn；prod 静默 |
| localStorage 不可用（隐私模式） | `getInitialLang` try/catch，回退默认 `zh-CN`；`setLang` 内 try/catch，无持久化但可用 |
| 插值参数缺失 | i18next 默认渲染 `{{name}}` 原文，不崩溃 |
| `useI18n` 在 Provider 外调用 | 抛 `Error`（和 `useTheme` 一致） |

## 测试策略

手动验收为主 —— UI 迁移是机械工作，TS 类型 + 浏览器实测足够。

**类型检查**：`tsc -b` 必须通过（key 拼写错误靠 `CustomTypeOptions` 模块扩展捕获）。

**浏览器验收清单**：
1. 首次访问（清 localStorage）→ 显示中文
2. 点 Sidebar 语言按钮 → 切到英文；刷新后仍为英文
3. 切语言时所有可见页面文本立刻更新（无需刷新）
4. Bold 模式下霓虹淫语保持中文（英/中双模式下都如此）
5. Dashboard 统计数字、Author Card 的 bio/粉丝数等数据不受影响
6. Dev console 无漏翻 warn

**非目标**：本轮不引入 i18n 单元测试。

## 交付步骤分解

对应后续 implementation plan：

1. **基建**：装 `react-i18next` + `i18next`，建 `src/i18n/` 目录（`index.ts` / `types.ts` / `locales/en.ts` / `locales/zh.ts` 骨架）、`I18nContext`、`main.tsx` 挂载 —— 验收标准：打开页面正常，浏览器无报错
2. **Sidebar + P0**：Sidebar 语言按钮 + `Sidebar` / `Layout` / `Dashboard` 迁移，填充对应 en/zh key —— 验收标准：切换语言，P0 文本全变
3. **P1 页面壳**：六个 Page 文件的标题、主要按钮迁移
4. **P2 功能组件**：所有功能组件迁移
5. **P3 边缘 + 扫尾**：边缘页、错误态、FilterBar；巡视 dev console 修补漏翻

每步独立可验收，可分次推进，不必一气完成。

## 非目标（明确不做）

- 后端 i18n
- 数据翻译（用户生成内容保持原样）
- 日期/数字本地化格式
- 复数规则
- RTL 支持
- i18n 单元测试
- 漏翻扫描脚本（YAGNI，`debug: true` 够用；有必要时再补）
