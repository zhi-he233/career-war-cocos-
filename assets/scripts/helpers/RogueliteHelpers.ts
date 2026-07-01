/**
 * RogueliteHelpers — pure functions that convert raw Room/Player state into
 * roguelite display data. Ported from Vue client's useRogueliteViewModels.
 *
 * No socket calls, no Cocos Component dependencies. Designed to be imported
 * by RogueliteScene or any roguelite UI component.
 */

import {
  ROGUELITE_BOSSES,
  ROGUELITE_ENEMIES,
  ROGUELITE_GROWTH_REWARDS,
  ROGUELITE_CHARACTER_SKILL_REWARDS,
  ROGUELITE_BOSS_ABILITY_REWARDS,
  ROGUELITE_STARTER_REWARDS,
  ROGUELITE_STAGE_SCALING,
} from '../shared/data/rogueliteBalance';
import type { Player, Room, RogueliteReward } from '../shared/types';
import type {
  RoguelitePanelVM,
  RogueliteBossStateChip,
  RoguelitePerkVM,
  RogueliteRewardOptionVM,
} from '../models/ViewModels';

// ── Reward classification sets ──

const ROGUELITE_GROWTH_DISPLAY_DRAFTS = [
  ...ROGUELITE_GROWTH_REWARDS,
  ...ROGUELITE_STARTER_REWARDS,
];
const GROWTH_REWARD_TYPES = new Set(ROGUELITE_GROWTH_DISPLAY_DRAFTS.map(r => r.type));
const BOSS_REWARD_TYPES = new Set(ROGUELITE_BOSS_ABILITY_REWARDS.map(r => r.type));
const SKILL_REWARD_TYPES = new Set(ROGUELITE_CHARACTER_SKILL_REWARDS.map(r => r.type));

// ── Perk/Skill display lookup tables ──

interface PerkDisplay { name: string; category: 'growth' | 'boss'; perLevelDesc: string }
interface SkillDisplay { name: string; perLevelDesc: string }

function createPerkDisplay(): Record<string, PerkDisplay> {
  const result: Record<string, PerkDisplay> = {};
  for (const r of ROGUELITE_GROWTH_DISPLAY_DRAFTS) result[r.type] = { name: r.name, category: 'growth', perLevelDesc: r.description };
  for (const r of ROGUELITE_BOSS_ABILITY_REWARDS) result[r.type] = { name: r.name, category: 'boss', perLevelDesc: r.description };
  return result;
}

function createSkillDisplay(): Record<string, SkillDisplay> {
  const result: Record<string, SkillDisplay> = {};
  for (const r of ROGUELITE_CHARACTER_SKILL_REWARDS) result[r.type] = { name: r.name, perLevelDesc: r.description };
  return result;
}

const PERK_DISPLAY = createPerkDisplay();
const SKILL_DISPLAY = createSkillDisplay();

// ── Enemy / Boss helpers ──

export function rogueliteEnemyMechanicSkills(id: string): string[] {
  const boss = ROGUELITE_BOSSES.find(b => b.id === id);
  if (boss) return [...boss.skills];
  const enemy = ROGUELITE_ENEMIES.find(e => e.id === id);
  if (!enemy || enemy.id === 'normal') return [];
  return [...enemy.skills];
}

export function rogueliteEnemyTypeLabel(player: Player | undefined): string {
  if (!player) return 'Enemy';
  const t = player.rogueliteEnemyInfo?.stageType;
  if (t === 'boss') return 'Boss';
  if (t === 'elite') return 'Elite';
  if (t === 'normal') return 'Minion';
  return 'Enemy';
}

export function rogueliteStageType(stage: number): 'normal' | 'elite' | 'boss' {
  if (stage % ROGUELITE_STAGE_SCALING.bossInterval === 0) return 'boss';
  if (stage % ROGUELITE_STAGE_SCALING.bossInterval === 2 && stage >= 5) return 'elite';
  return 'normal';
}

export function rogueliteStageTypeLabel(stage: number): string {
  const t = rogueliteStageType(stage);
  if (t === 'boss') return 'Boss';
  if (t === 'elite') return 'Elite';
  return 'Normal';
}

// ── Reward type classification ──

export function isBossRewardType(type: string): boolean { return BOSS_REWARD_TYPES.has(type); }
export function isGrowthRewardType(type: string): boolean { return GROWTH_REWARD_TYPES.has(type); }
export function isSkillRewardType(type: string): boolean { return SKILL_REWARD_TYPES.has(type); }

export function rogueliteRewardRarity(type: string): RogueliteRewardOptionVM['rarity'] {
  if (isBossRewardType(type)) return 'legendary';
  if (isSkillRewardType(type)) return 'epic';
  if (type.startsWith('starter_')) return 'rare';
  return 'common';
}

export function rogueliteRewardTags(type: string): string[] {
  if (isBossRewardType(type)) return ['Boss', 'Endgame'];
  if (isSkillRewardType(type)) return ['Skill', 'Build'];
  if (type.startsWith('starter_')) return ['Starter', 'Core'];
  if (isGrowthRewardType(type)) return ['Growth', 'Boost'];
  return ['Loot'];
}

export function rogueliteRewardIcon(type: string): string {
  if (isBossRewardType(type)) return 'boss';
  if (isSkillRewardType(type)) return 'skill';
  if (type.startsWith('starter_')) return 'starter';
  if (isGrowthRewardType(type)) return 'growth';
  return 'reward';
}

// ── Alert text ──

export function getRogueliteAlertText(msg: string): string | null {
  if (msg.includes('战后恢复至满血')) return 'Full Heal!';
  if (msg.includes('战后恢复')) return 'Post-Battle Heal!';
  if (msg.includes('Boss 出现')) return 'Boss Appears!';
  if (msg.includes('蓄力重拳')) return 'Heavy Punch!';
  if (msg.includes('进入狂暴')) return 'Berserk!';
  if (msg.includes('凝聚血盾')) return 'Blood Shield!';
  if (msg.includes('发动血祭')) return 'Blood Rite!';
  if (msg.includes('吸取生命')) return 'Life Drain!';
  if (msg.includes('架起巨盾')) return 'Guard Up!';
  if (msg.includes('盾击反击')) return 'Shield Counter!';
  if (msg.includes('狂怒之血')) return 'Fury Blood!';
  if (msg.includes('龙胆之力')) return 'Dragon Courage!';
  if (msg.includes('枪手') && msg.includes('三倍')) return 'Triple Shot!';
  if (msg.includes('血祭回复')) return 'Blood Rite Heal!';
  if (msg.includes('自爆')) return 'Self-Destruct!';
  if (msg.includes('处决')) return 'Execute!';
  if (msg.includes('碾压')) return 'Crush!';
  if (msg.includes('开始蓄力')) return 'Charging!';
  if (msg.includes('生命阈值')) return 'HP Threshold!';
  if (msg.includes('濒死不倒')) return 'Last Stand!';
  if (msg.includes('燃尽最后生命')) return 'God Berserker Falls!';
  if (msg.includes('狂战增伤')) return 'Berserker Damage Up!';
  return null;
}

// ── ViewModel builders ──

export function getRoguelitePerkList(
  player: Player | undefined,
): { growth: RoguelitePerkVM[]; skills: RoguelitePerkVM[]; boss: RoguelitePerkVM[] } {
  const stacks = player?.roguelitePerkStacks ?? {};
  const skillStacks = player?.rogueliteSkillStacks ?? {};
  return {
    growth: Object.entries(stacks)
      .filter(([id]) => PERK_DISPLAY[id]?.category === 'growth')
      .map(([id, lv]) => ({ id, name: PERK_DISPLAY[id]!.name, level: lv, description: PERK_DISPLAY[id]!.perLevelDesc, category: 'growth' as const }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    skills: Object.entries(skillStacks)
      .filter(([id]) => SKILL_DISPLAY[id])
      .map(([id, lv]) => ({ id, name: SKILL_DISPLAY[id]!.name, level: lv, description: SKILL_DISPLAY[id]!.perLevelDesc, category: 'skill' as const }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    boss: Object.entries(stacks)
      .filter(([id]) => PERK_DISPLAY[id]?.category === 'boss')
      .map(([id, lv]) => ({ id, name: PERK_DISPLAY[id]!.name, level: lv, description: PERK_DISPLAY[id]!.perLevelDesc, category: 'boss' as const }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function getRogueliteBossStateChips(player: Player | undefined): RogueliteBossStateChip[] {
  if (!player?.rogueliteBossState) return [];
  const s = player.rogueliteBossState;
  const chips: RogueliteBossStateChip[] = [];
  if ((s.charge as number) > 0) chips.push({ key: 'charge', text: `Charge: ${s.charge}`, kind: 'normal' });
  if (s.enraged) chips.push({ key: 'enraged', text: 'Berserk', kind: 'enraged' });
  if (s.guarding) chips.push({ key: 'guarding', text: 'Guarding', kind: 'guarding' });
  if (s.bloodSacrificeUsed) chips.push({ key: 'blood', text: 'Blood Rite Used', kind: 'normal' });
  if (player.rogueliteBossId === 'boss_god_berserker') {
    chips.push({ key: 't15', text: s.t15 ? 'HP>15' : 'HP<15', kind: s.t15 ? 'normal' : 'broken' });
    chips.push({ key: 't10', text: s.t10 ? 'HP>10' : 'HP<10', kind: s.t10 ? 'normal' : 'broken' });
    chips.push({ key: 't5',  text: s.t5  ? 'HP>5'  : 'HP<5',  kind: s.t5  ? 'normal' : 'broken' });
    chips.push({ key: 't1',  text: s.t1  ? 'HP>1'  : 'HP<1',  kind: s.t1  ? 'normal' : 'broken' });
    if (s.dyingAfterAttack) chips.push({ key: 'dying', text: 'Dying Attack!', kind: 'enraged' });
  }
  return chips;
}

export function getRogueliteBossSkills(player: Player | undefined): string[] {
  if (!player) return [];
  if (player.rogueliteEnemyInfo?.skillNames?.length) return player.rogueliteEnemyInfo.skillNames;
  if (!player.rogueliteBossId) return [];
  return rogueliteEnemyMechanicSkills(player.rogueliteBossId);
}

export function getRogueliteResources(
  player: Player | undefined,
): RoguelitePanelVM['resources'] {
  if (!player) return undefined;
  const res: NonNullable<RoguelitePanelVM['resources']> = {};
  if (player.roguelitePerkStacks?.['fate_tokens']) res.fateTokens = { current: player.rogueliteFateTokens ?? 0, max: 3 };
  if (player.roguelitePerkStacks?.['low_roll_charge']) res.lowRollCharge = player.rogueliteLowRollCharge ?? 0;
  if (player.roguelitePerkStacks?.['lucky_floor']) res.consecutiveLowRolls = { current: player.rogueliteConsecutiveLowRolls ?? 0, max: 2 };
  if (player.roguelitePerkStacks?.['shield_overload']) res.shieldOverloadUsed = player.rogueliteShieldOverloadUsed ?? false;
  return Object.keys(res).length > 0 ? res : undefined;
}

export function buildRogueliteRewardOption(reward: RogueliteReward): RogueliteRewardOptionVM {
  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    rarity: rogueliteRewardRarity(reward.type),
    tags: rogueliteRewardTags(reward.type),
    icon: rogueliteRewardIcon(reward.type),
  };
}

// ── Main RoguelitePanelVM builder ──

export function buildRoguelitePanelVM(
  room: Room,
  playerId: string,
): RoguelitePanelVM {
  const run = room.roguelite;
  const stage = run?.stage ?? 1;
  const isRoguelite = room.gameMode === 'pve_roguelite';
  const me = room.players.find(p => p.id === playerId || p.clientId === playerId);
  const bot = room.players.find(p => p.isBot);
  const isBoss = rogueliteStageType(stage) === 'boss';

  const vm: RoguelitePanelVM = {
    enabled: isRoguelite,
    stage,
    round: Math.floor((stage - 1) / 3) + 1,
    stageType: rogueliteStageType(stage),
    stageTypeLabel: rogueliteStageTypeLabel(stage),
    phaseText: getRoguelitePhaseText(room, playerId),
    perks: getRoguelitePerkList(me),
  };

  // Fatigue
  if (room.phase === 'battle' && run) {
    vm.fatigue = { battleRound: run.battleRound ?? 1, bonus: run.fatigueBonus ?? 0 };
  }

  // Boss
  if (bot?.rogueliteEnemyInfo?.stageType === 'boss' || bot?.rogueliteBossId) {
    vm.boss = {
      name: bot.nickname,
      typeLabel: rogueliteEnemyTypeLabel(bot),
      hp: bot.hp,
      maxHp: bot.maxHp,
      shield: bot.shield,
      skills: getRogueliteBossSkills(bot),
      stateChips: getRogueliteBossStateChips(bot),
    };
  } else if (bot && room.phase === 'battle') {
    const info = bot.rogueliteEnemyInfo;
    vm.enemy = {
      name: bot.nickname,
      typeLabel: rogueliteEnemyTypeLabel(bot),
      hpBonus: info?.hpBonus ?? 0,
      shieldBonus: info?.shieldBonus ?? 0,
      damageBonus: info?.damageBonus ?? 0,
      description: info?.description,
      skills: info?.skillNames ?? [],
    };
  }

  // Resources
  vm.resources = getRogueliteResources(me);

  // Enemy traits
  if (room.phase === 'battle' && bot) {
    const traits = bot.rogueliteEnemyInfo?.skillNames?.filter(Boolean) ?? [];
    if (traits.length === 0 && bot.rogueliteBossId) {
      vm.enemyTraits = rogueliteEnemyMechanicSkills(bot.rogueliteBossId).filter(Boolean);
    } else if (traits.length > 0) {
      vm.enemyTraits = traits;
    }
  }

  // Reward phase
  if (room.phase === 'reward' && run?.rewardChoices?.length) {
    vm.rewardPhase = {
      title: isBoss ? 'Choose Boss Ability' : 'Choose Reward',
      hint: isBoss ? 'Pick 1 boss ability to complete the run' : 'Pick 1 reward to continue',
      options: run.rewardChoices.map(r => buildRogueliteRewardOption(r)),
    };
  }

  // Continue phase
  if (room.phase === 'roguelite_continue') {
    vm.continuePhase = {
      hint: `Stage ${stage} cleared! Finish or continue.`,
      nextStage: stage,
    };
  }

  return vm;
}

function getRoguelitePhaseText(room: Room, playerId: string): string {
  if (room.phase === 'reward') return 'Choose Reward';
  if (room.phase === 'roguelite_continue') return 'Finish or Continue';
  if (room.phase === 'roguelite_event') return 'Event';
  if (room.phase === 'roguelite_shop') return 'Shop';
  if (room.phase === 'roguelite_rest') return 'Rest';
  if (room.phase === 'gameOver') {
    if (room.gameMode === 'duo_2v2' && room.winnerTeamId) return `${room.winnerTeamId} Team Wins`;
    return room.winnerId === playerId ? 'Victory' : 'Defeat';
  }
  return 'In Battle';
}
