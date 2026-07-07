/**
 * GameConfig is the single source of truth for everything the marketing team can
 * customise from the dashboard: brand, copy, gameplay tuning, asset URLs and links.
 *
 * The game reads a merged config (DEFAULT_CONFIG <- stored overrides) so it always
 * renders even when Supabase is not configured or a field is missing.
 */

export type BadgeTier = "gold" | "silver";

export interface GameConfig {
  /** Brand / theming */
  brand: {
    name: string;
    /** Loop purple — primary accent used across CTAs, coins, progress. */
    primaryColor: string;
    /** Gold badge / win highlight. */
    goldColor: string;
    /** Silver badge highlight. */
    silverColor: string;
    /** Dark UI surface (pills, panels, game-over background). */
    inkColor: string;
    /** Logo shown on splash / loading. Empty => built-in Loop wordmark. */
    logoUrl: string;
  };

  /** All user-facing copy. */
  copy: {
    splashTitle: string;
    splashSubtitle: string;
    playButton: string;
    playbookLinkLabel: string;
    playbookName: string;
    infoTitle: string;
    infoSubtitle: string;
    infoStep1: string;
    infoStep2: string;
    infoFooter: string;
    emailHeading: string;
    emailPlaceholder: string;
    emailHelper: string;
    startButton: string;
    tutorialHeading: string;
    winTitle: string;
    winMessage: string;
    loseTitle: string;
    loseMessage: string;
    playAgainButton: string;
    shareButton: string;
    homeButton: string;
    scoreLabel: string;
  };

  /** Gameplay tuning. */
  game: {
    /** Round length in seconds. */
    durationSeconds: number;
    /** Score needed for the gold badge (unlocks the playbook). */
    goldScore: number;
    /** Points per collectible. */
    coinValue: number;
    /** Base forward speed (relative units). */
    baseSpeed: number;
    /** How much speed ramps over the round (multiplier at end). */
    speedRamp: number;
    /** Seconds between obstacle/coin spawns at the start. */
    spawnInterval: number;
    /** If true, hitting an obstacle ends the run; else costs time. */
    obstacleEndsRun: boolean;
    /** Which 3D environment to use. */
    environment: "city" | "subway";
    /** Which character to play as. */
    character: "jake" | "default";
  };

  /** Asset URLs (Supabase Storage or any public URL). Empty => built-in art. */
  assets: {
    /** 3D environment model (GLB) — the "city" theme. */
    environmentModelUrl: string;
    /** Alternate 3D environment (GLB) — the "subway" theme. */
    subwayModelUrl: string;
    /** 3D character model (GLB, rigged humanoid) — the "default" avatar. */
    characterModelUrl: string;
    /** Alternate character — Jake (static mesh). */
    jakeModelUrl: string;
    /** Product images used as collectibles (replace coins). */
    productUrls: string[];
    /** Playbook reward image shown on the win screen. */
    playbookImageUrl: string;
    characterUrl: string;
    coinUrl: string;
    obstacleUrls: string[];
    /** Billboard / banner ad images placed along the track. */
    billboardUrls: string[];
    badgeGoldUrl: string;
    badgeSilverUrl: string;
  };

  /** Outbound links. */
  links: {
    /** Where the gold playbook download points. */
    playbookUrl: string;
    /** Offer / discount page for the share CTA. */
    offerUrl: string;
    /** Prefilled share text. */
    shareText: string;
  };

  /** Lead capture behaviour. */
  leadCapture: {
    enabled: boolean;
    requireEmail: boolean;
  };
}

export const DEFAULT_CONFIG: GameConfig = {
  brand: {
    name: "Loop",
    primaryColor: "#8B3DFF",
    goldColor: "#E9B44C",
    silverColor: "#C7CCD1",
    inkColor: "#0E0E10",
    logoUrl: "/assets/loop-logo.png",
  },
  copy: {
    splashTitle: "The Last Subscription Platform You'll Ever Need.",
    splashSubtitle: "",
    playButton: "Play Game",
    playbookLinkLabel: "How To Get Churn Playbook?",
    playbookName: "Churn Playbook",
    infoTitle: "How to get Churn Playbook?",
    infoSubtitle: "Proven strategies to reduce churn",
    infoStep1: "Complete the game under 1 minute.",
    infoStep2: "Collect all Products. Avoid the roadblock obstacles.",
    infoFooter: "Steps to grab Loop's Churn Playbook and get a “Churn Buster” badge.",
    emailHeading: "Enter your email",
    emailPlaceholder: "Enter your email*",
    emailHelper: "We'll share Loop's Churn Playbook on this email id.",
    startButton: "Start Game",
    tutorialHeading: "How to play",
    winTitle: "You Win!!!",
    winMessage: "Congrats, you got exclusive Loop's Churn Playbook",
    loseTitle: "Ohh! You got hit.",
    loseMessage: "Play again to get Loop's Churn Playbook",
    playAgainButton: "Play Again",
    shareButton: "Share To Claim Offer",
    homeButton: "Home",
    scoreLabel: "Your Total Score",
  },
  game: {
    durationSeconds: 60,
    goldScore: 150,
    coinValue: 10,
    baseSpeed: 1,
    speedRamp: 1.9,
    spawnInterval: 1.15,
    obstacleEndsRun: true,
    environment: "city",
    character: "jake",
  },
  assets: {
    environmentModelUrl: "/models/environment.glb",
    subwayModelUrl: "/models/subway.glb",
    characterModelUrl: "/models/character.glb",
    jakeModelUrl: "/models/jake.glb",
    productUrls: [
      "/assets/products/foursigmatic.png",
      "/assets/products/ketochow.png",
      "/assets/products/lilac.png",
      "/assets/products/nutripaw.png",
      "/assets/products/primalqueen.png",
    ],
    playbookImageUrl: "/assets/playbook.png",
    characterUrl: "",
    coinUrl: "",
    obstacleUrls: [],
    billboardUrls: [
      "/assets/banners/foursigmatic.png",
      "/assets/banners/primalqueen.png",
    ],
    badgeGoldUrl: "",
    badgeSilverUrl: "",
  },
  links: {
    playbookUrl: "https://loopwork.co",
    offerUrl: "https://loopwork.co",
    shareText: "I just beat the Loop Runner and unlocked the Churn Playbook! 🏃",
  },
  leadCapture: {
    enabled: true,
    requireEmail: true,
  },
};

/** Deep-merge a partial stored config over the defaults so the game never breaks. */
export function mergeConfig(partial: unknown): GameConfig {
  const p = (partial ?? {}) as DeepPartial<GameConfig>;
  return {
    brand: { ...DEFAULT_CONFIG.brand, ...(p.brand ?? {}) },
    copy: { ...DEFAULT_CONFIG.copy, ...(p.copy ?? {}) },
    game: { ...DEFAULT_CONFIG.game, ...(p.game ?? {}) },
    assets: {
      ...DEFAULT_CONFIG.assets,
      ...(p.assets ?? {}),
      obstacleUrls:
        (p.assets?.obstacleUrls as string[] | undefined) ??
        DEFAULT_CONFIG.assets.obstacleUrls,
      billboardUrls:
        (p.assets?.billboardUrls as string[] | undefined) ??
        DEFAULT_CONFIG.assets.billboardUrls,
      productUrls:
        (p.assets?.productUrls as string[] | undefined) ??
        DEFAULT_CONFIG.assets.productUrls,
    },
    links: { ...DEFAULT_CONFIG.links, ...(p.links ?? {}) },
    leadCapture: { ...DEFAULT_CONFIG.leadCapture, ...(p.leadCapture ?? {}) },
  };
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const CONFIG_ROW_ID = "default";
