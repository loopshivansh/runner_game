import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "light" | "accent";

export function PillButton({
  children,
  variant = "primary",
  icon,
  iconLeft,
  className = "",
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
  iconLeft?: ReactNode;
}) {
  return (
    <button
      className={`pill pill-${variant} ${className}`}
      style={{ padding: "17px 26px", fontSize: 18, ...style }}
      {...rest}
    >
      {iconLeft}
      {children}
      {icon}
    </button>
  );
}

/* --- Inline icons (stroke inherits currentColor) --- */

const S = ({
  children,
  size = 20,
  fill = "none",
}: {
  children: ReactNode;
  size?: number;
  fill?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const PlayIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M7 4.5l12 7.5-12 7.5v-15z" fill="currentColor" stroke="none" />
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
    <rect x="6" y="5" width="4" height="14" rx="1.4" fill="currentColor" stroke="none" />
    <rect x="14" y="5" width="4" height="14" rx="1.4" fill="currentColor" stroke="none" />
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
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
    <path d="M17 8a5 5 0 0 1 0 8" fill="none" />
  </S>
);
export const SoundOffIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
    <path d="M22 9l-6 6M16 9l6 6" fill="none" />
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
export const ShareIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </S>
);
export const CloseIcon = ({ size = 18 }: { size?: number }) => (
  <S size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);

/* --- Swipe gesture graphics for the tutorial --- */

/**
 * A clean hand-swipe glyph with a directional arrow. `dir` rotates the whole
 * gesture: up/down/left/right, plus the diagonal lane directions.
 */
export function SwipeGlyph({
  dir,
  size = 56,
  color = "#fff",
}: {
  dir: "up" | "down" | "left" | "right";
  size?: number;
  color?: string;
}) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      style={{ transform: `rotate(${rot}deg)` }}
    >
      {/* motion trail */}
      <path
        d="M32 46c0-6 0-11 0-16"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 6"
      />
      {/* arrowhead pointing in `dir` */}
      <path
        d="M32 8l9 11H23l9-11z"
        fill={color}
      />
      {/* pointing hand */}
      <g fill={color}>
        <path d="M30 24c0-2 3-2 3 0v9l3-1c2-.6 4 .3 4.4 2.2l2 8.4c.6 2.6-1 5.2-3.6 5.9l-8.6 1.9c-2 .45-4-.5-5-2.3l-4-7c-1-1.7-.3-3.9 1.5-4.6 1.4-.5 3 0 3.9 1.2l1 1.4V24z" />
      </g>
    </svg>
  );
}
