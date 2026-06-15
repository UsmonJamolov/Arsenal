"use client";

import { Camera, LogOut, Phone, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setApiUserId } from "@/lib/api";
import { clearSession, getInitials, type UserSession } from "@/lib/auth";
import { loadProfileExtras, saveProfileExtras } from "@/lib/user-storage";
import { cn } from "@/lib/utils";

type ProfileBoxProps = {
  session: UserSession;
  phone: string;
  onPhoneChange: (value: string) => void;
  onAvatarChange?: (avatarUrl: string | null) => void;
  className?: string;
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

async function readAvatarPreview(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Rasm yuklanmadi"));
      img.src = objectUrl;
    });

    const maxSize = 320;
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Rasm qayta ishlanmadi");
    }

    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProfileBox({ session, phone, onPhoneChange, onAvatarChange, className }: ProfileBoxProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaults = useMemo(() => splitName(session.name), [session.name]);
  const [firstName, setFirstName] = useState(defaults.firstName);
  const [lastName, setLastName] = useState(defaults.lastName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const profileRef = useRef({ firstName: defaults.firstName, lastName: defaults.lastName, avatarUrl: null as string | null });

  useEffect(() => {
    const saved = loadProfileExtras(session.id, {
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      avatarUrl: null,
    });
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setAvatarUrl(saved.avatarUrl);
    profileRef.current = saved;
    onAvatarChange?.(saved.avatarUrl);
  }, [session.id, defaults.firstName, defaults.lastName, onAvatarChange]);

  useEffect(() => {
    profileRef.current = { firstName, lastName, avatarUrl };
  }, [firstName, lastName, avatarUrl]);

  const persistProfile = useCallback(
    (next: { firstName?: string; lastName?: string; avatarUrl?: string | null }) => {
      const updated = {
        firstName: next.firstName ?? profileRef.current.firstName,
        lastName: next.lastName ?? profileRef.current.lastName,
        avatarUrl: next.avatarUrl !== undefined ? next.avatarUrl : profileRef.current.avatarUrl,
      };
      profileRef.current = updated;
      saveProfileExtras(session.id, updated);
      if (next.firstName !== undefined) setFirstName(next.firstName);
      if (next.lastName !== undefined) setLastName(next.lastName);
      if (next.avatarUrl !== undefined) setAvatarUrl(next.avatarUrl);
      if (next.avatarUrl !== undefined) onAvatarChange?.(next.avatarUrl);
    },
    [session.id, onAvatarChange],
  );

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setAvatarLoading(true);

    try {
      const url = await readAvatarPreview(file);
      persistProfile({ avatarUrl: url });
    } catch {
      /* rasm yuklanmadi */
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setApiUserId(null);
    router.replace("/auth");
  };

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border-default bg-arena-surface p-6 sm:p-7",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.78_0.14_195_/_0.08),transparent_55%)]"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarLoading}
          className={cn(
            "group relative size-28 overflow-hidden rounded-2xl border-2 transition",
            avatarUrl
              ? "border-brand-cyan/50 bg-arena-overlay"
              : "border-dashed border-brand-cyan/40 bg-brand-cyan-dim hover:border-brand-cyan/70",
          )}
        >
          {avatarLoading ? (
            <span className="text-sm font-semibold text-brand-cyan">Yuklanmoqda...</span>
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={avatarUrl}
              src={avatarUrl}
              alt="Profil rasmi"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-brand-cyan">{getInitials(`${firstName} ${lastName}`)}</span>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-arena-base/50 opacity-0 transition group-hover:opacity-100">
            <Camera className="size-6 text-brand-cyan" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="mt-3 text-xs text-text-muted">
          {avatarUrl ? "Rasmni o'zgartirish uchun bosing" : "Rasm qo'shish uchun bosing"}
        </p>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 label-caps text-text-muted">
            <User className="size-3.5" />
            Ism
          </span>
          <input
            value={firstName}
            onChange={(event) => {
              const value = event.target.value;
              setFirstName(value);
              persistProfile({ firstName: value });
            }}
            placeholder="Ismingiz"
            className="h-11 w-full rounded-xl border border-border-default bg-arena-raised px-3 text-sm text-text-primary outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20"
          />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 label-caps text-text-muted">
            <User className="size-3.5" />
            Familiya
          </span>
          <input
            value={lastName}
            onChange={(event) => {
              const value = event.target.value;
              setLastName(value);
              persistProfile({ lastName: value });
            }}
            placeholder="Familiyangiz"
            className="h-11 w-full rounded-xl border border-border-default bg-arena-raised px-3 text-sm text-text-primary outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20"
          />
        </label>
      </div>

      <div className="relative z-10 mt-5">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 label-caps text-text-muted">
            <Phone className="size-3.5" />
            Telefon
          </span>
          <input
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-border-default bg-arena-raised px-3 text-sm text-text-primary outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20"
          />
        </label>
      </div>

      <div className="relative z-10 mt-6">
        <Button type="button" variant="secondary" className="w-full" onClick={handleLogout}>
          <LogOut className="size-4" />
          Chiqish
        </Button>
      </div>
    </article>
  );
}
