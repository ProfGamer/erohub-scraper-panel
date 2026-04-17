import type { MediaItem, PaginatedResponse, Post } from "../types";
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

export const mediaFileUrl = (id: number) => `/api/media/${id}/file`;
