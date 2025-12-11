/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts

import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { logout } from "./auth";

export const API_URL = "https://api.koncms.com/";
// export const API_URL = "http://localhost:4009/";

// ==== INTERFACES ====
export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

export interface RegisterAdminParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginAdminParams {
  email: string;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface Question {
  id: string;
  projectId: string;
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  [key: string]: any;
}

export interface Candidate {
  id?: string;
  name: string;
  email: string;
  projectId: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  access_token?: string;
  [key: string]: any;
}

// ==== GENERIC HELPER ====

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    const result = JSON.parse(text);
    const errorText = result?.message;
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function registerAdmin(
  data: RegisterAdminParams
): Promise<ApiResponse> {
  const res = await FetchRequest(`${API_URL}/admin/register`, {
    method: "POST",
    body: data,
  });
  return handleResponse<ApiResponse>(res);
}

export async function loginAdmin(data: LoginAdminParams): Promise<ApiResponse> {
  const res = await FetchRequest(`${API_URL}admin/login`, {
    method: "POST",
    body: data,
  });
  console.log(res);
  return handleResponse<ApiResponse>(res);
}

// POST request
export async function Axios_post(
  url: string,
  data: any,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  try {
    const response = await axios.post(url, data, header);
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.warn("Unauthorized (401) response received!");
      logout();
      // Do logout or refresh token here if needed
    }
    throw error; // re-throw so the caller can handle it
  }
}

// GET request
export async function Axios_get(
  url: string,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  try {
    const response = await axios.get(url, header); // fixed to GET
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.warn("Unauthorized (401) response received!");
      logout();
      // Do logout or refresh token here if needed
    }
    throw error; // re-throw so the caller can handle it
  }
}

export async function Axios_delete(
  url: string,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  try {
    const response = await axios.delete(url, header); // fixed to GET
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.warn("Unauthorized (401) response received!");
      logout();
      // Do logout or refresh token here if needed
    }
    throw error; // re-throw so the caller can handle it
  }
}

/**
 * Update admin permissions via PATCH /admin/permissions/{adminId}
 */
export async function updateAdminPermissions(
  adminId: string,
  permissions: Record<string, any>,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const url = `${API_URL}admin/permissions/${adminId}`;
  try {
    const response = await axios.patch(url, permissions, header);
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
}

/**
 * Fetch admin permissions via GET /admin/permissions/{adminId}
 */
export async function getAdminPermissions(
  adminId: string,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const url = `${API_URL}admin/permissions/${adminId}`;
  try {
    const response = await axios.get(url, header);
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
}

export async function FetchRequest(
  url: string,
  options: FetchOptions = {}
): Promise<any> {
  const { method = "GET", headers = {}, body } = options;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      logout();
    }
  }

  return res;
}

/**
 * Assign channels to an admin. Uses the backend admin assign endpoint.
 * Sends the full list of channel IDs for the admin.
 */
/**
 * Assign a single channel to an admin (AdminController_assignChannelToAdmin)
 * expected body: { channelId, adminId }
 */
export async function assignChannelToAdmin(
  adminId: string,
  channelId: string,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const url = `${API_URL}admin/channels/assign`;
  return Axios_post(url, { channelId, adminId }, header);
}

/**
 * Assign a video to a user. Expected body: { userId, channelId, videoId }
 */
export async function assignVideoToUser(
  userId: string,
  channelId: string,
  videoId: string,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const url = `${API_URL}admin/user-videos/assign`;
  return Axios_post(url, { userId, channelId, videoId }, header);
}

/**
 * Assign multiple channels to an admin. Sends an array of channel IDs.
 */
export async function assignChannelsToAdmin(
  adminId: string,
  channelIds: string[],
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const url = `${API_URL}admin/assign-channels/${adminId}`;
  return Axios_post(url, { channelIds }, header);
}

/**
 * Remove a channel from an admin. Uses DELETE to `/admin/channels/remove` with body { adminId, channelId }
 */
export async function removeChannelFromAdmin(
  adminId: string,
  channelId: string,
  header: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const url = `${API_URL}admin/channels/remove`;
  // Axios.delete accepts a config object where `data` contains the request body
  const config: AxiosRequestConfig = {
    ...(header || {}),
    data: { adminId, channelId },
  };
  return Axios_delete(url, config);
}
