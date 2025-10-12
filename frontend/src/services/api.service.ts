import axios, { type AxiosInstance } from "axios";
import type { ETLOperation, ProcessingJob } from "../types/admin.types";
import { supabase } from "./supabase.service";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error("Missing API base URL environment variable");
}

const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Authorization header with access token
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const adminService = {
  async getETLOperations(tenantId: string): Promise<ETLOperation[]> {
    const { data } = await api.get(`/admin/etl-operations/${tenantId}`);
    return data;
  },

  async startProcessing(
    tenantId: string,
    fileIds: string[],
  ): Promise<ProcessingJob> {
    const { data } = await api.post("/admin/process", {
      tenant_id: tenantId,
      file_ids: fileIds,
    });
    return data;
  },

  async getProcessingStatus(jobId: string): Promise<ProcessingJob> {
    const { data } = await api.get(`/admin/processing/${jobId}`);
    return data;
  },

  async health(): Promise<{ status: string }> {
    const { data } = await api.get("/health");
    return data;
  },
};

export { api };
