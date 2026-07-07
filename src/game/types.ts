import type { GameConfig } from "@/lib/config";

export type EntityKind = "coin" | "block" | "barrier";

export interface Entity {
  kind: EntityKind;
  lane: -1 | 0 | 1;
  /** Distance ahead of the player in world units (0 = at player). */
  z: number;
  collected?: boolean;
  hit?: boolean;
  /** Wobble seed for coins. */
  seed: number;
}

export interface GameCallbacks {
  onScore: (score: number) => void;
  onTimer: (secondsLeft: number) => void;
  onCoin: () => void;
  onHit: () => void;
  onEnd: (result: { score: number; timeUp: boolean }) => void;
}

export interface LoadedAssets {
  character?: HTMLImageElement;
  coin?: HTMLImageElement;
  obstacles: HTMLImageElement[];
  billboards: HTMLImageElement[];
}

export type { GameConfig };
