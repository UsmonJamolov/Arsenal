type HookahIconProps = {
  className?: string;
  strokeWidth?: number;
};

export function HookahIcon({ className, strokeWidth = 1.75 }: HookahIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path
        d="M9 20.5h6c1.2 0 2.2-1 2.2-2.2V16H6.8v2.3c0 1.2 1 2.2 2.2 2.2Z"
        fill="currentColor"
        fillOpacity={0.12}
      />
      <path d="M7.5 16h9l-1.4-7.8C14.6 6.8 13.4 5.8 12 5.8S9.4 6.8 9.1 8.2L7.5 16Z" />
      <ellipse cx="12" cy="5.4" rx="2.4" ry="1.1" />
      <path d="M12 8.2V4.8" />
      <ellipse cx="12" cy="8.6" rx="4.2" ry="1" />
      <path d="M15.2 10.2c2.6 0.4 4.3 2 4.3 4.4" />
      <path d="M19.5 14.6v4.2" />
      <circle cx="19.5" cy="19.4" r="1" fill="currentColor" stroke="none" />
      <path d="M10.2 10.8h3.6" strokeWidth={strokeWidth * 0.9} />
    </svg>
  );
}
