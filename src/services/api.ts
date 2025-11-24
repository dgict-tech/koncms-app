/* eslint-disable @typescript-eslint/no-empty-object-type */
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
