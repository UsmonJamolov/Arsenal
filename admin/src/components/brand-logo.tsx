import { cn } from "@/lib/utils";

const BRAND_LOGO_SRC = "/brand/arsenal-union-logo.png";

const sizeClass = {
  sm: "size-8",
  md: "size-12",
  lg: "size-16",
} as const;

type BrandLogoProps = {
  className?: string;
  size?: keyof typeof sizeClass;
};

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <span className={cn("brand-logo inline-flex shrink-0 items-center justify-center", className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt="Arsenal Union"
        className={cn("brand-logo__img aspect-square object-contain drop-shadow-[0_4px_12px_rgb(0_0_0_/_0.45)]", sizeClass[size])}
        width={64}
        height={64}
        decoding="async"
      />
    </span>
  );
}
