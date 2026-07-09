/**
 * MockData — Offline demo data for all scenes.
 *
 * Provides mock Room, Player, RogueliteRun data so every page can be
 * demonstrated without a running server. Used by scene ensureMinimalUi()
 * when no real server connection is available.
 */

import type { Room, Player, RoomSettings, GameMode, RoomPhase, CharacterId, SummonerSkillId } from '../shared/types';
import type { RouteNodeVM, RouteMapVM, RogueliteRewardOptionVM } from '../models/ViewModels';

// ── ID Generators ──

let _seq = 0;
function uid(prefix = 'mock'): string {
  return `${prefix}_${++_seq}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Mock Players ──

export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: uid('p'),
    clientId: uid('c'),
    nickname: `Player_${_seq}`,
    isHost: false,
    isOnline: true,
    isBot: false,
    hp: 30,
    maxHp: 30,
    shield: 0,
    isDead: false,
    ...overrides,
  } as Player;
}

// ── Mock Room ──

export function createMockRoom(
  gameMode: GameMode = 'classic',
  phase: RoomPhase = 'lobby',
  playerCount: number = 2,
): Room {
  const hostId = uid('p');
  const players: Player[] = [
    createMockPlayer({ id: hostId, nickname: '玩家A', isHost: true, characterId: 'assassin' as CharacterId }),
  ];

  for (let i = 1; i < playerCount; i++) {
    const charIds: CharacterId[] = ['berserker', 'flame_lord', 'gunner', 'paladin', 'vampire', 'war_knight'];
    players.push(createMockPlayer({
      nickname: `玩家${String.fromCharCode(65 + i)}`,
      characterId: charIds[i % charIds.length] as CharacterId,
      isHost: false,
    }));
  }

  const settings: RoomSettings = {
    maxPlayers: gameMode === 'duo_2v2' ? 4 : 2,
    allowDuplicateCharacters: false,
    gameMode,
  };

  return {
    id: uid('room').toUpperCase().slice(0, 6),
    hostId,
    phase,
    gameMode,
    settings,
    players,
    rematchReadyPlayerIds: [],
    activePlayerIndex: 0,
    effects: [],
    battleLog: [],
    snapshots: [],
    previousFinalDamage: 0,
  };
}

// ── Mock Room List ──

export interface MockRoomListItem {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  gameMode: GameMode;
  canJoin: boolean;
}

export function createMockRoomList(): MockRoomListItem[] {
  return [
    { roomId: 'ABCD12', hostName: '老玩家', playerCount: 1, maxPlayers: 2, gameMode: 'classic', canJoin: true },
    { roomId: 'EFGH34', hostName: '新手导师', playerCount: 2, maxPlayers: 4, gameMode: 'duo_2v2', canJoin: false },
    { roomId: 'IJKL56', hostName: '肉鸽达人', playerCount: 1, maxPlayers: 1, gameMode: 'pve_roguelite', canJoin: true },
  ];
}

// ── Mock Route Map ──

export function createMockRouteMap(stage: number): RouteMapVM {
  const nodeTypes = ['battle', 'elite', 'shop', 'event', 'rest', 'boss'] as const;
  const typeLabels: Record<string, string> = {
    battle: '⚔️ 战斗', elite: '💀 精英', shop: '🏪 商店',
    event: '❓ 事件', rest: '🔥 篝火', boss: '👹 Boss',
  };

  const clearedNode: RouteNodeVM | null = stage > 1 ? {
    id: `node_${stage - 1}_cleared`,
    stage: stage - 1,
    type: stage === 2 ? 'battle' : nodeTypes[(stage - 2) % nodeTypes.length],
    typeLabel: typeLabels[nodeTypes[(stage - 2) % nodeTypes.length]],
    icon: '✦',
    description: `第 ${stage - 1} 层已完成`,
  } : null;

  const availableCount = stage === 1 ? 2 : (stage % 3 === 0 ? 3 : 2);
  const availableNodes: RouteNodeVM[] = [];
  for (let i = 0; i < availableCount; i++) {
    const nodeType = nodeTypes[(stage + i) % nodeTypes.length];
    availableNodes.push({
      id: `node_${stage}_avail_${i}`,
      stage,
      type: nodeType,
      typeLabel: typeLabels[nodeType],
      icon: nodeType === 'battle' ? '⚔️' : nodeType === 'shop' ? '🏪' : nodeType === 'boss' ? '👹' : '❓',
      description: `${typeLabels[nodeType]} — 难度 ${stage}`,
    });
  }

  const previewCount = stage % 2 === 0 ? 2 : 3;
  const previewNodes: RouteNodeVM[] = [];
  for (let i = 0; i < previewCount; i++) {
    const nextStage = stage + 1;
    const nodeType = nodeTypes[(nextStage + i) % nodeTypes.length];
    previewNodes.push({
      id: `node_${nextStage}_prev_${i}`,
      stage: nextStage,
      type: nodeType,
      typeLabel: typeLabels[nodeType],
      icon: '👁',
      description: `${typeLabels[nodeType]} — 预览`,
    });
  }

  return { stage, clearedNode, availableNodes, previewNodes };
}

// ── Mock Roguelite Rewards ──

export function createMockRewards(stage: number): RogueliteRewardOptionVM[] {
  const rewards: RogueliteRewardOptionVM[] = [
    {
      id: `reward_${stage}_atk`,
      name: '力量之戒',
      description: '永久获得 +3 攻击力',
      rarity: 'common',
      tags: ['攻击', '永久'],
      icon: '⚔️',
    },
    {
      id: `reward_${stage}_hp`,
      name: '生命护符',
      description: '最大生命值 +5，恢复 5 HP',
      rarity: 'rare',
      tags: ['生命', '恢复'],
      icon: '❤️',
    },
    {
      id: `reward_${stage}_epic`,
      name: '凤凰羽毛',
      description: '每回合开始时恢复 2 HP',
      rarity: 'epic',
      tags: ['回复', '被动'],
      icon: '🪶',
    },
  ];

  // Every 3rd stage offers a legendary option
  if (stage % 3 === 0) {
    rewards.push({
      id: `reward_${stage}_legendary`,
      name: '龙之心脏',
      description: '攻击力 +8，HP +10，获得护盾',
      rarity: 'legendary',
      tags: ['全能', '永久'],
      icon: '🐉',
    });
  }

  return rewards;
}

// ── Mock Roguelite State ──

export function createMockRogueliteState(stage: number = 1) {
  return {
    stage,
    maxStage: 15,
    gold: 10 + stage * 3,
    hp: 25 + stage,
    maxHp: 30 + stage * 2,
    buffs: stage > 1 ? ['攻击力 +3', '护盾 +1'] : [],
    routeMap: createMockRouteMap(stage),
    rewards: createMockRewards(stage),
  };
}

// ── Mock Characters ──

export interface MockCharacterInfo {
  id: CharacterId;
  name: string;
  hp: number;
  role: string;
  description: string;
  difficulty: string;
}

export function createMockCharacterList(): MockCharacterInfo[] {
  return [
    { id: 'assassin' as CharacterId, name: '刺客', hp: 24, role: '攻击', description: '高速连击，闪避反击', difficulty: '普通' },
    { id: 'berserker' as CharacterId, name: '狂战士', hp: 35, role: '攻击', description: '越战越勇，血量越低伤害越高', difficulty: '简单' },
    { id: 'bomber' as CharacterId, name: '爆破手', hp: 26, role: '爆发', description: '范围伤害，自爆攻击', difficulty: '复杂' },
    { id: 'boxer' as CharacterId, name: '拳师', hp: 28, role: '攻击', description: '连击格斗，破防专家', difficulty: '普通' },
    { id: 'crescent' as CharacterId, name: '新月', hp: 22, role: '特殊', description: '月光之力，治疗与伤害兼备', difficulty: '复杂' },
    { id: 'flame_lord' as CharacterId, name: '炎帝', hp: 30, role: '爆发', description: '火焰主宰，高伤害AOE', difficulty: '普通' },
    { id: 'gunner' as CharacterId, name: '枪手', hp: 25, role: '攻击', description: '远程射击，精准打击', difficulty: '简单' },
    { id: 'mountain_shield' as CharacterId, name: '山盾', hp: 40, role: '防御', description: '坚不可摧，守护队友', difficulty: '简单' },
    { id: 'paladin' as CharacterId, name: '圣骑士', hp: 32, role: '防御', description: '神圣守护，治疗与护盾', difficulty: '普通' },
    { id: 'stone_titan' as CharacterId, name: '石巨人', hp: 45, role: '防御', description: '磐石之躯，超高血量', difficulty: '简单' },
    { id: 'vampire' as CharacterId, name: '吸血鬼', hp: 26, role: '特殊', description: '吸血回复，诅咒敌人', difficulty: '复杂' },
    { id: 'war_knight' as CharacterId, name: '战骑', hp: 33, role: '防御', description: '冲锋陷阵，攻守兼备', difficulty: '普通' },
    { id: 'zhao_yun' as CharacterId, name: '赵云', hp: 30, role: '攻击', description: '龙胆突进，七进七出', difficulty: '专家' },
  ];
}

// ── Mock Summoner Skills ──

export interface MockSkillInfo {
  id: SummonerSkillId;
  name: string;
  description: string;
  cooldown: number;
}

export function createMockSkillList(): MockSkillInfo[] {
  return [
    { id: 'heal' as SummonerSkillId, name: '治疗术', description: '恢复 8 HP', cooldown: 3 },
    { id: 'fireball' as SummonerSkillId, name: '火球术', description: '造成 10 点伤害', cooldown: 2 },
    { id: 'shield' as SummonerSkillId, name: '护盾术', description: '获得 5 点护盾', cooldown: 3 },
    { id: 'haste' as SummonerSkillId, name: '加速术', description: '本回合额外行动一次', cooldown: 4 },
  ];
}

// ── Demo Mode Helpers ──

/**
 * Check if we can show demo content.
 * Returns true if no real room is active (offline or unconnected).
 */
export function isDemoMode(room: Room | null): boolean {
  return !room || !room.id || room.players.length === 0;
}

/**
 * Get a demo room for the given mode and phase.
 * Cached after first creation to simulate persistent state.
 */
const demoRoomCache = new Map<string, Room>();

export function getDemoRoom(gameMode: GameMode = 'classic', phase: RoomPhase = 'lobby'): Room {
  const key = `${gameMode}_${phase}`;
  if (!demoRoomCache.has(key)) {
    demoRoomCache.set(key, createMockRoom(gameMode, phase, gameMode === 'duo_2v2' ? 4 : 2));
  }
  return demoRoomCache.get(key)!;
}
