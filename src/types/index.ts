export interface Group {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  author_count: number;
  post_count: number;
  media_count: number;
}

export interface Author {
  id: string;
  group_id: number | null;
  username: string;
  display_name: string | null;
  profile_image: string | null;
  status: "active" | "paused" | "archived" | "error";
  last_fetched_at: string | null;
  created_at: string;
  config_json: string | null;
  followers_count: number | null;
  favourites_count: number | null;
  statuses_count: number | null;
  media_count: number | null;
  bio: string | null;
  location: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  text: string | null;
  posted_at: string | null;
  fetched_at: string;
  media_count: number;
  favorite_count: number | null;
  retweet_count: number | null;
  reply_count: number | null;
  view_count: number | null;
  author?: {
    username: string;
    display_name: string | null;
    profile_image: string | null;
  } | null;
  media?: MediaItem[];
}

export interface PostDetail {
  id: string;
  author_id: string;
  text: string | null;
  posted_at: string | null;
  fetched_at: string;
  author: {
    username: string;
    display_name: string | null;
    profile_image: string | null;
  };
  media: MediaItem[];
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
  phase: "downloading" | "processing" | "saving" | "done";
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
