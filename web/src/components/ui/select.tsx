import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "scheme-dark h-11 w-full rounded-xl border border-violet-500/35 bg-[#181425] px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/25",
        className,
      )}
      {...props}
    />
  );
}
