import type { GameConfig } from "@/lib/config";

/** Light sky + city backdrop used on splash / email / loading screens. */
export function SkyScene({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#bcdcf2 0%,#d5e4ee 38%,#e9edf1 55%,#101014 100%)",
        }}
      />
      {/* city silhouette */}
      <svg
        className="absolute left-0 right-0"
        style={{ top: "32%", width: "100%" }}
        viewBox="0 0 360 160"
        preserveAspectRatio="none"
        fill="#9fb2c4"
      >
        <path d="M0 90h22V50h26v40h18V64h30v26h24V40h28v50h20V70h34v20h26V54h30v36h22V72h30v88H0z" opacity="0.5" />
        <path d="M0 120h40v-30h30v30h26V96h34v24h30v-16h40v16h30v-24h30v24h26v40H0z" opacity="0.7" />
      </svg>
      {/* road */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 0,
          width: "70%",
          height: "42%",
          background: "linear-gradient(180deg,rgba(60,64,72,0) 0%,#2f323a 60%)",
          clipPath: "polygon(42% 0,58% 0,100% 100%,0 100%)",
        }}
      />
      {children}
    </div>
  );
}

/** A charming stylised runner (back view, headphones) for splash + loading. */
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
      {/* shadow */}
      <ellipse cx="80" cy="176" rx="46" ry="8" fill="rgba(0,0,0,0.25)" />
      {/* back leg */}
      <path d="M70 108c-6 14-18 24-26 34" stroke="#e9edf2" strokeWidth="16" strokeLinecap="round" />
      <ellipse cx="42" cy="146" rx="14" ry="8" fill={p} />
      {/* front leg */}
      <path d="M92 108c6 16 14 30 22 44" stroke="#eef1f5" strokeWidth="17" strokeLinecap="round" />
      <ellipse cx="116" cy="154" rx="15" ry="9" fill={p} />
      {/* torso */}
      <rect x="56" y="54" width="48" height="66" rx="18" fill="#f4f6f9" />
      <rect x="56" y="54" width="48" height="18" rx="12" fill={p} />
      {/* arms */}
      <path d="M60 66c-10 6-16 16-18 28" stroke="#e9edf2" strokeWidth="13" strokeLinecap="round" />
      <path d="M100 66c10 4 18 12 22 22" stroke="#e9edf2" strokeWidth="13" strokeLinecap="round" />
      {/* head */}
      <circle cx="80" cy="38" r="24" fill="#2a2320" />
      <path d="M56 40a24 24 0 0 1 48 0" stroke={p} strokeWidth="7" fill="none" />
      <circle cx="55" cy="42" r="8" fill={p} />
      <circle cx="105" cy="42" r="8" fill={p} />
    </svg>
  );
}
