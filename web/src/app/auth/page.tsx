"use client";

import dynamic from "next/dynamic";

const AuthShell = dynamic(() => import("@/components/auth/auth-shell").then((mod) => mod.AuthShell), {
  ssr: false,
  loading: () => (
    <div className="auth-page relative flex min-h-screen items-center justify-center">
      <div className="auth-page__bg" aria-hidden />
      <div className="auth-page__overlay" aria-hidden />
      <p className="relative z-10 text-sm font-semibold tracking-widest text-brand-cyan uppercase">
        Portal yuklanmoqda...
      </p>
    </div>
  ),
});

export default function AuthPage() {
  return <AuthShell />;
}
