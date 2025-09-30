import * as ex from 'excalibur';
import type { Player } from '../player';
import { IPlayerState, PlayerStateType } from './player-state';

export class IdleState implements IPlayerState {
  enter(player: Player): void {
    // Stop movement
    player.vel = ex.Vector.Zero;
    
    // Set idle animation
    player.setAnimation('idle');
  }

  update(player: Player, engine: ex.Engine, delta: number): void {
    const input = engine.input.keyboard;
    
    // Check for dodge roll
    if (input.wasPressed(ex.Keys.Space)) {
      if (player.tryDodgeRoll()) {
        player.changeState(PlayerStateType.DodgeRolling);
        return;
      }
    }
    
    // Check for movement input
    const moveX = (input.isHeld(ex.Keys.ArrowLeft) || input.isHeld(ex.Keys.KeyA) ? -1 : 0) +
                  (input.isHeld(ex.Keys.ArrowRight) || input.isHeld(ex.Keys.KeyD) ? 1 : 0);
    const moveY = (input.isHeld(ex.Keys.ArrowUp) || input.isHeld(ex.Keys.KeyW) ? -1 : 0) +
                  (input.isHeld(ex.Keys.ArrowDown) || input.isHeld(ex.Keys.KeyS) ? 1 : 0);
    
    if (moveX !== 0 || moveY !== 0) {
      player.changeState(PlayerStateType.Moving);
    }
  }

  exit(player: Player): void {
    // Nothing to clean up
  }
}

