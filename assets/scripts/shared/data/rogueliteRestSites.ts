import { GENERATED_ROGUELITE_REST_SITE_ACTIONS } from "./rogueliteRestSites.generated";

export type RogueliteRestSiteActionId =
  | "campfire_heal"
  | "weapon_drill"
  | "shield_repair"
  | "blood_meditation"
  | "dice_prayer"
  | "sharpen_first_hit"
  | "reinforce_armor"
  | "sell_scraps"
  | "skip_for_trophy"
  | "skill_focus";

export interface RogueliteRestSiteActionDraft {
  id: RogueliteRestSiteActionId;
  name: string;
  effect: string;
  limit: string;
  notes?: string;
}

export const ROGUELITE_REST_SITE_ACTIONS: readonly RogueliteRestSiteActionDraft[] = GENERATED_ROGUELITE_REST_SITE_ACTIONS;

export const rogueliteRestSites = {
  actions: ROGUELITE_REST_SITE_ACTIONS,
} as const;
