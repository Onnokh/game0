import * as ex from 'excalibur';
import type { Player } from '../player';
import { IPlayerState, PlayerStateType } from './player-state';

export class DodgeRollingState implements IPlayerState {
  enter(player: Player): void {
    // Reset and activate the dodge roll animation
    player.getDodgeRollAnimation().reset();
    player.setAnimation('dodgeroll');
    
    // Calculate dodge direction based on input
    const input = player.scene?.engine.input.keyboard;
    let dodgeX = 0;
    let dodgeY = 0;

    if (input) {
      if (input.isHeld(ex.Keys.ArrowLeft) || input.isHeld(ex.Keys.KeyA)) {
        dodgeX = -1;
      }
      if (input.isHeld(ex.Keys.ArrowRight) || input.isHeld(ex.Keys.KeyD)) {
        dodgeX = 1;
      }
      if (input.isHeld(ex.Keys.ArrowUp) || input.isHeld(ex.Keys.KeyW)) {
        dodgeY = -1;
      }
      if (input.isHeld(ex.Keys.ArrowDown) || input.isHeld(ex.Keys.KeyS)) {
        dodgeY = 1;
      }
    }

    // If no input direction, abort dodge roll
    if (dodgeX === 0 && dodgeY === 0) {
      player.changeState(PlayerStateType.Idle);
      return;
    }

    // Normalize and set dodge direction
    const dodgeDirection = ex.vec(dodgeX, dodgeY).normalize();
    player.setDodgeDirection(dodgeDirection);
    
    // Set velocity for dodge roll
    player.vel = dodgeDirection.scale(player.getDodgeRollSpeed());
  }

  update(player: Player, engine: ex.Engine, delta: number): void {
    const currentTime = Date.now();
    const timeSinceDodgeStart = currentTime - player.getLastDodgeRollTime();
    
    // Check if dodge roll duration is complete
    if (timeSinceDodgeStart >= player.getDodgeRollDuration()) {
      // Transition back to idle
      player.changeState(PlayerStateType.Idle);
      return;
    }
    
    // Continue moving in dodge direction
    player.vel = player.getDodgeDirection().scale(player.getDodgeRollSpeed());
  }

  exit(player: Player): void {
    // Stop movement
    player.vel = ex.Vector.Zero;
    player.setIsDodgeRolling(false);
  }
}

