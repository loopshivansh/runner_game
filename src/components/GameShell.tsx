"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CONFIG, mergeConfig, type GameConfig } from "@/lib/config";
import { RunnerGame } from "@/game/engine";
import {
  EmailCapture,
  GameOver,
  Hud,
  InfoOverlay,
  Loading,
  PauseOverlay,
  Splash,
  Tutorial,
} from "./screens";

type Screen =
  | "splash"
  | "info"
  | "email"
  | "loading"
  | "tutorial"
  | "playing"
  | "paused"
  | "over";

export default function GameShell() {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [screen, setScreen] = useState<Screen>("splash");
  const [prevScreen, setPrevScreen] = useState<Screen>("splash");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.game.durationSeconds);
  const [soundOn, setSoundOn] = useState(true);
  const [tier, setTier] = useState<"gold" | "silver">("silver");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RunnerGame | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  /* ---- load config ---- */
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setConfig(mergeConfig(data)))
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  const inGame = screen === "tutorial" || screen === "playing" || screen === "paused";

  /* ---- create engine when entering the game (tutorial) ---- */
  const buildEngine = useCallback(() => {
    if (!canvasRef.current) return;
    engineRef.current?.destroy();
    setScore(0);
    setTimeLeft(configRef.current.game.durationSeconds);
    const engine = new RunnerGame({
      canvas: canvasRef.current,
      config: configRef.current,
      soundEnabled: soundOn,
      callbacks: {
        onScore: setScore,
        onTimer: setTimeLeft,
        onCoin: () => {},
        onHit: () => {},
        onEnd: ({ score, timeUp }) => {
          const won = timeUp && score >= configRef.current.game.goldScore;
          const badge: "gold" | "silver" = won ? "gold" : "silver";
          setTier(badge);
          setScreen("over");
          void recordResult(score, badge, timeUp);
        },
      },
    });
    engineRef.current = engine;
    engine.resize();
    engine.attachResize();
    void engine.load().then(() => {
      engine.start();
      engine.pause(); // frozen scene under the tutorial overlay
    });
  }, [soundOn]);

  useEffect(() => {
    if (screen === "tutorial") buildEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => () => engineRef.current?.destroy(), []);

  /* ---- input while playing ---- */
  useEffect(() => {
    if (screen !== "playing") return;
    const eng = engineRef.current;
    if (!eng) return;

    let sx = 0,
      sy = 0,
      moved = false;
    const onTouchStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      moved = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (moved) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (Math.abs(dx) < 28 && Math.abs(dy) < 28) return;
      moved = true;
      if (Math.abs(dx) > Math.abs(dy)) dx > 0 ? eng.moveRight() : eng.moveLeft();
      else dy > 0 ? eng.slide() : eng.jump();
    };
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
          eng.moveLeft();
          break;
        case "ArrowRight":
        case "d":
          eng.moveRight();
          break;
        case "ArrowUp":
        case "w":
        case " ":
          e.preventDefault();
          eng.jump();
          break;
        case "ArrowDown":
        case "s":
          eng.slide();
          break;
        case "p":
          pause();
          break;
      }
    };
    const stage = canvasRef.current?.parentElement;
    stage?.addEventListener("touchstart", onTouchStart, { passive: true });
    stage?.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      stage?.removeEventListener("touchstart", onTouchStart);
      stage?.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  /* ---- lead capture ---- */
  async function captureEmail(value: string) {
    setEmail(value);
    if (!config.leadCapture.enabled || !value) return;
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, event: "start" }),
      });
    } catch {
      /* non-blocking */
    }
  }

  async function recordResult(finalScore: number, badge: string, timeUp: boolean) {
    if (!config.leadCapture.enabled || !email) return;
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, score: finalScore, badge, timeUp, event: "end" }),
      });
    } catch {
      /* non-blocking */
    }
  }

  /* ---- transitions ---- */
  function goPlay() {
    if (config.leadCapture.enabled) setScreen("email");
    else setScreen("loading");
  }
  async function onEmailStart(value: string) {
    setSubmitting(true);
    await captureEmail(value);
    setSubmitting(false);
    setScreen("loading");
  }
  function startRun() {
    engineRef.current?.resume();
    setScreen("playing");
  }
  function pause() {
    engineRef.current?.pause();
    setScreen("paused");
  }
  function resume() {
    engineRef.current?.resume();
    setScreen("playing");
  }
  function toggleSound() {
    setSoundOn((s) => {
      engineRef.current?.setSound(!s);
      return !s;
    });
  }
  function playAgain() {
    engineRef.current?.destroy();
    engineRef.current = null;
    setScreen("loading");
  }
  function goHome() {
    engineRef.current?.destroy();
    engineRef.current = null;
    setScreen("splash");
  }
  function openInfo() {
    if (screen === "playing") engineRef.current?.pause();
    setPrevScreen(screen);
    setScreen("info");
  }
  function closeInfo() {
    if (prevScreen === "playing") engineRef.current?.resume();
    setScreen(prevScreen);
  }
  function share() {
    const url = config.links.offerUrl;
    const text = config.links.shareText;
    if (navigator.share) {
      navigator.share({ title: config.brand.name, text, url }).catch(() => {});
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        "_blank",
      );
    }
  }

  const stageStyle = {
    ["--brand-primary" as string]: config.brand.primaryColor,
    ["--brand-gold" as string]: config.brand.goldColor,
    ["--brand-silver" as string]: config.brand.silverColor,
    ["--brand-ink" as string]: config.brand.inkColor,
  } as React.CSSProperties;

  return (
    <div className="stage-wrap">
      <div className="stage" style={stageStyle}>
        {/* Canvas is always mounted so the engine has a stable target. */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: inGame ? "block" : "none" }}
        />

        {screen === "splash" && (
          <Splash config={config} onPlay={goPlay} onInfo={openInfo} />
        )}
        {screen === "info" && (
          <InfoOverlay config={config} onClose={closeInfo} />
        )}
        {screen === "email" && (
          <EmailCapture config={config} onStart={onEmailStart} submitting={submitting} />
        )}
        {screen === "loading" && (
          <Loading config={config} onDone={() => setScreen("tutorial")} />
        )}
        {screen === "tutorial" && <Tutorial config={config} onStart={startRun} />}

        {(screen === "playing" || screen === "paused") && (
          <Hud
            config={config}
            timeLeft={timeLeft}
            score={score}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            onHelp={openInfo}
            onPause={pause}
          />
        )}
        {screen === "paused" && <PauseOverlay config={config} onResume={resume} />}

        {screen === "over" && (
          <GameOver
            config={config}
            tier={tier}
            score={score}
            onPlayAgain={playAgain}
            onShare={share}
            onHome={goHome}
          />
        )}
      </div>
    </div>
  );
}
