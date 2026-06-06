# EroHub Scraper Panel — UI Redesign & Group Fetch

## Overview

Redesign the entire frontend with a Neon Pink/Cyan theme system (dark/light/bold modes), add group-level fetch, and enrich Dashboard, Group pages, and global UI.

**Repos:**
- Frontend: `D:\Code\erohub-scraper-panel` (React 19 + Vite + Tailwind v4 + TanStack Query)
- Backend: `D:\Code\erohub-media-scraper-server` (FastAPI + SQLAlchemy async + SQLite)

---

## 1. Theme System

### 1.1 Three Modes

| Mode | Background | Accent | Surface | Border |
|------|-----------|--------|---------|--------|
| **Dark** (default) | `#080810` | `#ec4899` / `#06b6d4` | `#0f0f1a` | `#1a1a2e` |
| **Light** | `#f8f7ff` | `#db2777` / `#0891b2` | `#ffffff` | `#ede9fe` |
| **Bold** (hidden) | `#050508` | `#ff2d8a` / `#00f0ff` (saturated) | `#0a0a14` | glow pulse `#ec4899` |

### 1.2 Implementation

- CSS custom properties defined in `index.css` via Tailwind v4 `@theme` blocks inside `@media (prefers-color-scheme)` and `.dark`/`.light`/`.bold` class selectors on `<html>`.
- Theme state stored in `localStorage` key `erohub-theme` with values `dark` | `light` | `bold`.
- On first visit: read `prefers-color-scheme` to pick dark/light. Bold is never auto.
- React context `ThemeContext` exposes `{ theme, setTheme, isBoldUnlocked }`.

### 1.3 CSS Variables (subset)

```
--bg-primary, --bg-surface, --bg-surface-hover
--border-primary, --border-subtle
--text-primary, --text-secondary, --text-muted
--accent-pink, --accent-cyan
--gradient-primary: linear-gradient(135deg, var(--accent-pink), var(--accent-cyan))
```

### 1.4 Theme Toggle

- Sidebar bottom: sun/moon icon button, cycles dark <-> light.
- When Bold is unlocked, the cycle becomes dark -> light -> bold -> dark.

### 1.5 Bold Mode Unlock

- Trigger: click the Sidebar logo ("EroHub") 5 times within 3 seconds.
- On unlock: brief flash animation, `isBoldUnlocked` set to `true`, stored in `localStorage` key `erohub-bold-unlocked`.
- Bold mode extras (CSS-only, no React logic):
  - `@keyframes glow-pulse` on card borders — 2s infinite alternate between `#ec489966` and `#06b6d466`.
  - `@keyframes float-particles` — CSS background with radial-gradient dots that drift upward, applied to `body::before` as a fixed overlay with `pointer-events: none`.
  - Sidebar nav links: `text-shadow` glow on hover.
  - Primary buttons: `box-shadow` breathing animation (scale pulse 0.98-1.02 + glow).

---

## 2. Backend Changes

### 2.1 Group Fetch Endpoint

**`POST /api/groups/{group_id}/fetch`** in `routers/groups.py`

- Load all authors in the group where `status == 'active'`.
- For each, check `_is_author_running()` (import from tasks module), skip if already running.
- Create `asyncio.create_task(_run_fetch(...))` for each.
- Return `{"message": "Fetch started for N authors (M already running)"}`.
- 202 status code.

### 2.2 Top Authors Stats Endpoint

**`GET /api/stats/top-authors?period=1d|1w|1m|all&limit=5`** in `routers/tasks.py` (or a new `routers/stats.py` to keep things clean — preferred).

- `period` param: `1d` = last 24h, `1w` = last 7 days, `1m` = last 30 days, `all` = no time filter.
- Query: join `Post` with `Author`, filter `Post.posted_at >= cutoff`, group by `Author.id`, count posts and count media (via subquery or joined count), order by post_count desc, limit.
- Return: `[{ "author_id", "username", "display_name", "profile_image", "post_count", "media_count" }]`.

### 2.3 Enhanced Stats Endpoint

Extend `GET /api/stats` to include:
- `storage_bytes`: sum of `Media.file_size` (already nullable in DB, sum non-null).
- `recent_media`: last 8 media items (id, type, post_id) for the dashboard preview grid.
- `groups`: list of `{ id, name, author_count, post_count, media_count }` for group cards.

### 2.4 Group Stats in Group List

Extend `GET /api/groups` response: each group includes `post_count` and `media_count` (via subquery joins). Update `GroupOut` schema.

---

## 3. Frontend — Dashboard Redesign

### 3.1 Layout

Top-down:
1. **Stats row** — 4 cards: Groups, Authors, Posts, Media Files. Gradient numbers, trend text.
2. **Two-column row:**
   - Left: **Author Leaderboard** — period selector (1D/1W/1M/All) as pill buttons, top 5 authors with avatar, name, post count, media count. Bar chart visual per entry.
   - Right: **Latest Media** — 2x4 thumbnail grid of most recent media, clickable.
3. **Storage card** — total size formatted (e.g. "18.2 GB"), horizontal bar segments per-author colored by gradient.

### 3.2 Data Fetching

- Stats: existing `GET /api/stats` (enhanced).
- Leaderboard: new `GET /api/stats/top-authors?period=1d`.
- Latest media: from enhanced stats response `recent_media` field, thumbnails via `mediaThumbnailUrl` / `mediaFileUrl`.

---

## 4. Frontend — Group Page Redesign

### 4.1 Group List Page

Replace plain list with rich cards:
- Each group card: icon (first letter gradient circle), name, description (truncated), stats row (authors / posts / media counts).
- **Fetch Group** button on each card — triggers `POST /api/groups/{id}/fetch`, shows spinner.
- "New Group" button in page header.

### 4.2 Group Detail Page

Already exists (shows group info + AuthorList). Enhance:
- Group stats at top (author/post/media counts).
- Fetch Group button.

---

## 5. Frontend — Global UI Upgrade

### 5.1 Sidebar

- Logo: "Ero" bold + "Hub" lighter, gradient text in bold mode.
- Navigation links with icons (inline SVG, not emoji — consistent sizing).
- Active link: left border accent + subtle background.
- Bottom section: theme toggle button + user info if available.
- Dark mode: `--bg-surface` background, `--border-primary` border.

### 5.2 All Cards / Surfaces

- Use `--bg-surface` background, `--border-primary` borders.
- Hover: `--bg-surface-hover`.
- Border-radius: 16px for cards, 10px for inner elements.

### 5.3 Buttons

- Primary: `--gradient-primary` background, white text.
- Outline: transparent background, `--accent-pink` border and text.
- Hover: slight brightness increase + translateY(-1px).
- Bold mode: glow shadow animation.

### 5.4 Badges / Status

- Active: `--accent-cyan` tinted background.
- Error: red tinted.
- Paused: amber/yellow tinted.

### 5.5 Pages to Update

All pages get the theme variables applied. Key changes:
- **AuthorCard**: themed card surface, gradient avatar fallback, themed badges.
- **PostCard**: themed background, footer icons already have color — adjust base color to theme muted text.
- **MediaGrid**: themed background on placeholders.
- **TaskList / TaskProgress**: themed cards.
- **Settings**: themed form inputs and cards.
- **FilterBar**: themed select dropdowns.
- **FetchActivityBar**: use accent colors instead of hardcoded blue/emerald.
- **MediaPreview**: themed modal backdrop.

---

## 6. File Structure Changes

### New files:
- `src/contexts/ThemeContext.tsx` — theme state, bold unlock, localStorage persistence.
- `src/components/ThemeToggle.tsx` — sidebar bottom toggle button.
- Backend: `app/routers/stats.py` — new stats router for top-authors and enhanced stats.

### Modified files:
- `src/index.css` — CSS variables for all 3 themes, bold mode animations.
- `src/components/Layout.tsx` — wrap with ThemeProvider.
- `src/components/Sidebar.tsx` — icons, theme toggle, logo with bold unlock.
- `src/components/Dashboard.tsx` — full redesign with leaderboard, media preview, storage.
- `src/pages/GroupsPage.tsx` — rich group cards with fetch button.
- `src/components/GroupList.tsx` — redesigned cards.
- `src/components/GroupDetail.tsx` — add stats + fetch button.
- `src/api/tasks.ts` — add fetchTopAuthors, fetchGroupFetch.
- `src/api/groups.ts` — add triggerGroupFetch.
- `src/types/index.ts` — add TopAuthor, EnhancedStats, EnhancedGroup types.
- Backend: `app/routers/groups.py` — add fetch endpoint, add post/media counts to list.
- Backend: `app/schemas.py` — update GroupOut.
- Backend: `app/main.py` — register stats router.
- All component files — replace hardcoded colors with CSS variable references.

---

## 7. Non-Goals

- No i18n changes (existing pattern preserved).
- No auth changes.
- No new npm dependencies (pure Tailwind v4 CSS + React).
- No chart library — leaderboard uses CSS bars, storage uses CSS segments.
