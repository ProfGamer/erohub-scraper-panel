export interface Group {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  author_count: number;
}

export interface Author {
  id: string;
  group_id: number | null;
  username: string;
  display_name: string | null;
  profile_image: string | null;
  status: "active" | "paused" | "error";
  last_fetched_at: string | null;
  created_at: string;
  config_json: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  text: string | null;
  posted_at: string | null;
  fetched_at: string;
  media_count: number;
}

export interface MediaItem {
  id: number;
  post_id: string;
  type: "image" | "video" | "gif";
  url: string | null;
  local_path: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  downloaded_at: string;
}

export interface TaskStatus {
  id: string;
  author_username: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
  total: number;
  error: string | null;
  started_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Stats {
  total_groups: number;
  total_authors: number;
  total_posts: number;
  total_media: number;
  storage_bytes: number;
}

export interface AppSettings {
  fetch_interval_minutes: number;
  max_concurrent_fetches: number;
  data_dir: string;
  cookies_dir: string;
}
