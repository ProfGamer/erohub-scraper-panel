# EroHub UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign entire frontend with Neon Pink/Cyan theme (dark/light/bold modes), add group-level fetch, and enrich Dashboard and Group pages.

**Architecture:** CSS custom properties for theming (3 modes via class on `<html>`), React context for state. New backend stats router and group fetch endpoint. Dashboard rebuilt with leaderboard, media preview, and storage stats. No new npm deps.

**Tech Stack:** React 19, Tailwind v4, Vite, TanStack Query, FastAPI, SQLAlchemy async, SQLite

---

## Task 1: Backend — Stats Router & Enhanced Stats

**Files:**
- Create: `app/routers/stats.py`
- Modify: `app/main.py:7,29-34`
- Modify: `app/routers/tasks.py:154-171` (move stats endpoint)

- [ ] **Step 1: Create `app/routers/stats.py` with enhanced stats and top-authors endpoints**

```python
import math
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Author, Group, Media, Post

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
async def get_stats(db: AsyncSession = Depends(get_db)):
    groups_count = (await db.execute(select(func.count(Group.id)))).scalar() or 0
    authors_count = (await db.execute(select(func.count(Author.id)))).scalar() or 0
    posts_count = (await db.execute(select(func.count(Post.id)))).scalar() or 0
    media_count = (await db.execute(select(func.count(Media.id)))).scalar() or 0
    storage_bytes = (await db.execute(select(func.coalesce(func.sum(Media.file_size), 0)))).scalar() or 0

    recent_media_stmt = (
        select(Media.id, Media.type, Media.post_id)
        .order_by(Media.downloaded_at.desc(), Media.id.desc())
        .limit(8)
    )
    recent_rows = (await db.execute(recent_media_stmt)).all()
    recent_media = [{"id": r.id, "type": r.type, "post_id": r.post_id} for r in recent_rows]

    group_stats_stmt = (
        select(
            Group.id,
            Group.name,
            func.count(func.distinct(Author.id)).label("author_count"),
            func.count(func.distinct(Post.id)).label("post_count"),
            func.count(Media.id).label("media_count"),
        )
        .outerjoin(Author, Author.group_id == Group.id)
        .outerjoin(Post, Post.author_id == Author.id)
        .outerjoin(Media, Media.post_id == Post.id)
        .group_by(Group.id)
    )
    group_rows = (await db.execute(group_stats_stmt)).all()
    groups = [
        {
            "id": r.id,
            "name": r.name,
            "author_count": r.author_count,
            "post_count": r.post_count,
            "media_count": r.media_count,
        }
        for r in group_rows
    ]

    return {
        "total_groups": groups_count,
        "total_authors": authors_count,
        "total_posts": posts_count,
        "total_media": media_count,
        "storage_bytes": storage_bytes,
        "recent_media": recent_media,
        "groups": groups,
    }


PERIOD_MAP = {
    "1d": timedelta(days=1),
    "1w": timedelta(weeks=1),
    "1m": timedelta(days=30),
}


@router.get("/top-authors")
async def get_top_authors(
    period: str = Query("all", pattern="^(1d|1w|1m|all)$"),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    post_count_sub = (
        select(
            Post.author_id,
            func.count(Post.id).label("post_count"),
        )
        .group_by(Post.author_id)
    )
    media_count_sub = (
        select(
            Post.author_id,
            func.count(Media.id).label("media_count"),
        )
        .join(Media, Media.post_id == Post.id)
        .group_by(Post.author_id)
    )

    if period != "all":
        cutoff = datetime.utcnow() - PERIOD_MAP[period]
        post_count_sub = post_count_sub.where(Post.posted_at >= cutoff)
        media_count_sub = media_count_sub.where(Post.posted_at >= cutoff)

    post_sub = post_count_sub.subquery()
    media_sub = media_count_sub.subquery()

    stmt = (
        select(
            Author.id,
            Author.username,
            Author.display_name,
            Author.profile_image,
            func.coalesce(post_sub.c.post_count, 0).label("post_count"),
            func.coalesce(media_sub.c.media_count, 0).label("media_count"),
        )
        .outerjoin(post_sub, post_sub.c.author_id == Author.id)
        .outerjoin(media_sub, media_sub.c.author_id == Author.id)
        .order_by(func.coalesce(post_sub.c.post_count, 0).desc())
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()
    return [
        {
            "author_id": r.id,
            "username": r.username,
            "display_name": r.display_name,
            "profile_image": r.profile_image,
            "post_count": r.post_count,
            "media_count": r.media_count,
        }
        for r in rows
    ]
```

- [ ] **Step 2: Register stats router in `app/main.py`**

Add import and include:
```python
from app.routers import authors, groups, media, posts, settings, stats, tasks
```
And add before the tasks router:
```python
app.include_router(stats.router)
```

- [ ] **Step 3: Remove old stats endpoint from `app/routers/tasks.py`**

Delete the `get_stats` function and its route (lines 154-171 in current file — the `@router.get("/api/stats")` block).

- [ ] **Step 4: Verify backend starts**

Run: `cd D:\Code\erohub-media-scraper-server && python -c "from app.main import app; print('OK')"`

- [ ] **Step 5: Commit**

```bash
git add app/routers/stats.py app/main.py app/routers/tasks.py
git commit -m "feat: add stats router with top-authors and enhanced stats"
```

---

## Task 2: Backend — Group Fetch Endpoint & Group Stats

**Files:**
- Modify: `app/routers/groups.py:1-68`
- Modify: `app/schemas.py:17-23`

- [ ] **Step 1: Update `GroupOut` schema in `app/schemas.py`**

Replace the existing `GroupOut` class:
```python
class GroupOut(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    author_count: int = 0
    post_count: int = 0
    media_count: int = 0

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Update `list_groups` in `app/routers/groups.py` to include post/media counts**

Replace the full `list_groups` function:
```python
@router.get("", response_model=list[GroupOut])
async def list_groups(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            Group,
            func.count(func.distinct(Author.id)).label("author_count"),
            func.count(func.distinct(Post.id)).label("post_count"),
            func.count(Media.id).label("media_count"),
        )
        .outerjoin(Author, Author.group_id == Group.id)
        .outerjoin(Post, Post.author_id == Author.id)
        .outerjoin(Media, Media.post_id == Post.id)
        .group_by(Group.id)
    )
    result = await db.execute(stmt)
    groups = []
    for row in result.all():
        group = row[0]
        group.author_count = row[1]
        group.post_count = row[2]
        group.media_count = row[3]
        groups.append(group)
    return groups
```

Update the import section at top of file — add missing models:
```python
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Author, Group, Media, Post
from app.schemas import GroupCreate, GroupOut, GroupUpdate
```

- [ ] **Step 3: Update `get_group` to include post/media counts**

Replace the full `get_group` function:
```python
@router.get("/{group_id}", response_model=GroupOut)
async def get_group(group_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            Group,
            func.count(func.distinct(Author.id)).label("author_count"),
            func.count(func.distinct(Post.id)).label("post_count"),
            func.count(Media.id).label("media_count"),
        )
        .outerjoin(Author, Author.group_id == Group.id)
        .outerjoin(Post, Post.author_id == Author.id)
        .outerjoin(Media, Media.post_id == Post.id)
        .where(Group.id == group_id)
        .group_by(Group.id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Group not found")
    row[0].author_count = row[1]
    row[0].post_count = row[2]
    row[0].media_count = row[3]
    return row[0]
```

- [ ] **Step 4: Add group fetch endpoint**

Add at the end of `app/routers/groups.py`, before the closing of the file:
```python
@router.post("/{group_id}/fetch", status_code=202)
async def trigger_group_fetch(group_id: int, db: AsyncSession = Depends(get_db)):
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    result = await db.execute(
        select(Author).where(Author.group_id == group_id, Author.status == "active")
    )
    authors = result.scalars().all()

    from app.routers.tasks import _is_author_running, _run_fetch

    started = 0
    for author in authors:
        if not _is_author_running(author.username):
            asyncio.create_task(_run_fetch(author.id, author.username, author.config_json))
            started += 1

    skipped = len(authors) - started
    return {"message": f"Fetch started for {started} authors ({skipped} already running)"}
```

- [ ] **Step 5: Also update `update_group` to return post/media counts**

Replace the `update_group` function:
```python
@router.put("/{group_id}", response_model=GroupOut)
async def update_group(group_id: int, body: GroupUpdate, db: AsyncSession = Depends(get_db)):
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if body.name is not None:
        group.name = body.name
    if body.description is not None:
        group.description = body.description
    await db.commit()
    await db.refresh(group)
    stmt = (
        select(
            func.count(func.distinct(Author.id)).label("author_count"),
            func.count(func.distinct(Post.id)).label("post_count"),
            func.count(Media.id).label("media_count"),
        )
        .outerjoin(Author, Author.group_id == Group.id)
        .outerjoin(Post, Post.author_id == Author.id)
        .outerjoin(Media, Media.post_id == Post.id)
        .where(Group.id == group_id)
    )
    counts = (await db.execute(stmt)).first()
    group.author_count = counts[0] if counts else 0
    group.post_count = counts[1] if counts else 0
    group.media_count = counts[2] if counts else 0
    return group
```

- [ ] **Step 6: Verify backend compiles**

Run: `cd D:\Code\erohub-media-scraper-server && python -c "from app.main import app; print('OK')"`

- [ ] **Step 7: Commit**

```bash
git add app/routers/groups.py app/schemas.py
git commit -m "feat: add group fetch endpoint and group stats"
```

---

## Task 3: Frontend — Theme System (CSS + Context)

**Files:**
- Rewrite: `src/index.css`
- Create: `src/contexts/ThemeContext.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Rewrite `src/index.css` with theme variables and bold animations**

```css
@import "tailwindcss";

/* ===== Dark theme (default) ===== */
:root,
.dark {
  --bg-primary: #080810;
  --bg-surface: #0f0f1a;
  --bg-surface-hover: #151528;
  --border-primary: #1a1a2e;
  --border-subtle: #12121f;
  --text-primary: #f0f0f5;
  --text-secondary: #a0a0b8;
  --text-muted: #606078;
  --accent-pink: #ec4899;
  --accent-cyan: #06b6d4;
  --accent-pink-muted: rgba(236, 72, 153, 0.15);
  --accent-cyan-muted: rgba(6, 182, 212, 0.15);
  --gradient-primary: linear-gradient(135deg, #ec4899, #06b6d4);
  --gradient-text: linear-gradient(135deg, #f9a8d4, #67e8f9);
  --sidebar-bg: #080810;
  --sidebar-active: rgba(236, 72, 153, 0.1);
  --sidebar-border: #1a1a2e;
  --input-bg: #0f0f1a;
  --input-border: #1a1a2e;
  --badge-active-bg: rgba(6, 182, 212, 0.15);
  --badge-active-text: #67e8f9;
  --badge-error-bg: rgba(239, 68, 68, 0.15);
  --badge-error-text: #fca5a5;
  --badge-paused-bg: rgba(234, 179, 8, 0.15);
  --badge-paused-text: #fde047;
  --overlay-bg: rgba(0, 0, 0, 0.8);
}

/* ===== Light theme ===== */
.light {
  --bg-primary: #f8f7ff;
  --bg-surface: #ffffff;
  --bg-surface-hover: #f3f0ff;
  --border-primary: #ede9fe;
  --border-subtle: #f5f3ff;
  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-pink: #db2777;
  --accent-cyan: #0891b2;
  --accent-pink-muted: rgba(219, 39, 119, 0.1);
  --accent-cyan-muted: rgba(8, 145, 178, 0.1);
  --gradient-primary: linear-gradient(135deg, #db2777, #0891b2);
  --gradient-text: linear-gradient(135deg, #be185d, #0e7490);
  --sidebar-bg: #ffffff;
  --sidebar-active: rgba(219, 39, 119, 0.08);
  --sidebar-border: #ede9fe;
  --input-bg: #ffffff;
  --input-border: #ede9fe;
  --badge-active-bg: rgba(8, 145, 178, 0.1);
  --badge-active-text: #0891b2;
  --badge-error-bg: rgba(239, 68, 68, 0.1);
  --badge-error-text: #dc2626;
  --badge-paused-bg: rgba(234, 179, 8, 0.1);
  --badge-paused-text: #a16207;
  --overlay-bg: rgba(0, 0, 0, 0.5);
}

/* ===== Bold theme ===== */
.bold {
  --bg-primary: #050508;
  --bg-surface: #0a0a14;
  --bg-surface-hover: #10102a;
  --border-primary: #1a1a3a;
  --border-subtle: #0f0f20;
  --text-primary: #f5f5ff;
  --text-secondary: #b0b0d0;
  --text-muted: #7070a0;
  --accent-pink: #ff2d8a;
  --accent-cyan: #00f0ff;
  --accent-pink-muted: rgba(255, 45, 138, 0.2);
  --accent-cyan-muted: rgba(0, 240, 255, 0.2);
  --gradient-primary: linear-gradient(135deg, #ff2d8a, #00f0ff);
  --gradient-text: linear-gradient(135deg, #ff6eb4, #40ffff);
  --sidebar-bg: #050508;
  --sidebar-active: rgba(255, 45, 138, 0.12);
  --sidebar-border: #1a1a3a;
  --input-bg: #0a0a14;
  --input-border: #1a1a3a;
  --badge-active-bg: rgba(0, 240, 255, 0.2);
  --badge-active-text: #40ffff;
  --badge-error-bg: rgba(255, 60, 60, 0.2);
  --badge-error-text: #ff8080;
  --badge-paused-bg: rgba(255, 200, 0, 0.2);
  --badge-paused-text: #ffdd44;
  --overlay-bg: rgba(0, 0, 0, 0.9);
}

/* ===== Global styles ===== */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* ===== Bold mode extras ===== */
.bold .card-glow {
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

.bold .btn-glow {
  animation: btn-breathe 2s ease-in-out infinite;
}

.bold .nav-glow:hover {
  text-shadow: 0 0 8px var(--accent-pink), 0 0 20px rgba(255, 45, 138, 0.3);
}

.bold body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 45, 138, 0.3), transparent),
    radial-gradient(1px 1px at 80% 20%, rgba(0, 240, 255, 0.3), transparent),
    radial-gradient(1px 1px at 50% 80%, rgba(255, 45, 138, 0.2), transparent),
    radial-gradient(1px 1px at 10% 60%, rgba(0, 240, 255, 0.2), transparent),
    radial-gradient(1px 1px at 70% 70%, rgba(255, 45, 138, 0.15), transparent),
    radial-gradient(1px 1px at 40% 10%, rgba(0, 240, 255, 0.15), transparent);
  animation: float-particles 12s ease-in-out infinite;
}

@keyframes glow-pulse {
  from { box-shadow: 0 0 8px rgba(236, 72, 153, 0.3), inset 0 0 8px rgba(236, 72, 153, 0.05); }
  to { box-shadow: 0 0 16px rgba(6, 182, 212, 0.3), inset 0 0 16px rgba(6, 182, 212, 0.05); }
}

@keyframes btn-breathe {
  0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(255, 45, 138, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 24px rgba(0, 240, 255, 0.4); }
}

@keyframes float-particles {
  0% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0); }
}

@keyframes flash-unlock {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* ===== Shared animations (from previous work) ===== */
@theme {
  --animate-shimmer: shimmer 1.5s ease-in-out infinite;
  --animate-indeterminate: indeterminate 1.5s ease-in-out infinite;
  --animate-fade-out: fadeOut 3s ease-in-out forwards;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes indeterminate {
  0% { width: 20%; transform: translateX(-100%); }
  50% { width: 40%; }
  100% { width: 20%; transform: translateX(400%); }
}

@keyframes fadeOut {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}
```

- [ ] **Step 2: Create `src/contexts/ThemeContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light" | "bold";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
  isBoldUnlocked: boolean;
  handleLogoClick: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("erohub-theme") as Theme | null;
  if (stored === "dark" || stored === "light" || stored === "bold") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isBoldUnlocked, setBoldUnlocked] = useState(
    () => localStorage.getItem("erohub-bold-unlocked") === "true",
  );
  const clickTimestamps = useRef<number[]>([]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("erohub-theme", t);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const order: Theme[] = isBoldUnlocked ? ["dark", "light", "bold"] : ["dark", "light"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      localStorage.setItem("erohub-theme", next);
      return next;
    });
  }, [isBoldUnlocked]);

  const handleLogoClick = useCallback(() => {
    if (isBoldUnlocked) return;
    const now = Date.now();
    clickTimestamps.current = [...clickTimestamps.current.filter((t) => now - t < 3000), now];
    if (clickTimestamps.current.length >= 5) {
      setBoldUnlocked(true);
      localStorage.setItem("erohub-bold-unlocked", "true");
      setTheme("bold");
    }
  }, [isBoldUnlocked, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light", "bold");
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, isBoldUnlocked, handleLogoClick }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 3: Wrap app with ThemeProvider in `src/main.tsx`**

Replace contents of `src/main.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/contexts/ThemeContext.tsx src/main.tsx
git commit -m "feat: add theme system with dark/light/bold modes"
```

---

## Task 4: Frontend — Sidebar Redesign

**Files:**
- Rewrite: `src/components/Sidebar.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Rewrite `src/components/Sidebar.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const links = [
  { to: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { to: "/groups", label: "Groups", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { to: "/authors", label: "Authors", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/browse", label: "Browse", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/posts", label: "Posts", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { to: "/tasks", label: "Tasks", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { to: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function Sidebar() {
  const { theme, cycleTheme, handleLogoClick } = useTheme();

  const themeIcon = theme === "light"
    ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    : theme === "bold"
    ? "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z";

  return (
    <aside
      className="w-60 flex flex-col min-h-screen border-r transition-colors duration-300"
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
    >
      <button
        onClick={handleLogoClick}
        className="px-5 py-5 text-xl font-extrabold tracking-tight text-left select-none"
        style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        Ero<span style={{ fontWeight: 400, opacity: 0.6 }}>Hub</span>
      </button>

      <nav className="flex-1 px-3 space-y-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `nav-glow flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "border-l-[3px]"
                  : "border-l-[3px] border-transparent"
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent-pink)" : "var(--text-secondary)",
              background: isActive ? "var(--sidebar-active)" : "transparent",
              borderLeftColor: isActive ? "var(--accent-pink)" : "transparent",
            })}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={link.icon} />
            </svg>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={cycleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={themeIcon} />
          </svg>
          <span className="capitalize">{theme} mode</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Update `src/components/Layout.tsx` — apply theme background**

```tsx
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskWebSocket } from "../hooks/useWebSocket";
import FetchActivityBar from "./FetchActivityBar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const queryClient = useQueryClient();
  const tasks = useTaskWebSocket({
    onTaskCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <FetchActivityBar tasks={tasks} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Layout.tsx
git commit -m "feat: redesign sidebar with icons, theme toggle, and logo unlock"
```

---

## Task 5: Frontend — API Layer & Types Updates

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/api/tasks.ts`
- Modify: `src/api/groups.ts`

- [ ] **Step 1: Add new types to `src/types/index.ts`**

Append these types at the end of the file (after `AppSettings` interface):

```typescript
export interface TopAuthor {
  author_id: string;
  username: string;
  display_name: string | null;
  profile_image: string | null;
  post_count: number;
  media_count: number;
}

export interface RecentMedia {
  id: number;
  type: string;
  post_id: string;
}

export interface EnhancedStats {
  total_groups: number;
  total_authors: number;
  total_posts: number;
  total_media: number;
  storage_bytes: number;
  recent_media: RecentMedia[];
  groups: GroupStats[];
}

export interface GroupStats {
  id: number;
  name: string;
  author_count: number;
  post_count: number;
  media_count: number;
}
```

Also update the existing `Group` interface — add `post_count` and `media_count`:
```typescript
export interface Group {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  author_count: number;
  post_count: number;
  media_count: number;
}
```

- [ ] **Step 2: Update `src/api/tasks.ts` — add fetchEnhancedStats and fetchTopAuthors**

Replace full file:
```typescript
import type { AppSettings, EnhancedStats, TaskStatus, TopAuthor } from "../types";
import api from "./client";

export const fetchTasks = () =>
  api.get<TaskStatus[]>("/tasks").then((r) => r.data);

export const fetchStats = () =>
  api.get<EnhancedStats>("/stats").then((r) => r.data);

export const fetchTopAuthors = (period: string = "all") =>
  api.get<TopAuthor[]>("/stats/top-authors", { params: { period } }).then((r) => r.data);

export const triggerFetchAll = () => api.post("/tasks/fetch-all");

export const fetchSettings = () =>
  api.get<AppSettings>("/settings").then((r) => r.data);

export const updateSettings = (data: Partial<AppSettings>) =>
  api.put<AppSettings>("/settings", data).then((r) => r.data);
```

- [ ] **Step 3: Update `src/api/groups.ts` — add triggerGroupFetch**

Add to end of file:
```typescript
export const triggerGroupFetch = (id: number) =>
  api.post(`/groups/${id}/fetch`);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/api/tasks.ts src/api/groups.ts
git commit -m "feat: add types and API functions for enhanced stats and group fetch"
```

---

## Task 6: Frontend — Dashboard Redesign

**Files:**
- Rewrite: `src/components/Dashboard.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Rewrite `src/components/Dashboard.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { mediaFileUrl, mediaThumbnailUrl } from "../api/media";
import { fetchStats, fetchTopAuthors } from "../api/tasks";

function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const PERIODS = ["1d", "1w", "1m", "all"] as const;
const PERIOD_LABELS: Record<string, string> = { "1d": "24H", "1w": "7D", "1m": "30D", "all": "All" };

export default function Dashboard() {
  const [period, setPeriod] = useState<string>("all");
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 10000 });
  const { data: topAuthors } = useQuery({ queryKey: ["top-authors", period], queryFn: () => fetchTopAuthors(period) });

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
      </div>
    );
  }

  const statCards = [
    { label: "Groups", value: stats.total_groups, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { label: "Authors", value: stats.total_authors, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Posts", value: fmtCount(stats.total_posts), icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
    { label: "Media Files", value: fmtCount(stats.total_media), icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  const maxPostCount = topAuthors?.length ? Math.max(...topAuthors.map((a) => a.post_count), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card-glow rounded-2xl p-5 border transition-colors duration-300"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ background: "var(--accent-pink-muted)" }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="var(--accent-pink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={card.icon} />
                </svg>
              </div>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{card.label}</span>
            </div>
            <div
              className="text-3xl font-bold"
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div
          className="card-glow rounded-2xl p-5 border transition-colors duration-300"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Top Authors</h3>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--bg-primary)" }}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-200"
                  style={{
                    background: period === p ? "var(--gradient-primary)" : "transparent",
                    color: period === p ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {topAuthors?.map((author, i) => (
              <div key={author.author_id} className="flex items-center gap-3">
                <span className="text-xs font-bold w-5 text-center" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                {author.profile_image ? (
                  <img src={author.profile_image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--gradient-primary)" }}>
                    {(author.display_name || author.username)[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {author.display_name || author.username}
                    </span>
                    <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                      {author.post_count}p / {author.media_count}m
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(author.post_count / maxPostCount) * 100}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!topAuthors || topAuthors.length === 0) && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No data for this period</p>
            )}
          </div>
        </div>

        {/* Latest Media */}
        <div
          className="card-glow rounded-2xl p-5 border transition-colors duration-300"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Latest Media</h3>
          <div className="grid grid-cols-4 gap-2">
            {stats.recent_media.map((m) => (
              <div key={m.id} className="aspect-square rounded-xl overflow-hidden relative" style={{ background: "var(--bg-primary)" }}>
                <img
                  src={m.type === "video" ? mediaThumbnailUrl(m.id) : mediaFileUrl(m.id)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {m.type === "video" && (
                  <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,.6)", color: "#fff" }}>
                    VIDEO
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storage */}
      <div
        className="card-glow rounded-2xl p-5 border transition-colors duration-300"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Storage</h3>
          <span className="text-2xl font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {fmtBytes(stats.storage_bytes)}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--bg-primary)" }}>
          {stats.groups.map((g, i) => {
            const pct = stats.total_media > 0 ? (g.media_count / stats.total_media) * 100 : 0;
            if (pct < 1) return null;
            const hue = (i * 60 + 330) % 360;
            return (
              <div
                key={g.id}
                className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, background: `hsl(${hue}, 80%, 60%)` }}
                title={`${g.name}: ${g.media_count} files`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {stats.groups.map((g, i) => {
            const hue = (i * 60 + 330) % 360;
            return (
              <div key={g.id} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: `hsl(${hue}, 80%, 60%)` }} />
                {g.name} ({g.media_count})
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/pages/DashboardPage.tsx`**

```tsx
import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
      <Dashboard />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard.tsx src/pages/DashboardPage.tsx
git commit -m "feat: redesign dashboard with leaderboard, media preview, and storage"
```

---

## Task 7: Frontend — Group Pages Redesign

**Files:**
- Rewrite: `src/components/GroupList.tsx`
- Modify: `src/components/GroupDetail.tsx`
- Modify: `src/pages/GroupsPage.tsx`

- [ ] **Step 1: Rewrite `src/components/GroupList.tsx`**

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteGroup, fetchGroups, triggerGroupFetch } from "../api/groups";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function GroupList() {
  const queryClient = useQueryClient();
  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const fetchMut = useMutation({ mutationFn: (id: number) => triggerGroupFetch(id) });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups?.map((g) => (
        <div
          key={g.id}
          className="card-glow rounded-2xl p-5 border transition-all duration-300 hover:translate-y-[-2px]"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: "var(--accent-pink-muted)", color: "var(--accent-pink)" }}
            >
              {g.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/groups/${g.id}`}
                className="text-base font-semibold hover:underline block truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {g.name}
              </Link>
              {g.description && (
                <p className="text-sm mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{g.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl" style={{ background: "var(--bg-primary)" }}>
            <div className="text-center">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Authors</div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{g.author_count}</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Posts</div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmtCount(g.post_count)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Media</div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmtCount(g.media_count)}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchMut.mutate(g.id)}
              disabled={fetchMut.isPending}
              className="btn-glow flex-1 text-sm py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: "var(--gradient-primary)" }}
            >
              {fetchMut.isPending && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              )}
              Fetch All
            </button>
            <button
              onClick={() => { if (confirm("Delete this group?")) deleteMut.mutate(g.id); }}
              className="text-sm px-3 py-2 rounded-lg border transition-colors duration-200"
              style={{ borderColor: "var(--border-primary)", color: "var(--badge-error-text)" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {groups?.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No groups yet.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/GroupDetail.tsx`**

```tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchGroup, triggerGroupFetch } from "../api/groups";
import AuthorList from "./AuthorList";

export default function GroupDetail({ groupId }: { groupId: number }) {
  const { data: group, isLoading } = useQuery({ queryKey: ["group", groupId], queryFn: () => fetchGroup(groupId) });
  const fetchMut = useMutation({ mutationFn: () => triggerGroupFetch(groupId) });

  if (isLoading || !group) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
      </div>
    );
  }

  return (
    <div>
      <div
        className="card-glow rounded-2xl p-5 border mb-6 transition-colors duration-300"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{group.name}</h2>
            {group.description && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{group.description}</p>}
          </div>
          <button
            onClick={() => fetchMut.mutate()}
            disabled={fetchMut.isPending}
            className="btn-glow text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: "var(--gradient-primary)" }}
          >
            {fetchMut.isPending && (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
            )}
            Fetch All Authors
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 p-3 rounded-xl" style={{ background: "var(--bg-primary)" }}>
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Authors</div>
            <div className="text-lg font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{group.author_count}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Posts</div>
            <div className="text-lg font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{group.post_count}</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Media</div>
            <div className="text-lg font-bold" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{group.media_count}</div>
          </div>
        </div>
      </div>
      <AuthorList groupId={groupId} />
    </div>
  );
}
```

- [ ] **Step 3: Update `src/pages/GroupsPage.tsx`**

```tsx
import { useState } from "react";
import GroupForm from "../components/GroupForm";
import GroupList from "../components/GroupList";

export default function GroupsPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Groups</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-glow text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110"
          style={{ background: "var(--gradient-primary)" }}
        >
          + New Group
        </button>
      </div>
      {showForm && <GroupForm onClose={() => setShowForm(false)} />}
      <GroupList />
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/GroupList.tsx src/components/GroupDetail.tsx src/pages/GroupsPage.tsx
git commit -m "feat: redesign group pages with stats and fetch button"
```

---

## Task 8: Frontend — Theme All Remaining Components

**Files:**
- Modify: `src/components/AuthorCard.tsx`
- Modify: `src/components/AuthorList.tsx`
- Modify: `src/components/AuthorForm.tsx`
- Modify: `src/components/GroupForm.tsx`
- Modify: `src/components/PostCard.tsx`
- Modify: `src/components/MediaGrid.tsx`
- Modify: `src/components/MediaPreview.tsx`
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/components/FetchActivityBar.tsx`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/TaskProgress.tsx`
- Modify: `src/components/Settings.tsx`
- Modify: `src/pages/AuthorsPage.tsx`
- Modify: `src/pages/PostsPage.tsx`
- Modify: `src/pages/BrowsePage.tsx`
- Modify: `src/pages/TasksPage.tsx`
- Modify: `src/pages/SettingsPage.tsx`

This is a large mechanical task — replace hardcoded Tailwind color classes with CSS variable inline styles across all components. The patterns are consistent:

**Replacement patterns:**
- `bg-white` / `bg-gray-100` -> `style={{ background: "var(--bg-surface)" }}`
- `bg-gray-900` / `bg-gray-800` -> `style={{ background: "var(--bg-primary)" }}`
- `border-gray-200` / `border-gray-300` -> `style={{ borderColor: "var(--border-primary)" }}`
- `text-gray-900` / `text-gray-800` -> `style={{ color: "var(--text-primary)" }}`
- `text-gray-500` / `text-gray-400` -> `style={{ color: "var(--text-muted)" }}`
- `bg-blue-600` buttons -> `style={{ background: "var(--gradient-primary)" }}` + `text-white`
- `hover:bg-gray-50` -> use `var(--bg-surface-hover)`
- Status badges: use `var(--badge-active-bg/text)`, `var(--badge-error-bg/text)`, `var(--badge-paused-bg/text)`
- `shadow` classes -> remove (borders replace shadows in this theme)
- Add `card-glow` class to main card containers (activates only in bold mode)
- Add `btn-glow` class to primary buttons
- Add `transition-colors duration-300` to containers that change with theme

- [ ] **Step 1: Theme AuthorCard.tsx**

Key changes:
- Card wrapper: `bg-white rounded-xl shadow p-5` -> `card-glow rounded-2xl p-5 border` + surface vars
- Stats grid: `bg-gray-50` -> `var(--bg-primary)`
- Status badge: use theme badge vars based on `author.status`
- Buttons: primary gradient for Fetch Now, border style for Pause/Resume, error color for Delete
- Avatar fallback: `bg-blue-500` -> `var(--gradient-primary)`
- All text colors via vars

- [ ] **Step 2: Theme AuthorList.tsx**

Key change: Loading spinner color via vars.

- [ ] **Step 3: Theme AuthorForm.tsx and GroupForm.tsx**

Key changes: Input fields use `var(--input-bg)` and `var(--input-border)`, card wrapper uses surface vars, buttons use gradient.

- [ ] **Step 4: Theme PostCard.tsx**

Key changes:
- Article wrapper: `bg-white border-gray-200` -> surface/border vars
- Text box: `bg-gray-50 border-gray-100` -> `var(--bg-primary)` / `var(--border-subtle)`
- Name/handle/time text colors -> `var(--text-primary)` / `var(--text-muted)`
- Footer icons: keep per-icon hover colors (blue/emerald/pink/sky) but base color from `var(--text-muted)`
- Media grid border -> `var(--border-primary)`

- [ ] **Step 5: Theme MediaGrid.tsx**

Key changes: Select button, delete button, media thumb backgrounds all via vars. Spinner via vars.

- [ ] **Step 6: Theme MediaPreview.tsx**

Key change: Modal backdrop `bg-black/80` -> `var(--overlay-bg)`.

- [ ] **Step 7: Theme FilterBar.tsx**

Key changes: Select elements use `var(--input-bg)`, `var(--input-border)`, `var(--text-primary)`.

- [ ] **Step 8: Theme FetchActivityBar.tsx**

Key changes: Replace hardcoded `bg-blue-50` / `text-blue-700` with `var(--accent-pink-muted)` / `var(--accent-pink)`. Complete banner uses `var(--accent-cyan-muted)` / `var(--accent-cyan)`. Shimmer bar uses accent-pink gradient.

- [ ] **Step 9: Theme TaskList.tsx and TaskProgress.tsx**

Key changes: Card surfaces, button gradient, status colors via badge vars.

- [ ] **Step 10: Theme Settings.tsx**

Key changes: Card surface, input styling, button gradient.

- [ ] **Step 11: Theme remaining page headers**

All pages that render `<h1>` should use `style={{ color: "var(--text-primary)" }}`. Pages: AuthorsPage, PostsPage, BrowsePage, TasksPage, SettingsPage.

- [ ] **Step 12: Verify TypeScript compiles**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 13: Visual smoke test**

Start dev server, visit each page (Dashboard, Groups, Authors, Browse, Posts, Tasks, Settings), toggle dark/light/bold. Verify no hardcoded white/gray colors leak through.

- [ ] **Step 14: Commit**

```bash
git add src/components/ src/pages/
git commit -m "feat: apply neon pink/cyan theme to all components"
```

---

## Task 9: Cleanup & Final Verification

**Files:**
- Delete: `demo-styles.html` (the brainstorming demo)

- [ ] **Step 1: Delete demo file**

```bash
rm demo-styles.html
```

- [ ] **Step 2: Full TypeScript compile check**

Run: `cd D:\Code\erohub-scraper-panel && npx tsc --noEmit`

- [ ] **Step 3: Backend compile check**

Run: `cd D:\Code\erohub-media-scraper-server && python -c "from app.main import app; print('OK')"`

- [ ] **Step 4: End-to-end visual verification**

Start backend and frontend, verify:
1. Dashboard: stats cards, leaderboard with period switching, media preview, storage bar
2. Groups: cards with stats, Fetch All button works, group detail shows stats
3. Theme: dark/light toggle in sidebar works, all pages themed
4. Bold: click logo 5x, verify bold mode activates with glow effects and particles
5. FetchActivityBar: trigger a fetch, verify animated bar appears

- [ ] **Step 5: Commit cleanup**

```bash
git add -A
git commit -m "chore: cleanup demo file and final verification"
```
