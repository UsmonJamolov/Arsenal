import * as React from "react";

import { cn, touchPress } from "@/lib/utils";

export function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-3xl border border-violet-500/25 bg-black/20 p-2 sm:grid-cols-2 lg:grid-cols-7",
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
        "rounded-2xl px-3 py-2 text-sm font-bold text-violet-200 hover:bg-white/10 hover:text-cyan-100 active:bg-white/20 data-[state=active]:bg-cyan-300/15 data-[state=active]:text-cyan-200 data-[state=active]:shadow-[0_0_18px_rgba(34,211,238,0.22)] data-[state=active]:active:bg-cyan-300/30",
        className,
      )}
      {...props}
    />
  );
}
