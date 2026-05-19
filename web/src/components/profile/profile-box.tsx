"use client";

import { motion } from "framer-motion";
import { Calendar, Crown, LogOut, Mail, Phone, Shield, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setApiUserId } from "@/lib/api";
import { clearSession, getInitials, type UserSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ProfileMiniScene = dynamic(
  () => import("@/components/profile/profile-mini-scene").then((mod) => mod.ProfileMiniScene),
  { ssr: false, loading: () => <div className="h-28 w-full animate-pulse rounded-2xl bg-cyan-500/10" /> },
);

type ProfileBoxProps = {
  session: UserSession;
  phone: string;
  onPhoneChange: (value: string) => void;
  className?: string;
};

const tierColors: Record<UserSession["tier"], string> = {
  Bronze: "from-amber-700/40 to-amber-900/20 border-amber-500/40 text-amber-200",
  Silver: "from-slate-400/30 to-slate-700/20 border-slate-300/40 text-slate-100",
  Gold: "from-yellow-500/35 to-amber-700/20 border-yellow-400/50 text-yellow-100",
  Platinum: "from-cyan-400/35 to-violet-600/25 border-cyan-300/50 text-cyan-100",
};

export function ProfileBox({ session, phone, onPhoneChange, className }: ProfileBoxProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    setApiUserId(null);
    router.replace("/auth");
  };

  const joined = new Date(session.joinedAt).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-violet-400/30 bg-gradient-to-br from-[#120a24]/95 via-[#0a0618]/90 to-[#05030f]/95 p-6 shadow-[0_24px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.18),transparent_55%)]"
      />

      <div className="pointer-events-none relative mb-5 overflow-hidden rounded-2xl border border-cyan-400/20">
        <ProfileMiniScene />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05030f] via-transparent to-transparent"
        />
      </div>

      <motion.div className="relative z-10 flex items-start gap-4">
        <motion.div
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-fuchsia-600/25 text-xl font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          animate={{
            boxShadow: [
              "0 0 20px rgba(34,211,238,0.25)",
              "0 0 36px rgba(192,38,211,0.35)",
              "0 0 20px rgba(34,211,238,0.25)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {getInitials(session.name)}
        </motion.div>

        <motion.div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300/80">Profile Box</p>
          <h3 className="mt-1 truncate text-2xl font-black text-white">{session.name}</h3>
          <p className="mt-1 truncate text-sm text-violet-200/70">{session.email}</p>
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-3 py-1 text-xs font-bold uppercase tracking-wider",
              tierColors[session.tier],
            )}
          >
            <Crown className="size-3.5" />
            {session.tier} Tier
          </span>
        </motion.div>
      </motion.div>

      <motion.div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
        <Stat icon={<Trophy className="size-4 text-amber-300" />} label="Loyalty" value={`${session.loyaltyPoints} XP`} />
        <Stat icon={<Calendar className="size-4 text-cyan-300" />} label="Qo'shilgan" value={joined} />
      </motion.div>

      <motion.div className="relative z-10 mt-5 space-y-3">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-200/75">
            <Phone className="size-3.5" />
            Telefon
          </span>
          <input
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-violet-500/35 bg-[#181425]/80 px-3 text-sm text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/25"
          />
        </label>

        <motion.div className="flex items-center gap-2 rounded-xl border border-violet-500/25 bg-white/5 px-3 py-2.5 text-sm text-violet-100/80">
          <Mail className="size-4 shrink-0 text-fuchsia-300" />
          <span className="truncate">{session.email}</span>
        </motion.div>
      </motion.div>

      <motion.div className="relative z-10 mt-6 flex flex-wrap gap-3">
        {session.role === "admin" ? (
          <Button type="button" className="w-full" asChild>
            <Link href="/admin">
              <Shield className="size-4" />
              Adminga o&apos;tish
            </Link>
          </Button>
        ) : null}
        <Button type="button" className="flex-1">
          <Sparkles className="size-4" />
          Bonuslarni ko&apos;rish
        </Button>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          <LogOut className="size-4" />
          Chiqish
        </Button>
      </motion.div>
    </article>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div
      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
      whileHover={{ scale: 1.02, borderColor: "rgba(34,211,238,0.35)" }}
    >
      <motion.div className="flex items-center gap-2 text-violet-200/70">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </motion.div>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </motion.div>
  );
}
