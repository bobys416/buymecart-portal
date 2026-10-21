/**
 * BuyMeCart / IBNK — Core API Client
 * Centralized, typed, resilient HTTP client connecting Next.js frontend to FastAPI backend.
 * Handles bearer token injection, standardized error normalization, and multipart uploads.
 */

import { getStoredSession } from "./auth";

export interface ApiClientConfig {
  baseUrl: string;
}

export class ApiClientError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  return "http://localhost:8000/api/v1";
}

/**
 * Retrieves the active JWT token from currently loaded portal sessions.
 */
export function getActiveAuthToken(): string | null {
  const portals = [
    "admin",
    "super-distributor",
    "area-distributor",
    "distributor",
    "retailer",
  ];
  for (const portal of portals) {
    const session = getStoredSession(portal);
    if (session?.accessToken) {
      return session.accessToken;
    }
  }
  return null;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  endpoint: string,
  method: string,
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      cleanEndpoint += (cleanEndpoint.includes("?") ? "&" : "?") + queryString;
    }
  }

  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = options.token || getActiveAuthToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
    body:
      body instanceof FormData
        ? body
        : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  };

  try {
    const res = await fetch(url, fetchOptions);

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    let responseData: any;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await res.json();
    } else {
      const text = await res.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      if (responseData && typeof responseData === "object") {
        if (typeof responseData.detail === "string") {
          errorMsg = responseData.detail;
        } else if (Array.isArray(responseData.detail)) {
          errorMsg = responseData.detail
            .map((e: any) => `${e.loc?.slice(1)?.join(".") || "field"}: ${e.msg}`)
            .join("; ");
        } else if (responseData.message) {
          errorMsg = responseData.message;
        }
      }
      throw new ApiClientError(errorMsg, res.status, responseData);
    }

    return responseData as T;
  } catch (err: any) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    throw new ApiClientError(
      err.message || "Failed to connect to BuyMeCart API service.",
      0,
      { originalError: err }
    );
  }
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, "GET", undefined, options);
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, "POST", body, options);
  },

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, "PATCH", body, options);
  },

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, "PUT", body, options);
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, "DELETE", undefined, options);
  },

  async uploadFile<T>(
    endpoint: string,
    file: File | Blob,
    filename = "document.bin",
    fieldName = "file",
    extraFields?: Record<string, string>,
    options?: RequestOptions
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file, filename);

    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.append(key, value);
      }
    }

    return request<T>(endpoint, "POST", formData, options);
  },

  async checkHealth(): Promise<{ ok: boolean; status?: string; error?: string }> {
    try {
      const baseUrl = getApiBaseUrl().replace(/\/api\/v1$/, "");
      const res = await fetch(`${baseUrl}/health`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, status: data.status || "ok" };
      }
      return { ok: false, error: `Health check returned ${res.status}` };
    } catch (e: any) {
      return { ok: false, error: e.message || "Unreachable" };
    }
  },
};
