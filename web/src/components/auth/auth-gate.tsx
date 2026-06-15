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
      <div className="arena-bg flex min-h-screen items-center justify-center text-brand-cyan">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-brand-cyan/25 border-t-brand-cyan" />
          <p className="label-caps">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
