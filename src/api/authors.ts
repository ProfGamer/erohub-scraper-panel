import type { Author } from "../types";
import api from "./client";

export const fetchAuthors = (groupId?: number) =>
  api
    .get<Author[]>("/authors", { params: groupId ? { group_id: groupId } : {} })
    .then((r) => r.data);

export const createAuthor = (data: {
  username: string;
  group_id?: number;
  display_name?: string;
}) => api.post<Author>("/authors", data).then((r) => r.data);

export const updateAuthor = (id: string, data: Partial<Author>) =>
  api.put<Author>(`/authors/${id}`, data).then((r) => r.data);

export const deleteAuthor = (id: string) => api.delete(`/authors/${id}`);

export const triggerFetch = (id: string) => api.post(`/authors/${id}/fetch`);
