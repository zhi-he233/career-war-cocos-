/**
 * BattlePlayerHelpers — pure display-logic functions extracted from BattleScene.
 *
 * All functions are pure: they take room/player/character data and return display values.
 * No socket calls, no Cocos Component dependencies. Designed to be imported by any
 * Cocos Component that needs to render battle state.
 */

import type { GameEvent, Player, Room } from '../shared/types';

// ── Player Identification ──

/** Get the currently active player (actor). Handles duo-2v2 selectedActorId. */
export function getActor(room: Room): Player | null {
  if (room.selectedActorId) {
    const selected = room.players.find(p => p.id === room.selectedActorId);
    if (selected) return selected;
  }
  return room.players[room.activePlayerIndex] ?? null;
}

/** Find a player by name or ID */
export function getPlayerByName(room: Room, name: string): Player | undefined {
  return room.players.find(p => p.nickname === name || p.id === name);
}

/** Get the local player from a room given the client ID */
export function getLocalPlayer(room: Room, clientId: string): Player | undefined {
  return room.players.find(
    p => p.clientId === clientId || p.controllerId === clientId
  );
}

// ── Permissions / Can-Act ──

/** Whether the given client can control the given player. */
export function canControlPlayer(player: Player | null, clientId: string): boolean {
  if (!player || player.isDead || player.isBot || !clientId) return false;
  return player.clientId === clientId || player.controllerId === clientId;
}

/** Whether the local client can act in the current room. */
export function canLocalAct(room: Room, clientId: string): boolean {
  return canControlPlayer(getActor(room), clientId);
}

/** Whether the local client can resolve the pending roll decision. */
export function canResolveDecision(room: Room, clientId: string): boolean {
  const actorId = room.pendingRollDecision?.actorId;
  const actor = actorId ? room.players.find(p => p.id === actorId) ?? null : null;
  return canControlPlayer(actor, clientId);
}

// ── Targeting ──

/** Whether `actor` can target `target` in the current room. */
export function canTarget(actor: Player, target: Player): boolean {
  if (target.id === actor.id || target.isDead) return false;
  // In duo mode, players on the same team cannot target each other
  if (actor.teamId && target.teamId) return actor.teamId !== target.teamId;
  return true;
}

/** Get all valid targets for the given actor. */
export function getValidTargets(room: Room, actor: Player): Player[] {
  return room.players.filter(target => canTarget(actor, target));
}

// ── HP / Shield Display ──

export function hpPercent(player: Player): number {
  if (player.maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
}

export function hpBarWidth(player: Player, maxWidth = 100): number {
  return Math.round((hpPercent(player) / 100) * maxWidth);
}

// ── Status Text ──

export function playerStatus(player: Player, room: Room): string {
  if (!player.isOnline) return 'Offline';
  if (player.isDead) return 'Dead';
  if (player.characterId === 'mountain_shield' && player.guarding) return 'Guarding';
  if (room.pendingRoll?.playerId === player.id) return 'Pending roll';
  if (player.id === getActor(room)?.id) return 'Acting';
  if (hasInvincible(player, room)) return 'Invincible';
  return 'Waiting';
}

export function hasInvincible(player: Player, room: Room): boolean {
  return room.effects.some(
    e => e.type === 'invincible' && e.sourcePlayerId === player.id
  );
}

// ── Badges / Tags ──

export function guardBadges(player: Player, room: Room): string[] {
  const badges: string[] = [];
  if (player.characterId === 'mountain_shield' && player.guarding) {
    badges.push('Guarding', 'Armor +1');
    // Check if team members are also protected
    const hasTeammate = room.players.some(
      p => p.teamId === player.teamId && p.id !== player.id && !p.isDead
    );
    if (hasTeammate) badges.push('Team Armor +2');
  }
  return badges;
}

export function statusBadges(player: Player): string[] {
  const tags: string[] = [];
  const marks = (player as Player & { flameMarks?: number }).flameMarks;
  if (marks && marks > 0) tags.push(`Flame x${marks}`);
  return tags;
}

export function buildSeatTags(
  player: Player,
  room: Room,
  characterName: string,
  summonerSkillName: string,
  enemyTypeLabel?: (p: Player) => string,
): string[] {
  const isRoguelite = (room.gameMode ?? room.settings?.gameMode) === 'pve_roguelite';
  if (isRoguelite && player.isBot && player.rogueliteEnemyInfo) {
    const tags = [enemyTypeLabel ? enemyTypeLabel(player) : 'Enemy'];
    if (player.rogueliteEnemyInfo.skillNames?.[0])
      tags.push(player.rogueliteEnemyInfo.skillNames[0]);
    tags.push(...statusBadges(player));
    return tags;
  }
  const tags: string[] = [characterName];
  if (!isRoguelite || player.isBot) {
    const cd = player.summonerSkillCooldown
      ? ` (${player.summonerSkillCooldown})`
      : '';
    tags.push(`${summonerSkillName}${cd}`);
  }
  tags.push(...statusBadges(player));
  tags.push(...guardBadges(player, room));
  return tags;
}

// ── Last Roll ──

export function lastRollText(player: Player, room: Room): string {
  if (room.pendingRollDecision?.actorId === player.id) {
    return `Roll: ${room.pendingRollDecision.currentRoll}`;
  }
  const rollEvent = latestEvents(room).find(
    e => e.type === 'roll' && e.playerId === player.id && e.dice?.length
  );
  if (!rollEvent?.dice?.length) return '';
  return `Roll: ${rollEvent.dice.join(',')}`;
}

// ── Battle Log ──

export function latestEvents(room: Room, limit: number = room.battleLog.length): GameEvent[] {
  return [...room.battleLog]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

// ── Player Display Line (for debug / text-only UI) ──

export function playerLine(
  room: Room,
  player: Player,
  index: number,
  charName: string,
  skillName: string,
  getPlayerNameFn: (id: string | undefined) => string,
): string {
  const activeMark =
    index === room.activePlayerIndex || player.id === room.selectedActorId
      ? '> '
      : '  ';
  const targetMark = player.selectedTargetId
    ? ` -> ${getPlayerNameFn(player.selectedTargetId)}`
    : '';
  const team = player.teamId ? ` Team ${player.teamId}` : '';
  const bot = player.isBot ? ' bot' : '';
  const dead = player.isDead ? ' dead' : '';
  return [
    `${activeMark}${player.nickname}${team}${bot}${dead}`,
    `${charName} / ${skillName} | HP ${player.hp}/${player.maxHp} | Shield ${player.shield}${targetMark}`,
  ].join('\n');
}

// ── Self Panel ──

export function selfPanelSkillHint(
  player: Player,
  room: Room,
): string {
  const decision = room.pendingRollDecision;
  if (decision?.actorId === player.id && decision.availableCharacterSkillName) {
    return `Skill: ${decision.availableCharacterSkillName}`;
  }
  return '';
}

// ── Floating Effects ──

export interface FloatingEffect {
  playerId: string;
  key: string;
  value: number;
  type: 'damage' | 'heal' | 'block';
}

/** Compare two room snapshots and generate floating effect entries. */
export function diffFloatingEffects(
  prevRoom: Room | null,
  nextRoom: Room,
): FloatingEffect[] {
  if (!prevRoom) return [];
  const effects: FloatingEffect[] = [];
  for (const player of nextRoom.players) {
    const prev = prevRoom.players.find(p => p.id === player.id);
    if (!prev) continue;
    const hpDelta = player.hp - prev.hp;
    if (hpDelta < 0) {
      effects.push({
        playerId: player.id,
        key: `${Date.now()}-${Math.random()}`,
        value: -hpDelta,
        type: 'damage',
      });
    } else if (hpDelta > 0 && !player.isDead) {
      effects.push({
        playerId: player.id,
        key: `${Date.now()}-${Math.random()}`,
        value: hpDelta,
        type: 'heal',
      });
    }
    if (player.shield < prev.shield) {
      effects.push({
        playerId: player.id,
        key: `${Date.now()}-${Math.random()}`,
        value: prev.shield - player.shield,
        type: 'block',
      });
    }
  }
  return effects;
}
