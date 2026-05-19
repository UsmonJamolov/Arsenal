export type AdminSession = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "admin";
  tier: string;
  loyaltyPoints: number;
  joinedAt: string;
};

const ADMIN_SESSION_KEY = "arsenal-union-admin-session";

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as AdminSession;
    return session.role === "admin" ? session : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
