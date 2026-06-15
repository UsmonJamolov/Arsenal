"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useCallback, useState } from "react";

import { cn, touchPress } from "@/lib/utils";

type PressButtonVariant = "primary" | "payment" | "clear";

const variantClass: Record<PressButtonVariant, string> = {
  primary: "bg-brand-magenta text-white hover:bg-brand-magenta/90 active:bg-brand-magenta/80",
  payment: "bg-brand-cyan text-arena-base hover:bg-brand-cyan/90 active:bg-brand-cyan/80",
  clear:
    "border border-border-strong bg-arena-overlay/40 text-text-secondary hover:bg-arena-overlay active:border-status-busy/50 active:bg-status-busy/10 active:text-status-busy",
};

const flashClass: Record<PressButtonVariant, string> = {
  primary: "bg-white/25",
  payment: "bg-white/30",
  clear: "bg-status-busy/20",
};

type PressButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: PressButtonVariant;
  children?: React.ReactNode;
};

export function PressButton({
  className,
  variant = "primary",
  children,
  disabled,
  onClick,
  onPointerDown,
  ...props
}: PressButtonProps) {
  const [flash, setFlash] = useState(false);

  const pulse = useCallback(() => {
    if (disabled) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 380);
  }, [disabled]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
      onPointerDown={(event) => {
        pulse();
        onPointerDown?.(event);
      }}
      onClick={(event) => {
        pulse();
        onClick?.(event);
      }}
      className={cn(
        "relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-sm font-bold",
        touchPress,
        variantClass[variant],
        flash && "ring-2 ring-white/30 ring-offset-2 ring-offset-arena-base",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {flash ? (
        <motion.span
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 z-0", flashClass[variant])}
          initial={{ opacity: 0.85, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        />
      ) : null}
    </motion.button>
  );
}
