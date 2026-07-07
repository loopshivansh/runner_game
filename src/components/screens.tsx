"use client";

import { useEffect, useState } from "react";
import type { GameConfig } from "@/lib/config";
import { LoopLogo, LoopMark } from "./brand";
import { RunnerArt, SkyScene } from "./scene";
import {
  CloseIcon,
  HelpIcon,
  HomeIcon,
  OfferIcon,
  PauseIcon,
  PillButton,
  PlayIcon,
  RefreshIcon,
  ShareIcon,
  SoundOffIcon,
  SoundOnIcon,
  SwipeGlyph,
  TimerIcon,
} from "./ui";

/* --------------------------- Score / coin chip -------------------------- */
function CoinChip() {
  return <LoopMark size={24} />;
}

/* ------------------------------- Splash -------------------------------- */
export function Splash({
  config,
  onPlay,
  onInfo,
}: {
  config: GameConfig;
  onPlay: () => void;
  onInfo: () => void;
}) {
  return (
    <div className="overlay">
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center pt-10 px-6 text-center">
          <LoopLogo config={config} height={40} />
          <h1 className="mt-5 font-display font-semibold text-white text-[19px] leading-[1.25] max-w-[260px]">
            {config.copy.splashTitle}
          </h1>
        </div>

        <div className="flex-1" />

        <div className="px-5 pb-9 flex flex-col gap-3 slide-up">
          <PillButton
            variant="ghost"
            onClick={onInfo}
            className="w-full"
            style={{ fontSize: 14, padding: "13px 20px", fontWeight: 500 }}
          >
            {config.copy.playbookLinkLabel}
          </PillButton>
          <PillButton onClick={onPlay} icon={<PlayIcon />} className="w-full">
            {config.copy.playButton}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Info overlay ----------------------------- */
export function InfoOverlay({
  config,
  onClose,
  onPlay,
}: {
  config: GameConfig;
  onClose: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="overlay bg-black/65 justify-end fade-in">
      <div className="sheet rounded-t-[28px] px-6 pt-5 pb-8">
        {/* grabber */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

        <div className="flex items-start gap-3 pb-5 border-b border-white/8">
          <div className="flex-1">
            <h2 className="font-display font-bold text-[21px] leading-tight">
              How to get{" "}
              <span style={{ color: config.brand.goldColor }}>
                {config.copy.playbookName}?
              </span>
            </h2>
            <p className="text-white/55 text-[13px] mt-1">{config.copy.infoSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center rounded-full shrink-0 text-white/70"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.07)" }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="flex justify-center py-6">
          <PlaybookReward config={config} />
        </div>

        <p className="font-display font-semibold text-[15px] leading-snug mb-5 text-white/90">
          {config.copy.infoFooter}
        </p>
        <ol className="flex flex-col gap-3 mb-7">
          <Step n={1} icon={<TimerIcon size={15} />} text={config.copy.infoStep1} />
          <Step
            n={2}
            icon={<LoopMark size={15} color={config.brand.primaryColor} />}
            text={config.copy.infoStep2}
          />
        </ol>
        <PillButton onClick={onPlay} icon={<PlayIcon />} className="w-full">
          {config.copy.playButton}
        </PillButton>
      </div>
    </div>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex items-center justify-center gap-1.5 shrink-0 rounded-full pl-1 pr-2.5 py-1"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-white text-[#141418] font-display font-bold"
          style={{ width: 22, height: 22, fontSize: 12 }}
        >
          {n}
        </span>
        <span className="flex items-center justify-center w-4 text-white/85">{icon}</span>
      </span>
      <span className="text-[14px] text-white/80 leading-snug">{text}</span>
    </li>
  );
}

/* --------------------------- Email capture ----------------------------- */
export function EmailCapture({
  config,
  onStart,
  submitting,
}: {
  config: GameConfig;
  onStart: (email: string) => void;
  submitting: boolean;
}) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function submit() {
    if (config.leadCapture.requireEmail && !valid) {
      setErr("Please enter a valid email");
      return;
    }
    onStart(email.trim());
  }

  return (
    <div className="overlay">
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center pt-10">
          <LoopLogo config={config} height={36} />
        </div>
        <div className="flex-1" />

        <div className="sheet px-6 pt-7 pb-8 rounded-t-[28px] slide-up">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
          <label className="eyebrow text-white/45 block mb-2 text-center">
            {config.copy.emailHeading}
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={config.copy.emailPlaceholder}
            aria-label={config.copy.emailHeading}
            className="w-full rounded-full bg-white text-[#141418] text-center font-body font-medium text-[16px] py-4 outline-none placeholder:text-[#9aa0a6]"
            style={{ boxShadow: err ? "0 0 0 2px #ef4444" : "0 0 0 2px transparent" }}
          />
          <p className="text-center text-white/55 text-[13px] mt-3 px-4 leading-snug">
            {config.copy.emailHelper}
          </p>
          {err && <p className="text-center text-red-400 text-[13px] mt-2">{err}</p>}
          <PillButton
            onClick={submit}
            disabled={submitting}
            icon={
              submitting ? (
                <span className="spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <PlayIcon />
              )
            }
            className="w-full mt-5"
          >
            {submitting ? "Loading…" : config.copy.startButton}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Loading -------------------------------- */
/**
 * Progress is driven by the parent (0–100). For backward compatibility with an
 * older shell that self-times via `onDone`, an optional `onDone` fallback is
 * supported: when `progress` is omitted, the bar advances itself and fires
 * `onDone` at 100%. When `progress` is provided, it simply reflects the prop.
 */
export function Loading({
  config,
  progress,
  onDone,
}: {
  config: GameConfig;
  progress?: number;
  onDone?: () => void;
}) {
  const controlled = typeof progress === "number";
  const [selfPct, setSelfPct] = useState(0);

  useEffect(() => {
    if (controlled || !onDone) return;
    let raf = 0;
    const start = performance.now();
    const DUR = 1600;
    const tick = (t: number) => {
      const v = Math.min(100, Math.round(((t - start) / DUR) * 100));
      setSelfPct(v);
      if (v < 100) raf = requestAnimationFrame(tick);
      else setTimeout(() => onDone(), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controlled, onDone]);

  const pct = controlled ? Math.max(0, Math.min(100, Math.round(progress!))) : selfPct;

  return (
    <div className="overlay">
      <SkyScene />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center pt-10">
          <LoopLogo config={config} height={36} />
        </div>
        <div className="flex-1 flex items-end justify-center pb-2">
          <div className="float-y">
            <RunnerArt config={config} size={180} />
          </div>
        </div>

        <div className="px-8 pb-16">
          <div className="flex items-baseline justify-between mb-3">
            <span className="font-display font-semibold text-[18px] text-white/90">
              Loading
            </span>
            <span className="font-display font-bold text-[20px] tabular-nums">
              {pct}%
            </span>
          </div>
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-150 relative overflow-hidden"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg,#9a52ff,${config.brand.primaryColor})`,
              }}
            >
              <span className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Tutorial ------------------------------- */
export function Tutorial({
  config,
  onStart,
}: {
  config: GameConfig;
  onStart: () => void;
}) {
  return (
    <button
      className="overlay bg-black/80 items-center justify-between text-center px-6 pt-16 pb-9 fade-in cursor-pointer"
      onClick={onStart}
    >
      <span className="eyebrow text-white/45">{config.copy.tutorialHeading}</span>

      <div className="flex-1 flex flex-col items-center justify-center gap-9 w-full">
        <Gesture dir="up" label="Swipe up to jump" />
        <div className="flex items-start justify-between w-full max-w-[320px]">
          <Gesture dir="left" label="Swipe left" />
          <Gesture dir="right" label="Swipe right" />
        </div>
        <Gesture dir="down" label="Swipe down to slide" />
      </div>

      <div className="w-full">
        <span className="pill pill-primary w-full" style={{ padding: "17px", fontSize: 18 }}>
          Tap Here To Start Game
        </span>
      </div>
    </button>
  );
}

function Gesture({
  dir,
  label,
}: {
  dir: "up" | "down" | "left" | "right";
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="pulse-arrow">
        <SwipeGlyph dir={dir} size={54} color="#fff" />
      </span>
      <span className="font-display font-semibold text-[13px] tracking-wide text-white/85 uppercase">
        {label}
      </span>
    </div>
  );
}

/* -------------------------------- HUD ---------------------------------- */
export function Hud({
  config,
  timeLeft,
  score,
  soundOn,
  onToggleSound,
  onHelp,
  onPause,
}: {
  config: GameConfig;
  timeLeft: number;
  score: number;
  soundOn: boolean;
  onToggleSound: () => void;
  onHelp: () => void;
  onPause: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 p-4 flex justify-between items-start pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <span className="hud-pill">
          <TimerIcon size={16} /> {timeLeft} Sec
        </span>
        <span className="hud-pill">
          <CoinChip /> {score}
        </span>
      </div>
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        <button className="hud-pill" onClick={onHelp}>
          <HelpIcon size={16} /> Help
        </button>
        <button className="hud-pill" onClick={onToggleSound}>
          {soundOn ? <SoundOnIcon size={16} /> : <SoundOffIcon size={16} />} Sound
        </button>
        <button className="hud-pill" onClick={onPause}>
          <PauseIcon size={16} /> Pause
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Pause --------------------------------- */
export function PauseOverlay({
  config,
  onResume,
}: {
  config: GameConfig;
  onResume: () => void;
}) {
  return (
    <button
      className="overlay bg-black/75 items-center justify-center fade-in"
      style={{ backdropFilter: "blur(6px)" }}
      onClick={onResume}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 76,
            height: 76,
            background: `linear-gradient(180deg,#9a52ff,${config.brand.primaryColor})`,
            boxShadow: "0 16px 40px -12px rgba(124,45,240,0.6)",
          }}
        >
          <PauseIcon size={32} />
        </div>
        <p className="font-display font-bold text-2xl">Paused</p>
        <span
          className="pill pill-ghost"
          style={{ padding: "14px 28px", fontSize: 16 }}
        >
          Tap to Resume
        </span>
      </div>
    </button>
  );
}

/* ------------------------------ Game over ------------------------------ */
export function GameOver({
  config,
  tier,
  score,
  onPlayAgain,
  onShare,
  onHome,
}: {
  config: GameConfig;
  tier: "gold" | "silver";
  score: number;
  onPlayAgain: () => void;
  onShare: () => void;
  onHome: () => void;
}) {
  const gold = tier === "gold";
  return (
    <div
      className="overlay items-center px-6 py-9 overflow-y-auto"
      style={{
        background: gold
          ? "radial-gradient(90% 60% at 50% 12%, rgba(233,180,76,0.18) 0%, #0a0a0c 60%)"
          : "radial-gradient(90% 60% at 50% 12%, rgba(199,204,209,0.12) 0%, #0a0a0c 60%)",
      }}
    >
      <div className="w-full flex flex-col items-center text-center flex-1 justify-center gap-5 pop">
        {/* Title */}
        {gold ? (
          <h1
            className="font-display font-bold text-[34px] leading-none"
            style={{ color: config.brand.goldColor }}
          >
            {config.copy.winTitle}
          </h1>
        ) : (
          <h1 className="font-display font-bold text-[32px] leading-none text-white">
            Ohh!{" "}
            <span style={{ color: "#f5a3a3" }}>You Got Hit.</span>
          </h1>
        )}

        {/* Score chip */}
        <span
          className="inline-flex items-center gap-2 rounded-full font-display font-semibold text-[15px] px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.97)",
            color: "#141418",
            boxShadow: `0 0 0 2px ${
              gold ? config.brand.goldColor : "#f5a3a3"
            }, 0 10px 30px -12px rgba(0,0,0,0.6)`,
          }}
        >
          <CoinChip />
          {config.copy.scoreLabel}: {score}
        </span>

        {/* Reward — the playbook / giveaway image (both win and lose) */}
        <div className="relative py-2 w-full flex justify-center">
          <PlaybookReward config={config} />
          {gold && <Confetti color={config.brand.goldColor} />}
        </div>

        <p className="font-display font-semibold text-[19px] leading-snug max-w-[290px] text-white">
          {gold ? config.copy.winMessage : config.copy.loseMessage}
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3 mt-1">
          {gold && (
            <PillButton
              variant="accent"
              onClick={() => window.open(config.links.playbookUrl, "_blank")}
              icon={<OfferIcon />}
              className="w-full"
            >
              Get the {config.copy.playbookName}
            </PillButton>
          )}
          <PillButton
            variant={gold ? "ghost" : "primary"}
            onClick={onPlayAgain}
            icon={<RefreshIcon />}
            className="w-full"
          >
            {config.copy.playAgainButton}
          </PillButton>
          <PillButton
            variant="ghost"
            onClick={onShare}
            icon={<ShareIcon />}
            className="w-full"
          >
            {config.copy.shareButton}
          </PillButton>
          <PillButton
            variant="ghost"
            onClick={onHome}
            icon={<HomeIcon />}
            className="w-full"
          >
            {config.copy.homeButton}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

function PlaybookReward({ config }: { config: GameConfig }) {
  const [failed, setFailed] = useState(false);
  if (!config.assets.playbookImageUrl || failed) return null;
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        maxWidth: 208,
        width: "58%",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 18px 40px -16px rgba(0,0,0,0.7)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={config.assets.playbookImageUrl}
        alt={config.copy.playbookName}
        className="block w-full h-auto"
        onError={() => setFailed(true)}
        draggable={false}
      />
    </div>
  );
}

function Confetti({ color }: { color: string }) {
  const bits = Array.from({ length: 16 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {bits.map((_, i) => (
        <span
          key={i}
          className="absolute block rounded-sm"
          style={{
            width: 6,
            height: 10,
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            background: i % 3 === 0 ? color : i % 3 === 1 ? "#fff" : "var(--brand-primary)",
            transform: `rotate(${i * 40}deg)`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
