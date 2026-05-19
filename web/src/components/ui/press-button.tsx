"use client";

import { motion } from "framer-motion";
import { useCallback, useState, type ButtonHTMLAttributes } from "react";

import { cn, touchPress } from "@/lib/utils";

type PressButtonVariant = "primary" | "payment" | "clear";

const variantClass: Record<PressButtonVariant, string> = {
  primary:
    "bg-fuchsia-600 text-white shadow-[0_0_24px_rgba(217,70,239,0.35)] hover:bg-fuchsia-500 active:bg-fuchsia-300",
  payment:
    "bg-cyan-500 text-[#05030f] shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-400 active:bg-cyan-300",
  clear:
    "border-2 border-violet-400/50 bg-white/5 text-violet-100 hover:bg-white/10 active:border-rose-300/70 active:bg-rose-500/20 active:text-rose-100",
};

const flashClass: Record<PressButtonVariant, string> = {
  primary: "bg-fuchsia-200/50",
  payment: "bg-cyan-100/60",
  clear: "bg-rose-200/40",
};

type PressButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PressButtonVariant;
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
      whileTap={disabled ? undefined : { scale: 0.9 }}
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
        flash && "ring-[3px] ring-white/50 ring-offset-2 ring-offset-[#07050f]",
        disabled && "pointer-events-none opacity-50",
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
