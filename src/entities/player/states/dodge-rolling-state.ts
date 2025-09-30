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
    
    // Configure particles to emit behind the player
    const particles = player.getDodgeRollParticles();
    // Calculate the angle opposite to dodge direction (behind the player)
    const dodgeAngle = Math.atan2(dodgeDirection.y, dodgeDirection.x);
    const behindAngle = dodgeAngle + Math.PI; // 180 degrees opposite
    const spreadAngle = Math.PI / 6; // 30 degree spread (±15 degrees)
    
    // Set particle angles to emit in a cone behind the player
    particles.particle.minAngle = behindAngle - spreadAngle / 2;
    particles.particle.maxAngle = behindAngle + spreadAngle / 2;
    particles.isEmitting = true;
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
    
    // Stop emitting particles
    const particles = player.getDodgeRollParticles();
    particles.isEmitting = false;
  }
}

