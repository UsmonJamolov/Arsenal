import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-border-default bg-arena-raised px-3.5 text-sm text-text-primary outline-none transition",
        "placeholder:text-text-faint",
        "focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20",
        className,
      )}
      {...props}
    />
  );
}
