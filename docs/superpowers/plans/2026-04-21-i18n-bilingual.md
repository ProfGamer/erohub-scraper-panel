# i18n 双语支持 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `erohub-scraper-panel` 前端引入 `react-i18next`，提供中（默认）/英双语切换，所有前端自生成文本走翻译表；用户数据、后端文本、Bold 霓虹淫语保持原样。

**Architecture:** 初始化 i18next 实例 + 建立类型化翻译对象（`en.ts` 为 key 权威源、`zh.ts` 同构）+ 薄封装 `I18nContext` 管持久化 + Sidebar 增加语言切换按钮。按 P0→P3 分批迁移组件，每批可独立验收。

**Tech Stack:** React 19 · Vite 8 · TypeScript · react-i18next · i18next · localStorage

**Spec:** `docs/superpowers/specs/2026-04-21-i18n-bilingual-design.md`

---

## File Structure

**Create:**
- `src/i18n/index.ts` — i18next 实例初始化
- `src/i18n/types.ts` — 模块扩展，为 `t()` 提供类型补全
- `src/i18n/locales/en.ts` — 英文翻译对象（key 权威源，`as const`）
- `src/i18n/locales/zh.ts` — 中文翻译对象
- `src/contexts/I18nContext.tsx` — Provider：`useI18n()` 返回 `{ lang, setLang, toggleLang }`

**Modify:**
- `src/main.tsx` — 导入 `./i18n` 触发 init；包 `I18nProvider`
- `src/components/Sidebar.tsx` — 新增 Globe 语言按钮 + 全部文本 i18n
- `src/components/Layout.tsx` — 无文本，无需改动（仅验证）
- `src/components/Dashboard.tsx` — 全部文本 i18n
- `src/pages/*.tsx`（6 个 page）— 页面标题与主按钮 i18n
- `src/components/AuthorList.tsx` / `AuthorCard.tsx` / `AuthorForm.tsx`
- `src/components/GroupList.tsx` / `GroupDetail.tsx` / `GroupForm.tsx`
- `src/components/MediaGrid.tsx` / `MediaPreview.tsx` / `PostCard.tsx` / `FilterBar.tsx`
- `src/components/TaskList.tsx` / `TaskProgress.tsx` / `FetchActivityBar.tsx` / `Settings.tsx`
- `src/pages/CallbackPage.tsx` / `UnauthorizedPage.tsx`
- `package.json` / `package-lock.json` — 新增依赖

**Unchanged（不动）:**
- `src/index.css` / `src/main.tsx` 以外的 `src/App.tsx`
- `src/hooks/*`（内部无面向用户文本）
- `src/api/*`（无面向用户文本）
- `src/auth/*`（AuthContext 内部错误用 `console.error` 不翻译）
- Bold 霓虹淫语（`MediaGrid.tsx:23-29` 的 `TEASERS` 数组）— 保留原中文
- 后端返回的 `bio`/`location`/Post `text`/Author `display_name` 等数据

---

## Task 1: 安装依赖

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: 安装 `i18next` 与 `react-i18next`**

在 `D:\Code\erohub-scraper-panel` 下运行（PowerShell）:
```powershell
npm install i18next react-i18next
```

Expected: `package.json` 的 `dependencies` 新增这两个包，lockfile 被更新，无报错。

- [ ] **Step 2: 验证 dev server 仍能启动**

```powershell
npm run dev
```
Expected: 开发服务器启动在 `http://localhost:5174`，首页可加载，浏览器 console 无新增 error。按 Ctrl+C 停止。

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore(i18n): install i18next and react-i18next"
```

---

## Task 2: 建立 i18n 骨架（en/zh/index/types）

**Files:**
- Create: `src/i18n/locales/en.ts`
- Create: `src/i18n/locales/zh.ts`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/types.ts`

- [ ] **Step 1: 创建 `src/i18n/locales/en.ts`（仅骨架，足以覆盖 P0）**

```ts
export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    add: "Add",
    remove: "Remove",
    confirm: "Confirm",
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
} as const;
```

- [ ] **Step 2: 创建 `src/i18n/locales/zh.ts`（同构）**

```ts
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
```

- [ ] **Step 3: 创建 `src/i18n/index.ts`**

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
    // localStorage unavailable — fall through to default
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

- [ ] **Step 4: 创建 `src/i18n/types.ts`**

```ts
import type { en } from "./locales/en";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}
```

- [ ] **Step 5: 强约束：`zh` 结构必须与 `en` 一致**

编辑 `src/i18n/locales/zh.ts`，在文件末尾添加编译期校验：
```ts
// 放在文件末尾
import type { en } from "./en";
type _Check = typeof zh extends typeof en ? true : false;
const _check: _Check = true;
void _check;
```

注意：上面的校验只防止 `zh` 缺少键；若要严格同构（互相子集），可在后续任务补充。本步足以防止遗漏。

- [ ] **Step 6: 类型检查**

```powershell
npm run build
```
Expected: `tsc -b` 与 `vite build` 全通过，无报错。

- [ ] **Step 7: Commit**

```powershell
git add src/i18n
git commit -m "feat(i18n): scaffold i18next instance and locale files"
```

---

## Task 3: I18nContext Provider

**Files:**
- Create: `src/contexts/I18nContext.tsx`

- [ ] **Step 1: 创建 `src/contexts/I18nContext.tsx`**

```tsx
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

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
```

- [ ] **Step 2: 类型检查**

```powershell
npm run build
```
Expected: 通过。

- [ ] **Step 3: Commit**

```powershell
git add src/contexts/I18nContext.tsx
git commit -m "feat(i18n): add I18nContext provider with persistence"
```

---

## Task 4: 在 main.tsx 挂载 Provider

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: 编辑 `src/main.tsx`，增加 `import "./i18n"` 与 `I18nProvider` 包裹**

将文件整体替换为：
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import App from "./App";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 2: 启动 dev server 验证**

```powershell
npm run dev
```
打开浏览器：
- 页面正常加载
- 浏览器 console 有 i18next 的 debug 日志输出（因为 `debug: import.meta.env.DEV` 为 true），但无 error
- 清除 `localStorage['erohub-lang']` 后刷新，页面仍正常

按 Ctrl+C 停止。

- [ ] **Step 3: Commit**

```powershell
git add src/main.tsx
git commit -m "feat(i18n): mount I18nProvider in app root"
```

---

## Task 5: Sidebar 语言切换按钮 + Sidebar 文本 i18n

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 重写 `src/components/Sidebar.tsx`，接入 useTranslation、useI18n，替换所有硬编码文本，插入语言切换按钮**

```tsx
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";

const links = [
  { to: "/",         labelKey: "sidebar.dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { to: "/groups",   labelKey: "sidebar.groups",    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { to: "/authors",  labelKey: "sidebar.authors",   icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/browse",   labelKey: "sidebar.browse",    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/posts",    labelKey: "sidebar.posts",     icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { to: "/tasks",    labelKey: "sidebar.tasks",     icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { to: "/settings", labelKey: "sidebar.settings",  icon: [
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ] },
] as const;

const themeIcons: Record<string, string> = {
  dark: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  light: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  bold: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
};

export default function Sidebar() {
  const { t } = useTranslation();
  const { lang, toggleLang } = useI18n();
  const { theme, cycleTheme, handleLogoClick, nsfw, toggleNsfw } = useTheme();

  return (
    <aside
      className="w-60 flex flex-col h-screen sticky top-0 border-r overflow-y-auto"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-color)" }}
    >
      {/* Logo — brand name 'EroHub' is not translated */}
      <button
        onClick={handleLogoClick}
        className="p-4 text-xl border-b text-left select-none"
        style={{ borderColor: "var(--border-color)" }}
      >
        <span
          className="font-bold"
          style={{
            background: "linear-gradient(135deg, var(--accent-pink), var(--accent-blue))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ero
        </span>
        <span
          style={{
            background: "linear-gradient(135deg, var(--accent-pink), var(--accent-blue))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: 0.6,
          }}
        >
          Hub
        </span>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className="nav-glow"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 1rem",
              marginBottom: "0.25rem",
              borderRadius: "0.5rem",
              transition: "all 150ms ease",
              borderLeft: "3px solid",
              color: isActive ? "var(--accent-pink)" : "var(--text-secondary)",
              background: isActive ? "var(--sidebar-active)" : "transparent",
              borderLeftColor: isActive ? "var(--accent-pink)" : "transparent",
            })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              {Array.isArray(link.icon) ? link.icon.map((d, i) => <path key={i} d={d} />) : <path d={link.icon} />}
            </svg>
            <span>{t(link.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls: NSFW → Lang → Theme */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--border-color)" }}>
        <button
          onClick={toggleNsfw}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
          style={{ color: nsfw ? "var(--accent-pink)" : "var(--text-muted)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            {nsfw ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
          <span className="text-sm">{nsfw ? t("sidebar.nsfw") : t("sidebar.sfw")}</span>
        </button>

        <button
          onClick={toggleLang}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title={t("sidebar.language")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span className="text-sm">{lang === "zh-CN" ? "中文" : "English"}</span>
        </button>

        <button
          onClick={cycleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={themeIcons[theme]} />
          </svg>
          <span className="text-sm capitalize">{t("sidebar.themeMode", { theme })}</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 浏览器验收**

```powershell
npm run dev
```
打开 `http://localhost:5174`：
- Sidebar 默认显示中文（仪表盘 / 分组 / 作者 / 浏览 / 推文 / 任务 / 设置）
- 底部三按钮顺序：NSFW → 🌐 中文 → dark 模式（或 light/bold）
- 点击 🌐 按钮，整个 Sidebar 文本切换成英文（Dashboard / Groups / …）；按钮文本变为 "English"
- 再次点击，切回中文
- 刷新页面，语言设置保留
- Console 可能有部分 P1/P2/P3 的 "missingKey" warn（正常，后续任务会补）

按 Ctrl+C 停止。

- [ ] **Step 3: Commit**

```powershell
git add src/components/Sidebar.tsx
git commit -m "feat(i18n): add language toggle in sidebar and translate nav"
```

---

## Task 6: Dashboard 迁移（P0）

**Files:**
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh.ts`
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: 在 `en.ts` 顶层对象中追加 `dashboard` 命名空间**

在 `sidebar: { ... },` 之后、末尾 `} as const;` 之前插入：
```ts
  dashboard: {
    stats: {
      groups: "Groups",
      authors: "Authors",
      posts: "Posts",
      mediaFiles: "Media Files",
    },
    topAuthors: "Top Authors",
    period: { "1d": "24H", "1w": "7D", "1m": "30D", all: "All" },
    noDataForPeriod: "No data for this period",
    latestMedia: "Latest Media",
    storage: "Storage",
    videoBadge: "VIDEO",
    postsMediaShort: "{{posts}}p / {{media}}m",
  },
```

- [ ] **Step 2: 在 `zh.ts` 顶层对象中追加 `dashboard` 命名空间**

同一位置插入：
```ts
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
```

- [ ] **Step 3: 改 `src/components/Dashboard.tsx`**

在顶部增加 import：
```tsx
import { useTranslation } from "react-i18next";
```

在函数组件开头加：
```tsx
const { t } = useTranslation();
```

替换以下硬编码文本：

| 位置 | 原文 | 替换为 |
|---|---|---|
| `statCards` 数组中 `label: "Groups"` | `"Groups"` | `t("dashboard.stats.groups")` |
| 同上 `"Authors"` | `"Authors"` | `t("dashboard.stats.authors")` |
| 同上 `"Posts"` | `"Posts"` | `t("dashboard.stats.posts")` |
| 同上 `"Media Files"` | `"Media Files"` | `t("dashboard.stats.mediaFiles")` |
| `<h2>Top Authors</h2>` | `Top Authors` | `{t("dashboard.topAuthors")}` |
| `PERIOD_LABELS[p]` | 整个 `PERIOD_LABELS` 常量 | 替换为 `t(\`dashboard.period.${p}\`)` |
| "No data for this period" 文本节点 | `No data for this period` | `{t("dashboard.noDataForPeriod")}` |
| `{author.post_count}p / {author.media_count}m` | 整段 | `{t("dashboard.postsMediaShort", { posts: author.post_count, media: author.media_count })}` |
| `<h2>Latest Media</h2>` | `Latest Media` | `{t("dashboard.latestMedia")}` |
| `VIDEO` 文本节点 | `VIDEO` | `{t("dashboard.videoBadge")}` |
| `<h2>Storage</h2>` | `Storage` | `{t("dashboard.storage")}` |

同时：**删除 `PERIOD_LABELS` 常量**（不再需要），把 `{PERIOD_LABELS[p]}` 改成 `{t(\`dashboard.period.${p}\`)}`。

`fmtBytes` / `fmtCount` 中的 `B/KB/MB/GB/TB` 与 `K/M` 保留不变（国际化惯例）。

- [ ] **Step 4: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
访问 `/`：
- 中文：标题卡显示 "分组 / 作者 / 推文 / 媒体文件"
- "顶级作者" 区的时间段按钮：24时 / 7天 / 30天 / 全部
- "最新媒体"、"存储" 区显示中文
- 切到英文，所有文本变英文
- `fmtBytes`、`fmtCount` 的数字格式（1.5K、2 MB 等）不变

按 Ctrl+C 停止。

- [ ] **Step 5: Commit**

```powershell
git add src/i18n/locales/en.ts src/i18n/locales/zh.ts src/components/Dashboard.tsx
git commit -m "feat(i18n): translate Dashboard component"
```

---

## Task 7: Page 标题与主按钮（P1）

**Files:**
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Modify: `src/pages/AuthorsPage.tsx`
- Modify: `src/pages/GroupsPage.tsx`
- Modify: `src/pages/BrowsePage.tsx`
- Modify: `src/pages/PostsPage.tsx`
- Modify: `src/pages/TasksPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: 在 `en.ts` 追加 pages 命名空间**

```ts
  pages: {
    authors: {
      title: "Authors",
      addAuthor: "+ Add Author",
    },
    groups: {
      title: "Groups",
      newGroup: "+ New Group",
    },
    browse: {
      title: "Browse",
    },
    posts: {
      title: "Posts",
      totalCount: "{{count}} posts",
    },
    tasks: {
      title: "Tasks",
    },
    settings: {
      title: "Settings",
    },
  },
```

- [ ] **Step 2: 在 `zh.ts` 追加相同命名空间**

```ts
  pages: {
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
    },
    tasks: {
      title: "任务",
    },
    settings: {
      title: "设置",
    },
  },
```

- [ ] **Step 3: 改 `src/pages/AuthorsPage.tsx`**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthorForm from "../components/AuthorForm";
import AuthorList from "../components/AuthorList";

export default function AuthorsPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("pages.authors.title")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
          style={{ background: "var(--gradient-primary)" }}
        >
          {t("pages.authors.addAuthor")}
        </button>
      </div>
      {showForm && <AuthorForm onClose={() => setShowForm(false)} />}
      <AuthorList />
    </div>
  );
}
```

- [ ] **Step 4: 改 `src/pages/GroupsPage.tsx`**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GroupForm from "../components/GroupForm";
import GroupList from "../components/GroupList";

export default function GroupsPage() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("pages.groups.title")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-glow text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110"
          style={{ background: "var(--gradient-primary)" }}
        >
          {t("pages.groups.newGroup")}
        </button>
      </div>
      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
      <GroupList />
    </div>
  );
}
```

- [ ] **Step 5: 改 `src/pages/BrowsePage.tsx`**

只替换 `<h1>Browse</h1>` 这一行（Bold 模式下隐藏的那个）。在文件顶部加：
```tsx
import { useTranslation } from "react-i18next";
```
函数体第一行加：
```tsx
const { t } = useTranslation();
```
把 `<h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Browse</h1>` 的 `Browse` 改成 `{t("pages.browse.title")}`。其余部分不动。

- [ ] **Step 6: 改 `src/pages/PostsPage.tsx`**

在顶部 import 加入：
```tsx
import { useTranslation } from "react-i18next";
```
函数体第一行加：
```tsx
const { t } = useTranslation();
```
把 `<h1>...Posts</h1>` 改为 `{t("pages.posts.title")}`。
把 `{data.pages[0]?.total ?? 0} posts` 改为 `{t("pages.posts.totalCount", { count: data.pages[0]?.total ?? 0 })}`。
把 `No posts found.` 留到 P2 的 PostsPage 相关任务 — 这里先不动（它在 JSX 中，下一个任务统一处理）。

实际上 `No posts found.` 也在 PostsPage 里，一并处理更整洁。**追加 key**：在 `en.ts`/`zh.ts` 的 `pages.posts` 下加：
- en: `emptyState: "No posts found."`
- zh: `emptyState: "暂无推文。"`

然后把 `<div className="mt-8 text-center" style={{ color: "var(--text-muted)" }}>No posts found.</div>` 的 `No posts found.` 改为 `{t("pages.posts.emptyState")}`。

- [ ] **Step 7: 改 `src/pages/TasksPage.tsx`**

```tsx
import { useTranslation } from "react-i18next";
import TaskList from "../components/TaskList";

export default function TasksPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>{t("pages.tasks.title")}</h1>
      <TaskList />
    </div>
  );
}
```

- [ ] **Step 8: 改 `src/pages/SettingsPage.tsx`**

```tsx
import { useTranslation } from "react-i18next";
import Settings from "../components/Settings";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>{t("pages.settings.title")}</h1>
      <Settings />
    </div>
  );
}
```

- [ ] **Step 9: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
访问每个页面（/authors、/groups、/browse、/posts、/tasks、/settings），确认标题与主按钮文本在中/英之间正确切换。

按 Ctrl+C 停止。

- [ ] **Step 10: Commit**

```powershell
git add src/i18n src/pages
git commit -m "feat(i18n): translate page titles and primary buttons"
```

---

## Task 8: Group 相关组件迁移（GroupList / GroupDetail / GroupForm）

**Files:**
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Modify: `src/components/GroupList.tsx`
- Modify: `src/components/GroupDetail.tsx`
- Modify: `src/components/GroupForm.tsx`

- [ ] **Step 1: 扩充 `en.ts` / `zh.ts` 的 `groups` 命名空间**

在 `en.ts` 的 `pages` 之后（顶层）新增：
```ts
  groups: {
    list: {
      loading: "Loading groups...",
      empty: "No groups yet.",
      stats: { authors: "Authors", posts: "Posts", media: "Media" },
      fetchAll: "Fetch All",
      deleteConfirm: "Delete group \"{{name}}\"?",
    },
    detail: {
      fetchAll: "Fetch All",
      groupName: "Group name",
      descriptionPlaceholder: "Description (optional)",
      stats: { authors: "Authors", posts: "Posts", media: "Media" },
      authors: "Authors",
      assignExisting: "+ Assign Existing",
      newAuthor: "+ New Author",
      usernamePlaceholder: "Username (e.g. @MixMico3)",
      addToGroup: "Add to Group",
      adding: "Adding...",
      addFailed: "Failed — username may already exist.",
      ungroupedHint: "Ungrouped authors — click to add to this group",
      noUngrouped: "No ungrouped authors available.",
      noAuthors: "No authors in this group yet.",
      removeFromGroup: "Remove from group",
    },
    form: {
      title: "New Group",
      namePlaceholder: "Group name",
      descriptionPlaceholder: "Description (optional)",
      create: "Create",
    },
  },
```

在 `zh.ts` 同位置：
```ts
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
```

- [ ] **Step 2: 改 `src/components/GroupList.tsx`**

顶部 import 加：
```tsx
import { useTranslation } from "react-i18next";
```
函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `<div style={{ color: "var(--text-muted)" }}>No groups yet.</div>` | 文字改为 `{t("groups.list.empty")}` |
| stats 区三个 `<div className="text-xs font-medium" ...>Authors</div>` | 分别为 `{t("groups.list.stats.authors")}` / `.posts` / `.media` |
| `Fetch All` | `{t("groups.list.fetchAll")}` |
| `Delete` | `{t("common.delete")}` |
| `` `Delete group "${g.name}"?` `` | `t("groups.list.deleteConfirm", { name: g.name })` |

- [ ] **Step 3: 改 `src/components/GroupDetail.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `placeholder="Group name"` | `placeholder={t("groups.detail.groupName")}` |
| `placeholder="Description (optional)"` | `placeholder={t("groups.detail.descriptionPlaceholder")}` |
| `Save` | `{t("common.save")}` |
| `Cancel` | `{t("common.cancel")}` |
| `Fetch All` | `{t("groups.detail.fetchAll")}` |
| 三个 stats label `Authors` / `Posts` / `Media` | 分别 `{t("groups.detail.stats.authors")}` / `.posts` / `.media` |
| `<h3 ...>Authors</h3>` | `{t("groups.detail.authors")}` |
| `+ Assign Existing` | `{t("groups.detail.assignExisting")}` |
| `+ New Author` | `{t("groups.detail.newAuthor")}` |
| `placeholder="Username (e.g. @MixMico3)"` | `placeholder={t("groups.detail.usernamePlaceholder")}` |
| `Adding...` | `{t("groups.detail.adding")}` |
| `Add to Group` | `{t("groups.detail.addToGroup")}` |
| `Failed — username may already exist.` | `{t("groups.detail.addFailed")}` |
| `Ungrouped authors — click to add to this group` | `{t("groups.detail.ungroupedHint")}` |
| `No ungrouped authors available.` | `{t("groups.detail.noUngrouped")}` |
| `No authors in this group yet.` | `{t("groups.detail.noAuthors")}` |
| `title="Remove from group"` | `title={t("groups.detail.removeFromGroup")}` |

- [ ] **Step 4: 改 `src/components/GroupForm.tsx`**

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createGroup } from "../api/groups";

export default function GroupForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      onClose();
    },
  });

  return (
    <div
      className="card-glow rounded-2xl p-6 mb-4 border transition-colors duration-300"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
    >
      <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("groups.form.title")}</h3>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name, description: description || undefined }); }}>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          placeholder={t("groups.form.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
          placeholder={t("groups.form.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-glow text-white px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gradient-primary)" }}
          >
            {t("groups.form.create")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
打开 `/groups`：
- 列表中 "全部抓取 / 删除" 按钮、stats label 中文正确
- 点 "新建分组" 表单标题与占位符中文
- 点某个 group 进入详情，所有文本中文
- 切英文再次验证

按 Ctrl+C 停止。

- [ ] **Step 6: Commit**

```powershell
git add src/i18n src/components/GroupList.tsx src/components/GroupDetail.tsx src/components/GroupForm.tsx
git commit -m "feat(i18n): translate Group list/detail/form components"
```

---

## Task 9: Author 相关组件迁移（AuthorList / AuthorCard / AuthorForm）

**Files:**
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Modify: `src/components/AuthorList.tsx`
- Modify: `src/components/AuthorCard.tsx`
- Modify: `src/components/AuthorForm.tsx`

- [ ] **Step 1: 扩充 `en.ts` 的 `authors` 命名空间**

顶层新增：
```ts
  authors: {
    list: {
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
      empty: "No authors yet.",
    },
    card: {
      status: {
        active: "active",
        paused: "paused",
        error: "error",
      },
      stats: {
        followers: "Followers",
        likes: "Likes",
        posts: "Posts",
        media: "Media",
      },
      lastFetched: "Last fetched: {{when}}",
      fetchNow: "Fetch Now",
      fetching: "Fetching...",
      pause: "Pause",
      resume: "Resume",
    },
    form: {
      title: "Add Author",
      usernamePlaceholder: "Username (e.g. elonmusk)",
      displayNamePlaceholder: "Display name (optional)",
      noGroup: "No group",
      addFailed: "Failed to add author. Username may already exist.",
    },
  },
```

- [ ] **Step 2: 扩充 `zh.ts` 的 `authors` 命名空间**

```ts
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
```

- [ ] **Step 3: 改 `src/components/AuthorList.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。

把 `SORT_OPTIONS` 的 `label` 字段全部删除，改为从翻译函数取：
```ts
const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: "name",      labelKey: "authors.list.sort.name" },
  { key: "followers", labelKey: "authors.list.sort.followers" },
  { key: "media",     labelKey: "authors.list.sort.media" },
  { key: "posts",     labelKey: "authors.list.sort.posts" },
  { key: "recent",    labelKey: "authors.list.sort.recent" },
  { key: "status",    labelKey: "authors.list.sort.status" },
];
```
把 `{opt.label}` 改为 `{t(opt.labelKey)}`。

其他替换：
| 原文 | 替换 |
|---|---|
| `Sort by` | `{t("authors.list.sortBy")}` |
| `{authors.length} authors` | `{t("authors.list.count", { count: authors.length })}` |
| `No authors yet.` | `{t("authors.list.empty")}` |

- [ ] **Step 4: 改 `src/components/AuthorCard.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `{author.status}` 文本节点 | `{t(\`authors.card.status.${author.status as "active" \| "paused" \| "error"}\`)}` |
| stats 四个 label `Followers` / `Likes` / `Posts` / `Media` | 分别 `{t("authors.card.stats.followers")}` / `.likes` / `.posts` / `.media` |
| `` Last fetched: {new Date(author.last_fetched_at).toLocaleString()} `` | `{t("authors.card.lastFetched", { when: new Date(author.last_fetched_at).toLocaleString() })}` |
| `Fetch Now` | `{t("authors.card.fetchNow")}` |
| `Fetching...` | `{t("authors.card.fetching")}` |
| `Pause` / `Resume` 三元 | `{author.status === "active" ? t("authors.card.pause") : t("authors.card.resume")}` |
| `Delete` | `{t("common.delete")}` |

- [ ] **Step 5: 改 `src/components/AuthorForm.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `<h3 ...>Add Author</h3>` | `{t("authors.form.title")}` |
| `placeholder="Username (e.g. elonmusk)"` | `placeholder={t("authors.form.usernamePlaceholder")}` |
| `placeholder="Display name (optional)"` | `placeholder={t("authors.form.displayNamePlaceholder")}` |
| `<option value="">No group</option>` | `{t("authors.form.noGroup")}` |
| `Add` | `{t("common.add")}` |
| `Cancel` | `{t("common.cancel")}` |
| `Failed to add author. Username may already exist.` | `{t("authors.form.addFailed")}` |

- [ ] **Step 6: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
访问 `/authors`：
- 排序工具栏中文（排序 / 姓名 / 粉丝 / 媒体 / 推文 / 最近抓取 / 状态）
- `{n} 位作者` 计数正确
- AuthorCard 状态徽标（活跃/暂停/错误）、stats label、按钮中文
- "添加作者" 表单字段 placeholder 中文
- 切英文所有文本变英文

按 Ctrl+C 停止。

- [ ] **Step 7: Commit**

```powershell
git add src/i18n src/components/AuthorList.tsx src/components/AuthorCard.tsx src/components/AuthorForm.tsx
git commit -m "feat(i18n): translate Author list/card/form components"
```

---

## Task 10: Browse/Posts 相关组件（FilterBar / MediaGrid / MediaPreview / PostCard）

**Files:**
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/components/MediaGrid.tsx`
- Modify: `src/components/MediaPreview.tsx`
- Modify: `src/components/PostCard.tsx`

- [ ] **Step 1: 扩充翻译对象（`en.ts`）**

```ts
  filterBar: {
    types: {
      all: "All types",
      image: "Images",
      video: "Videos",
      gif: "GIFs",
    },
    allGroups: "All groups",
    allAuthors: "All authors",
  },
  mediaGrid: {
    select: "Select",
    cancel: "Cancel",
    selectedCount: "{{count}} selected",
    deleteSelected: "Delete Selected",
    deleting: "Deleting...",
    fileCount: "{{count}} files",
    empty: "No media found.",
    videoBadge: "VIDEO",
  },
  mediaPreview: {
    mediaSection: "Media ({{count}})",
    viewOnX: "View on X",
  },
```

- [ ] **Step 2: 扩充 `zh.ts`**

```ts
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
```

- [ ] **Step 3: 改 `src/components/FilterBar.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原 option | 替换文本 |
|---|---|
| `All types` | `{t("filterBar.types.all")}` |
| `Images` | `{t("filterBar.types.image")}` |
| `Videos` | `{t("filterBar.types.video")}` |
| `GIFs` | `{t("filterBar.types.gif")}` |
| `All groups` | `{t("filterBar.allGroups")}` |
| `All authors` | `{t("filterBar.allAuthors")}` |

- [ ] **Step 4: 改 `src/components/MediaGrid.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。

**注意：`TEASERS` 数组（霓虹淫语）保留不动。**

替换：
| 原文 | 替换 |
|---|---|
| `No media found.` | `{t("mediaGrid.empty")}` |
| `Cancel` / `Select` 三元 | `{selectMode ? t("mediaGrid.cancel") : t("mediaGrid.select")}` |
| `{selected.size} selected` | `{t("mediaGrid.selectedCount", { count: selected.size })}` |
| `Deleting...` | `{t("mediaGrid.deleting")}` |
| `Delete Selected` | `{t("mediaGrid.deleteSelected")}` |
| `{data.pages[0]?.total ?? 0} files` | `{t("mediaGrid.fileCount", { count: data.pages[0]?.total ?? 0 })}` |
| `VIDEO` 文本节点 | `{t("mediaGrid.videoBadge")}` |

- [ ] **Step 5: 改 `src/components/MediaPreview.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `Media ({list.length})` | `{t("mediaPreview.mediaSection", { count: list.length })}` |
| `View on X` | `{t("mediaPreview.viewOnX")}` |

- [ ] **Step 6: 改 `src/components/PostCard.tsx`**

`PostCard` 主要是数据展示，无硬编码面向用户的 UI 文本（`fmtCount`、`formatRelativeTime` 生成的 "5s / 3m / 2h" 保留英文简写作为紧凑格式）。**无需改动。** 仅在 `page` 层 `Posts` 页的标题和 empty state 已在 Task 7 处理。

- [ ] **Step 7: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
- `/browse`：FilterBar 所有 option、工具栏 Select/Cancel/计数、空态文案中文；Bold 模式下切换前后霓虹淫语保持中文不变
- `/posts`：page 标题、空态文案 ok
- 点开任何媒体进入 preview；若是 posts 模式，左面板 "Media (N)" 变中文；"View on X" 链接变 "在 X 上查看"
- 切英文，全部正确
- Console 无漏翻 warn

按 Ctrl+C 停止。

- [ ] **Step 8: Commit**

```powershell
git add src/i18n src/components/FilterBar.tsx src/components/MediaGrid.tsx src/components/MediaPreview.tsx
git commit -m "feat(i18n): translate FilterBar, MediaGrid, MediaPreview"
```

---

## Task 11: Tasks 相关组件（TaskList / TaskProgress / FetchActivityBar）

**Files:**
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/TaskProgress.tsx`
- Modify: `src/components/FetchActivityBar.tsx`

- [ ] **Step 1: 扩充翻译对象（`en.ts`）**

```ts
  tasks: {
    list: {
      fetchAllActive: "Fetch All Active",
      starting: "Starting...",
      fetching: "Fetching...",
      empty: "No tasks yet.",
    },
    progress: {
      status: {
        pending: "pending",
        running: "running",
        completed: "completed",
        error: "error",
      },
      completedItems: "{{count}} items",
    },
  },
  fetchActivity: {
    phases: {
      downloading: "Downloading",
      processing: "Processing metadata",
      saving: "Saving to database",
      done: "Done",
    },
    phaseFilesSuffix: " ({{count}} files)",
    phaseItemsSuffix: " ({{count}} items)",
    headerOne: "Fetching 1 author",
    headerMany: "Fetching {{count}} authors",
    filesDownloaded: "{{count}} files downloaded",
    complete: "Fetch complete — {{count}} items fetched",
  },
```

- [ ] **Step 2: 扩充 `zh.ts`**

```ts
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
```

- [ ] **Step 3: 改 `src/components/TaskList.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `Starting...` | `{t("tasks.list.starting")}` |
| `Fetching...` | `{t("tasks.list.fetching")}` |
| `Fetch All Active` | `{t("tasks.list.fetchAllActive")}` |
| `No tasks yet.` | `{t("tasks.list.empty")}` |

- [ ] **Step 4: 改 `src/components/TaskProgress.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。

替换状态文案：
```tsx
<div className="text-sm" style={statusStyle}>
  {t(`tasks.progress.status.${task.status as "pending" | "running" | "completed" | "error"}`)}
</div>
```

替换 `{task.total} items` 为：
```tsx
{t("tasks.progress.completedItems", { count: task.total })}
```

- [ ] **Step 5: 改 `src/components/FetchActivityBar.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。

**删除** `PHASE_LABELS` 常量。重写 `phaseLabel(t: TaskStatus)` 函数，改成接收第二个参数 `translate`（rename 以避 react-i18next 的 `t` 同名）：

由于 `phaseLabel` 在组件顶层函数里，改成组件内的函数或直接内联。内联方式更清晰：

把：
```tsx
const PHASE_LABELS: Record<string, string> = { ... };
function phaseLabel(t: TaskStatus): string { ... }
```
**整块删除**。

在组件内部新增：
```tsx
const phaseLabel = (task: TaskStatus): string => {
  const base = t(`fetchActivity.phases.${task.phase as "downloading" | "processing" | "saving" | "done"}`, { defaultValue: task.phase });
  if (task.phase === "downloading" && task.progress > 0) {
    return base + t("fetchActivity.phaseFilesSuffix", { count: task.progress });
  }
  if ((task.phase === "processing" || task.phase === "saving") && task.total > 0) {
    return base + t("fetchActivity.phaseItemsSuffix", { count: task.total });
  }
  return base;
};
```

替换 `{phaseLabel(t)}` 改为 `{phaseLabel(t)}` — 注意这里参数名 `t` 与 i18next 的 `t` 冲突。把 `running.map((t) => ...)` 里的 `t` 改为 `task`（整块重命名 iter 变量），以免与 `t()` 混淆：

检查 `running.map((t) => ...)` 和 `errors.map((t) => ...)` 两处循环，将 iter 变量全部从 `t` 改为 `task`；把用到 `t.author_username`、`t.error`、`t.id`、`t.phase`、`t.progress` 等的地方也相应改为 `task.*`。

替换顶层文本：
| 原文 | 替换 |
|---|---|
| `` `Fetching ${running.length} ${running.length === 1 ? "author" : "authors"}` `` | `{running.length === 1 ? t("fetchActivity.headerOne") : t("fetchActivity.headerMany", { count: running.length })}` |
| `{totalDownloaded} files downloaded` | `{t("fetchActivity.filesDownloaded", { count: totalDownloaded })}` |
| `` `Fetch complete — ${completedSnapshot!.reduce(...)} items fetched` `` | `{t("fetchActivity.complete", { count: completedSnapshot!.reduce((s, task) => s + (task.total || 0), 0) })}` |

（注意里面的 reduce 变量名也要从 `t` 改成 `task`）

- [ ] **Step 6: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
- `/tasks`：按钮、空态中文；触发一个抓取（`/authors` 对某 author 点 "立即抓取"），回到 `/tasks` 观察状态切换、完成态文本
- 顶部 FetchActivityBar 在抓取期间展开，阶段文本（下载中 / 处理元数据 / 写入数据库）正确；完成后横幅文本正确
- 切英文再次跑一次

按 Ctrl+C 停止。

- [ ] **Step 7: Commit**

```powershell
git add src/i18n src/components/TaskList.tsx src/components/TaskProgress.tsx src/components/FetchActivityBar.tsx
git commit -m "feat(i18n): translate TaskList, TaskProgress, FetchActivityBar"
```

---

## Task 12: Settings 组件 + Callback/Unauthorized 页（P3 扫尾）

**Files:**
- Modify: `src/i18n/locales/en.ts`, `src/i18n/locales/zh.ts`
- Modify: `src/components/Settings.tsx`
- Modify: `src/pages/CallbackPage.tsx`
- Modify: `src/pages/UnauthorizedPage.tsx`

- [ ] **Step 1: 扩充翻译对象（`en.ts`）**

```ts
  settings: {
    loading: "Loading...",
    fetchInterval: "Fetch Interval (minutes)",
    maxConcurrent: "Max Concurrent Fetches",
    dataDirectory: "Data Directory",
    cookiesDirectory: "Cookies Directory",
  },
  auth: {
    callback: {
      loginFailed: "Login Failed",
      backToHome: "Back to Home",
    },
    unauthorized: {
      title: "Access Denied",
      loggedInAs: "Logged in as: {{name}}",
      unknownUser: "Unknown",
      roleRequired: "You need the <0>bot_admin</0> role to access this panel.",
      logoutAndRetry: "Logout & Try Another Account",
    },
  },
```

- [ ] **Step 2: 扩充 `zh.ts`**

```ts
  settings: {
    loading: "加载中...",
    fetchInterval: "抓取间隔（分钟）",
    maxConcurrent: "最大并发抓取数",
    dataDirectory: "数据目录",
    cookiesDirectory: "Cookies 目录",
  },
  auth: {
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
```

- [ ] **Step 3: 改 `src/components/Settings.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `Loading...` | `{t("settings.loading")}` |
| `Fetch Interval (minutes)` | `{t("settings.fetchInterval")}` |
| 两个 `Save` 按钮 | `{t("common.save")}` |
| `Max Concurrent Fetches` | `{t("settings.maxConcurrent")}` |
| `Data Directory` | `{t("settings.dataDirectory")}` |
| `Cookies Directory` | `{t("settings.cookiesDirectory")}` |

- [ ] **Step 4: 改 `src/pages/CallbackPage.tsx`**

顶部加 `import { useTranslation } from "react-i18next";`；函数体开头加 `const { t } = useTranslation();`。替换：

| 原文 | 替换 |
|---|---|
| `Login Failed` | `{t("auth.callback.loginFailed")}` |
| `Back to Home` | `{t("auth.callback.backToHome")}` |

- [ ] **Step 5: 改 `src/pages/UnauthorizedPage.tsx`**

因为 `You need the <code>bot_admin</code> role ...` 中间嵌了 `<code>`，使用 react-i18next 的 `<Trans>` 组件：

```tsx
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../auth/AuthContext";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const name = user?.profile?.name || user?.profile?.preferred_username || t("auth.unauthorized.unknownUser");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">{t("auth.unauthorized.title")}</h1>
        <p className="text-gray-500 text-sm mb-1">
          {t("auth.unauthorized.loggedInAs", { name })}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          <Trans i18nKey="auth.unauthorized.roleRequired">
            You need the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">bot_admin</code> role to access this panel.
          </Trans>
        </p>
        <button
          onClick={() => logout()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("auth.unauthorized.logoutAndRetry")}
        </button>
      </div>
    </div>
  );
}
```

注意：`<Trans>` 里的 `<0>` / `</0>` 对应的是**组件按位置编号**（第 0 个子元素是那个 `<code>`）。为保险起见，使用命名占位（`<code>`）更稳，可改写为：
```tsx
<Trans
  i18nKey="auth.unauthorized.roleRequired"
  components={{ 0: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono" /> }}
/>
```
并保持翻译里 `<0>bot_admin</0>` 作为 placeholder。**采用第二种写法，避免子元素位置变化时失效。**

最终 UnauthorizedPage 的 `<p>` 渲染改为：
```tsx
<p className="text-gray-500 text-sm mb-6">
  <Trans
    i18nKey="auth.unauthorized.roleRequired"
    components={{ 0: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono" /> }}
  />
</p>
```

- [ ] **Step 6: 类型检查 + 浏览器验收**

```powershell
npm run build
```
Expected: 通过。

```powershell
npm run dev
```
- `/settings`：所有 label 中文、Save 按钮中文
- Auth 流程（若当前未登录，默认已拦截）：手动触发 `/auth/callback?code=abc&state=xxx` 会报 error，测试 "登录失败 / 返回首页" 文案
- 未授权场景：手动将 `localStorage` 里的 `bot_admin` 角色移除（如果 AuthContext 用的是 oidc token），或单独在 `/unauthorized` 路由访问（如存在）查看效果 — 若不易触发，仅做代码和构建验证

按 Ctrl+C 停止。

- [ ] **Step 7: Commit**

```powershell
git add src/i18n src/components/Settings.tsx src/pages/CallbackPage.tsx src/pages/UnauthorizedPage.tsx
git commit -m "feat(i18n): translate Settings and auth callback/unauthorized pages"
```

---

## Task 13: 漏翻扫描与补漏

**Files:**
- Modify: 任何被发现漏翻的组件 + 对应的 `en.ts` / `zh.ts`

- [ ] **Step 1: 运行 dev server，翻遍每个路由**

```powershell
npm run dev
```

逐个访问并切换中/英语言：
- `/` Dashboard
- `/groups` + 点开一个 group detail
- `/authors` + 点 "添加作者"
- `/browse` + 打开一个 media preview
- `/posts` + 打开一个 post preview
- `/tasks` + 触发一次抓取观察 FetchActivityBar
- `/settings`

- [ ] **Step 2: 打开浏览器 console，搜索漏翻 warn**

i18next `debug: true` 会在 console 打印 `i18next::translator: missingKey ...`。每见一条：
1. 找出是哪个组件触发的
2. 在对应命名空间补 key（`en.ts` 和 `zh.ts` 同步）
3. 修改组件使用 `t()` 引用

若 console 无此类 warn，说明全部迁移完整，跳到 Step 4。

- [ ] **Step 3: 对每个漏翻处，edit 组件 + 翻译文件，然后重复 Step 2**

（循环直到 console 无 missingKey warn）

- [ ] **Step 4: 最终类型检查与构建**

```powershell
npm run build
```
Expected: 通过。

- [ ] **Step 5: Commit（若有补漏）**

```powershell
git add src/i18n src/components src/pages
git commit -m "feat(i18n): patch missing translations found in walkthrough"
```

（如无补漏，跳过 commit）

---

## Task 14: 最终验收清单

**Files:** 无（纯验收）

- [ ] **Step 1: 清 localStorage 首次访问验证默认语言**

浏览器 DevTools → Application → Local Storage → 删除 `erohub-lang` key。刷新页面。
Expected: Sidebar 与所有可见文本为中文。

- [ ] **Step 2: 切换至英文并刷新**

点 Sidebar 🌐 按钮 → 所有文本变英文。
刷新页面。
Expected: 仍为英文；Local Storage 中 `erohub-lang = "en"`。

- [ ] **Step 3: Bold 模式特殊行为**

点 logo 5 次（3 秒内）解锁 Bold 模式，再切到 Bold。进入 `/browse`，键盘上下左右导航到一张图，查看底部浮动 teaser 文字（霓虹淫语）。
Expected: teaser 文字保持中文（"想看更多吗？" 等），与当前界面语言无关。

- [ ] **Step 4: 数据不受翻译影响**

在 `/authors` 查看某个 author 的 `bio` / `location`（由后端返回，可能是英文或日文）。
Expected: 原样显示，不被翻译。

- [ ] **Step 5: console 无 missingKey warn**

DevTools console → 过滤 `missingKey`。
Expected: 无结果。

- [ ] **Step 6: `npm run build` 通过**

```powershell
npm run build
```
Expected: 无 error、无 type error。

- [ ] **Step 7: 所有变更已 commit**

```powershell
git status
```
Expected: working tree clean（或只有与本次 i18n 无关的预存在改动）。

```powershell
git log --oneline -20
```
Expected: 能看到 i18n 相关的一串 commit。

---

## Self-Review Notes

- **Spec coverage**: 决策 1-8 全部在任务中体现（Task 2 锁定默认 zh-CN；Task 10 明确 Bold teaser 不翻；Tasks 5-12 覆盖所有组件；Task 13 漏翻扫描对应 `debug: true` + fallback）
- **类型一致**: `useI18n()` 在 Task 3 定义，`toggleLang` 在 Task 5 调用；translation key 全部在 `en.ts` 声明再在组件引用；`TaskStatus.phase` 的四种值在 `fetchActivity.phases` 下完全对齐
- **文件路径一致**: 所有路径用 `src/` 开头，与仓库实际布局一致
- **不破坏 AuthContext**: 故意没有在 `main.tsx` 把 `I18nProvider` 放到 `AuthProvider` 里面，因为 CallbackPage 与 UnauthorizedPage 都调用了 `t()`，而它们渲染时 `AuthProvider` 已经挂载，但 `I18nProvider` 必须在外层才能让这些页面也能翻译
- **`useTranslation` 命名冲突**: Task 11 已明确指出 `FetchActivityBar` 中把循环 iter 变量 `t` 改名为 `task` 以避免和 `t()` 冲突

---

## What's Not Covered

按 spec 明确排除，本计划**不**涉及：
- 后端 i18n
- 用户生成数据翻译（bio、post text、display_name）
- Bold 模式霓虹淫语翻译
- 日期 / 数字本地化格式
- 复数规则
- RTL 支持
- i18n 单元测试
- 漏翻扫描脚本（Task 13 靠肉眼 + console 扫描）
