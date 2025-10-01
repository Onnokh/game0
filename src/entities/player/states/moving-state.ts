import * as ex from 'excalibur';
import type { Player } from '../player';
import { IPlayerState, PlayerStateType } from './player-state';

export class MovingState implements IPlayerState {
  enter(player: Player): void {
    // Animation will be set based on sprint state in update
    // Start emitting walking particles
    const walkParticles = player.getWalkParticles();
    walkParticles.isEmitting = true;
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
    
    // Calculate movement direction
    let moveX = 0;
    let moveY = 0;
    
    if (input.isHeld(ex.Keys.ArrowLeft) || input.isHeld(ex.Keys.KeyA)) {
      moveX = -1;
    }
    if (input.isHeld(ex.Keys.ArrowRight) || input.isHeld(ex.Keys.KeyD)) {
      moveX = 1;
    }
    if (input.isHeld(ex.Keys.ArrowUp) || input.isHeld(ex.Keys.KeyW)) {
      moveY = -1;
    }
    if (input.isHeld(ex.Keys.ArrowDown) || input.isHeld(ex.Keys.KeyS)) {
      moveY = 1;
    }
    
    // Check if still moving
    if (moveX === 0 && moveY === 0) {
      player.changeState(PlayerStateType.Idle);
      return;
    }
    
    // Check for sprint
    const isSprinting = input.isHeld(ex.Keys.ShiftLeft);

    // Normalize diagonal movement
    const normalizedMovement = ex.vec(moveX, moveY).normalize();
    const speed = isSprinting ? player.getSprintSpeed() : player.getWalkSpeed();
    const desiredVel = normalizedMovement.scale(speed);
    player.vel = desiredVel.add(player.vel);
    
    // Facing direction is now handled by mouse aiming, not movement
    
    // Set animation based on sprint state
    if (isSprinting) {
      player.setAnimation('sprint');
    } else {
      player.setAnimation('walk');
    }
    
    // Adjust particle emit rate based on sprint state
    const walkParticles = player.getWalkParticles();
    walkParticles.emitRate = isSprinting ? 10 : 5; // Double when sprinting
  }

  exit(player: Player): void {
    player.vel = ex.Vector.Zero;
    // Stop emitting walking particles
    const walkParticles = player.getWalkParticles();
    walkParticles.isEmitting = false;
  }
}

