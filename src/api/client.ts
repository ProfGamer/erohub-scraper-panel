import axios from "axios";
import { UserManager } from "oidc-client-ts";
import { oidcConfig } from "../auth/oidc-config";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

const userManager = new UserManager(oidcConfig);

api.interceptors.request.use(async (config) => {
  const user = await userManager.getUser();
  if (user?.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`;
  }
  return config;
});

export default api;
