"use client";

import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { Gamepad2, Lock, Mail, Phone, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthScene3D } from "@/components/auth/auth-scene-3d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { setApiUserId } from "@/lib/api";
import { saveSession, type UserSession } from "@/lib/auth";
import { cn, touchPress } from "@/lib/utils";

type AuthMode = "login" | "register";

export function AuthShell() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "+998 ",
    email: "",
    password: "",
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 48, opacity: 0, skewY: 6 },
        { y: 0, opacity: 1, skewY: 0, duration: 1.1, ease: "power4.out" },
      );

      gsap.fromTo(
        cardRef.current,
        { y: 80, opacity: 0, rotateX: 18, scale: 0.92 },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, duration: 1.2, delay: 0.15, ease: "power3.out" },
      );

      gsap.to(glowRef.current, {
        scale: 1.08,
        opacity: 0.85,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  const updateField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.phone.trim() || form.phone.trim().length < 8) {
      setError("Telefon raqamini to'g'ri kiriting.");
      return;
    }

    if (!form.password || form.password.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    if (mode === "register" && !form.name.trim()) {
      setError("Ismingizni kiriting.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "register"
          ? {
              name: form.name,
              phone: form.phone,
              email: form.email,
              password: form.password,
            }
          : {
              phone: form.phone,
              password: form.password,
            };

      const data = await apiRequest<{ user: UserSession }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      saveSession(data.user);
      setApiUserId(data.user.id);

      const target = data.user.role === "admin" ? "/admin" : "/";

      gsap.to(cardRef.current, {
        scale: 0.96,
        opacity: 0,
        y: -20,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => router.push(target),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030108] text-white">
      <AuthScene3D />

      <motion.div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_68%)] blur-3xl"
        initial={{ opacity: 0.4 }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(192,38,211,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        <motion.div ref={titleRef} className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.55em] text-cyan-300/80">Arsenal Union</p>
          <h1 className="mt-3 bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-violet-200 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl">
            3D NEON GATE
          </h1>
          <p className="mt-3 max-w-md text-sm text-violet-200/70">
            Three.js · GSAP · WebGL · Framer Motion — manga / cyberpunk uslubida kirish
          </p>
        </motion.div>

        <div
          ref={cardRef}
          className="w-full max-w-md"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/25 bg-black/45 p-6 shadow-[0_0_60px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:p-8">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <motion.div
              className="mb-6 flex items-center gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
                <Gamepad2 className="size-6 text-cyan-200" />
              </motion.div>
              <motion.div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-fuchsia-300/90">Secure Access</p>
                <p className="text-lg font-bold text-white">Game Club Portal</p>
              </motion.div>
            </motion.div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-violet-500/25 bg-white/5 p-1">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMode(tab)}
                  className={cn(
                    touchPress,
                    "rounded-xl px-3 py-2.5 text-sm font-semibold",
                    mode === tab
                      ? "bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 text-white shadow-[0_0_20px_rgba(192,38,211,0.25)] active:from-cyan-500/45 active:to-fuchsia-500/45"
                      : "text-violet-200/60 hover:text-white active:bg-white/10",
                  )}
                >
                  {tab === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35 }}
              >
                {mode === "register" && (
                  <Field icon={<UserRound className="size-4" />} label="Ism">
                    <Input value={form.name} onChange={updateField("name")} placeholder="Sardor Aliyev" />
                  </Field>
                )}

                <Field icon={<Phone className="size-4" />} label="Telefon">
                  <Input value={form.phone} onChange={updateField("phone")} placeholder="+998 90 123 45 67" />
                </Field>

                <Field icon={<Mail className="size-4" />} label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder="player@arsenal.union"
                  />
                </Field>

                <Field icon={<Lock className="size-4" />} label="Parol">
                  <Input
                    type="password"
                    value={form.password}
                    onChange={updateField("password")}
                    placeholder="••••••••"
                  />
                </Field>

                {error ? (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                  >
                    {error}
                  </motion.p>
                ) : null}

                <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
                  {loading ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      Yuklanmoqda...
                    </motion.span>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      {mode === "login" ? "3D Portalga kirish" : "Hisob yaratish"}
                    </>
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            <p className="mt-5 text-center text-xs text-violet-300/55">
              <a
                href="https://t.me/arsenalGC_bot"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Telegram: @arsenalGC_bot
              </a>
              <span className="mx-2 text-violet-500">·</span>
              Admin: <span className="text-amber-300">/admin/login</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.label
      className="block space-y-2"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/75">
        {icon}
        {label}
      </span>
      {children}
    </motion.label>
  );
}
