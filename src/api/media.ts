import type { MediaItem, PaginatedResponse, Post, PostDetail } from "../types";
import api from "./client";

export const fetchMedia = (params: {
  type?: string;
  author_id?: string;
  group_id?: number;
  page?: number;
  size?: number;
}) =>
  api
    .get<PaginatedResponse<MediaItem>>("/media", { params })
    .then((r) => r.data);

export const fetchPosts = (params: {
  author_id?: string;
  group_id?: number;
  page?: number;
  size?: number;
}) =>
  api
    .get<PaginatedResponse<Post>>("/posts", { params })
    .then((r) => r.data);

export const deleteMediaBatch = (ids: number[]) =>
  api.delete("/media/batch", { data: { ids } }).then((r) => r.data);

export const deletePostBatch = (ids: string[]) =>
  api.delete("/posts/batch", { data: { ids } }).then((r) => r.data);

export const fetchPostDetail = (postId: string) =>
  api.get<PostDetail>(`/posts/${postId}`).then((r) => r.data);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
export const mediaFileUrl = (id: number) => `${API_BASE}/media/${id}/file`;
export const mediaThumbnailUrl = (id: number) => `${API_BASE}/media/${id}/thumbnail`;
