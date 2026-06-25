import { API_URL, UPLOAD_API_URL } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-auth";

type ApiError = { message?: string };

const REQUEST_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Server javob bermadi. cd server && npm run dev tekshiring");
    }
    throw new Error("Serverga ulanib bo'lmadi. Terminalda: cd server && npm run dev");
  } finally {
    clearTimeout(timeout);
  }
}

async function parseAdminResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.message || "So'rov bajarilmadi");
  }

  return data;
}

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getAdminSession();

  if (!session && !path.includes("/login")) {
    throw new Error("Admin sessiyasi topilmadi");
  }

  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { "X-Admin-Id": session.id } : {}),
      ...options?.headers,
    },
  });

  return parseAdminResponse<T>(response);
}

async function adminUploadRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getAdminSession();

  if (!session) {
    throw new Error("Admin sessiyasi topilmadi");
  }

  const response = await fetchWithTimeout(`${UPLOAD_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Id": session.id,
      ...options?.headers,
    },
  });

  return parseAdminResponse<T>(response);
}

export { adminRequest, adminUploadRequest };
