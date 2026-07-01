/**
 * ViewModelBuilders — factory functions that convert raw Room/Player data
 * into display-ready ViewModels. UI components call these with the current
 * game state and get back everything they need to render.
 */

import type { Player, Room, RollDecisionAvailableAction } from '../shared/types';
import { characterName, summonerSkillName } from '../core/DisplayText';
import {
  getActor, canLocalAct, canResolveDecision, canTarget,
  hpPercent, playerStatus, lastRollText, hasInvincible,
  guardBadges, statusBadges, buildSeatTags,
} from '../helpers/BattlePlayerHelpers';
import { rogueliteEnemyTypeLabel } from '../helpers/RogueliteHelpers';
import type {
  SeatViewModel, DicePanelViewModel, ActionSlotVM,
  SelfPanelVM, SkillHintVM, BattleLogEntryVM,
} from './ViewModels';

// ── Seat ──

export function buildSeatViewModel(
  room: Room,
  player: Player,
  index: number,
  localClientId: string,
): SeatViewModel {
  const actor = getActor(room);
  const charName = characterName(player.characterId);
  const skillName = summonerSkillName(player.summonerSkillId);

  return {
    playerId: player.id,
    playerNumber: index + 1,
    nickname: player.nickname,
    isDead: player.isDead,
    isActive: player.id === actor?.id,
    isSelectable: !player.isDead && player.clientId !== localClientId,
    isSelected: actor?.selectedTargetId === player.id,
    isSelf: player.clientId === localClientId || player.controllerId === localClientId,
    characterName: charName,
    summonerSkillName: skillName,
    hp: player.hp,
    maxHp: player.maxHp,
    hpPercent: hpPercent(player),
    shield: player.shield,
    statusText: playerStatus(player, room),
    lastRollText: lastRollText(player, room),
    seatTags: buildSeatTags(player, room, charName, skillName, rogueliteEnemyTypeLabel),
    attackableLabel: canTarget(actor ?? player, player) ? 'TARGET' : '',
    targetLabel: actor?.selectedTargetId === player.id ? 'SELECTED' : '',
    isHost: player.isHost,
    isBot: player.isBot,
    hasInvincible: hasInvincible(player, room),
    guardBadges: guardBadges(player, room),
    isOnline: player.isOnline !== false,
  };
}

export function buildAllSeatViewModels(
  room: Room,
  localClientId: string,
): SeatViewModel[] {
  return room.players.map((p, i) => buildSeatViewModel(room, p, i, localClientId));
}

// ── Dice Panel ──

export function buildDicePanelVM(
  room: Room,
  localClientId: string,
): DicePanelViewModel {
  const decision = room.pendingRollDecision;
  const canRoll = room.phase === 'battle' && !decision && canLocalAct(room, localClientId);

  return {
    currentRoll: decision?.currentRoll ?? 0,
    lastRollDice: [],
    rollPhase: 'idle',
    isReady: room.phase === 'battle' && !decision,
    hasRolled: !!decision,
    title: decision ? 'Choose action' : 'Your turn',
    detail: decision ? `Roll: ${decision.currentRoll}` : '',
    skillText: decision?.availableCharacterSkillName ?? '',
    skillHints: buildSkillHints(room),
    showRollButton: room.phase === 'battle' && !decision,
    canRoll,
    rollButtonText: 'ROLL',
  };
}

export function buildSkillHints(room: Room): SkillHintVM[] {
  const decision = room.pendingRollDecision;
  if (!decision) return [];
  const hints: SkillHintVM[] = [];
  if (decision.availableCharacterSkillName) {
    hints.push({ id: 'character_skill', text: decision.availableCharacterSkillName });
  }
  if (decision.availableSummonerSkillName) {
    hints.push({ id: 'summoner_skill', text: decision.availableSummonerSkillName });
  }
  return hints;
}

// ── Action Slots ──

export function buildActionSlotVM(
  action: RollDecisionAvailableAction,
  canResolve: boolean,
): ActionSlotVM {
  return {
    id: action.id,
    label: action.label || action.id,
    description: action.reason ?? '',
    enabled: action.enabled === true && canResolve,
    requiresSelfDamage: action.requiresSelfDamageAmount === true,
    settling: false,
  };
}

export function buildAllActionSlotVMs(
  room: Room,
  localClientId: string,
): ActionSlotVM[] {
  const actions = room.pendingRollDecision?.availableActions ?? [];
  if (actions.length === 0 && room.pendingRollDecision) {
    // No special actions — just normal attack
    return [{
      id: 'normal_attack',
      label: 'Attack',
      description: '',
      enabled: canResolveDecision(room, localClientId),
      requiresSelfDamage: false,
      settling: false,
    }];
  }
  const canResolve = canResolveDecision(room, localClientId);
  return actions.map(a => buildActionSlotVM(a, canResolve));
}

// ── Self Panel ──

export function buildSelfPanelVM(
  room: Room,
  player: Player,
  localClientId: string,
): SelfPanelVM {
  const decision = room.pendingRollDecision;
  const isCurrentTurn = player.id === getActor(room)?.id && canLocalAct(room, localClientId);
  const tags: string[] = [];
  if ((player as Player & { flameMarks?: number }).flameMarks) {
    tags.push(`Flame x${(player as Player & { flameMarks?: number }).flameMarks}`);
  }
  tags.push(...guardBadges(player, room));

  return {
    nickname: player.nickname,
    characterName: characterName(player.characterId),
    hp: player.hp,
    maxHp: player.maxHp,
    hpPercent: hpPercent(player),
    shield: player.shield,
    isDead: player.isDead,
    isCurrentTurn,
    statusTags: tags,
    skillHintText: decision?.actorId === player.id && decision.availableCharacterSkillName
      ? decision.availableCharacterSkillName : '',
    lastRollText: lastRollText(player, room),
  };
}

// ── Battle Log ──

export function buildBattleLogEntryVM(
  event: Room['battleLog'][number],
): BattleLogEntryVM {
  return {
    timestamp: event.createdAt,
    message: event.message,
    type: event.type,
  };
}
