export type UserTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export type UserSession = {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: UserTier;
  loyaltyPoints: number;
  role?: "user" | "admin";
  joinedAt: string;
};

const SESSION_KEY = "arsenal-union-session";

export function getSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AU";
}
