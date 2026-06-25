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
  error?: string;
};

function readApiError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const record = data as ApiError;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (status === 401) {
    return "Sessiya eskirgan. Qayta kiring.";
  }
  if (status === 403) {
    return "Bu amal uchun ruxsat yo'q";
  }
  if (status === 404) {
    return "Ma'lumot topilmadi";
  }
  if (status === 409) {
    return "Tanlangan qurilma hozir bo'sh emas";
  }
  if (status >= 500) {
    return "Server vaqtincha javob bermayapti";
  }
  if (status === 0) {
    return "Internet yoki server bilan aloqa yo'q";
  }

  return "So'rov bajarilmadi";
}

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
    throw new Error(readApiError(data, response.status));
  }

  return data;
}

export { API_URL };
