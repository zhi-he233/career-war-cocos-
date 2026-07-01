/**
 * EmoteHelper — emote display and cooldown management.
 *
 * Emotes are lightweight player-to-player visual reactions.
 * The server broadcasts `playerEmote` events; this helper manages
 * the local cooldown (anti-spam) and active emote tracking.
 */

import type { EmoteId } from '../shared/types';

// ── Emote Definitions ──

export interface EmoteDef {
  id: EmoteId;
  label: string;
  emoji: string;
}

export const EMOTE_DEFS: EmoteDef[] = [
  { id: 'cry',      label: 'Cry',      emoji: '😭' },
  { id: 'surprise', label: 'Surprise', emoji: '😮' },
  { id: 'taunt',    label: 'Taunt',    emoji: '😏' },
  { id: 'angry',    label: 'Angry',    emoji: '😡' },
  { id: 'like',     label: 'Like',     emoji: '👍' },
  { id: 'question', label: 'Huh?',     emoji: '❓' },
];

const EMOTE_MAP: Record<string, EmoteDef> = {};
for (const def of EMOTE_DEFS) {
  EMOTE_MAP[def.id] = def;
}

export function getEmoteDef(id: string): EmoteDef | undefined {
  return EMOTE_MAP[id];
}

// ── Active Emote (per player, auto-expire) ──

export interface ActiveEmote {
  playerId: string;
  emoji: string;
  key: string;
  expiresAt: number;
}

const DEFAULT_COOLDOWN_MS = 1500;
const DEFAULT_EXPIRE_MS = 2000;

export class EmoteHelper {
  private _active: ActiveEmote[] = [];
  private _lastSendTime = 0;
  private _cooldownMs: number;

  constructor(cooldownMs = DEFAULT_COOLDOWN_MS) {
    this._cooldownMs = cooldownMs;
  }

  /** Whether the local player can send another emote (cooldown check). */
  get canSend(): boolean {
    return Date.now() - this._lastSendTime >= this._cooldownMs;
  }

  /** Get all currently active (non-expired) emotes. */
  get active(): ActiveEmote[] {
    return this._active;
  }

  /**
   * Record that the local player sent an emote. Starts cooldown.
   * @returns true if the emote was allowed (not on cooldown).
   */
  trySend(): boolean {
    if (!this.canSend) return false;
    this._lastSendTime = Date.now();
    return true;
  }

  /**
   * Record an incoming emote from another player.
   * @param playerId  The player who sent the emote
   * @param emoteId   The emote ID
   */
  addIncoming(playerId: string, emoteId: string): void {
    const def = getEmoteDef(emoteId);
    if (!def) return;

    // Deduplicate: replace any existing emote from this player
    this._active = this._active.filter(a => a.playerId !== playerId);
    this._active.push({
      playerId,
      emoji: def.emoji,
      key: `${playerId}-${Date.now()}`,
      expiresAt: Date.now() + DEFAULT_EXPIRE_MS,
    });
  }

  /** Get the active emote for a specific player, if any. */
  getForPlayer(playerId: string): ActiveEmote | undefined {
    return this._active.find(a => a.playerId === playerId);
  }

  /** Remove expired emotes. Call periodically (e.g. in update()). */
  tick(): void {
    const now = Date.now();
    this._active = this._active.filter(a => a.expiresAt > now);
  }

  /** Clear all active emotes and cooldown. */
  reset(): void {
    this._active = [];
    this._lastSendTime = 0;
  }
}
