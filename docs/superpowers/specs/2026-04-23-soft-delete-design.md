# Soft Delete for Posts and Media

## Overview

Add soft-delete capability to posts and media. Deleted items are hidden from the frontend, their files are removed from disk, and the scraper will not re-fetch or re-insert them.

## Decisions

- **Approach**: Status field on Post and Media models (`"active"` / `"deleted"`)
- **Granularity**: Both post-level and individual media-level deletion
- **Re-fetch prevention**: Rely on gallery-dl `archive.db` to prevent re-downloading files. DB-level dedup queries include deleted records so they won't be re-inserted.
- **UI entry point**: Batch selection mode only (PostsPage for posts, MediaGrid for media). No delete button in MediaPreview.
- **Confirmation**: `window.confirm()` dialog before deletion, consistent with existing GroupList pattern.

## Data Model Changes

### Post model — new fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | Text, NOT NULL | `"active"` | `"active"` or `"deleted"` |
| `deleted_at` | DateTime, nullable | NULL | Timestamp when deleted |

### Media model — new fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | Text, NOT NULL | `"active"` | `"active"` or `"deleted"` |
| `deleted_at` | DateTime, nullable | NULL | Timestamp when deleted |

### Cascade behavior

Deleting a post sets its status to `"deleted"` and also sets all its media to `"deleted"` with matching `deleted_at`. Deleting individual media does not affect the parent post's status.

## Backend API Changes

### Modified query endpoints — add `WHERE status = 'active'`

- `GET /api/posts` — filter Post and nested Media to active only
- `GET /api/posts/{post_id}` — return 404 if post is deleted
- `GET /api/media` — filter to active media only
- `GET /api/stats` — exclude deleted from counts

### New endpoint: `DELETE /api/posts/batch`

- **Body**: `{ "ids": ["tweet_id_1", "tweet_id_2", ...] }`
- **Behavior**:
  1. Set Post.status = `"deleted"`, Post.deleted_at = now
  2. Set all child Media.status = `"deleted"`, Media.deleted_at = now
  3. Delete local files via `Path.unlink(missing_ok=True)`
  4. Return `{ "deleted_posts": N, "deleted_media": M }`

### Modified endpoint: `DELETE /api/media/batch`

Currently does physical delete of DB records + files. Change to:
1. Set Media.status = `"deleted"`, Media.deleted_at = now
2. Delete local files
3. Keep DB records

### Fetch logic changes (`tasks.py`)

The existing dedup queries (`existing_post_ids`, `existing_media_set`) must include deleted records so they remain in the sets and are not re-inserted.

Add `deleted_post_ids` set — when a post_id is in this set, skip engagement count updates (don't update a deleted post's metrics).

## Frontend Changes

### PostsPage — new selection mode

Mirror MediaGrid's existing selection pattern:
- "Select" button in toolbar enters selection mode
- PostCard shows checkbox overlay in top-left when selectable
- Toolbar shows selected count + "Delete Selected" button
- Click delete → `window.confirm("确认删除 N 条推文及其所有媒体文件？")`
- On confirm → call `DELETE /api/posts/batch` with selected IDs
- On success → invalidate `["posts"]`, `["media"]`, `["stats"]`

### MediaGrid — add confirmation dialog

- Before calling `deleteMediaBatch`, show `window.confirm("确认删除 N 个媒体文件？")`
- On success → additionally invalidate `["stats"]`

### API client

- New function in `src/api/media.ts`: `deletePostBatch(ids: string[])`
- Existing `deleteMediaBatch` unchanged (backend behavior changes transparently)

### i18n keys

New keys to add to both `en.ts` and `zh.ts`:

| Key | EN | ZH |
|-----|----|----|
| `posts.select` | Select | 选择 |
| `posts.cancel` | Cancel | 取消 |
| `posts.selectedCount` | {{count}} selected | 已选 {{count}} 条 |
| `posts.deleteSelected` | Delete Selected | 删除所选 |
| `posts.deleting` | Deleting... | 删除中... |
| `posts.deleteConfirm` | Delete {{count}} posts and all their media files? | 确认删除 {{count}} 条推文及其所有媒体文件？ |
| `mediaGrid.deleteConfirm` | Delete {{count}} media files? | 确认删除 {{count}} 个媒体文件？ |

## Out of Scope

- Admin "recycle bin" or undo/restore functionality
- Scheduled cleanup of deleted records from DB
- Delete button in MediaPreview modal
- DB-level re-fetch prevention beyond archive.db
