"use client";

import dynamic from "next/dynamic";

const AuthShell = dynamic(() => import("@/components/auth/auth-shell").then((mod) => mod.AuthShell), {
  ssr: false,
  loading: () => (
    <div className="auth-page relative flex min-h-screen items-center justify-center">
      <div className="auth-page__bg" aria-hidden />
      <div className="auth-page__overlay" aria-hidden />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="app-loader__spinner" aria-hidden />
        <p className="app-loader__label">Portal yuklanmoqda...</p>
      </div>
    </div>
  ),
});

export default function AuthPage() {
  return <AuthShell />;
}
