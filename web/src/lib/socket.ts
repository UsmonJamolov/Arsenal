import { io, type Socket } from "socket.io-client";

import { API_URL } from "@/lib/api";

export type RealtimeEntity = "devices" | "tables" | "bookings" | "hookah" | "cart" | "settings" | "all";

export type ClubUpdateEvent = {
  entity: RealtimeEntity;
  message?: string;
};

export type LiveStatus = "connected" | "connecting" | "offline";

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    const socketUrl = API_URL || window.location.origin;

    socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 8,
      timeout: 12000,
    });
  }

  return socket;
}

export type OrderAcceptedEvent = {
  title: string;
  message: string;
  at: string;
};

export function joinUserRoom(userId: string) {
  const client = getSocket();
  if (!client || !userId) {
    return;
  }

  client.connect();
  client.emit("join", `user:${userId}`);
}

export function subscribeOrderCompleted(handler: (event: OrderAcceptedEvent) => void) {
  const client = getSocket();
  if (!client) {
    return () => undefined;
  }

  client.connect();
  client.on("order:completed", handler);

  return () => {
    client.off("order:completed", handler);
  };
}

export function subscribeOrderAccepted(handler: (event: OrderAcceptedEvent) => void) {
  const client = getSocket();
  if (!client) {
    return () => undefined;
  }

  client.connect();
  client.on("order:accepted", handler);

  return () => {
    client.off("order:accepted", handler);
  };
}

export function subscribeClubUpdates(handler: (event: ClubUpdateEvent) => void) {
  const client = getSocket();
  if (!client) {
    return () => undefined;
  }

  client.connect();
  client.on("club:update", handler);

  return () => {
    client.off("club:update", handler);
  };
}

export function trackSocketConnection(onChange: (status: LiveStatus) => void) {
  const client = getSocket();
  if (!client) {
    return () => undefined;
  }

  let offlineTimer: ReturnType<typeof setTimeout> | null = null;

  const clearOfflineTimer = () => {
    if (offlineTimer) {
      clearTimeout(offlineTimer);
      offlineTimer = null;
    }
  };

  const scheduleOffline = () => {
    clearOfflineTimer();
    offlineTimer = setTimeout(() => {
      if (!client.connected) {
        onChange("offline");
      }
    }, 12000);
  };

  const handleConnect = () => {
    clearOfflineTimer();
    onChange("connected");
  };

  const handleDisconnect = () => {
    onChange("connecting");
    scheduleOffline();
  };

  const handleConnectError = () => {
    onChange("connecting");
    scheduleOffline();
  };

  client.on("connect", handleConnect);
  client.on("disconnect", handleDisconnect);
  client.on("connect_error", handleConnectError);

  if (client.connected) {
    onChange("connected");
  } else {
    onChange("connecting");
    scheduleOffline();
  }

  client.connect();

  return () => {
    clearOfflineTimer();
    client.off("connect", handleConnect);
    client.off("disconnect", handleDisconnect);
    client.off("connect_error", handleConnectError);
  };
}
