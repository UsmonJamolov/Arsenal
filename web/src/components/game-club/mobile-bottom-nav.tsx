"use client";

import {
  CreditCard,
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
  { key: "home", label: "Bosh", icon: Home },
  { key: "devices", label: "Qurilma", icon: Gamepad2 },
  { key: "hookah", label: "Kalyan", icon: HookahIcon },
  { key: "cart", label: "Savat", icon: ShoppingCart },
  { key: "payment", label: "To'lov", icon: CreditCard },
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-strong/60 bg-arena-surface/98 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Asosiy navigatsiya"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 pt-1.5">
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
                active
                  ? "bg-brand-cyan-dim text-brand-cyan shadow-[inset_0_0_0_1px_oklch(0.8_0.15_195_/_0.35)]"
                  : "text-text-secondary hover:bg-arena-overlay/80 hover:text-text-primary active:bg-arena-overlay",
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
                  <Icon className={cn("size-5 shrink-0", active && "text-brand-cyan")} strokeWidth={active ? 2.5 : 2} />
                )}
                {showBadge ? (
                  <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-magenta text-[9px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "max-w-[3.25rem] truncate text-[10px] font-semibold leading-tight",
                  active && "text-brand-cyan",
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
