"use client";

import { motion } from "framer-motion";
import { KeyRound, LogIn, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";

import { Input } from "@/components/ui/input";
import { apiRequest, setApiUserId } from "@/lib/api";
import { saveSession, type UserSession } from "@/lib/auth";

type TelegramConfig = {
  botUsername: string;
  botUrl: string;
};

export function AuthShell() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [botConfig, setBotConfig] = useState<TelegramConfig>({
    botUsername: "arsenalGC_bot",
    botUrl: "https://t.me/arsenalGC_bot?start=login",
  });
  const [otp, setOtp] = useState("");

  useEffect(() => {
    apiRequest<TelegramConfig>("/api/auth/telegram/config")
      .then(setBotConfig)
      .catch(() => undefined);
  }, []);

  const verifyCode = useCallback(
    async (code: string) => {
      setError("");
      setLoading(true);

      try {
        const data = await apiRequest<{ user: UserSession }>("/api/auth/telegram/verify", {
          method: "POST",
          body: JSON.stringify({ code }),
        });

        saveSession(data.user);
        setApiUserId(data.user.id);
        window.location.href = "/";
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Kod noto'g'ri");
        setOtp("");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (otp.length === 6 && !loading) {
      verifyCode(otp);
    }
  }, [otp, loading, verifyCode]);

  const handleLogin = () => {
    if (otp.length === 6) {
      verifyCode(otp);
    } else {
      setError("6 xonali kodni to'liq kiriting");
    }
  };

  return (
    <main className="auth-page relative min-h-screen overflow-hidden text-text-primary">
      <div className="auth-page__bg" aria-hidden />
      <div className="auth-page__overlay" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="auth-card-wrap w-full max-w-[420px]"
        >
          <div className="auth-card-scrim" aria-hidden />
          <div className="auth-card relative">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="auth-card__logo mb-4">
                <BrandLogo size="lg" />
              </div>
              <p className="text-xs font-bold tracking-[0.28em] text-text-secondary">ARSENAL UNION</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                Xush kelibsiz <span className="text-brand-cyan">yana!</span>
              </h1>
              <p className="mt-2 text-sm text-text-muted">O&apos;yin sayohatingizni davom eting</p>
            </div>

            <p className="auth-tab-single mb-6">Kirish</p>

            <div className="space-y-4">
              <AuthField icon={<KeyRound className="size-4" />} label="6 xonali kod">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  disabled={loading}
                  className="auth-input h-12 pl-11 font-mono text-base tracking-[0.3em]"
                />
              </AuthField>

              {error ? <p className="auth-error">{error}</p> : null}

              <button type="button" className="auth-submit" onClick={handleLogin} disabled={loading}>
                <LogIn className="size-5" />
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </button>
            </div>

            <div className="auth-divider my-6">
              <span>Parolni Telegram botdan oling</span>
            </div>

            <a
              href={botConfig.botUrl}
              target="_blank"
              rel="noreferrer"
              className="auth-telegram-btn"
            >
              <span className="auth-telegram-btn__icon" aria-hidden>
                <Send className="size-4" strokeWidth={2.25} />
              </span>
              <span>Telegram botga o&apos;tish</span>
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}
