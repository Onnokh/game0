import * as ex from 'excalibur';
import type { Player } from '../player';

export enum PlayerStateType {
  Idle = 'Idle',
  Moving = 'Moving',
  DodgeRolling = 'DodgeRolling',
}

export interface IPlayerState {
  enter(player: Player): void;
  update(player: Player, engine: ex.Engine, delta: number): void;
  exit(player: Player): void;
}

