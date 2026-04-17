import type { AppSettings, Stats, TaskStatus } from "../types";
import api from "./client";

export const fetchTasks = () =>
  api.get<TaskStatus[]>("/tasks").then((r) => r.data);

export const fetchStats = () =>
  api.get<Stats>("/stats").then((r) => r.data);

export const triggerFetchAll = () => api.post("/tasks/fetch-all");

export const fetchSettings = () =>
  api.get<AppSettings>("/settings").then((r) => r.data);

export const updateSettings = (data: Partial<AppSettings>) =>
  api.put<AppSettings>("/settings", data).then((r) => r.data);
