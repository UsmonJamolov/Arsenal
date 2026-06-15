const PENDING_SESSIONS_PREFIX = "arsenal-pending-sessions";

export function pendingSessionsKey(userId: string) {
  return `${PENDING_SESSIONS_PREFIX}-${userId}`;
}

export function loadPendingSessions<T>(userId: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(pendingSessionsKey(userId));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function savePendingSessions<T>(userId: string, sessions: T[]) {
  if (typeof window === "undefined") {
    return;
  }
  const key = pendingSessionsKey(userId);
  if (sessions.length) {
    localStorage.setItem(key, JSON.stringify(sessions));
  } else {
    localStorage.removeItem(key);
  }
}

export function clearPendingSessions(userId: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(pendingSessionsKey(userId));
}

const PROFILE_EXTRAS_PREFIX = "arsenal-profile-extras";

export type UserProfileExtras = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export function profileExtrasKey(userId: string) {
  return `${PROFILE_EXTRAS_PREFIX}-${userId}`;
}

export function loadProfileExtras(userId: string, defaults: UserProfileExtras): UserProfileExtras {
  if (typeof window === "undefined") {
    return defaults;
  }
  try {
    const raw = localStorage.getItem(profileExtrasKey(userId));
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<UserProfileExtras>;
    return {
      firstName: parsed.firstName ?? defaults.firstName,
      lastName: parsed.lastName ?? defaults.lastName,
      avatarUrl: parsed.avatarUrl ?? defaults.avatarUrl,
    };
  } catch {
    return defaults;
  }
}

export function saveProfileExtras(userId: string, extras: UserProfileExtras) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(profileExtrasKey(userId), JSON.stringify(extras));
}
