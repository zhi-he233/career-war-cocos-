import type { EmoteId } from '../shared/types';

export interface EmoteDef {
  id: EmoteId;
  label: string;
  emoji: string;
}

export const EMOTE_DEFS: EmoteDef[] = [
  { id: 'cry', label: '哭', emoji: 'T_T' },
  { id: 'surprise', label: '惊讶', emoji: '!' },
  { id: 'taunt', label: '嘲讽', emoji: '哼' },
  { id: 'angry', label: '生气', emoji: '怒' },
  { id: 'like', label: '赞', emoji: 'OK' },
  { id: 'question', label: '疑问', emoji: '?' },
];

const EMOTE_MAP: Record<string, EmoteDef> = {};
for (const def of EMOTE_DEFS) {
  EMOTE_MAP[def.id] = def;
}

export function getEmoteDef(id: string): EmoteDef | undefined {
  return EMOTE_MAP[id];
}

export interface ActiveEmote {
  playerId: string;
  emoji: string;
  key: string;
  expiresAt: number;
}

const DEFAULT_COOLDOWN_MS = 1500;
const DEFAULT_EXPIRE_MS = 2000;

export class EmoteHelper {
  private activeEmotes: ActiveEmote[] = [];
  private lastSendTime = 0;

  constructor(private readonly cooldownMs = DEFAULT_COOLDOWN_MS) {}

  get canSend(): boolean {
    return Date.now() - this.lastSendTime >= this.cooldownMs;
  }

  get active(): ActiveEmote[] {
    return this.activeEmotes;
  }

  trySend(): boolean {
    if (!this.canSend) return false;
    this.lastSendTime = Date.now();
    return true;
  }

  addIncoming(playerId: string, emoteId: string): void {
    const def = getEmoteDef(emoteId);
    if (!def) return;

    this.activeEmotes = this.activeEmotes.filter((item) => item.playerId !== playerId);
    this.activeEmotes.push({
      playerId,
      emoji: def.emoji,
      key: `${playerId}-${Date.now()}`,
      expiresAt: Date.now() + DEFAULT_EXPIRE_MS,
    });
  }

  getForPlayer(playerId: string): ActiveEmote | undefined {
    return this.activeEmotes.find((item) => item.playerId === playerId);
  }

  tick(): void {
    const now = Date.now();
    this.activeEmotes = this.activeEmotes.filter((item) => item.expiresAt > now);
  }

  reset(): void {
    this.activeEmotes = [];
    this.lastSendTime = 0;
  }
}
