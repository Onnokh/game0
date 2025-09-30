import * as ex from 'excalibur';
import type { Enemy } from '../enemy.js';

export enum EnemyStateType {
  Idle = 'Idle',
  Chase = 'Chase',
  Attack = 'Attack',
}

export interface IEnemyState {
  enter(enemy: Enemy): void;
  update(enemy: Enemy, engine: ex.Engine, delta: number): void;
  exit(enemy: Enemy): void;
}

