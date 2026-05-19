function resolveApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "";
  }
  return "http://127.0.0.1:4000";
}

const API_URL = resolveApiUrl();

type ApiError = {
  message?: string;
};

let currentUserId: string | null = null;

export function setApiUserId(userId: string | null) {
  currentUserId = userId;
}

export function getApiUserId() {
  return currentUserId;
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (currentUserId) {
    headers["X-User-Id"] = currentUserId;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.message || "So'rov bajarilmadi");
  }

  return data;
}

export { API_URL };
