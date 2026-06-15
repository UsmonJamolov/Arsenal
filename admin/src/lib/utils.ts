import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Telefonda bosilganda darhol ko‘rinadigan effekt (hover ishlamaydi) */
export const touchPress =
  "cursor-pointer touch-manipulation select-none [-webkit-tap-highlight-color:transparent] transition-[transform,filter,background-color,border-color,box-shadow] duration-75 active:scale-[0.96] active:brightness-110 active:opacity-95 disabled:active:scale-100 disabled:active:brightness-100 disabled:active:opacity-50";
