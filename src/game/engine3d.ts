import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { GameConfig } from "@/lib/config";
import { AudioManager } from "./audio";
import type { GameCallbacks } from "./types";

/* ----------------------------------------------------------------------------
 * Loop Runner 3D — a third-person Three.js lane runner.
 *
 * The character runs in place (procedurally animated skeleton) while the city
 * environment and spawned objects scroll toward the camera. A 60s sprint ends
 * at a checkered finish line. Products are collectibles, banners line the track.
 * -------------------------------------------------------------------------- */

const LANE_X = 1.7;
const CHAR_HEIGHT = 1.75;
const SPAWN_Z = -78;
const DESPAWN_Z = 9;
const HIT_Z_NEAR = -0.9;
const HIT_Z_FAR = 1.4;
const JUMP_CLEAR_Y = 0.7;

type Kind = "product" | "low" | "high" | "banner" | "finish";

interface WorldObj {
  kind: Kind;
  lane: -1 | 0 | 1;
  z: number;
  mesh: THREE.Object3D;
  spin?: THREE.Object3D;
  done?: boolean;
}

export interface Engine3DOptions {
  canvas: HTMLCanvasElement;
  config: GameConfig;
  callbacks: GameCallbacks & { onLoadProgress?: (pct: number) => void };
  soundEnabled: boolean;
}

export class Runner3D {
  private canvas: HTMLCanvasElement;
  private cfg: GameConfig;
  private cb: GameCallbacks & { onLoadProgress?: (pct: number) => void };
  private audio = new AudioManager();

  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private envTiles: THREE.Object3D[] = [];
  private envDepth = 60;
  private character?: THREE.Object3D;
  private bones: Record<string, THREE.Bone> = {};
  private objects: WorldObj[] = [];
  private productTextures: THREE.Texture[] = [];
  private bannerTextures: THREE.Texture[] = [];

  private raf = 0;
  private running = false;
  private paused = false;
  private ended = false;
  private mode: "menu" | "play" = "menu";

  // player state
  private lane: -1 | 0 | 1 = 0;
  private laneX = 0;
  private jumpY = 0;
  private jumpV = 0;
  private jumping = false;
  private sliding = false;
  private slideT = 0;
  private runPhase = 0;

  // world state
  private speed = 0;
  private dist = 0;
  private spawnTimer = 0;
  private bannerTimer = 3;
  private score = 0;
  private timeLeft: number;
  private finishSpawned = false;
  private spawnCount = 0;

  constructor(opts: Engine3DOptions) {
    this.canvas = opts.canvas;
    this.cfg = opts.config;
    this.cb = opts.callbacks;
    this.audio.enabled = opts.soundEnabled;
    this.timeLeft = opts.config.game.durationSeconds;
  }

  /* ----------------------------- setup ---------------------------------- */

  private initRenderer() {
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    this.renderer = r;

    const sky = new THREE.Color("#aecbe6");
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, 40, 88);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
    this.camera.position.set(0, 3.0, 6.4);
    this.camera.lookAt(0, 1.1, -6);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x5a6272, 1.15);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff2dd, 1.5);
    dir.position.set(6, 14, 8);
    this.scene.add(dir);

    // Always-present dark road under the play area so the runner is grounded
    // even where an environment model has gaps (sits just below env ground).
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(20, Math.abs(SPAWN_Z) + DESPAWN_Z + 40),
      new THREE.MeshStandardMaterial({ color: 0x2b2e34, roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.04, (SPAWN_Z + DESPAWN_Z) / 2);
    this.scene.add(road);

    this.addLaneGuides();
    this.resize();
  }

  private addLaneGuides() {
    // Subtle glowing lines between lanes so the player can read the track.
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
    });
    for (const x of [-LANE_X / 2 - LANE_X / 2, LANE_X / 2 + LANE_X / 2]) {
      const geo = new THREE.PlaneGeometry(0.08, Math.abs(SPAWN_Z) + DESPAWN_Z);
      const line = new THREE.Mesh(geo, mat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, (SPAWN_Z + DESPAWN_Z) / 2);
      this.scene.add(line);
    }
  }

  /* ------------------------------ loading ------------------------------- */

  async load() {
    this.initRenderer();
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    // Weighted progress: env 45%, character 45%, textures 10%.
    let envFrac = 0;
    let charFrac = 0;
    const report = () =>
      this.cb.onLoadProgress?.(Math.round((envFrac * 45 + charFrac * 45) + 0));

    const loadGLB = (url: string, onFrac: (f: number) => void) =>
      new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
          url,
          (g) => {
            onFrac(1);
            resolve(g.scene as unknown as THREE.Group);
          },
          (e) => {
            if (e.total) onFrac(e.loaded / e.total);
          },
          reject,
        );
      });

    const envUrl =
      this.cfg.game.environment === "subway"
        ? this.cfg.assets.subwayModelUrl
        : this.cfg.assets.environmentModelUrl;

    const [env, char] = await Promise.all([
      loadGLB(envUrl, (f) => {
        envFrac = f;
        report();
      }).catch(() => null),
      loadGLB(this.cfg.assets.characterModelUrl, (f) => {
        charFrac = f;
        report();
      }).catch(() => null),
    ]);

    if (env) this.setupEnvironment(env);
    else this.addFallbackGround();
    if (char) this.setupCharacter(char);
    else this.addFallbackCharacter();

    await this.loadTextures();
    this.mode = "menu";
    this.cb.onLoadProgress?.(100);
  }

  private async loadTextures() {
    const tl = new THREE.TextureLoader();
    const load = (url: string) =>
      new Promise<THREE.Texture | null>((res) => {
        tl.load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            res(t);
          },
          undefined,
          () => res(null),
        );
      });
    const products = await Promise.all(this.cfg.assets.productUrls.map(load));
    const banners = await Promise.all(this.cfg.assets.billboardUrls.map(load));
    this.productTextures = products.filter(Boolean) as THREE.Texture[];
    this.bannerTextures = banners.filter(Boolean) as THREE.Texture[];
  }

  private setupEnvironment(root: THREE.Object3D) {
    // Orient so the longest horizontal axis runs along Z (the track), sit on y=0.
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Scale so the street is a sensible width for 3 lanes (~16 units wide).
    const horizWidth = Math.min(size.x, size.z);
    const scale = horizWidth > 0 ? 16 / horizWidth : 1;

    const makeTile = (obj: THREE.Object3D) => {
      const g = new THREE.Group();
      obj.scale.setScalar(scale);
      // recenter on X and place on ground
      obj.position.x = -center.x * scale;
      obj.position.z = -center.z * scale;
      obj.position.y = -box.min.y * scale;
      // if length runs along X, rotate 90° so it runs along Z
      if (size.x > size.z) obj.rotation.y = Math.PI / 2;
      g.add(obj);
      return g;
    };

    const depth = (size.x > size.z ? size.x : size.z) * scale;
    this.envDepth = depth > 4 ? depth : 60;

    const tileA = makeTile(root);
    const tileB = makeTile(root.clone(true));
    const tileC = makeTile(root.clone(true));
    tileA.position.z = 0;
    tileB.position.z = -this.envDepth;
    tileC.position.z = -this.envDepth * 2;
    this.envTiles = [tileA, tileB, tileC];
    this.envTiles.forEach((t) => this.scene.add(t));
  }

  private addFallbackGround() {
    const geo = new THREE.PlaneGeometry(24, 400);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a3d44 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -180;
    this.scene.add(ground);
    this.envDepth = 120;
  }

  private setupCharacter(root: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = size.y > 0 ? CHAR_HEIGHT / size.y : 1;
    root.scale.setScalar(scale);
    const box2 = new THREE.Box3().setFromObject(root);
    root.position.y = -box2.min.y;
    root.position.z = 0;

    const wrap = new THREE.Group();
    wrap.add(root);
    this.scene.add(wrap);
    this.character = wrap;

    // Collect bones by name prefix (names look like "LeftUpLeg_60").
    root.traverse((o) => {
      const b = o as THREE.Bone;
      if (!b.isBone && b.type !== "Bone") return;
      const name = b.name.replace(/_\d+$/, "");
      this.bones[name] = b;
    });

    // Face away from the camera (down the track, -Z).
    const facing = this.detectFacing(root);
    wrap.rotation.y = facing;

    // Base run pose: bring arms down to the sides and bent forward a touch.
    this.applyBaseArmPose();
  }

  private detectFacing(root: THREE.Object3D): number {
    // RPM/Mixamo models usually face +Z; we want them facing -Z (away from cam).
    // Keep it simple and rotate 180°; refined visually if needed.
    void root;
    return Math.PI;
  }

  private applyBaseArmPose() {
    const set = (n: string, x = 0, y = 0, z = 0) => {
      const b = this.bones[n];
      if (b) b.rotation.set(x, y, z);
    };
    // Drop the arms from the T/A-pose to the sides.
    set("LeftArm", 0, 0, 1.15);
    set("RightArm", 0, 0, -1.15);
    set("LeftForeArm", 0, 0, 0.4);
    set("RightForeArm", 0, 0, -0.4);
  }

  private addFallbackCharacter() {
    const wrap = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 0.9, 4, 12),
      new THREE.MeshStandardMaterial({ color: this.cfg.brand.primaryColor }),
    );
    body.position.y = 0.9;
    wrap.add(body);
    this.scene.add(wrap);
    this.character = wrap;
  }

  /* ------------------------------ lifecycle ----------------------------- */

  /** Begin the idle render loop showing the environment behind the menus. */
  startMenu() {
    this.running = true;
    this.paused = false;
    this.ended = false;
    this.mode = "menu";
    this.clock.start();
    this.loop();
  }

  /** Reset state and switch into an active gameplay run. */
  beginGame() {
    this.clearObjects();
    this.mode = "play";
    this.ended = false;
    this.paused = false;
    this.score = 0;
    this.timeLeft = this.cfg.game.durationSeconds;
    this.dist = 0;
    this.spawnTimer = 0;
    this.bannerTimer = 3;
    this.spawnCount = 0;
    this.finishSpawned = false;
    this.lane = 0;
    this.laneX = 0;
    this.jumping = false;
    this.sliding = false;
    this.jumpY = 0;
    this.audio.resume();
    this.clock.getDelta();
    this.cb.onTimer(Math.ceil(this.timeLeft));
    this.cb.onScore(0);
    if (!this.running) this.startMenu();
  }

  /** Return to the idle menu scene (e.g. after game over / home). */
  backToMenu() {
    this.clearObjects();
    this.mode = "menu";
    this.ended = false;
    this.paused = false;
    this.lane = 0;
  }

  private clearObjects() {
    for (const o of this.objects) {
      this.scene.remove(o.mesh);
      this.disposeObj(o.mesh);
    }
    this.objects = [];
  }

  pause() {
    this.paused = true;
  }
  resume() {
    if (this.ended) return;
    this.paused = false;
    this.clock.getDelta();
  }
  setSound(on: boolean) {
    this.audio.enabled = on;
    if (on) this.audio.resume();
  }
  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.renderer?.dispose();
  }

  moveLeft() {
    if (this.lane > -1) this.lane = (this.lane - 1) as -1 | 0 | 1;
  }
  moveRight() {
    if (this.lane < 1) this.lane = (this.lane + 1) as -1 | 0 | 1;
  }
  jump() {
    if (!this.jumping && !this.sliding) {
      this.jumping = true;
      this.jumpV = 6.2;
      this.audio.jump();
    }
  }
  slide() {
    if (!this.sliding && !this.jumping) {
      this.sliding = true;
      this.slideT = 0.6;
    }
  }

  private onResize = () => this.resize();
  attachResize() {
    window.addEventListener("resize", this.onResize);
  }
  resize() {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ------------------------------- loop --------------------------------- */

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.paused && !this.ended) this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private get progress() {
    return 1 - this.timeLeft / this.cfg.game.durationSeconds;
  }

  /** Idle scene shown behind the splash / email screens. */
  private menuUpdate(dt: number) {
    const dz = 9 * dt;
    this.runPhase += dt * 8;
    this.laneX += (0 - this.laneX) * Math.min(1, dt * 8);
    this.scrollEnv(dz);
    this.animateCharacter(dt);
  }

  private update(dt: number) {
    if (this.mode === "menu") {
      this.menuUpdate(dt);
      return;
    }
    const prev = Math.ceil(this.timeLeft);
    this.timeLeft -= dt;
    if (Math.ceil(this.timeLeft) !== prev)
      this.cb.onTimer(Math.max(0, Math.ceil(this.timeLeft)));

    const g = this.cfg.game;
    this.speed = 14 * g.baseSpeed * (1 + g.speedRamp * this.progress * 0.4);
    const dz = this.speed * dt;
    this.dist += dz;
    this.runPhase += dt * 10;

    // lane tween
    const targetX = this.lane * LANE_X;
    this.laneX += (targetX - this.laneX) * Math.min(1, dt * 12);

    // jump physics
    if (this.jumping) {
      this.jumpY += this.jumpV * dt;
      this.jumpV -= 16 * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumping = false;
      }
    }
    if (this.sliding) {
      this.slideT -= dt;
      if (this.slideT <= 0) this.sliding = false;
    }

    this.scrollEnv(dz);
    this.animateCharacter(dt);
    this.updateObjects(dz);
    this.handleSpawns(dt);

    // finish line arrives right as the clock hits zero
    if (!this.finishSpawned && this.timeLeft <= this.finishLead()) {
      this.spawnFinish();
    }
    if (this.timeLeft <= 0) this.end(true);
  }

  private finishLead() {
    // seconds of runway for the finish gate to travel in
    return Math.min(3.5, this.cfg.game.durationSeconds * 0.1);
  }

  private scrollEnv(dz: number) {
    for (const t of this.envTiles) {
      t.position.z += dz;
      if (t.position.z - this.envDepth / 2 > this.camera.position.z + 4) {
        t.position.z -= this.envDepth * this.envTiles.length;
      }
    }
  }

  private animateCharacter(dt: number) {
    const wrap = this.character;
    if (!wrap) return;
    wrap.position.x = this.laneX;
    wrap.position.y = this.jumpY;

    const inner = wrap.children[0];
    const swing = this.jumping ? 0.25 : this.sliding ? 0.1 : 1;

    // procedural run cycle on the legs / arms
    const s = Math.sin(this.runPhase) * 0.9 * swing;
    const s2 = Math.sin(this.runPhase + Math.PI) * 0.9 * swing;
    this.setBone("LeftUpLeg", s);
    this.setBone("RightUpLeg", s2);
    this.setBone("LeftLeg", Math.max(0, -s) * 1.2);
    this.setBone("RightLeg", Math.max(0, -s2) * 1.2);
    // arms swing opposite legs (rotate on X while base pose holds them down)
    if (this.bones["LeftArm"]) this.bones["LeftArm"].rotation.x = s2 * 0.6;
    if (this.bones["RightArm"]) this.bones["RightArm"].rotation.x = s * 0.6;

    // body bob + slide/jump posture
    if (inner) {
      const bob = Math.abs(Math.sin(this.runPhase)) * 0.06 * swing;
      if (this.sliding) {
        inner.scale.y += (0.55 - inner.scale.y) * Math.min(1, dt * 12);
        inner.rotation.x += (-0.5 - inner.rotation.x) * Math.min(1, dt * 12);
      } else {
        inner.scale.y += (1 - inner.scale.y) * Math.min(1, dt * 12);
        inner.rotation.x += (0 - inner.rotation.x) * Math.min(1, dt * 12);
        inner.position.y = bob;
      }
    }
  }

  private setBone(name: string, x: number) {
    const b = this.bones[name];
    if (b) b.rotation.x = x;
  }

  /* ------------------------------ spawning ------------------------------ */

  private handleSpawns(dt: number) {
    if (this.finishSpawned) return;
    this.spawnTimer -= dt;
    this.bannerTimer -= dt;
    const g = this.cfg.game;
    const interval = Math.max(0.55, g.spawnInterval * (1 - this.progress * 0.35));
    if (this.spawnTimer <= 0) {
      this.spawnTimer = interval;
      this.spawnPattern();
    }
    if (this.bannerTimer <= 0) {
      this.bannerTimer = 5.5;
      this.spawnBanner();
    }
  }

  private spawnPattern() {
    this.spawnCount++;
    const lanes: Array<-1 | 0 | 1> = [-1, 0, 1];
    const roll = Math.random();
    if (roll < 0.42) {
      // product run in one lane
      const lane = lanes[Math.floor(Math.random() * 3)];
      for (let i = 0; i < 4; i++) this.spawnProduct(lane, SPAWN_Z - i * 3.4);
    } else if (roll < 0.78) {
      const obLane = lanes[Math.floor(Math.random() * 3)];
      this.spawnObstacle(obLane, Math.random() < 0.6 ? "low" : "high");
      const free = lanes.filter((l) => l !== obLane);
      this.spawnProduct(free[Math.floor(Math.random() * free.length)], SPAWN_Z);
    } else {
      // two obstacles, always one open lane
      const open = lanes[Math.floor(Math.random() * 3)];
      for (const l of lanes)
        if (l !== open) this.spawnObstacle(l, Math.random() < 0.6 ? "low" : "high");
      this.spawnProduct(open, SPAWN_Z);
    }
  }

  private spawnProduct(lane: -1 | 0 | 1, z: number) {
    const grp = new THREE.Group();
    const tex = this.productTextures.length
      ? this.productTextures[this.spawnCount % this.productTextures.length]
      : null;
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      tex
        ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.4 })
        : new THREE.MeshBasicMaterial({ color: this.cfg.brand.primaryColor, side: THREE.DoubleSide }),
    );
    card.position.y = 1.15;
    grp.add(card);
    // glow ring on the ground
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({ color: this.cfg.brand.primaryColor, transparent: true, opacity: 0.8 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    grp.add(ring);
    grp.position.set(lane * LANE_X, 0, z);
    this.scene.add(grp);
    this.objects.push({ kind: "product", lane, z, mesh: grp, spin: card });
  }

  private spawnObstacle(lane: -1 | 0 | 1, kind: "low" | "high") {
    const grp = new THREE.Group();
    const stripe = this.hazardTexture();
    if (kind === "low") {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.7, 0.4),
        new THREE.MeshStandardMaterial({ map: stripe }),
      );
      barrier.position.y = 0.35;
      grp.add(barrier);
    } else {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.4, 0.4),
        new THREE.MeshStandardMaterial({ map: stripe }),
      );
      bar.position.y = 1.7;
      grp.add(bar);
      for (const x of [-0.7, 0.7]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 1.9, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x2c2f36 }),
        );
        post.position.set(x, 0.95, 0);
        grp.add(post);
      }
    }
    grp.position.set(lane * LANE_X, 0, SPAWN_Z);
    this.scene.add(grp);
    this.objects.push({ kind, lane, z: SPAWN_Z, mesh: grp });
  }

  private spawnBanner() {
    if (!this.bannerTextures.length) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    const tex = this.bannerTextures[this.spawnCount % this.bannerTextures.length];
    const grp = new THREE.Group();
    const w = 5.2;
    const img = tex.image as { width?: number; height?: number } | undefined;
    const h = w * ((img?.height || 1) / (img?.width || 2));
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    panel.position.y = h / 2 + 2.4;
    panel.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    grp.add(panel);
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, panel.position.y, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x23262c }),
    );
    post.position.y = panel.position.y / 2;
    grp.add(post);
    grp.position.set(side * 8.5, 0, SPAWN_Z);
    this.scene.add(grp);
    this.objects.push({ kind: "banner", lane: 0, z: SPAWN_Z, mesh: grp });
  }

  private spawnFinish() {
    this.finishSpawned = true;
    const dist = Math.max(12, this.speed * this.finishLead());
    const grp = new THREE.Group();
    // checkered ground band
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 3),
      new THREE.MeshBasicMaterial({ map: this.checkerTexture() }),
    );
    band.rotation.x = -Math.PI / 2;
    band.position.y = 0.03;
    grp.add(band);
    // arch posts + banner
    for (const x of [-6, 6]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 6),
        new THREE.MeshStandardMaterial({ color: 0x1c1f25 }),
      );
      post.position.set(x, 3, 0);
      grp.add(post);
    }
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 1.1, 0.3),
      new THREE.MeshBasicMaterial({ map: this.checkerTexture(8) }),
    );
    top.position.set(0, 6, 0);
    grp.add(top);
    grp.position.set(0, 0, -dist);
    this.scene.add(grp);
    this.objects.push({ kind: "finish", lane: 0, z: -dist, mesh: grp });
  }

  /* ---------------------------- object update --------------------------- */

  private updateObjects(dz: number) {
    for (const o of this.objects) {
      o.z += dz;
      o.mesh.position.z = o.z;
      if (o.spin) o.spin.rotation.y += 0.04;
      if (o.done) continue;
      if (o.kind === "banner" || o.kind === "finish") continue;
      if (o.z >= HIT_Z_NEAR && o.z <= HIT_Z_FAR) {
        const sameLane = Math.abs(this.laneX - o.lane * LANE_X) < LANE_X * 0.5;
        if (sameLane) this.resolve(o);
      }
    }
    // cull
    const keep: WorldObj[] = [];
    for (const o of this.objects) {
      if (o.z > DESPAWN_Z || o.done) {
        this.scene.remove(o.mesh);
        this.disposeObj(o.mesh);
      } else keep.push(o);
    }
    this.objects = keep;
  }

  private resolve(o: WorldObj) {
    if (o.kind === "product") {
      o.done = true;
      this.score += this.cfg.game.coinValue;
      this.cb.onScore(this.score);
      this.cb.onCoin();
      this.audio.coin();
      return;
    }
    if (o.kind === "low" && this.jumpY >= JUMP_CLEAR_Y) return;
    if (o.kind === "high" && this.sliding) return;
    o.done = true;
    this.audio.hit();
    this.cb.onHit();
    if (this.cfg.game.obstacleEndsRun) this.end(false);
    else this.timeLeft = Math.max(0, this.timeLeft - 5);
  }

  private end(timeUp: boolean) {
    if (this.ended) return;
    this.ended = true;
    if (timeUp && this.score >= this.cfg.game.goldScore) this.audio.win();
    this.cb.onEnd({ score: this.score, timeUp });
  }

  /* --------------------------- procedural textures ---------------------- */

  private hazardTexture(): THREE.Texture {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f2b01e";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#1a1a1a";
    for (let i = -8; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 16, 0);
      ctx.lineTo(i * 16 + 8, 0);
      ctx.lineTo(i * 16 + 8 + 64, 64);
      ctx.lineTo(i * 16 + 64, 64);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  private checkerTexture(n = 6): THREE.Texture {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const s = 128 / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#111" : "#fff";
        ctx.fillRect(x * s, y * s, s, s);
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return t;
  }

  private disposeObj(obj: THREE.Object3D) {
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        const mat = m.material as THREE.Material | THREE.Material[];
        Array.isArray(mat) ? mat.forEach((x) => x.dispose()) : mat.dispose();
      }
    });
  }
}
