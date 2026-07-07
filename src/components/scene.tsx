import type { GameConfig } from "@/lib/config";

/**
 * Atmospheric backdrop for the splash / email / loading screens.
 * A cinematic dusk-to-dark street with a receding perspective road and a
 * soft brand glow — premium and moody rather than cartoonish.
 */
export function SkyScene({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* sky / atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#20293a 0%,#1a2130 30%,#12141c 58%,#0a0a0c 100%)",
        }}
      />
      {/* brand glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "6%",
          width: "70%",
          height: "40%",
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(139,61,255,0.28) 0%, rgba(139,61,255,0) 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* skyline silhouette */}
      <svg
        className="absolute left-0 right-0"
        style={{ top: "30%", width: "100%" }}
        viewBox="0 0 360 150"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 96h20V54h24v42h16V66h28v30h22V44h26v52h18V72h32v24h24V56h28v40h20V74h30v76H0z"
          fill="#171b26"
        />
        <path
          d="M0 118h38v-28h28v28h24V98h32v20h28v-14h38v14h28v-22h28v22h24v34H0z"
          fill="#0f121a"
        />
        {/* window lights */}
        <g fill="rgba(180,200,255,0.18)">
          <rect x="30" y="70" width="4" height="6" />
          <rect x="52" y="80" width="4" height="6" />
          <rect x="120" y="60" width="4" height="6" />
          <rect x="210" y="86" width="4" height="6" />
          <rect x="300" y="88" width="4" height="6" />
        </g>
      </svg>

      {/* perspective road */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 0,
          width: "88%",
          height: "48%",
          background:
            "linear-gradient(180deg,rgba(24,26,34,0) 0%,#181a22 40%,#0d0e13 100%)",
          clipPath: "polygon(44% 0,56% 0,100% 100%,0 100%)",
        }}
      />
      {/* centre lane line */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 0,
          width: "2px",
          height: "46%",
          background:
            "linear-gradient(180deg,rgba(139,61,255,0) 0%,rgba(139,61,255,0.5) 100%)",
          clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
          transformOrigin: "top",
          transform: "scaleX(6)",
          maskImage: "linear-gradient(180deg,transparent,black 40%)",
        }}
      />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 30%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      {children}
    </div>
  );
}

/**
 * A stylised runner (back view, headphones) for the splash / loading screens.
 * Refined proportions and lighting to sit against the dark backdrop.
 */
export function RunnerArt({
  config,
  size = 190,
}: {
  config: GameConfig;
  size?: number;
}) {
  const p = config.brand.primaryColor;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 160 184" fill="none" aria-hidden>
      {/* ground glow */}
      <ellipse cx="80" cy="176" rx="52" ry="10" fill="rgba(139,61,255,0.22)" />
      <ellipse cx="80" cy="176" rx="40" ry="7" fill="rgba(0,0,0,0.35)" />
      {/* back leg */}
      <path d="M70 108c-6 14-18 24-26 34" stroke="#d7dbe2" strokeWidth="16" strokeLinecap="round" />
      <ellipse cx="42" cy="146" rx="14" ry="8" fill={p} />
      {/* front leg */}
      <path d="M92 108c6 16 14 30 22 44" stroke="#e6e9ef" strokeWidth="17" strokeLinecap="round" />
      <ellipse cx="116" cy="154" rx="15" ry="9" fill={p} />
      {/* torso */}
      <rect x="56" y="54" width="48" height="66" rx="18" fill="#eef1f6" />
      <rect x="56" y="54" width="48" height="18" rx="12" fill={p} />
      {/* subtle torso shading */}
      <rect x="56" y="54" width="16" height="66" rx="16" fill="rgba(0,0,0,0.06)" />
      {/* arms */}
      <path d="M60 66c-10 6-16 16-18 28" stroke="#d7dbe2" strokeWidth="13" strokeLinecap="round" />
      <path d="M100 66c10 4 18 12 22 22" stroke="#d7dbe2" strokeWidth="13" strokeLinecap="round" />
      {/* head + headphones */}
      <circle cx="80" cy="38" r="24" fill="#2a2320" />
      <path d="M56 40a24 24 0 0 1 48 0" stroke={p} strokeWidth="7" fill="none" />
      <circle cx="55" cy="42" r="8" fill={p} />
      <circle cx="105" cy="42" r="8" fill={p} />
    </svg>
  );
}
