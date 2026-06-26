"use client";

import { useId } from "react";

type HookahIconProps = {
  className?: string;
  strokeWidth?: number;
};

const VIEWBOX_STROKE = 3.2;
const LEGACY_STROKE = 1.75;

export function HookahIcon({ className, strokeWidth = LEGACY_STROKE }: HookahIconProps) {
  const glowId = useId();
  const resolvedStrokeWidth = strokeWidth * (VIEWBOX_STROKE / LEGACY_STROKE);

  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        filter={`url(#${glowId})`}
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M56 18H72" />
        <path d="M58 18V24C58 26 60 28 64 28C68 28 70 26 70 24V18" />
        <ellipse cx="64" cy="34" rx="16" ry="3" />
        <line x1="64" y1="34" x2="64" y2="68" />
        <path d="M58 68H70" />
        <path d="M60 68L58 76H70L68 68" />
        <path d="M44 76 C44 94 52 104 64 104 C76 104 84 94 84 76" />
        <path d="M48 76 C48 86 54 94 64 94 C74 94 80 86 80 76" />
        <path d="M52 88H76" />
        <path d="M56 104H72" />
        <path d="M70 72 C88 74 96 90 92 102 C88 112 74 112 64 104" />
      </g>
    </svg>
  );
}
