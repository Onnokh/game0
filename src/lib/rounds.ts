import * as ex from "excalibur";
import { Enemy } from "../entities/enemy";
import { Player } from "../entities/player";

// Round system configuration types
export type EnemyType = "skeleton" | "default";

export interface SpawnDirective {
    type: EnemyType;
    count: number;
    // If provided, spawn exactly at these world positions; otherwise use area/random
    points?: ex.Vector[];
    // Rectangle area to randomize spawn positions within (x, y, width, height)
    area?: { x: number; y: number; width: number; height: number };
    // Milliseconds between spawns for this directive (default: 0 for instant batch)
    cadenceMs?: number;
    // Delay before this directive starts spawning (ms)
    startDelayMs?: number;
}

export interface RoundConfig {
    spawns: SpawnDirective[];
}

export interface LevelRoundsConfig {
    rounds: RoundConfig[];
    autoAdvance?: boolean; // default true
    interRoundDelayMs?: number; // default 1000
}

interface TrackedSpawnState {
    totalToSpawn: number;
    spawned: number;
}

export class RoundManager {
    private scene: ex.Scene;
    private player: Player;
    private config: LevelRoundsConfig;
    private currentRoundIndex = -1;
    private aliveEnemies = new Set<Enemy>();
    private activeTimers: ex.Timer[] = [];
    private isSpawning = false;

    constructor(scene: ex.Scene, player: Player, config: LevelRoundsConfig) {
        this.scene = scene;
        this.player = player;
        this.config = {
            autoAdvance: true,
            interRoundDelayMs: 1000,
            ...config
        };
    }

    getCurrentRoundNumber(): number {
        return this.currentRoundIndex + 1;
    }

    getRemainingEnemies(): number {
        return this.aliveEnemies.size;
    }

    startFirstRound(): void {
        this.startRound(0);
    }

    startNextRound(): void {
        this.startRound(this.currentRoundIndex + 1);
    }

    private startRound(index: number): void {
        if (index < 0 || index >= this.config.rounds.length) {
            // All rounds complete
            this.scene.emit("allRoundsComplete");
            return;
        }

        this.cleanupTimers();
        this.currentRoundIndex = index;
        this.isSpawning = true;
        this.scene.emit("roundStart", { round: this.getCurrentRoundNumber() });

        const round = this.config.rounds[index];
        const spawnTrackers: TrackedSpawnState[] = [];

        for (const directive of round.spawns) {
            const totalToSpawn = directive.count;
            const tracker: TrackedSpawnState = { totalToSpawn, spawned: 0 };
            spawnTrackers.push(tracker);

            const cadence = directive.cadenceMs ?? 0;
            const delay = directive.startDelayMs ?? 0;

            if (cadence <= 0) {
                // Spawn immediately after optional delay
                const timer = new ex.Timer({
                    interval: delay,
                    repeats: false,
                    fcn: () => {
                        for (let i = 0; i < totalToSpawn; i++) {
                            this.spawnEnemyForDirective(directive);
                            tracker.spawned++;
                        }
                        this.checkRoundCompletion(spawnTrackers);
                    }
                });
                this.scene.add(timer);
                this.activeTimers.push(timer);
                timer.start();
            } else {
                // Spread spawns over time
                let spawned = 0;
                const timer = new ex.Timer({
                    interval: cadence,
                    repeats: true,
                    numberOfRepeats: totalToSpawn,
                    fcn: () => {
                        // Respect start delay via first-run gate
                        if (delay > 0 && spawned === 0) {
                            // schedule a one-shot delay to begin cadence
                            const startTimer = new ex.Timer({
                                interval: delay,
                                repeats: false,
                                fcn: () => {
                                    this.spawnEnemyForDirective(directive);
                                    spawned++;
                                    tracker.spawned++;
                                    this.checkRoundCompletion(spawnTrackers);
                                }
                            });
                            this.scene.add(startTimer);
                            this.activeTimers.push(startTimer);
                            startTimer.start();
                            return; // skip this tick
                        }
                        this.spawnEnemyForDirective(directive);
                        spawned++;
                        tracker.spawned++;
                        this.checkRoundCompletion(spawnTrackers);
                    }
                });
                this.scene.add(timer);
                this.activeTimers.push(timer);
                timer.start();
            }
        }
    }

    private spawnEnemyForDirective(directive: SpawnDirective): void {
        const pos = this.chooseSpawnPosition(directive);
        const enemy = this.createEnemy(directive.type, pos);
        enemy.setPlayer(this.player);

        // Listen for custom death event
        enemy.on("died", () => {
            this.aliveEnemies.delete(enemy);
            this.scene.emit("enemyDied");
            this.checkRoundCleared();
        });

        this.scene.add(enemy);
        this.aliveEnemies.add(enemy);
    }

    private chooseSpawnPosition(d: SpawnDirective): ex.Vector {
        if (d.points && d.points.length > 0) {
            const index = Math.floor(Math.random() * d.points.length);
            return d.points[index].clone();
        }
        if (d.area) {
            const x = d.area.x + Math.random() * d.area.width;
            const y = d.area.y + Math.random() * d.area.height;
            return ex.vec(x, y);
        }
        // Fallback: around player at a distance
        const angle = Math.random() * Math.PI * 2;
        const radius = 200 + Math.random() * 150;
        return ex.vec(this.player.pos.x + Math.cos(angle) * radius, this.player.pos.y + Math.sin(angle) * radius);
    }

    private createEnemy(type: EnemyType, pos: ex.Vector): Enemy {
        // Placeholder switch for future enemy types
        switch (type) {
            case "skeleton":
                // TODO: replace with specific skeleton class when implemented
                return new Enemy(pos.x, pos.y);
            case "default":
            default:
                return new Enemy(pos.x, pos.y);
        }
    }

    private checkRoundCompletion(trackers: TrackedSpawnState[]): void {
        const allSpawned = trackers.every(t => t.spawned >= t.totalToSpawn);
        if (allSpawned) {
            this.isSpawning = false;
            this.checkRoundCleared();
        }
    }

    private checkRoundCleared(): void {
        if (!this.isSpawning && this.aliveEnemies.size === 0) {
            this.scene.emit("roundClear", { round: this.getCurrentRoundNumber() });
            if (this.config.autoAdvance !== false) {
                const delay = this.config.interRoundDelayMs ?? 1000;
                const t = new ex.Timer({
                    interval: delay,
                    repeats: false,
                    fcn: () => this.startNextRound()
                });
                this.scene.add(t);
                this.activeTimers.push(t);
                t.start();
            }
        }
    }

    private cleanupTimers(): void {
        for (const t of this.activeTimers) {
            // Removing a timer from the scene stops it
            try {
                this.scene.remove(t);
            } catch {}
        }
        this.activeTimers = [];
    }
}


