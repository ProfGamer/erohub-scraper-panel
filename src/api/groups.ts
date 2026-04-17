import type { Group } from "../types";
import api from "./client";

export const fetchGroups = () => api.get<Group[]>("/groups").then((r) => r.data);

export const fetchGroup = (id: number) =>
  api.get<Group>(`/groups/${id}`).then((r) => r.data);

export const createGroup = (data: { name: string; description?: string }) =>
  api.post<Group>("/groups", data).then((r) => r.data);

export const updateGroup = (
  id: number,
  data: { name?: string; description?: string },
) => api.put<Group>(`/groups/${id}`, data).then((r) => r.data);

export const deleteGroup = (id: number) => api.delete(`/groups/${id}`);
