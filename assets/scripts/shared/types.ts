import type { RogueliteMapNodeSelection } from "./data/rogueliteRoomTypes";

export type CharacterId = string;

export type RoomPhase = "lobby" | "battle" | "reward" | "roguelite_event" | "roguelite_shop" | "roguelite_rest" | "roguelite_continue" | "gameOver";
export type RoomListStatus = "waiting" | "playing" | "ended";
export type GameMode = "classic" | "duo_2v2" | "pve_1v1" | "pve_roguelite";
export type TeamId = "A" | "B";
export type CharacterDifficulty = "simple" | "normal" | "complex" | "expert";
export type CharacterRole = "attack" | "defense" | "healing" | "burst" | "special";

export const EMOTE_IDS = ["cry", "surprise", "taunt", "angry", "like", "question"] as const;
export type EmoteId = (typeof EMOTE_IDS)[number];

export interface Character {
  id: CharacterId;
  name: string;
  title?: string;
  maxHp: number;
  description: string[];
  difficulty?: CharacterDifficulty;
  role?: CharacterRole;
  tags?: string[];
  shortDescription?: string;
  fullDescription?: string[];
  isImplemented?: boolean;
  isHidden?: boolean;
  avatarUrl?: string;
  spriteUrl?: string;
  availability?: {
    classic: boolean;
    duo: boolean;
    pve: boolean;
    roguelite: boolean;
    hidden?: boolean;
  };
  implementation?: {
    mode: "data_driven" | "code_driven";
    handlerId?: string;
  };
  diceFaces?: Array<{
    roll: 1 | 2 | 3 | 4 | 5 | 6;
    name: string;
    description: string;
    presetId?: string;
    params?: Record<string, unknown>;
  }>;
  sortOrder?: number;
}

export interface Effect {
  id: string;
  type: "invincible";
  sourcePlayerId: string;
  expiresAtSourceTurnStartPlayerId: string;
}

export interface Player {
  id: string;
  clientId: string;
  userId?: string;
  nickname: string;
  isHost: boolean;
  isOnline: boolean;
  isBot?: boolean;
  characterId?: CharacterId;
  summonerSkillId?: SummonerSkillId;
  characterSelected?: boolean;
  summonerSkillSelected?: boolean;
  summonerSkillCooldown?: number;
  hp: number;
  maxHp: number;
  shield: number;
  rogueliteSummonerCooldownReduction?: number;
  rogueliteSkillStacks?: Record<string, number>;
  rogueliteBossAbilities?: RogueliteRewardType[];
  roguelitePerkStacks?: Record<string, number>;
  rogueliteBossId?: string;
  rogueliteBossState?: Record<string, number | boolean>;
  rogueliteEnemyInfo?: {
    stageType: "normal" | "elite" | "boss";
    enemyTemplateId?: string;
    displayName?: string;
    enemyKind?: "monster" | "duelist" | "boss";
    spriteKey?: string;
    portraitKey?: string;
    baseCharacterId?: string;
    hpBonus: number;
    shieldBonus: number;
    damageBonus: number;
    skillNames?: string[];
    description?: string;
  };
  rogueliteStageStartHeal?: number;
  rogueliteDamageBonus?: number;
  rogueliteArmorBonus?: number;
  rogueliteStartShield?: number;
  roguelitePostBattleHealBonus?: number;
  roguelitePassiveIds?: string[];
  rogueliteFirstStrikeUsed?: boolean;
  rogueliteLowHpArmor?: number;
  rogueliteKillHeal?: number;
  rogueliteComebackDamage?: number;
  rogueliteFateTokens?: number;
  rogueliteLowRollCharge?: number;
  rogueliteConsecutiveLowRolls?: number;
  rogueliteShieldOverloadUsed?: boolean;
  rogueliteShieldStrikeBonus?: number;
  rogueliteLowRollDefenseShield?: number;
  zhaoZilongHitCount?: number;
  flameMarks?: number;
  guarding?: boolean;
  isDead: boolean;
  selectedTargetId?: string;
  controllerId?: string;
  teamId?: TeamId;
  slotIndex?: 0 | 1;
}

export interface GameEvent {
  id: string;
  createdAt: number;
  type:
    | "system"
    | "chooseCharacter"
    | "startGame"
    | "turn"
    | "roll"
    | "guardCheck"
    | "skill"
    | "damage"
    | "heal"
    | "death"
    | "victory";
  message: string;
  playerId?: string;
  targetId?: string;
  dice?: number[];
  damage?: number;
  healing?: number;
}

export interface PlayerEmoteEvent {
  roomId: string;
  playerId: string;
  emoteId: EmoteId;
  createdAt: number;
}

export type CharacterHighlightType = "big_damage" | "big_heal" | "streak";

export interface CharacterHighlight {
  id: string;
  type: CharacterHighlightType;
  title: string;
  valueText?: string;
  actorId: string;
  rollId?: string;
}

export interface SkillHint {
  id: string;
  actorId: string;
  text: string;
  valueText?: string;
  rollId?: string;
}

export interface DuoCharacterSlot {
  controllerId: string;
  teamId: TeamId;
  slotIndex: 0 | 1;
  characterId?: CharacterId;
  summonerSkillId?: SummonerSkillId;
  characterSelected?: boolean;
  summonerSkillSelected?: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  allowDuplicateCharacters: boolean;
  gameMode?: GameMode;
}

export type RogueliteRewardType =
  | "starter_heavy_punch"
  | "starter_blood_punch"
  | "starter_iron_wall"
  | "starter_recovery"
  | "heavy_punch_training"
  | "iron_body"
  | "breathing_recovery"
  | "blood_punch"
  | "battle_instinct"
  | "guard_training"
  | "gunner_triple_shot"
  | "vampire_skill"
  | "zhaoyun_pierce"
  | "flame_lord_mark"
  | "berserker_blood"
  | "vampire_instinct"
  | "dragon_courage"
  | "vitality_boost"
  | "shield_wall"
  | "first_strike"
  | "low_hp_armor"
  | "kill_heal"
  | "drink_blood"
  | "comeback"
  | "low_roll_defense"
  | "shield_strike"
  | "shield_overload"
  | "sturdy_bulwark"
  | "fate_tokens"
  | "low_roll_charge"
  | "desperate_reroll"
  | "lucky_floor";

export interface RogueliteReward {
  id: string;
  name: string;
  description: string;
  type: RogueliteRewardType;
  value: number;
  tag?: "shield" | "dice" | "low_hp" | "burst" | "heal" | "armor" | "status";
  maxStacks?: number;
}

export type RogueliteEventChoiceId = "a" | "b";

export interface RogueliteEventChoice {
  id: RogueliteEventChoiceId;
  label: string;
  effect: string;
  cost: string;
}

export interface RoguelitePendingEvent {
  id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare";
  stage: "early" | "mid" | "late" | "any";
  description: string;
  choices: readonly RogueliteEventChoice[];
}

export interface RogueliteRunState {
  stage: number;
  maxStage: number;
  currentMapNode?: RogueliteMapNodeSelection;
  mapRoute?: Record<number, string>;
  consumedMapNodeIds?: string[];
  shopPurchasedIds?: string[];
  battleRound?: number;
  fatigueBonus?: number;
  fatigueAnnouncedBonus?: number;
  rewardChoices?: RogueliteReward[];
  appliedRewards?: RogueliteReward[];
  pendingEvent?: RoguelitePendingEvent;
  runGold?: number;
  nextBattleShieldBonus?: number;
  nextBattleDamageBonus?: number;
  lastStageSummary?: {
    defeatedEnemyName: string;
    postBattleHeal: number;
    goldGained?: number;
    hpAfterHeal: number;
    maxHp: number;
    isBoss: boolean;
  };
}

export type CharacterReactionSkillId =
  | "gunslinger_copy_damage"
  | "gunslinger_barrage"
  | "vampire_life_steal"
  | "vampire_blood_rite"
  | "paladin_invincible"
  | "self_destruct"
  | "war_knight_heal"
  | "crescent_moon_strike"
  | "fire_lord_spark"
  | "fire_lord_burst"
  | "stone_titan_crush"
  | "mountain_shield_guard";
export type SummonerSkillId = "lucky_plus_one" | "first_aid" | "iron_wall" | "fate_reroll" | "last_stand";
export type RollActionType = "normal_attack" | "character_skill" | "summoner_skill" | "roguelite_skill";
export type RollDecisionChoice = RollActionType | "settle";

export interface RollDecisionAvailableAction {
  id: RollActionType;
  label: string;
  enabled: boolean;
  description: string;
  reason?: string;
  skillId?: CharacterReactionSkillId | SummonerSkillId;
  skillName?: string;
  requiresSelfDamageAmount?: boolean;
}

export interface PendingRollDecision {
  id: string;
  actorId: string;
  targetId: string;
  rawRoll: number;
  currentRoll: number;
  phase: "waiting_reaction";
  canUseCharacterSkill: boolean;
  availableCharacterSkillId?: CharacterReactionSkillId;
  availableCharacterSkillName?: string;
  availableSummonerSkillId?: SummonerSkillId;
  availableSummonerSkillName?: string;
  usedSummonerSkillId?: SummonerSkillId;
  availableActions?: RollDecisionAvailableAction[];
  rollEventId: string;
  createdAt: number;
  isFollowUpRoll?: boolean;
}

export type PendingRollType = "gunslinger_bonus_damage" | "vampire_bonus_heal" | string;

export interface PendingRoll {
  playerId: string;
  type: PendingRollType;
  targetId?: string;
  sourceRoll: number;
  characterId: CharacterId;
  message: string;
}

export interface PendingGuardCheck {
  actorId: string;
  controllerId?: string;
}

export interface ActionSnapshot {
  id: string;
  createdAt: number;
  currentPlayerId: string;
  players: Player[];
  effects: Effect[];
  activePlayerIndex: number;
  previousFinalDamage: number;
}

export interface Room {
  id: string;
  hostId: string;
  phase: RoomPhase;
  gameMode?: GameMode;
  settings: RoomSettings;
  players: Player[];
  rematchReadyPlayerIds: string[];
  activePlayerIndex: number;
  effects: Effect[];
  battleLog: GameEvent[];
  snapshots: ActionSnapshot[];
  previousFinalDamage: number;
  emptySince?: number;
  pendingRoll?: PendingRoll;
  pendingRollDecision?: PendingRollDecision;
  pendingGuardCheck?: PendingGuardCheck;
  guardCheckCompletedForActorId?: string;
  winnerId?: string;
  activeControllerId?: string;
  selectedActorId?: string;
  winnerTeamId?: TeamId;
  controllerTurnOrder?: string[];
  duoSlots?: DuoCharacterSlot[];
  roguelite?: RogueliteRunState;
  highlight?: CharacterHighlight;
  skillHints?: SkillHint[];
}

export interface PublicRoomState extends Room {
  snapshots: ActionSnapshot[];
}

export interface RoomListItem {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: RoomListStatus;
  canJoin: boolean;
  gameMode?: GameMode;
}

export interface RollResult {
  room: Room;
  events: GameEvent[];
  gameOver?: {
    winnerId: string;
    winnerName: string;
  };
}
