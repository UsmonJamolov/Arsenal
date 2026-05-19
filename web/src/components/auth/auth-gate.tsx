"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/auth");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07050f] text-cyan-200">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
          <p className="text-sm font-semibold tracking-[0.3em] uppercase">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
