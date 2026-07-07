"use client";

import { useEffect, useState } from "react";
import type { GameConfig } from "@/lib/config";
import { Badge, LoopLogo, LoopMark } from "./brand";
import { RunnerArt, SkyScene } from "./scene";
import {
  HelpIcon,
  HomeIcon,
  OfferIcon,
  PauseIcon,
  PillButton,
  PlayIcon,
  RefreshIcon,
  SoundOffIcon,
  SoundOnIcon,
  TimerIcon,
} from "./ui";

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
      <SkyScene />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center pt-8 px-6 text-center">
          <LoopLogo config={config} height={38} />
          <p className="mt-4 font-display font-semibold text-[#16161a] text-[17px] leading-snug max-w-[240px]">
            {config.copy.splashTitle}
          </p>
        </div>
        <div className="flex-1 flex items-end justify-center pb-2">
          <RunnerArt config={config} size={200} />
        </div>
        <div className="px-6 pb-8 flex flex-col gap-3 fade-in">
          <PillButton onClick={onPlay} icon={<PlayIcon />} className="w-full">
            {config.copy.playButton}
          </PillButton>
          <PillButton variant="ghost" onClick={onInfo} className="w-full" style={{ fontSize: 15, padding: "12px 20px" }}>
            {config.copy.playbookLinkLabel}
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
}: {
  config: GameConfig;
  onClose: () => void;
}) {
  return (
    <div className="overlay bg-black/60 justify-end fade-in">
      <div
        className="rounded-t-[28px] px-6 pt-6 pb-8"
        style={{ background: "linear-gradient(180deg,#2a2a30,#141416)" }}
      >
        <div className="flex items-start gap-3 pb-4 border-b border-white/10">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 44, height: 44, background: config.brand.primaryColor }}
          >
            <LoopMark size={26} color="#fff" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[19px]">
              How to get{" "}
              <span style={{ color: config.brand.goldColor }}>{config.copy.playbookName}?</span>
            </h2>
            <p className="text-white/60 text-[13px]">{config.copy.infoSubtitle}</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center py-5">
          <BadgeCard config={config} tier="gold" label="Gold Badge" />
          <BadgeCard config={config} tier="silver" label="Silver Badge" />
        </div>

        <p className="font-display font-semibold text-[15px] leading-snug mb-4">
          {config.copy.infoFooter}
        </p>
        <ol className="flex flex-col gap-3 mb-6">
          <Step n={1} icon={<TimerIcon size={16} />} text={config.copy.infoStep1} />
          <Step
            n={2}
            icon={<LoopMark size={16} color={config.brand.primaryColor} />}
            text={config.copy.infoStep2}
          />
        </ol>
        <PillButton variant="ghost" onClick={onClose} className="w-full" style={{ fontSize: 17 }}>
          Got It
        </PillButton>
      </div>
    </div>
  );
}

function BadgeCard({
  config,
  tier,
  label,
}: {
  config: GameConfig;
  tier: "gold" | "silver";
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Badge tier={tier} config={config} size={64} />
      <span
        className="font-display font-bold text-[13px] px-2 py-1 rounded-lg"
        style={{
          color: "#16161a",
          background: tier === "gold" ? config.brand.goldColor : config.brand.silverColor,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex items-center gap-1 shrink-0">
        <span
          className="flex items-center justify-center rounded-full bg-white text-[#16161a] font-display font-bold"
          style={{ width: 22, height: 22, fontSize: 12 }}
        >
          {n}
        </span>
        <span className="text-white/50">·</span>
        <span className="flex items-center justify-center w-5">{icon}</span>
      </span>
      <span className="text-[14px] text-white/85 leading-snug">{text}</span>
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
      <SkyScene />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center pt-8">
          <LoopLogo config={config} height={34} />
        </div>
        <div className="flex-1 flex items-end justify-center">
          <RunnerArt config={config} size={150} />
        </div>
        <div
          className="px-6 pt-6 pb-8 rounded-t-[28px] fade-in"
          style={{ background: "linear-gradient(180deg,#26262b,#141416)" }}
        >
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
            className="w-full rounded-full bg-white text-[#16161a] text-center font-display font-medium text-[16px] py-3.5 outline-none placeholder:text-[#9aa0a6]"
          />
          <p className="text-center text-white/60 text-[13px] mt-3 px-4">
            {config.copy.emailHelper}
          </p>
          {err && <p className="text-center text-red-400 text-[13px] mt-2">{err}</p>}
          <PillButton
            onClick={submit}
            disabled={submitting}
            variant="light"
            icon={submitting ? <span className="spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <PlayIcon />}
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
export function Loading({
  config,
  onDone,
}: {
  config: GameConfig;
  onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const DUR = 1600;
    const tick = (t: number) => {
      const v = Math.min(100, Math.round(((t - start) / DUR) * 100));
      setPct(v);
      if (v < 100) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="overlay">
      <SkyScene />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-center pt-8">
          <LoopLogo config={config} height={34} />
        </div>
        <div className="flex-1 flex items-end justify-center">
          <RunnerArt config={config} size={170} />
        </div>
        <div className="px-8 pb-14">
          <p className="text-center font-display font-semibold text-[22px] mb-3">
            Loading {pct} %
          </p>
          <div className="h-4 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-100"
              style={{ width: `${pct}%`, background: config.brand.primaryColor }}
            />
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
      className="overlay bg-black/78 items-center justify-center text-center px-6 fade-in cursor-pointer"
      onClick={onStart}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <Gesture label="SWIPE UP TO JUMP" arrow="↑" />
        <div className="flex items-center justify-between w-full max-w-[300px]">
          <Gesture label="SWIPE LEFT" arrow="↖" />
          <Gesture label="SWIPE RIGHT" arrow="↗" />
        </div>
        <Gesture label="SWIPE DOWN TO SLIDE" arrow="↓" />
      </div>
      <div className="w-full pb-10">
        <span className="pill pill-ghost w-full" style={{ padding: "16px", fontSize: 18 }}>
          Tap Here To Start Game
        </span>
      </div>
    </button>
  );
}

function Gesture({ label, arrow }: { label: string; arrow: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white text-3xl leading-none">👆</span>
      <span className="font-display font-bold text-[13px] tracking-wide text-white/90">
        {arrow} {label}
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
          <span
            className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, background: config.brand.primaryColor }}
          >
            <LoopMark size={14} color="#fff" />
          </span>
          {score}
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
      className="overlay bg-black/70 items-center justify-center fade-in"
      onClick={onResume}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 72, height: 72, background: config.brand.primaryColor }}
        >
          <PauseIcon size={34} />
        </div>
        <p className="font-display font-bold text-2xl">Paused</p>
        <span className="pill pill-ghost" style={{ padding: "14px 28px", fontSize: 17 }}>
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
    <div className="overlay bg-[#0b0b0d] items-center px-6 py-8 overflow-y-auto">
      <div className="w-full flex flex-col items-center text-center flex-1 justify-center gap-5 pop">
        <h1
          className="font-display font-bold text-[34px] leading-none"
          style={{ color: gold ? config.brand.goldColor : "#fff" }}
        >
          {gold ? config.copy.winTitle : config.copy.loseTitle}
        </h1>
        <span className="hud-pill" style={{ fontSize: 16, padding: "10px 18px" }}>
          <span
            className="flex items-center justify-center rounded-full"
            style={{ width: 24, height: 24, background: config.brand.primaryColor }}
          >
            <LoopMark size={15} color="#fff" />
          </span>
          {config.copy.scoreLabel}: {score}
        </span>

        <div className="relative py-2">
          <Badge tier={tier} config={config} size={150} />
          {gold && <Confetti color={config.brand.goldColor} />}
        </div>

        <p className="font-display font-semibold text-[18px] leading-snug max-w-[280px]">
          {gold ? config.copy.winMessage : config.copy.loseMessage}
        </p>

        <div className="w-full flex flex-col gap-3 mt-2">
          {gold ? (
            <PillButton
              variant="light"
              onClick={() => window.open(config.links.playbookUrl, "_blank")}
              icon={<OfferIcon />}
              className="w-full"
            >
              Get the {config.copy.playbookName}
            </PillButton>
          ) : null}
          <PillButton variant="ghost" onClick={onPlayAgain} icon={<RefreshIcon />} className="w-full">
            {config.copy.playAgainButton}
          </PillButton>
          <PillButton variant="ghost" onClick={onShare} icon={<OfferIcon />} className="w-full">
            {config.copy.shareButton}
          </PillButton>
          <PillButton variant="ghost" onClick={onHome} icon={<HomeIcon />} className="w-full">
            {config.copy.homeButton}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

function Confetti({ color }: { color: string }) {
  const bits = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {bits.map((_, i) => (
        <span
          key={i}
          className="absolute block rounded-sm"
          style={{
            width: 7,
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
