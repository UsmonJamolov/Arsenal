"use client";

import {
  CalendarCheck,
  Cigarette,
  CreditCard,
  Gamepad2,
  Home,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { type TabKey } from "@/lib/game-club-data";
import { cn, touchPress } from "@/lib/utils";

const NAV_ITEMS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Bosh", icon: Home },
  { key: "devices", label: "Qurilma", icon: Gamepad2 },
  { key: "booking", label: "Bron", icon: CalendarCheck },
  { key: "hookah", label: "Kalyan", icon: Cigarette },
  { key: "cart", label: "Savat", icon: ShoppingCart },
  { key: "payment", label: "To'lov", icon: CreditCard },
  { key: "profile", label: "Profil", icon: UserRound },
];

type MobileBottomNavProps = {
  activeTab: TabKey;
  cartCount: number;
  onChange: (tab: TabKey) => void;
};

export function MobileBottomNav({ activeTab, cartCount, onChange }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-500/30 bg-[#07050f]/95 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden"
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
                  ? "bg-cyan-400/15 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.2)] active:bg-cyan-400/30 active:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                  : "text-violet-300/70 hover:bg-white/5 hover:text-violet-100 active:bg-white/15",
              )}
            >
              <span className="relative">
                <Icon className={cn("size-5 shrink-0", active && "text-cyan-300")} strokeWidth={active ? 2.5 : 2} />
                {showBadge ? (
                  <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </span>
              <span className={cn("max-w-[3.25rem] truncate text-[10px] font-semibold leading-tight", active && "text-cyan-100")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
