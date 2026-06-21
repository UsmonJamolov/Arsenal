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
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      aria-label="Asosiy navigatsiya"
    >
      <div className="home-nav__inner mx-auto flex items-stretch justify-between">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          const showBadge = key === "cart" && cartCount > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                touchPress,
                "home-nav__btn relative flex min-w-0 flex-1 flex-col items-center rounded-xl",
                active ? "home-nav__item--active" : "home-nav__item",
              )}
            >
              <span className="relative flex items-center justify-center">
                {key === "profile" && profileAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileAvatarUrl}
                    alt=""
                    className={cn(
                      "home-nav__avatar shrink-0 rounded-full object-cover ring-2",
                      active ? "ring-[var(--au-red)]" : "ring-border-default",
                    )}
                  />
                ) : (
                  <span className={cn("home-nav__icon-wrap", active && "home-nav__icon-wrap--active")}>
                    <Icon className={cn("home-nav__icon", active && "text-[var(--au-red)]")} strokeWidth={active ? 2.5 : 2} />
                  </span>
                )}
                {showBadge ? (
                  <span className="home-nav__cart-badge">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </span>
              <span className={cn("home-nav__label", active && "home-nav__label--active")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
