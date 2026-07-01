/**
 * DiceAnimator — dice roll animation state machine.
 *
 * Manages the visual phase transitions during a dice roll:
 *   idle → fast(55ms tick, 240ms) → slow(110ms tick, 260ms)
 *   → pause(180ms) → reveal → idle(220ms/420ms)
 *
 * Usage:
 * ```
 * const animator = new DiceAnimator();
 * animator.start('normal', () => { /* server result arrived *\/ });
 * // In your component's update(dt):
 * animator.update(dt);
 * // Read current face: animator.currentFace
 * // Read current phase: animator.phase
 * ```
 */

export type RollPhase = 'idle' | 'fast' | 'slow' | 'pause' | 'reveal';
export type RollMode = 'normal' | 'guard';

export class DiceAnimator {
  private _phase: RollPhase = 'idle';
  private _mode: RollMode = 'normal';
  private _currentFace = 1;
  private _finalFace = 1;

  // Timing
  private _elapsed = 0;
  private _tickInterval = 0;
  private _tickAccum = 0;

  // Phase durations (seconds)
  private _fastDuration = 0.24;
  private _slowDuration = 0.26; // 500ms total from start of fast
  private _pauseDuration = 0.18; // 680ms total from start
  private _revealTimeout = 0.68;
  private _safetyTimeout = 0.82;
  private _absoluteTimeout = 1.2;

  // Reveal-to-idle delay
  private _revealIdleDelay = 0.22; // normal mode
  private _revealIdleGuardDelay = 0.42; // guard mode

  // Callbacks
  private _onReveal: (() => void) | null = null;
  private _revealTriggered = false;
  private _safetyTriggered = false;

  // ── Public accessors ──

  get phase(): RollPhase { return this._phase; }
  get mode(): RollMode { return this._mode; }
  get currentFace(): number { return this._currentFace; }
  get finalFace(): number { return this._finalFace; }
  get isRolling(): boolean { return this._phase !== 'idle' && this._phase !== 'reveal'; }
  get isReveal(): boolean { return this._phase === 'reveal'; }

  // ── Public API ──

  /**
   * Start the roll animation pipeline.
   * @param mode      'normal' for attack roll, 'guard' for guard-check roll
   * @param onReveal  Called when the animation reaches the reveal point.
   *                  The caller should update game state and then call finishReveal().
   */
  start(mode: RollMode = 'normal', onReveal?: () => void): void {
    if (this.isRolling) return;

    this._phase = 'fast';
    this._mode = mode;
    this._elapsed = 0;
    this._tickAccum = 0;
    this._tickInterval = 0.055; // ~55ms
    this._currentFace = this._randomFace();
    this._finalFace = this._randomFace();
    this._revealTriggered = false;
    this._safetyTriggered = false;
    this._onReveal = onReveal ?? null;
  }

  /** Transition into reveal phase (call when server result is available). */
  reveal(finalFace: number): void {
    if (this._phase === 'idle' || this._phase === 'reveal') return;
    this._phase = 'reveal';
    this._finalFace = finalFace;
    this._currentFace = finalFace;
    this._revealTriggered = true;
    this._safetyTriggered = true;
  }

  /** Transition from reveal back to idle. */
  finishReveal(): void {
    if (this._phase !== 'reveal') return;
    this._phase = 'idle';
    this._mode = 'normal';
  }

  /** Force reset to idle (cleanup). */
  reset(): void {
    this._phase = 'idle';
    this._mode = 'normal';
    this._elapsed = 0;
    this._tickAccum = 0;
    this._onReveal = null;
    this._revealTriggered = false;
    this._safetyTriggered = false;
  }

  // ── Per-frame update ──

  /** Call this from your Component's update(dt). dt is in seconds. */
  update(dt: number): void {
    if (this._phase === 'idle' || this._phase === 'reveal') return;

    this._elapsed += dt;

    // Absolute timeout — force idle if stuck
    if (this._elapsed >= this._absoluteTimeout) {
      this.reset();
      return;
    }

    // Safety reveal trigger
    if (!this._safetyTriggered && this._elapsed >= this._safetyTimeout) {
      this._safetyTriggered = true;
      this._triggerRevealCallback();
    }

    // Primary reveal trigger
    if (!this._revealTriggered && this._elapsed >= this._revealTimeout) {
      this._triggerRevealCallback();
    }

    // Phase transitions
    if (this._phase === 'fast' && this._elapsed >= this._fastDuration) {
      this._phase = 'slow';
      this._tickInterval = 0.11; // ~110ms
      this._tickAccum = 0;
    }

    if (this._phase === 'slow' && this._elapsed >= this._fastDuration + this._slowDuration) {
      this._phase = 'pause';
    }

    // Tick the dice face for fast/slow phases
    if (this._phase === 'fast' || this._phase === 'slow') {
      this._tickAccum += dt;
      if (this._tickAccum >= this._tickInterval) {
        this._tickAccum -= this._tickInterval;
        this._currentFace = this._randomFace();
      }
    }
  }

  // ── Private ──

  private _randomFace(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  private _triggerRevealCallback(): void {
    if (this._phase === 'idle' || this._phase === 'reveal') return;
    // Switch to pause while waiting for server result
    if (this._phase !== 'pause') {
      this._phase = 'pause';
    }
    this._onReveal?.();
  }
}
