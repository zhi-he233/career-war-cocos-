import type { RogueliteReward, RogueliteRewardType } from "../types";
import {
  GENERATED_ROGUELITE_BOSS_ABILITY_REWARDS,
  GENERATED_ROGUELITE_BOSSES,
  GENERATED_ROGUELITE_CHARACTER_SKILL_REWARDS,
  GENERATED_ROGUELITE_ENEMIES,
  GENERATED_ROGUELITE_GROWTH_REWARDS,
  GENERATED_ROGUELITE_STARTER_REWARDS,
} from "./rogueliteBalance.generated";

export type RogueliteStageType = "normal" | "elite" | "boss";
export type RogueliteRewardDraft = Omit<RogueliteReward, "id">;

export type RogueliteEnemyId =
  | "normal"
  | "normal_gambler"
  | "normal_shield_breaker"
  | "normal_armor_piercer"
  | "elite_iron_skin"
  | "elite_berserker"
  | "elite_reaper"
  | "elite_armor_piercing";

export type RogueliteBossId =
  | "boss_boxer_king"
  | "boss_blood_demon"
  | "boss_shield_guard"
  | "boss_god_berserker"
  | "boss_gambler_dealer";

export type RogueliteMechanicId =
  | "fatigue"
  | "stage_scaling"
  | "reward_rhythm"
  | "boss_fixed_hp";

export type RogueliteRewardCategory =
  | "starter"
  | "growth"
  | "character_skill"
  | "boss_ability";

export interface UnsupportedRogueliteRewardDraft {
  type: string;
  name: string;
  category: RogueliteRewardCategory;
  value: number;
  tag?: string;
  maxStacks?: number;
  description: string;
  reason: string;
}

export interface UnsupportedRogueliteBossDraft {
  id: string;
  name: string;
  baseHp: number;
  baseShield: number;
  description: string;
  reason: string;
}

export interface RogueliteEnemyBalance {
  id: RogueliteEnemyId;
  name: string;
  enemyTemplateId: string;
  displayName: string;
  enemyKind: "monster" | "duelist";
  spriteKey?: string;
  portraitKey?: string;
  baseCharacterId?: string;
  stageType: Exclude<RogueliteStageType, "boss">;
  hpBonus: number;
  shieldBonus: number;
  damageBonus: number;
  skills: readonly string[];
  description: string;
}

export interface RogueliteBossBalance {
  id: RogueliteBossId;
  name: string;
  enemyTemplateId: string;
  displayName: string;
  enemyKind: "boss";
  spriteKey?: string;
  portraitKey?: string;
  baseCharacterId?: string;
  stageType: "boss";
  baseHp: number;
  fixedHp?: number;
  baseShield: number;
  skills: readonly string[];
  description: string;
}

export interface RogueliteEarlyStageBalance {
  stage: number;
  enemyId?: RogueliteEnemyId;
  bossPool?: readonly RogueliteBossId[];
  hp: number | "boss_config";
  shield: number | "boss_config";
  description: string;
}

export interface RogueliteStageScalingBalance {
  bossInterval: number;
  earlyStages: readonly RogueliteEarlyStageBalance[];
  stage4To6: Readonly<Partial<Record<number, { hpBonus: number; shieldBonus: number }>>>;
  stage7Plus: {
    hpBonusFormula: string;
    hpBonusPerStage: number;
    shieldBonusFormula: string;
    shieldStageDivisor: number;
    shieldBonusPerStep: number;
    bossExtraHp: number;
    bossExtraShield: number;
    eliteExtraHp: number;
    eliteExtraShield: number;
  };
}

export interface RogueliteRewardRhythmBalance {
  stage: string;
  title: string;
  rewardTypes: readonly RogueliteRewardType[];
  notes: string;
}

export interface RogueliteFatigueBalance {
  startsAtRound: number;
  normalRounds: string;
  formula: string;
  affects: string;
}

export const ROGUELITE_MAX_STAGE = 15;

export const ROGUELITE_PLAYER_START = {
  characterId: "boxer",
  summonerSkill: "disabled",
} as const;

export const ROGUELITE_BOT_BASE = {
  characterId: "boxer",
  controllerId: "bot",
} as const;

export const ROGUELITE_FATIGUE = {
  startsAtRound: 9,
  normalRounds: "1-8",
  formula: "Math.max(0, Math.floor((round - 7) / 2))",
  affects: "direct_attack_damage_only",
} as const satisfies RogueliteFatigueBalance;

export const ROGUELITE_STAGE_SCALING = {
  bossInterval: 6,
  earlyStages: [
    {
      stage: 1,
      enemyId: "normal",
      hp: 12,
      shield: 0,
      description: "训练敌人",
    },
    {
      stage: 2,
      enemyId: "normal",
      hp: 12,
      shield: 0,
      description: "普通敌人",
    },
  ],
  stage4To6: {
    4: { hpBonus: 10, shieldBonus: 2 },
    5: { hpBonus: 12, shieldBonus: 4 },
    6: { hpBonus: 15, shieldBonus: 6 },
  },
  stage7Plus: {
    hpBonusFormula: "stage * 5",
    hpBonusPerStage: 5,
    shieldBonusFormula: "Math.floor(stage / 2) * 2",
    shieldStageDivisor: 2,
    shieldBonusPerStep: 2,
    bossExtraHp: 10,
    bossExtraShield: 4,
    eliteExtraHp: 3,
    eliteExtraShield: 2,
  },
} as const satisfies RogueliteStageScalingBalance;

export const ROGUELITE_ENEMIES = GENERATED_ROGUELITE_ENEMIES;
export const ROGUELITE_BOSSES = GENERATED_ROGUELITE_BOSSES;
export const ROGUELITE_GROWTH_REWARDS = GENERATED_ROGUELITE_GROWTH_REWARDS;
export const ROGUELITE_CHARACTER_SKILL_REWARDS = GENERATED_ROGUELITE_CHARACTER_SKILL_REWARDS;
export const ROGUELITE_BOSS_ABILITY_REWARDS = GENERATED_ROGUELITE_BOSS_ABILITY_REWARDS;
export const ROGUELITE_STARTER_REWARDS = GENERATED_ROGUELITE_STARTER_REWARDS;

export const UNSUPPORTED_ROGUELITE_REWARD_TYPES = [] as const;
export const ROGUELITE_UNSUPPORTED_ENABLED_REWARDS = [] as const satisfies readonly UnsupportedRogueliteRewardDraft[];
export const UNSUPPORTED_ROGUELITE_BOSS_IDS = [] as const;
export const ROGUELITE_UNSUPPORTED_ENABLED_BOSSES = [] as const satisfies readonly UnsupportedRogueliteBossDraft[];

export const ROGUELITE_REWARD_RHYTHM = [
  {
    stage: "1",
    title: "基础奖励",
    rewardTypes: ["vitality_boost", "shield_wall", "heavy_punch_training", "iron_body", "breathing_recovery", "guard_training"],
    notes: "第 1 关胜利后给基础生存或伤害奖励。",
  },
  {
    stage: "2",
    title: "流派启动",
    rewardTypes: ["low_roll_defense", "shield_strike", "fate_tokens", "low_roll_charge", "low_hp_armor", "comeback", "first_strike"],
    notes: "第 2 关胜利后尽量来自不同 tag。",
  },
  {
    stage: "3",
    title: "核心技能",
    rewardTypes: ["shield_overload", "sturdy_bulwark", "lucky_floor", "drink_blood"],
    notes: "第 3 关 Boss 胜利后给关键技能。",
  },
  {
    stage: "4-6",
    title: "流派强化",
    rewardTypes: [],
    notes: "根据玩家已有 tag 略微提高同流派奖励出现概率。",
  },
  {
    stage: "15",
    title: "Boss 能力",
    rewardTypes: ["berserker_blood", "vampire_instinct", "dragon_courage"],
    notes: "第 15 关大 Boss 后给质变能力。",
  },
] as const satisfies readonly RogueliteRewardRhythmBalance[];

export const ROGUELITE_BALANCE_MECHANICS = {
  fatigue: ROGUELITE_FATIGUE,
  stageScaling: ROGUELITE_STAGE_SCALING,
  normalEnemyRotationStartsAtStage: 7,
  normalEnemyRotation: ["normal", "normal_gambler", "normal_shield_breaker", "normal_armor_piercer"],
  normalGamblerFallbackStartsAtStage: 4,
  normalGamblerFallbackModulo: 4,
  eliteStartsAtStage: 5,
  eliteStageRule: "cycleStage === 5 && stage >= 5",
  eliteEarlyPool: ["elite_iron_skin", "elite_berserker"],
  eliteLatePoolStartsAtStage: 10,
  eliteLatePool: ["elite_iron_skin", "elite_berserker", "elite_reaper", "elite_armor_piercing"],
  bossStageRule: "cycleStage === 6 || cycleStage === 15",
  bossAbilityRewardStage: 15,
} as const;

export const ROGUELITE_REWARD_TABLES: Record<RogueliteRewardCategory, readonly RogueliteRewardDraft[]> = {
  starter: ROGUELITE_STARTER_REWARDS,
  growth: ROGUELITE_GROWTH_REWARDS,
  character_skill: ROGUELITE_CHARACTER_SKILL_REWARDS,
  boss_ability: ROGUELITE_BOSS_ABILITY_REWARDS,
};

export const rogueliteBalance = {
  maxStage: ROGUELITE_MAX_STAGE,
  playerStart: ROGUELITE_PLAYER_START,
  botBase: ROGUELITE_BOT_BASE,
  stageScaling: ROGUELITE_STAGE_SCALING,
  enemies: ROGUELITE_ENEMIES,
  bosses: ROGUELITE_BOSSES,
  rewardTables: ROGUELITE_REWARD_TABLES,
  rewardRhythm: ROGUELITE_REWARD_RHYTHM,
  mechanics: ROGUELITE_BALANCE_MECHANICS,
} as const;
