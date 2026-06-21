"use client";

import { useEffect, useState } from "react";

import { getSession } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      window.location.replace("/auth");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="app-loader" role="status" aria-live="polite" aria-busy="true">
        <div className="app-loader__inner">
          <div className="app-loader__spinner" aria-hidden />
          <p className="app-loader__label">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
