import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-violet-500/35 bg-[#181425] px-3 text-sm text-white outline-none transition placeholder:text-violet-300/45 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/25",
        className,
      )}
      {...props}
    />
  );
}
