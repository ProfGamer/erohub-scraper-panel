# Soft Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add soft-delete (status field) to Posts and Media so deleted items are hidden from frontend, files are cleaned up, and the scraper never re-inserts them.

**Architecture:** Add `status` + `deleted_at` columns to Post and Media models. All read APIs filter to `status='active'`. Fetch dedup queries include deleted records to prevent re-insertion. Frontend adds batch-select delete on PostsPage (mirroring MediaGrid) and a confirm dialog on MediaGrid.

**Tech Stack:** FastAPI + SQLAlchemy (backend), React 19 + TanStack Query + react-i18next (frontend)

---

## File Map

### Backend (`D:\Code\erohub-media-scraper-server`)

| File | Action | Responsibility |
|------|--------|---------------|
| `app/models.py` | Modify | Add `status` + `deleted_at` to Post and Media |
| `app/schemas.py` | Modify | Add `BatchDeletePosts` schema |
| `app/routers/posts.py` | Modify | Filter by active status; add `DELETE /api/posts/batch` |
| `app/routers/media.py` | Modify | Filter by active status; change batch delete to soft-delete |
| `app/routers/stats.py` | Modify | Filter counts to active-only |
| `app/routers/tasks.py` | Modify | Skip engagement updates for deleted posts |

### Frontend (`D:\Code\erohub-scraper-panel`)

| File | Action | Responsibility |
|------|--------|---------------|
| `src/api/media.ts` | Modify | Add `deletePostBatch()` function |
| `src/components/MediaGrid.tsx` | Modify | Add confirm dialog before delete; invalidate stats |
| `src/pages/PostsPage.tsx` | Modify | Add selection mode + batch delete |
| `src/components/PostCard.tsx` | Modify | Accept `selectMode` + `selected` props for checkbox overlay |
| `src/i18n/locales/en.ts` | Modify | Add delete-related translation keys |
| `src/i18n/locales/zh.ts` | Modify | Add delete-related translation keys |

---

## Task 1: Backend — Add status fields to Post and Media models

**Files:**
- Modify: `D:\Code\erohub-media-scraper-server\app\models.py:45-76`

- [ ] **Step 1: Add `status` and `deleted_at` to Post model**

In `app/models.py`, add two fields to the `Post` class after line 57 (`view_count`):

```python
class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    author_id: Mapped[str] = mapped_column(Text, ForeignKey("authors.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    raw_meta_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    favorite_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    retweet_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reply_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    view_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(Text, default="active", nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    author: Mapped[Author] = relationship(back_populates="posts")
    media_items: Mapped[list["Media"]] = relationship(back_populates="post", cascade="all, delete-orphan")
```

- [ ] **Step 2: Add `status` and `deleted_at` to Media model**

In the same file, add two fields to the `Media` class after line 74 (`downloaded_at`):

```python
class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[str] = mapped_column(Text, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    downloaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(Text, default="active", nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    post: Mapped[Post] = relationship(back_populates="media_items")
```

- [ ] **Step 3: Add `BatchDeletePosts` schema**

In `app/schemas.py`, add after the `BatchDeleteMedia` class at the end of file:

```python
class BatchDeletePosts(BaseModel):
    ids: list[str]
```

- [ ] **Step 4: Delete old database and restart to recreate with new columns**

Since this project uses SQLite with `create_all` (no migrations), delete the existing DB and let it recreate:

```bash
# The DB file location depends on config, typically /app/db/scraper.db or local dev path
# In development, just restart the server — create_all will add missing columns to new tables
# For existing DB with data, the simplest path is to backup and recreate
```

> **Note:** `Base.metadata.create_all` will add new tables but won't alter existing ones. For a dev DB with test data, delete and recreate. For production data, run manual ALTER TABLE:
> ```sql
> ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
> ALTER TABLE posts ADD COLUMN deleted_at DATETIME;
> ALTER TABLE media ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
> ALTER TABLE media ADD COLUMN deleted_at DATETIME;
> ```

- [ ] **Step 5: Commit**

```bash
cd D:/Code/erohub-media-scraper-server
git add app/models.py app/schemas.py
git commit -m "feat: add status and deleted_at fields to Post and Media models"
```

---

## Task 2: Backend — Filter query endpoints to active-only

**Files:**
- Modify: `D:\Code\erohub-media-scraper-server\app\routers\posts.py`
- Modify: `D:\Code\erohub-media-scraper-server\app\routers\media.py:17-63`

- [ ] **Step 1: Filter posts list to active-only**

In `app/routers/posts.py`, add `Post.status == "active"` filter to both the count and data queries in `list_posts()`. Also filter nested media in `_serialize_post()` to only include active media.

Replace `_serialize_post` (lines 14-45):

```python
def _serialize_post(post: Post) -> dict:
    return {
        "id": post.id,
        "author_id": post.author_id,
        "text": post.text,
        "posted_at": post.posted_at.isoformat() if post.posted_at else None,
        "fetched_at": post.fetched_at.isoformat(),
        "favorite_count": post.favorite_count,
        "retweet_count": post.retweet_count,
        "reply_count": post.reply_count,
        "view_count": post.view_count,
        "media_count": sum(1 for m in post.media_items if m.status == "active"),
        "author": {
            "username": post.author.username,
            "display_name": post.author.display_name,
            "profile_image": post.author.profile_image,
        } if post.author else None,
        "media": [
            {
                "id": m.id,
                "post_id": m.post_id,
                "type": m.type,
                "url": m.url,
                "local_path": m.local_path,
                "file_size": m.file_size,
                "width": m.width,
                "height": m.height,
                "downloaded_at": m.downloaded_at.isoformat(),
            }
            for m in post.media_items
            if m.status == "active"
        ],
    }
```

Replace `list_posts` (lines 48-81) — add `.where(Post.status == "active")` to both statements:

```python
@router.get("")
async def list_posts(
    author_id: str | None = Query(None),
    group_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    count_stmt = select(func.count(Post.id)).where(Post.status == "active")
    stmt = (
        select(Post)
        .where(Post.status == "active")
        .options(selectinload(Post.media_items), selectinload(Post.author))
        .order_by(Post.posted_at.desc(), Post.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    if author_id:
        count_stmt = count_stmt.where(Post.author_id == author_id)
        stmt = stmt.where(Post.author_id == author_id)
    elif group_id:
        count_stmt = count_stmt.join(Author, Post.author_id == Author.id).where(Author.group_id == group_id)
        stmt = stmt.join(Author, Post.author_id == Author.id).where(Author.group_id == group_id)
    total = (await db.execute(count_stmt)).scalar() or 0

    result = await db.execute(stmt)
    posts = result.scalars().unique().all()

    return {
        "items": [_serialize_post(p) for p in posts],
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 0,
    }
```

- [ ] **Step 2: Filter single post to active-only**

Replace `get_post` (lines 84-95) — add `Post.status == "active"` and return 404 for deleted:

```python
@router.get("/{post_id}")
async def get_post(post_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Post)
        .where(Post.id == post_id, Post.status == "active")
        .options(selectinload(Post.media_items), selectinload(Post.author))
    )
    result = await db.execute(stmt)
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return _serialize_post(post)
```

- [ ] **Step 3: Filter media list to active-only**

In `app/routers/media.py`, update `list_media()`. Add `.where(Media.status == "active")` to both statements. Replace lines 17-63:

```python
@router.get("")
async def list_media(
    type: str | None = Query(None),
    author_id: str | None = Query(None),
    group_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Media).where(Media.status == "active")
    count_stmt = select(func.count(Media.id)).where(Media.status == "active")

    if type:
        stmt = stmt.where(Media.type == type)
        count_stmt = count_stmt.where(Media.type == type)
    if author_id:
        stmt = stmt.join(Post).where(Post.author_id == author_id)
        count_stmt = count_stmt.join(Post).where(Post.author_id == author_id)
    elif group_id:
        stmt = stmt.join(Post).join(Author, Post.author_id == Author.id).where(Author.group_id == group_id)
        count_stmt = count_stmt.join(Post).join(Author, Post.author_id == Author.id).where(Author.group_id == group_id)

    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(Media.downloaded_at.desc(), Media.id.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": m.id,
                "post_id": m.post_id,
                "type": m.type,
                "url": m.url,
                "local_path": m.local_path,
                "file_size": m.file_size,
                "width": m.width,
                "height": m.height,
                "downloaded_at": m.downloaded_at.isoformat(),
            }
            for m in items
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 0,
    }
```

- [ ] **Step 4: Verify server starts without errors**

```bash
cd D:/Code/erohub-media-scraper-server
python -c "from app.models import Post, Media; print('status' in Post.__table__.columns, 'status' in Media.__table__.columns)"
```

Expected: `True True`

- [ ] **Step 5: Commit**

```bash
cd D:/Code/erohub-media-scraper-server
git add app/routers/posts.py app/routers/media.py
git commit -m "feat: filter posts and media queries to active-only status"
```

---

## Task 3: Backend — Filter stats to active-only

**Files:**
- Modify: `D:\Code\erohub-media-scraper-server\app\routers\stats.py:19-101`

- [ ] **Step 1: Add active-only filters to get_stats()**

In `app/routers/stats.py`, update the `get_stats()` function. The counts for posts, media, storage_bytes, and recent_media should exclude deleted items. Groups subqueries should also filter. Replace lines 20-101:

```python
@router.get("")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_groups = (await db.execute(select(func.count(Group.id)))).scalar() or 0
    total_authors = (await db.execute(select(func.count(Author.id)))).scalar() or 0
    total_posts = (await db.execute(
        select(func.count(Post.id)).where(Post.status == "active")
    )).scalar() or 0
    total_media = (await db.execute(
        select(func.count(Media.id)).where(Media.status == "active")
    )).scalar() or 0

    storage_bytes = (
        await db.execute(
            select(func.coalesce(func.sum(Media.file_size), 0))
            .where(Media.status == "active")
        )
    ).scalar() or 0

    recent_media_rows = (
        await db.execute(
            select(Media.id, Media.type, Media.post_id)
            .where(Media.status == "active")
            .order_by(Media.id.desc())
            .limit(8)
        )
    ).all()
    recent_media = [
        {"id": row.id, "type": row.type, "post_id": row.post_id}
        for row in recent_media_rows
    ]

    author_count_sq = (
        select(func.count(Author.id))
        .where(Author.group_id == Group.id)
        .correlate(Group)
        .scalar_subquery()
    )

    post_count_sq = (
        select(func.count(Post.id))
        .join(Author, Post.author_id == Author.id)
        .where(Author.group_id == Group.id, Post.status == "active")
        .correlate(Group)
        .scalar_subquery()
    )

    media_count_sq = (
        select(func.count(Media.id))
        .join(Post, Media.post_id == Post.id)
        .join(Author, Post.author_id == Author.id)
        .where(Author.group_id == Group.id, Media.status == "active")
        .correlate(Group)
        .scalar_subquery()
    )

    groups_rows = (
        await db.execute(
            select(
                Group.id,
                Group.name,
                func.coalesce(author_count_sq, 0).label("author_count"),
                func.coalesce(post_count_sq, 0).label("post_count"),
                func.coalesce(media_count_sq, 0).label("media_count"),
            )
        )
    ).all()

    groups = [
        {
            "id": row.id,
            "name": row.name,
            "author_count": row.author_count,
            "post_count": row.post_count,
            "media_count": row.media_count,
        }
        for row in groups_rows
    ]

    return {
        "total_groups": total_groups,
        "total_authors": total_authors,
        "total_posts": total_posts,
        "total_media": total_media,
        "storage_bytes": storage_bytes,
        "recent_media": recent_media,
        "groups": groups,
    }
```

- [ ] **Step 2: Filter top-authors to exclude deleted posts/media**

Replace the `get_top_authors()` function (lines 104-169). Add `.where(Post.status == "active")` to the post count subquery and `.where(Media.status == "active")` to the media count subquery:

```python
@router.get("/top-authors")
async def get_top_authors(
    period: str = Query("all", pattern=r"^(1d|1w|1m|all)$"),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    time_filter = None
    if period != "all":
        cutoff = datetime.utcnow() - PERIOD_MAP[period]
        time_filter = Post.posted_at >= cutoff

    post_count_q = (
        select(
            Post.author_id,
            func.count(Post.id).label("post_count"),
        )
        .where(Post.status == "active")
        .group_by(Post.author_id)
    )
    if time_filter is not None:
        post_count_q = post_count_q.where(time_filter)
    post_count_sq = post_count_q.subquery()

    media_count_q = (
        select(
            Post.author_id,
            func.count(Media.id).label("media_count"),
        )
        .join(Media, Media.post_id == Post.id)
        .where(Post.status == "active", Media.status == "active")
        .group_by(Post.author_id)
    )
    if time_filter is not None:
        media_count_q = media_count_q.where(time_filter)
    media_count_sq = media_count_q.subquery()

    stmt = (
        select(
            Author.id.label("author_id"),
            Author.username,
            Author.display_name,
            Author.profile_image,
            func.coalesce(post_count_sq.c.post_count, 0).label("post_count"),
            func.coalesce(media_count_sq.c.media_count, 0).label("media_count"),
        )
        .join(post_count_sq, Author.id == post_count_sq.c.author_id)
        .outerjoin(media_count_sq, Author.id == media_count_sq.c.author_id)
        .order_by(func.coalesce(post_count_sq.c.post_count, 0).desc())
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()

    return [
        {
            "author_id": row.author_id,
            "username": row.username,
            "display_name": row.display_name,
            "profile_image": row.profile_image,
            "post_count": row.post_count,
            "media_count": row.media_count,
        }
        for row in rows
    ]
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/erohub-media-scraper-server
git add app/routers/stats.py
git commit -m "feat: filter stats endpoints to exclude deleted posts and media"
```

---

## Task 4: Backend — Add batch delete posts endpoint + modify media batch delete

**Files:**
- Modify: `D:\Code\erohub-media-scraper-server\app\routers\posts.py`
- Modify: `D:\Code\erohub-media-scraper-server\app\routers\media.py:66-79`

- [ ] **Step 1: Add `DELETE /api/posts/batch` endpoint**

In `app/routers/posts.py`, add the import for `datetime`, `update`, `Path`, and the schema at the top. Then add the new endpoint after `get_post()`:

Add to imports at top of file (merge with existing):

```python
import math
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Author, Media, Post
from app.schemas import BatchDeletePosts
```

Add the endpoint after `get_post()`:

```python
@router.delete("/batch")
async def batch_delete_posts(body: BatchDeletePosts, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()

    result = await db.execute(
        select(Post)
        .where(Post.id.in_(body.ids), Post.status == "active")
        .options(selectinload(Post.media_items))
    )
    posts = result.scalars().unique().all()
    if not posts:
        return {"deleted_posts": 0, "deleted_media": 0}

    local_paths = []
    media_count = 0
    for post in posts:
        post.status = "deleted"
        post.deleted_at = now
        for media in post.media_items:
            if media.status == "active":
                media.status = "deleted"
                media.deleted_at = now
                media_count += 1
                if media.local_path:
                    local_paths.append(media.local_path)

    await db.commit()

    for fp in local_paths:
        try:
            Path(fp).unlink(missing_ok=True)
        except OSError:
            pass

    return {"deleted_posts": len(posts), "deleted_media": media_count}
```

- [ ] **Step 2: Change media batch delete to soft-delete**

In `app/routers/media.py`, replace the `batch_delete_media` function (lines 66-79). Change from physical delete to soft-delete:

```python
@router.delete("/batch")
async def batch_delete_media(body: BatchDeleteMedia, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    result = await db.execute(
        select(Media).where(Media.id.in_(body.ids), Media.status == "active")
    )
    items = result.scalars().all()
    local_paths = []
    for m in items:
        m.status = "deleted"
        m.deleted_at = now
        if m.local_path:
            local_paths.append(m.local_path)
    await db.commit()

    for fp in local_paths:
        try:
            Path(fp).unlink(missing_ok=True)
        except OSError:
            pass
    return {"deleted": len(items)}
```

Also add `datetime` import at the top of `media.py` (merge with existing imports):

```python
import math
from datetime import datetime
from pathlib import Path
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/erohub-media-scraper-server
git add app/routers/posts.py app/routers/media.py
git commit -m "feat: add batch delete posts endpoint, change media delete to soft-delete"
```

---

## Task 5: Backend — Update fetch dedup logic to skip deleted posts

**Files:**
- Modify: `D:\Code\erohub-media-scraper-server\app\routers\tasks.py:88-145`

- [ ] **Step 1: Add deleted_post_ids set and skip engagement updates for deleted posts**

In `app/routers/tasks.py`, modify the `_run_fetch` function. The existing dedup queries already include all records (no status filter), so deleted post IDs and media tuples are already in the sets — they won't be re-inserted. We only need to add logic to skip engagement count updates for deleted posts.

Replace lines 88-145 (the batch pre-query and insert/update section inside `async with async_session() as db:`):

```python
            # Batch pre-query: existing post IDs and media paths (include deleted to prevent re-insertion)
            result_post_ids = [r.tweet_id for r in results]
            existing_post_rows = (await db.execute(
                select(Post.id, Post.status).where(Post.id.in_(result_post_ids))
            )).all()
            existing_post_ids = {row[0] for row in existing_post_rows}
            deleted_post_ids = {row[0] for row in existing_post_rows if row[1] == "deleted"}

            result_media_keys = [(r.tweet_id, r.media_path) for r in results]
            existing_media_rows = (await db.execute(
                select(Media.post_id, Media.local_path)
                .where(Media.post_id.in_(result_post_ids))
            )).all()
            existing_media_set = {(row[0], row[1]) for row in existing_media_rows}

            # Batch insert / update
            new_posts = []
            new_media = []
            for r in results:
                stripped_meta = ScraperService.strip_meta(r.raw_meta)

                if r.tweet_id not in existing_post_ids:
                    new_posts.append(Post(
                        id=r.tweet_id,
                        author_id=author_id,
                        text=r.text,
                        posted_at=r.posted_at,
                        raw_meta_json=json.dumps(stripped_meta) if stripped_meta else None,
                        favorite_count=r.raw_meta.get("favorite_count"),
                        retweet_count=r.raw_meta.get("retweet_count"),
                        reply_count=r.raw_meta.get("reply_count"),
                        view_count=r.raw_meta.get("view_count"),
                    ))
                    existing_post_ids.add(r.tweet_id)
                elif r.tweet_id not in deleted_post_ids:
                    existing_post = await db.get(Post, r.tweet_id)
                    if existing_post:
                        for field in ("favorite_count", "retweet_count", "reply_count", "view_count"):
                            val = r.raw_meta.get(field)
                            if val is not None:
                                setattr(existing_post, field, val)

                if (r.tweet_id, r.media_path) not in existing_media_set:
                    file_size = r.raw_meta.get("filesize")
                    if file_size is None:
                        try:
                            file_size = Path(r.media_path).stat().st_size
                        except OSError:
                            pass
                    new_media.append(Media(
                        post_id=r.tweet_id,
                        type=r.media_type,
                        url=r.url,
                        local_path=r.media_path,
                        file_size=file_size,
                        width=r.raw_meta.get("width"),
                        height=r.raw_meta.get("height"),
                    ))
                    existing_media_set.add((r.tweet_id, r.media_path))
```

The key change: line `elif r.tweet_id not in deleted_post_ids:` — this skips engagement updates for deleted posts while still preventing re-insertion (because `existing_post_ids` includes deleted ones).

- [ ] **Step 2: Commit**

```bash
cd D:/Code/erohub-media-scraper-server
git add app/routers/tasks.py
git commit -m "feat: skip engagement updates for deleted posts during fetch"
```

---

## Task 6: Frontend — Add `deletePostBatch` API function

**Files:**
- Modify: `D:\Code\erohub-scraper-panel\src\api\media.ts`

- [ ] **Step 1: Add deletePostBatch function**

In `src/api/media.ts`, add after `deleteMediaBatch` (line 26):

```typescript
export const deletePostBatch = (ids: string[]) =>
  api.delete("/posts/batch", { data: { ids } }).then((r) => r.data);
```

- [ ] **Step 2: Commit**

```bash
cd D:/Code/erohub-scraper-panel
git add src/api/media.ts
git commit -m "feat: add deletePostBatch API function"
```

---

## Task 7: Frontend — Add i18n keys for delete features

**Files:**
- Modify: `D:\Code\erohub-scraper-panel\src\i18n\locales\en.ts`
- Modify: `D:\Code\erohub-scraper-panel\src\i18n\locales\zh.ts`

- [ ] **Step 1: Add English keys**

In `src/i18n/locales/en.ts`, add `deleteConfirm` key inside the `mediaGrid` section (after `videoBadge` on line 157):

```typescript
  mediaGrid: {
    select: "Select",
    cancel: "Cancel",
    selectedCount: "{{count}} selected",
    deleteSelected: "Delete Selected",
    deleting: "Deleting...",
    fileCount: "{{count}} files",
    empty: "No media found.",
    videoBadge: "VIDEO",
    deleteConfirm: "Delete {{count}} media files?",
  },
```

Add selection/delete keys inside the `pages.posts` section (after `emptyState` on line 58):

```typescript
    posts: {
      title: "Posts",
      totalCount: "{{count}} posts",
      emptyState: "No posts found.",
      select: "Select",
      cancel: "Cancel",
      selectedCount: "{{count}} selected",
      deleteSelected: "Delete Selected",
      deleting: "Deleting...",
      deleteConfirm: "Delete {{count}} posts and all their media files?",
    },
```

- [ ] **Step 2: Add Chinese keys**

In `src/i18n/locales/zh.ts`, add matching keys.

Inside `mediaGrid` section (after `videoBadge`):

```typescript
  mediaGrid: {
    select: "选择",
    cancel: "取消",
    selectedCount: "已选 {{count}} 项",
    deleteSelected: "删除所选",
    deleting: "删除中...",
    fileCount: "{{count}} 个文件",
    empty: "暂无媒体。",
    videoBadge: "视频",
    deleteConfirm: "确认删除 {{count}} 个媒体文件？",
  },
```

Inside `pages.posts` section (after `emptyState`):

```typescript
    posts: {
      title: "推文",
      totalCount: "{{count}} 条推文",
      emptyState: "暂无推文。",
      select: "选择",
      cancel: "取消",
      selectedCount: "已选 {{count}} 条",
      deleteSelected: "删除所选",
      deleting: "删除中...",
      deleteConfirm: "确认删除 {{count}} 条推文及其所有媒体文件？",
    },
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/erohub-scraper-panel
git add src/i18n/locales/en.ts src/i18n/locales/zh.ts
git commit -m "feat: add i18n keys for post/media delete features"
```

---

## Task 8: Frontend — Add confirm dialog and stats invalidation to MediaGrid

**Files:**
- Modify: `D:\Code\erohub-scraper-panel\src\components\MediaGrid.tsx:50-56,110-117`

- [ ] **Step 1: Add confirm dialog before delete**

In `src/components/MediaGrid.tsx`, modify the `deleteMutation` (lines 50-56) to also invalidate `["stats"]`:

```typescript
  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteMediaBatch(ids),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
```

- [ ] **Step 2: Add confirm before delete trigger**

Replace the delete button's `onClick` (line 111) to use `window.confirm`:

```typescript
            <button
              onClick={() => {
                const msg = t("mediaGrid.deleteConfirm", { count: selected.size });
                if (window.confirm(msg)) {
                  deleteMutation.mutate(Array.from(selected));
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ background: "var(--badge-error-text)" }}
            >
              {deleteMutation.isPending ? t("mediaGrid.deleting") : t("mediaGrid.deleteSelected")}
            </button>
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/erohub-scraper-panel
git add src/components/MediaGrid.tsx
git commit -m "feat: add confirm dialog and stats invalidation to MediaGrid delete"
```

---

## Task 9: Frontend — Add selection mode to PostCard

**Files:**
- Modify: `D:\Code\erohub-scraper-panel\src\components\PostCard.tsx:4-11`

- [ ] **Step 1: Add selectMode and selected props to PostCard**

In `src/components/PostCard.tsx`, extend the Props interface and add checkbox overlay. Replace the Props interface and component signature (lines 5-11):

```typescript
interface Props {
  post: Post;
  media: MediaItem[];
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onMediaClick?: (media: MediaItem) => void;
}

export default function PostCard({ post, media, selectMode, selected, onSelect, onMediaClick }: Props) {
```

- [ ] **Step 2: Add checkbox overlay and click handler**

Wrap the `<article>` tag to handle selection click. Replace the opening `<article>` tag (line 26-28):

```typescript
      <article
        className={`card-glow rounded-2xl border transition-colors duration-300 relative ${selectMode ? "cursor-pointer" : ""}`}
        style={{
          background: "var(--bg-surface)",
          borderColor: selected ? "var(--accent-pink)" : "var(--border-primary)",
          ...(selected ? { boxShadow: "0 0 0 2px var(--accent-pink)" } : {}),
        }}
        onClick={selectMode ? onSelect : undefined}
      >
        {selectMode && (
          <div
            className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 transition-colors"
            style={selected
              ? { background: "var(--accent-pink)", borderColor: "var(--accent-pink)" }
              : { background: "var(--bg-surface)", borderColor: "var(--border-primary)" }
            }
          >
            {selected && <span className="text-white text-xs font-bold">&#10003;</span>}
          </div>
        )}
```

- [ ] **Step 3: Prevent media clicks in select mode**

In the media grid section, wrap the `onClick` for media items to be no-op in select mode. Find the media item `onClick` (around line 98):

Change:
```typescript
onClick={() => onMediaClick?.(m)}
```

To:
```typescript
onClick={(e) => { if (selectMode) { e.stopPropagation(); onSelect?.(); } else { onMediaClick?.(m); } }}
```

- [ ] **Step 4: Commit**

```bash
cd D:/Code/erohub-scraper-panel
git add src/components/PostCard.tsx
git commit -m "feat: add selection mode support to PostCard"
```

---

## Task 10: Frontend — Add selection mode and batch delete to PostsPage

**Files:**
- Modify: `D:\Code\erohub-scraper-panel\src\pages\PostsPage.tsx`

- [ ] **Step 1: Add imports, state, and mutation**

In `src/pages/PostsPage.tsx`, add imports and selection state. Update the imports (line 1-11):

```typescript
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { deletePostBatch, fetchPosts } from "../api/media";
import FilterBar from "../components/FilterBar";
import MasonryGrid from "../components/MasonryGrid";
import MediaPreview from "../components/MediaPreview";
import PostCard from "../components/PostCard";
import { useGridNav } from "../hooks/useGridNav";
import { useIntersection } from "../hooks/useIntersection";
import type { MediaItem, Post } from "../types";
```

Add state and mutation inside the component, after the existing `useState` declarations (after line 24):

```typescript
  const queryClient = useQueryClient();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deletePostBatch(ids),
    onSuccess: () => {
      exitSelectMode();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
```

- [ ] **Step 2: Add toolbar with select/delete buttons**

Replace the header `<div>` (lines 130-133) to include selection controls:

```typescript
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("pages.posts.title")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${selectMode ? "text-white" : ""}`}
            style={
              selectMode
                ? { background: "var(--gradient-primary)", borderColor: "transparent", color: "#fff" }
                : { background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-primary)" }
            }
          >
            {selectMode ? t("pages.posts.cancel") : t("pages.posts.select")}
          </button>
          {selected.size > 0 && (
            <>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("pages.posts.selectedCount", { count: selected.size })}</span>
              <button
                onClick={() => {
                  const msg = t("pages.posts.deleteConfirm", { count: selected.size });
                  if (window.confirm(msg)) {
                    deleteMutation.mutate(Array.from(selected));
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ background: "var(--badge-error-text)" }}
              >
                {deleteMutation.isPending ? t("pages.posts.deleting") : t("pages.posts.deleteSelected")}
              </button>
            </>
          )}
          {data && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("pages.posts.totalCount", { count: data.pages[0]?.total ?? 0 })}</span>}
        </div>
      </div>
```

- [ ] **Step 3: Pass selection props to PostCard**

Update the PostCard render inside MasonryGrid (around line 150-163). Pass `selectMode`, `selected`, and `onSelect`:

```typescript
            renderItem={(post: Post, index: number) => (
              <div
                className="rounded-2xl transition-shadow duration-200"
                style={!selectMode && focusedIndex === index ? {
                  boxShadow: "0 0 0 2px var(--accent-pink), 0 0 12px rgba(236, 72, 153, 0.2)",
                } : undefined}
                onClick={() => !selectMode && setFocus(index)}
              >
                <PostCard
                  post={post}
                  media={post.media || []}
                  selectMode={selectMode}
                  selected={selected.has(post.id)}
                  onSelect={() => toggleSelect(post.id)}
                  onMediaClick={(m) => handleMediaClick(index, m)}
                />
              </div>
            )}
```

- [ ] **Step 4: Exit select mode on filter change**

Update the FilterBar `onChange` (line 134) to also exit select mode:

```typescript
      <FilterBar filters={filters} onChange={(f) => { setFilters(f); resetFocus(); setPreview(null); exitSelectMode(); }} />
```

- [ ] **Step 5: Commit**

```bash
cd D:/Code/erohub-scraper-panel
git add src/pages/PostsPage.tsx
git commit -m "feat: add selection mode and batch delete to PostsPage"
```

---

## Task 11: Manual Testing

- [ ] **Step 1: Start backend and apply DB migration**

```bash
cd D:/Code/erohub-media-scraper-server
# If existing DB has data, run ALTER TABLE commands:
# sqlite3 <path-to-scraper.db> "ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'active'; ALTER TABLE posts ADD COLUMN deleted_at DATETIME; ALTER TABLE media ADD COLUMN status TEXT NOT NULL DEFAULT 'active'; ALTER TABLE media ADD COLUMN deleted_at DATETIME;"
# Then start the server
python -m uvicorn app.main:app --reload --port 8000
```

- [ ] **Step 2: Start frontend**

```bash
cd D:/Code/erohub-scraper-panel
npm run dev
```

- [ ] **Step 3: Test MediaGrid delete flow**

1. Open Browse page (`/browse`)
2. Click "Select" button — enters selection mode
3. Click on a few media items — checkmarks appear
4. Click "Delete Selected" — confirm dialog appears with count
5. Cancel — nothing deleted
6. Confirm — items disappear from grid, stats update

- [ ] **Step 4: Test PostsPage delete flow**

1. Open Posts page (`/posts`)
2. Click "Select" button — enters selection mode
3. Click on post cards — checkbox appears in top-left
4. Click "Delete Selected" — confirm dialog mentions posts + media
5. Confirm — posts disappear, browse page also reflects removed media

- [ ] **Step 5: Test fetch doesn't re-insert deleted items**

1. Delete a post that belongs to an active author
2. Trigger a fetch for that author
3. Verify the deleted post does not reappear in Posts or Browse pages

- [ ] **Step 6: Verify stats are correct**

1. Check Dashboard — total posts, media, storage bytes should exclude deleted items
2. Top authors counts should also exclude deleted
