import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", {
  variants: {
    variant: {
      available: "border-emerald-300/40 bg-emerald-400/10 text-emerald-300",
      busy: "border-rose-300/40 bg-rose-400/10 text-rose-300",
      booked: "border-amber-300/40 bg-amber-400/10 text-amber-200",
      neutral: "border-violet-300/30 bg-violet-400/10 text-violet-100",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
