"use client";

import dynamic from "next/dynamic";

const AuthShell = dynamic(() => import("@/components/auth/auth-shell").then((mod) => mod.AuthShell), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#030108] text-cyan-200">
      <p className="text-sm font-semibold tracking-[0.35em] uppercase">3D portal yuklanmoqda...</p>
    </div>
  ),
});

export default function AuthPage() {
  return <AuthShell />;
}
