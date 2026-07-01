import { GENERATED_ROGUELITE_EVENTS } from "./rogueliteEvents.generated";

export type RogueliteEventRarity = "common" | "uncommon" | "rare";
export type RogueliteEventStage = "early" | "mid" | "late" | "any";
export type RogueliteEventRewardPool = "growth" | "character_skill" | "boss_ability" | "rare";
export type RogueliteEventOutcomeType =
  | "heal"
  | "lose_hp"
  | "gain_gold"
  | "lose_gold"
  | "gain_start_shield_next_battle"
  | "gain_start_damage_next_battle"
  | "reward_choice"
  | "start_battle"
  | "todo";

export interface RogueliteEventOutcomeDraft {
  type: RogueliteEventOutcomeType;
  value?: number;
  rewardPool?: RogueliteEventRewardPool;
  enemyId?: string;
  note?: string;
}

export interface RogueliteEventChoiceDraft {
  label: string;
  effect: string;
  cost: string;
  effects?: readonly RogueliteEventOutcomeDraft[];
  costs?: readonly RogueliteEventOutcomeDraft[];
}

export interface RogueliteEventDraft {
  id: string;
  name: string;
  rarity: RogueliteEventRarity;
  stage: RogueliteEventStage;
  description: string;
  choices: readonly RogueliteEventChoiceDraft[];
  notes?: string;
}

export const ROGUELITE_EVENTS = GENERATED_ROGUELITE_EVENTS;
