import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "scheme-dark h-11 w-full rounded-xl border border-border-default bg-arena-raised px-3.5 text-sm font-medium text-text-primary outline-none transition",
        "focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20",
        className,
      )}
      {...props}
    />
  );
}
