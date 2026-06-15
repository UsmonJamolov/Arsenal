import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, touchPress } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold",
    touchPress,
    "disabled:pointer-events-none disabled:opacity-45",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-arena-base",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-brand-magenta text-white shadow-[0_4px_16px_oklch(0.66_0.24_320_/_0.38)] hover:bg-brand-magenta/92 active:bg-brand-magenta/85",
        accent:
          "bg-brand-cyan text-arena-base shadow-[0_4px_16px_oklch(0.8_0.15_195_/_0.35)] hover:bg-brand-cyan/92 active:bg-brand-cyan/85",
        secondary:
          "border-2 border-brand-cyan/45 bg-brand-cyan-dim text-text-primary shadow-[0_2px_10px_oklch(0_0_0_/_0.2)] hover:border-brand-cyan/70 hover:bg-brand-cyan/25 active:bg-brand-cyan/30",
        ghost:
          "text-text-secondary hover:bg-arena-overlay/70 hover:text-text-primary active:bg-arena-surface",
        gold:
          "border-2 border-brand-gold/50 bg-brand-gold-dim text-brand-gold shadow-[0_2px_10px_oklch(0_0_0_/_0.18)] hover:bg-brand-gold/22 active:bg-brand-gold/30",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
