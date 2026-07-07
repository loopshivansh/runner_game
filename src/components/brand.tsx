"use client";

import { useState } from "react";
import type { GameConfig } from "@/lib/config";

/**
 * The Loop mark — a continuous looping glyph rendered as an SVG.
 * Used for the coin/score chip and as a fallback for the wordmark.
 */
export function LoopMark({
  size = 32,
  color = "var(--brand-primary)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
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

/**
 * The Loop wordmark. Prefers the real brand asset at `config.brand.logoUrl`,
 * and gracefully falls back to the built-in mark + wordmark if the image is
 * missing or fails to load.
 */
export function LoopLogo({
  config,
  className = "",
  height = 34,
}: {
  config: GameConfig;
  className?: string;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(config.brand.logoUrl) && !failed;

  if (hasImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={config.brand.logoUrl}
        alt={config.brand.name}
        style={{ height, width: "auto" }}
        className={className}
        onError={() => setFailed(true)}
        draggable={false}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoopMark size={height} color={config.brand.primaryColor} />
      <span
        className="font-display font-semibold lowercase"
        style={{
          fontSize: height * 0.9,
          color: config.brand.primaryColor,
          letterSpacing: "-0.03em",
        }}
      >
        {config.brand.name}
      </span>
    </div>
  );
}

/**
 * Premium shield badge for the info + win/lose screens.
 * Metallic gold/silver rim, a photographic (or tinted) center panel, the Loop
 * mark on a white disc, and the "NOISE RUNNER" lockup — matching the Figma.
 * Prefers a real image asset when present, otherwise renders a crisp SVG.
 */
export function Badge({
  tier,
  config,
  size = 150,
}: {
  tier: "gold" | "silver";
  config: GameConfig;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const url = tier === "gold" ? config.assets.badgeGoldUrl : config.assets.badgeSilverUrl;

  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={`${tier} badge`}
        style={{ width: size }}
        onError={() => setFailed(true)}
        draggable={false}
      />
    );
  }

  const gold = tier === "gold";
  const rimHi = gold ? "#f5cf7a" : "#eef1f4";
  const rimMid = gold ? config.brand.goldColor : config.brand.silverColor;
  const rimLo = gold ? "#a9741f" : "#8b9299";
  const id = tier;
  const w = size;
  const h = size * 1.16;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 150 174"
      fill="none"
      aria-hidden
      style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.55))" }}
    >
      <defs>
        <linearGradient id={`rim-${id}`} x1="20" y1="8" x2="130" y2="166" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={rimHi} />
          <stop offset="0.5" stopColor={rimMid} />
          <stop offset="1" stopColor={rimLo} />
        </linearGradient>
        <linearGradient id={`panel-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5560" />
          <stop offset="0.5" stopColor="#2b333c" />
          <stop offset="1" stopColor="#141a20" />
        </linearGradient>
        <clipPath id={`clip-${id}`}>
          <path d="M75 12 128 33V90C128 122 104 148 75 160C46 148 22 122 22 90V33L75 12Z" />
        </clipPath>
      </defs>

      {/* outer metallic rim */}
      <path
        d="M75 6 134 30V90C134 125 108 153 75 166C42 153 16 125 16 90V30L75 6Z"
        fill={`url(#rim-${id})`}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.5"
      />
      {/* inner bevel */}
      <path
        d="M75 12 128 33V90C128 122 104 148 75 160C46 148 22 122 22 90V33L75 12Z"
        fill={`url(#panel-${id})`}
      />
      {/* faint cityscape hint inside the panel */}
      <g clipPath={`url(#clip-${id})`} opacity="0.5">
        <rect x="30" y="78" width="12" height="60" fill="rgba(255,255,255,0.06)" />
        <rect x="46" y="88" width="14" height="50" fill="rgba(255,255,255,0.09)" />
        <rect x="64" y="72" width="16" height="66" fill="rgba(255,255,255,0.07)" />
        <rect x="84" y="90" width="14" height="48" fill="rgba(255,255,255,0.1)" />
        <rect x="102" y="82" width="12" height="56" fill="rgba(255,255,255,0.06)" />
        <rect x="30" y="140" width="90" height="20" fill="rgba(255,255,255,0.05)" />
      </g>

      {/* Loop mark disc */}
      <circle cx="75" cy="60" r="21" fill="#fff" />
      <g transform="translate(53,38)">
        <LoopMark size={44} color={config.brand.primaryColor} />
      </g>

      {/* NOISE RUNNER lockup */}
      <text
        x="75"
        y="118"
        textAnchor="middle"
        fill="#fff"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing="0.5"
      >
        NOISE
      </text>
      <text
        x="75"
        y="136"
        textAnchor="middle"
        fill="#fff"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing="0.5"
      >
        RUNNER
      </text>
    </svg>
  );
}
