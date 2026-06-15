import * as React from "react";

import { cn, touchPress } from "@/lib/utils";

export function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid gap-1 rounded-2xl border border-border-default bg-arena-surface p-1.5 shadow-[0_4px_16px_oklch(0_0_0_/_0.18)] sm:grid-cols-2 lg:grid-cols-6",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        touchPress,
        "rounded-xl px-3 py-2.5 text-sm font-semibold text-text-secondary transition-colors",
        "hover:bg-arena-overlay hover:text-text-primary",
        "data-[state=active]:bg-brand-cyan-dim data-[state=active]:text-brand-cyan",
        "data-[state=active]:border data-[state=active]:border-brand-cyan/45 data-[state=active]:shadow-[inset_0_0_0_1px_oklch(0.8_0.15_195_/_0.2)]",
        className,
      )}
      {...props}
    />
  );
}
