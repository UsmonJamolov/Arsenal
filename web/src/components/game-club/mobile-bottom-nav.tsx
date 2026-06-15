"use client";

import {
  Gamepad2,
  Home,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";

import { HookahIcon } from "@/components/icons/hookah-icon";
import { type TabKey } from "@/lib/game-club-data";
import { cn, touchPress } from "@/lib/utils";

type NavIcon = LucideIcon | ComponentType<{ className?: string; strokeWidth?: number }>;

const NAV_ITEMS: { key: TabKey; label: string; icon: NavIcon }[] = [
  { key: "home", label: "Bosh sahifa", icon: Home },
  { key: "devices", label: "Qurilmalar", icon: Gamepad2 },
  { key: "hookah", label: "Kalyanlar", icon: HookahIcon },
  { key: "cart", label: "Savatcha", icon: ShoppingCart },
  { key: "profile", label: "Profil", icon: UserRound },
];

type MobileBottomNavProps = {
  activeTab: TabKey;
  cartCount: number;
  profileAvatarUrl?: string | null;
  onChange: (tab: TabKey) => void;
};

export function MobileBottomNav({ activeTab, cartCount, profileAvatarUrl, onChange }: MobileBottomNavProps) {
  return (
    <nav
      className="home-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Asosiy navigatsiya"
    >
      <div className="home-nav__inner mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-2 pt-1.5">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          const showBadge = key === "cart" && cartCount > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                touchPress,
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2",
                active ? "home-nav__item--active" : "home-nav__item",
              )}
            >
              <span className="relative">
                {key === "profile" && profileAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileAvatarUrl}
                    alt="Profil"
                    className={cn(
                      "size-5 shrink-0 rounded-full object-cover ring-2",
                      active ? "ring-brand-cyan" : "ring-border-default",
                    )}
                  />
                ) : (
                  <Icon className={cn("size-5 shrink-0", active && "text-[#00E5FF]")} strokeWidth={active ? 2.5 : 2} />
                )}
                {showBadge ? (
                  <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-magenta text-[9px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "max-w-[4.5rem] truncate text-[9.5px] font-semibold leading-tight",
                  active ? "text-[#00E5FF]" : "text-[#94A3B8]",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
