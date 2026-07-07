import type { GameConfig } from "@/lib/config";

/** Stylised Loop mark — a continuous looping glyph. Overridable by a real logo. */
export function LoopMark({
  size = 32,
  color = "var(--brand-primary)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <path
        d="M17 14c-6 0-11 4.5-11 10s4.7 10 10.5 10c6.5 0 9.5-5.5 14-11 3.6-4.4 6-8 10.5-8 4 0 6.5 3 6.5 7s-3 7-7 7c-3.4 0-5.6-2-8.6-6"
        stroke={color}
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoopLogo({
  config,
  className = "",
  height = 34,
}: {
  config: GameConfig;
  className?: string;
  height?: number;
}) {
  if (config.brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={config.brand.logoUrl}
        alt={config.brand.name}
        style={{ height }}
        className={className}
      />
    );
  }
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <LoopMark size={height} color={config.brand.primaryColor} />
      <span
        className="font-display font-semibold lowercase tracking-tight"
        style={{ fontSize: height * 0.85, color: config.brand.primaryColor }}
      >
        {config.brand.name}
      </span>
    </div>
  );
}

/** Shield badge shown on the info overlay and win/lose screens. */
export function Badge({
  tier,
  config,
  size = 150,
}: {
  tier: "gold" | "silver";
  config: GameConfig;
  size?: number;
}) {
  const url = tier === "gold" ? config.assets.badgeGoldUrl : config.assets.badgeSilverUrl;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`${tier} badge`} style={{ width: size }} />;
  }
  const rim = tier === "gold" ? config.brand.goldColor : config.brand.silverColor;
  const rim2 = tier === "gold" ? "#b5842e" : "#8b9096";
  const id = `bg-${tier}`;
  return (
    <svg width={size} height={size * 1.28} viewBox="0 0 130 166" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rim} />
          <stop offset="1" stopColor={rim2} />
        </linearGradient>
        <clipPath id={`clip-${tier}`}>
          <path d="M65 6 122 30V88C122 122 96 148 65 160C34 148 8 122 8 88V30L65 6Z" />
        </clipPath>
      </defs>
      <path
        d="M65 6 122 30V88C122 122 96 148 65 160C34 148 8 122 8 88V30L65 6Z"
        fill={`url(#${id})`}
        stroke="#1a1a1a"
        strokeWidth="4"
      />
      <g clipPath={`url(#clip-${tier})`}>
        <rect x="16" y="44" width="98" height="72" fill="rgba(20,20,24,0.35)" />
      </g>
      <circle cx="65" cy="52" r="19" fill="#fff" />
      <g transform="translate(46,33) scale(0.8)">
        <LoopMark size={48} color={config.brand.primaryColor} />
      </g>
      <text
        x="65"
        y="112"
        textAnchor="middle"
        fill="#fff"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="700"
        fontSize="15"
      >
        {config.brand.name.toUpperCase()}
      </text>
      <text
        x="65"
        y="130"
        textAnchor="middle"
        fill="#fff"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="700"
        fontSize="15"
      >
        RUNNER
      </text>
    </svg>
  );
}
