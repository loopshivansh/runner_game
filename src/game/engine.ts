import type { GameConfig } from "@/lib/config";
import { AudioManager } from "./audio";
import type { Entity, GameCallbacks, LoadedAssets } from "./types";

/* ----------------------------------------------------------------------------
 * Loop Runner — a lightweight 2.5D (pseudo-3D) lane runner.
 *
 * The world is a set of entities living at a depth `z` ahead of the player.
 * Each frame the world rushes toward the player; entities are projected to the
 * screen with a simple perspective factor p = CAM / (z + CAM). Everything is
 * drawn procedurally from config colours, with optional image overrides.
 * -------------------------------------------------------------------------- */

const LANES: Array<-1 | 0 | 1> = [-1, 0, 1];
const CAM = 26; // perspective camera constant
const SPAWN_Z = 200; // where entities appear
const HIT_Z = 4; // collision band near the player
const JUMP_CLEAR = 0.42; // normalised jump height needed to clear a block

type Pattern = { lane: -1 | 0 | 1; kind: Entity["kind"] }[];

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  config: GameConfig;
  callbacks: GameCallbacks;
  soundEnabled: boolean;
}

export class RunnerGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cfg: GameConfig;
  private cb: GameCallbacks;
  private audio = new AudioManager();

  private W = 0;
  private H = 0;
  private dpr = 1;

  private entities: Entity[] = [];
  private scenery: { z: number; url?: number }[] = []; // side billboards
  private raf = 0;
  private last = 0;
  private running = false;
  private paused = false;
  private ended = false;

  // player state
  private lane: -1 | 0 | 1 = 0;
  private laneX = 0; // tweened -1..1
  private jumpY = 0; // 0 grounded .. 1 apex
  private jumpV = 0;
  private jumping = false;
  private sliding = false;
  private slideT = 0;
  private runPhase = 0;

  // world state
  private worldDist = 0;
  private spawnTimer = 0;
  private spawnCount = 0;
  private score = 0;
  private timeLeft: number;
  private assets: LoadedAssets = { obstacles: [], billboards: [] };

  constructor(opts: EngineOptions) {
    this.canvas = opts.canvas;
    const ctx = opts.canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas not supported");
    this.ctx = ctx;
    this.cfg = opts.config;
    this.cb = opts.callbacks;
    this.audio.enabled = opts.soundEnabled;
    this.timeLeft = opts.config.game.durationSeconds;
    this.resize();
  }

  /* ----------------------------- lifecycle ------------------------------ */

  async load() {
    const a = this.cfg.assets;
    const load = (url: string) =>
      new Promise<HTMLImageElement | undefined>((res) => {
        if (!url) return res(undefined);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = () => res(undefined);
        img.src = url;
      });
    const [character, coin, obstacles, billboards] = await Promise.all([
      load(a.characterUrl),
      load(a.coinUrl),
      Promise.all(a.obstacleUrls.map(load)),
      Promise.all(a.billboardUrls.map(load)),
    ]);
    this.assets = {
      character,
      coin,
      obstacles: obstacles.filter(Boolean) as HTMLImageElement[],
      billboards: billboards.filter(Boolean) as HTMLImageElement[],
    };
  }

  start() {
    this.running = true;
    this.paused = false;
    this.ended = false;
    this.last = performance.now();
    this.audio.resume();
    this.loop(this.last);
  }

  pause() {
    this.paused = true;
  }
  resume() {
    if (this.ended) return;
    this.paused = false;
    this.last = performance.now();
  }
  setSound(on: boolean) {
    this.audio.enabled = on;
    if (on) this.audio.resume();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
  }

  /* ------------------------------- input -------------------------------- */

  moveLeft() {
    if (this.lane > -1) this.lane = (this.lane - 1) as -1 | 0 | 1;
  }
  moveRight() {
    if (this.lane < 1) this.lane = (this.lane + 1) as -1 | 0 | 1;
  }
  jump() {
    if (!this.jumping && !this.sliding) {
      this.jumping = true;
      this.jumpV = 2.6;
      this.audio.jump();
    }
  }
  slide() {
    if (!this.sliding && !this.jumping) {
      this.sliding = true;
      this.slideT = 0.55;
    }
  }

  /* ------------------------------- resize ------------------------------- */

  private onResize = () => this.resize();

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.W = rect.width;
    this.H = rect.height;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  attachResize() {
    window.addEventListener("resize", this.onResize);
  }

  /* ----------------------------- projection ----------------------------- */

  private get horizonY() {
    return this.H * 0.4;
  }
  private get groundY() {
    return this.H;
  }
  private get roadHalfBottom() {
    return this.W * 0.46;
  }

  private project(z: number, lane: number) {
    const p = CAM / (z + CAM);
    const screenY = this.horizonY + (this.groundY - this.horizonY) * p;
    const roadHalf = this.roadHalfBottom * p;
    const x = this.W / 2 + lane * roadHalf * 0.6;
    return { x, y: screenY, p };
  }

  /* ------------------------------- loop --------------------------------- */

  private loop = (t: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    let dt = (t - this.last) / 1000;
    this.last = t;
    if (this.paused || this.ended) {
      this.render(0);
      return;
    }
    dt = Math.min(dt, 0.05);
    this.update(dt);
    this.render(dt);
  };

  private get progress() {
    return 1 - this.timeLeft / this.cfg.game.durationSeconds;
  }

  private update(dt: number) {
    // timer
    const prevSec = Math.ceil(this.timeLeft);
    this.timeLeft -= dt;
    if (Math.ceil(this.timeLeft) !== prevSec) {
      this.cb.onTimer(Math.max(0, Math.ceil(this.timeLeft)));
    }
    if (this.timeLeft <= 0) {
      this.end(true);
      return;
    }

    const g = this.cfg.game;
    const speed = 55 * g.baseSpeed * (1 + g.speedRamp * this.progress * 0.5);
    const dz = speed * dt;
    this.worldDist += dz;
    this.runPhase += dt * 9;

    // lane tween
    const target = this.lane;
    this.laneX += (target - this.laneX) * Math.min(1, dt * 12);

    // jump physics
    if (this.jumping) {
      this.jumpY += this.jumpV * dt;
      this.jumpV -= 6.5 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumping = false;
        this.jumpV = 0;
      }
    }
    // slide timer
    if (this.sliding) {
      this.slideT -= dt;
      if (this.slideT <= 0) this.sliding = false;
    }

    // spawn
    this.spawnTimer -= dt;
    const interval = Math.max(0.45, g.spawnInterval * (1 - this.progress * 0.4));
    if (this.spawnTimer <= 0) {
      this.spawnTimer = interval;
      this.spawnPattern();
    }

    // advance entities + collisions
    for (const e of this.entities) {
      e.z -= dz;
    }
    for (const e of this.entities) {
      if (e.collected || e.hit) continue;
      if (e.z <= HIT_Z && e.z >= -2) {
        if (Math.round(this.laneX) === e.lane && Math.abs(this.laneX - e.lane) < 0.4) {
          this.resolveHit(e);
        }
      }
    }
    this.entities = this.entities.filter((e) => e.z > -6 && !e.collected);

    // scenery
    for (const s of this.scenery) s.z -= dz;
    this.scenery = this.scenery.filter((s) => s.z > -6);
  }

  private resolveHit(e: Entity) {
    if (e.kind === "coin") {
      e.collected = true;
      this.score += this.cfg.game.coinValue;
      this.cb.onScore(this.score);
      this.cb.onCoin();
      this.audio.coin();
      return;
    }
    if (e.kind === "block") {
      if (this.jumpY >= JUMP_CLEAR) return; // cleared
    } else if (e.kind === "barrier") {
      if (this.sliding) return; // ducked under
    }
    // hit
    e.hit = true;
    this.audio.hit();
    this.cb.onHit();
    if (this.cfg.game.obstacleEndsRun) {
      this.end(false);
    } else {
      this.timeLeft = Math.max(0, this.timeLeft - 5);
    }
  }

  private spawnPattern() {
    this.spawnCount++;
    // Every few spawns, drop a side billboard for flavour.
    if (this.spawnCount % 4 === 0) {
      this.scenery.push({
        z: SPAWN_Z,
        url: this.assets.billboards.length
          ? this.spawnCount % this.assets.billboards.length
          : undefined,
      });
    }

    const roll = Math.random();
    const pat: Pattern = [];
    if (roll < 0.4) {
      // coin run in one lane
      const lane = LANES[Math.floor(Math.random() * 3)];
      for (let i = 0; i < 4; i++) {
        this.entities.push({
          kind: "coin",
          lane,
          z: SPAWN_Z + i * 7,
          seed: Math.random() * 10,
        });
      }
      return;
    } else if (roll < 0.75) {
      // one obstacle, coins in a free lane
      const obLane = LANES[Math.floor(Math.random() * 3)];
      const kind: Entity["kind"] = Math.random() < 0.6 ? "block" : "barrier";
      pat.push({ lane: obLane, kind });
      const free = LANES.filter((l) => l !== obLane);
      const coinLane = free[Math.floor(Math.random() * free.length)];
      pat.push({ lane: coinLane, kind: "coin" });
    } else {
      // two obstacles, always leave one lane open
      const open = LANES[Math.floor(Math.random() * 3)];
      for (const l of LANES) {
        if (l === open) continue;
        pat.push({ lane: l, kind: Math.random() < 0.6 ? "block" : "barrier" });
      }
      pat.push({ lane: open, kind: "coin" });
    }
    for (const p of pat) {
      this.entities.push({ kind: p.kind, lane: p.lane, z: SPAWN_Z, seed: Math.random() * 10 });
    }
  }

  private end(timeUp: boolean) {
    if (this.ended) return;
    this.ended = true;
    if (timeUp && this.score >= this.cfg.game.goldScore) this.audio.win();
    this.cb.onEnd({ score: this.score, timeUp });
  }

  /* ------------------------------- render ------------------------------- */

  private render(dt: number) {
    const ctx = this.ctx;
    const { W, H } = this;
    ctx.clearRect(0, 0, W, H);
    this.drawSky();
    this.drawBuildings();
    this.drawRoad();
    this.drawScenery();

    // draw entities far-to-near
    const sorted = [...this.entities].sort((a, b) => b.z - a.z);
    for (const e of sorted) {
      if (e.collected) continue;
      this.drawEntity(e, dt);
    }
    this.drawCharacter();
  }

  private drawSky() {
    const ctx = this.ctx;
    const grd = ctx.createLinearGradient(0, 0, 0, this.horizonY);
    grd.addColorStop(0, "#bcdcf2");
    grd.addColorStop(1, "#e8eef3");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.W, this.horizonY + 2);
  }

  private drawBuildings() {
    const ctx = this.ctx;
    const { W } = this;
    const slabs = 9;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = slabs; i >= 1; i--) {
        const z = i * 22 - (this.worldDist % 22);
        const { p } = this.project(z, 0);
        const roadHalf = this.roadHalfBottom * p;
        const edgeX = W / 2 + side * roadHalf;
        const bh = (this.groundY - this.horizonY) * p * 1.4;
        const bw = W * 0.5 * p;
        const y = this.horizonY + (this.groundY - this.horizonY) * p;
        const shade = 60 + Math.round(p * 60);
        ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 14})`;
        const x = side < 0 ? edgeX - bw : edgeX;
        ctx.fillRect(x, y - bh, bw, bh);
        // windows
        ctx.fillStyle = `rgba(255,240,200,${0.14 + p * 0.12})`;
        const cols = 3;
        const rows = 5;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if ((c + r + i) % 2 === 0) continue;
            ctx.fillRect(
              x + bw * (0.15 + c * 0.28),
              y - bh * (0.9 - r * 0.16),
              bw * 0.14,
              bh * 0.08,
            );
          }
        }
      }
    }
  }

  private drawRoad() {
    const ctx = this.ctx;
    const { W } = this;
    const topHalf = this.roadHalfBottom * (CAM / (SPAWN_Z + CAM));
    const grd = ctx.createLinearGradient(0, this.horizonY, 0, this.groundY);
    grd.addColorStop(0, "#6b7078");
    grd.addColorStop(1, "#3a3d44");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(W / 2 - topHalf, this.horizonY);
    ctx.lineTo(W / 2 + topHalf, this.horizonY);
    ctx.lineTo(W / 2 + this.roadHalfBottom, this.groundY);
    ctx.lineTo(W / 2 - this.roadHalfBottom, this.groundY);
    ctx.closePath();
    ctx.fill();

    // lane dividers (scrolling dashes)
    for (const l of [-1, 1] as const) {
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      for (let z = 0; z < SPAWN_Z; z += 10) {
        const zz = z - (this.worldDist % 10);
        const a = this.project(zz, l * 0.33 / 0.6);
        const b = this.project(zz + 5, (l * 0.33) / 0.6);
        ctx.lineWidth = Math.max(1, a.p * 6);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  private drawScenery() {
    const ctx = this.ctx;
    for (const s of [...this.scenery].sort((a, b) => b.z - a.z)) {
      const { x, y, p } = this.project(s.z, 0);
      const w = this.W * 0.42 * p;
      const h = w * 0.5;
      const bx = x - w / 2;
      const by = y - (this.groundY - this.horizonY) * p * 1.3 - h;
      const img = s.url !== undefined ? this.assets.billboards[s.url] : undefined;
      // support post
      ctx.fillStyle = "rgba(40,40,46,0.9)";
      ctx.fillRect(x - w * 0.03, by + h, w * 0.06, (this.groundY - this.horizonY) * p * 0.6);
      if (img) {
        ctx.drawImage(img, bx, by, w, h);
      } else {
        ctx.fillStyle = this.cfg.brand.primaryColor;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(bx, by, w, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.font = `700 ${Math.max(8, h * 0.3)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.cfg.brand.name, x, by + h / 2);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.strokeRect(bx, by, w, h);
    }
  }

  private drawEntity(e: Entity, _dt: number) {
    const { x, y, p } = this.project(e.z, e.lane);
    const size = 90 * p;
    const ctx = this.ctx;
    if (e.kind === "coin") {
      const bob = Math.sin(this.runPhase + e.seed) * size * 0.12;
      const cy = y - size * 0.7 + bob;
      const img = this.assets.coin;
      if (img) {
        ctx.drawImage(img, x - size / 2, cy - size / 2, size, size);
      } else {
        // Loop coin: purple disc with a white loop glyph
        ctx.beginPath();
        ctx.arc(x, cy, size * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = this.cfg.brand.primaryColor;
        ctx.fill();
        ctx.lineWidth = size * 0.06;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = size * 0.09;
        ctx.beginPath();
        ctx.arc(x - size * 0.08, cy, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size * 0.08, cy, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }
    // obstacles
    const img = this.assets.obstacles.length
      ? this.assets.obstacles[Math.floor(e.seed) % this.assets.obstacles.length]
      : undefined;
    if (img) {
      const w = size * 1.3;
      const h = e.kind === "barrier" ? size * 0.9 : size * 1.1;
      ctx.drawImage(img, x - w / 2, y - h, w, h);
      return;
    }
    if (e.kind === "block") {
      // roadblock: striped barrier low to the ground (jump over)
      const w = size * 1.15;
      const h = size * 0.5;
      ctx.fillStyle = "#e6503a";
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - w / 2, y - h, w, h);
        ctx.clip();
        ctx.fillRect(x - w / 2 + i * (w / 3) - h, y - h, h * 0.6, h * 2);
        ctx.restore();
      }
    } else {
      // barrier: overhead bar (slide under)
      const w = size * 1.3;
      const barH = size * 0.28;
      const topY = y - size * 1.25;
      ctx.fillStyle = "#37393f";
      ctx.fillRect(x - w * 0.05, topY, w * 0.1, size * 1.25); // post
      ctx.fillStyle = this.cfg.brand.goldColor;
      ctx.fillRect(x - w / 2, topY, w, barH);
      ctx.fillStyle = "#222";
      for (let i = 0; i < 5; i++)
        ctx.fillRect(x - w / 2 + i * (w / 5), topY, w / 10, barH);
    }
  }

  private drawCharacter() {
    const ctx = this.ctx;
    const laneCenter = this.laneX;
    const { x, p } = this.project(2, laneCenter);
    const baseY = this.groundY - this.H * 0.06;
    const size = this.H * 0.2;
    const jumpOffset = this.jumpY * this.H * 0.26;
    const cy = baseY - jumpOffset;
    const slideSquash = this.sliding ? 0.55 : 1;
    const legSwing = Math.sin(this.runPhase) * (this.jumping ? 0.2 : 1);
    const armSwing = -legSwing;
    const purple = this.cfg.brand.primaryColor;

    if (this.assets.character) {
      const w = size * 0.9;
      const h = size * (this.sliding ? 0.7 : 1.2);
      ctx.drawImage(this.assets.character, x - w / 2, cy - h, w, h);
      // shadow
      this.drawShadow(x, baseY, size, p, jumpOffset);
      return;
    }

    this.drawShadow(x, baseY, size, p, jumpOffset);

    ctx.save();
    ctx.translate(x, cy);
    ctx.scale(1, slideSquash);

    const bodyW = size * 0.34;
    const bodyH = size * 0.5;
    const headR = size * 0.17;

    // legs (behind)
    ctx.strokeStyle = "#e9edf2";
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.25, -size * 0.02);
    ctx.lineTo(-bodyW * 0.25 + legSwing * size * 0.18, size * 0.28);
    ctx.moveTo(bodyW * 0.25, -size * 0.02);
    ctx.lineTo(bodyW * 0.25 - legSwing * size * 0.18, size * 0.28);
    ctx.stroke();
    // shoes
    ctx.fillStyle = purple;
    ctx.beginPath();
    ctx.ellipse(-bodyW * 0.25 + legSwing * size * 0.18, size * 0.3, size * 0.08, size * 0.05, 0, 0, 7);
    ctx.ellipse(bodyW * 0.25 - legSwing * size * 0.18, size * 0.3, size * 0.08, size * 0.05, 0, 0, 7);
    ctx.fill();

    // torso (white top with purple trim — nods to Figma runner)
    ctx.fillStyle = "#f4f6f9";
    this.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, size * 0.1);
    ctx.fill();
    ctx.fillStyle = purple;
    this.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH * 0.22, size * 0.1);
    ctx.fill();

    // arms
    ctx.strokeStyle = "#e9edf2";
    ctx.lineWidth = size * 0.09;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.45, -bodyH * 0.85);
    ctx.lineTo(-bodyW * 0.6, -bodyH * 0.4 + armSwing * size * 0.12);
    ctx.moveTo(bodyW * 0.45, -bodyH * 0.85);
    ctx.lineTo(bodyW * 0.6, -bodyH * 0.4 - armSwing * size * 0.12);
    ctx.stroke();

    // head
    ctx.fillStyle = "#2a2320";
    ctx.beginPath();
    ctx.arc(0, -bodyH - headR * 0.6, headR, 0, Math.PI * 2);
    ctx.fill();
    // headphones
    ctx.strokeStyle = purple;
    ctx.lineWidth = size * 0.05;
    ctx.beginPath();
    ctx.arc(0, -bodyH - headR * 0.6, headR * 1.05, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = purple;
    ctx.beginPath();
    ctx.arc(-headR, -bodyH - headR * 0.5, headR * 0.28, 0, 7);
    ctx.arc(headR, -bodyH - headR * 0.5, headR * 0.28, 0, 7);
    ctx.fill();

    ctx.restore();
  }

  private drawShadow(x: number, baseY: number, size: number, p: number, jump: number) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(0,0,0,${0.28 - jump * 0.4 / this.H})`;
    ctx.beginPath();
    ctx.ellipse(x, baseY + size * 0.3, size * 0.32 * (1 - jump / this.H), size * 0.09, 0, 0, 7);
    ctx.fill();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
