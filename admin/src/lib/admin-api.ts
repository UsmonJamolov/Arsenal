import { API_URL } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-auth";

type ApiError = { message?: string };

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const session = getAdminSession();

  if (!session && !path.includes("/login")) {
    throw new Error("Admin sessiyasi topilmadi");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { "X-Admin-Id": session.id } : {}),
      ...options?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.message || "So'rov bajarilmadi");
  }

  return data;
}

export { adminRequest };
