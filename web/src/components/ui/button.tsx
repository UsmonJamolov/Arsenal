import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, touchPress } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold",
    touchPress,
    "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-fuchsia-600 text-white shadow-[0_0_24px_rgba(217,70,239,0.35)] hover:bg-fuchsia-500 active:bg-fuchsia-400 active:shadow-[0_0_28px_rgba(217,70,239,0.5)]",
        secondary:
          "border border-violet-500/40 bg-white/5 text-violet-100 hover:bg-white/10 active:border-cyan-300/50 active:bg-white/20",
        ghost: "text-violet-200 hover:bg-white/10 hover:text-cyan-100 active:bg-white/15 active:text-cyan-50",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-7",
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
