
export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Point;
}

export interface EnemyMissile extends Entity {
  startPos: Point;
  targetPos: Point;
  progress: number; // 0 to 1
  speed: number;
  isDestroyed: boolean;
}

export interface PlayerMissile extends Entity {
  startPos: Point;
  targetPos: Point;
  progress: number;
  speed: number;
  isExploding: boolean;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  expanding: boolean;
  isFinished: boolean;
}

export interface City extends Entity {
  isDestroyed: boolean;
}

export interface Battery extends Entity {
  ammo: number;
  maxAmmo: number;
  isDestroyed: boolean;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface GameStats {
  score: number;
  citiesSaved: number;
  totalMissilesFired: number;
}
