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
