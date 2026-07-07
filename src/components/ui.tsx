import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "light";

export function PillButton({
  children,
  variant = "primary",
  icon,
  className = "",
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
}) {
  return (
    <button
      className={`pill pill-${variant} ${className}`}
      style={{ padding: "16px 24px", fontSize: 20, ...style }}
      {...rest}
    >
      {children}
      {icon}
    </button>
  );
}

/* --- Inline icons (stroke inherits currentColor) --- */

const S = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const PlayIcon = ({ size = 20 }: { size?: number }) => (
  <S size={size}>
    <path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />
  </S>
);
export const TimerIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 13V9M9 2h6" />
  </S>
);
export const PauseIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </S>
);
export const HelpIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" />
  </S>
);
export const SoundOnIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 8a5 5 0 0 1 0 8" />
  </S>
);
export const SoundOffIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M22 9l-6 6M16 9l6 6" />
  </S>
);
export const HomeIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v9h12v-9" />
  </S>
);
export const RefreshIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />
  </S>
);
export const OfferIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9h.01M15 15h.01M15 9l-6 6" />
  </S>
);
export const QuestionSteps = ({ n }: { n: number }) => (
  <span
    className="inline-flex items-center justify-center rounded-full bg-white text-[#16161a] font-display font-bold"
    style={{ width: 22, height: 22, fontSize: 13 }}
  >
    {n}
  </span>
);
