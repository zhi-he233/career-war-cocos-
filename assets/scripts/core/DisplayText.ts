import type { CharacterId, GameMode, SummonerSkillId } from '../shared/types';
import { characterList } from '../shared/characters';
import { ROGUELITE_BOSSES, ROGUELITE_ENEMIES } from '../shared/data/rogueliteBalance';

const CHARACTER_NAMES: Record<string, string> = {
  boxer: 'Boxer', gunslinger: 'Gunslinger', vampire: 'Vampire',
  zhaoZilong: 'Zhao Zilong', assassin: 'Assassin', paladin: 'Paladin',
  berserker: 'Berserker', stone_titan: 'Stone Titan',
  fearless_assassin: 'Fearless Assassin', execution_assassin: 'Execution Assassin',
  self_destructor: 'Self Destructor', war_knight: 'War Knight',
  crescent_moon: 'Crescent Moon', fire_lord: 'Fire Lord', mountain_shield: 'Mountain Shield',
};

const SUMMONER_SKILL_NAMES: Record<SummonerSkillId, string> = {
  lucky_plus_one: 'Lucky +1', first_aid: 'First Aid', iron_wall: 'Iron Wall',
  fate_reroll: 'Fate Reroll', last_stand: 'Last Stand',
};

const SUMMONER_SKILL_DESCRIPTIONS: Record<SummonerSkillId, string> = {
  lucky_plus_one: 'Increase the current roll by 1, up to 6. Cooldown 2 turns.',
  first_aid: 'Convert this action into healing yourself by the roll amount. Cooldown 3 turns.',
  iron_wall: 'Convert this action into gaining shield equal to the roll. Cooldown 3 turns.',
  fate_reroll: 'Reroll once and accept the new result. Cooldown 3 turns.',
  last_stand: 'Emergency comeback skill — effect scales with low HP. Cooldown 3 turns.',
};

const GAME_MODE_DESCRIPTIONS: Record<string, string> = {
  classic: '1v1 duel. Each player controls one character.',
  duo_2v2: '2v2 team battle. Each player controls two characters.',
  pve_1v1: '1v1 against an AI opponent.',
  pve_roguelite: 'Roguelite challenge. Fight through stages, collect rewards, face bosses.',
};

const STATUS_EFFECT_DESCRIPTIONS: Record<string, string> = {
  invincible: 'Cannot take damage this turn.',
  guarding: 'Gain +1 armor. Team members gain +2 armor.',
  flame_mark: 'Takes extra damage when Fire Lord triggers burst.',
  enraged: 'Deals increased damage.',
  charge: 'Charging for a powerful attack.',
};

export const SUMMONER_SKILL_IDS: SummonerSkillId[] = [
  'lucky_plus_one', 'first_aid', 'iron_wall', 'fate_reroll', 'last_stand',
];

export function characterName(characterId: CharacterId | undefined): string {
  if (!characterId) return 'No Character';
  return CHARACTER_NAMES[characterId] ?? titleFromId(characterId);
}

export function characterDescription(characterId: CharacterId | undefined): string {
  if (!characterId) return 'Unknown character.';
  const c = characterList.find(ch => ch.id === characterId);
  if (!c) return `No description for ${titleFromId(characterId)}.`;
  const lines = c.fullDescription?.length ? c.fullDescription : c.description?.length ? c.description : [c.shortDescription ?? 'No description.'];
  return lines.join('\n');
}

export function summonerSkillName(skillId: SummonerSkillId | undefined): string {
  if (!skillId) return 'No Skill';
  return SUMMONER_SKILL_NAMES[skillId] ?? titleFromId(skillId);
}

export function summonerSkillDescription(skillId: SummonerSkillId | undefined): string {
  if (!skillId) return 'Unknown skill.';
  return SUMMONER_SKILL_DESCRIPTIONS[skillId] ?? `No description for ${titleFromId(skillId)}.`;
}

export function gameModeDescription(mode: GameMode | string | undefined): string {
  if (!mode) return 'Unknown mode.';
  return GAME_MODE_DESCRIPTIONS[mode] ?? `Mode: ${titleFromId(mode)}`;
}

export function statusEffectDescription(type: string): string {
  return STATUS_EFFECT_DESCRIPTIONS[type] ?? `Status effect: ${titleFromId(type)}`;
}

export function rogueliteEnemyDescription(id: string): string {
  const enemy = ROGUELITE_ENEMIES.find(e => e.id === id);
  return enemy?.description ?? `Enemy template: ${titleFromId(id)}`;
}

export function rogueliteBossDescription(id: string): string {
  const boss = ROGUELITE_BOSSES.find(b => b.id === id);
  return boss?.description ?? `Boss template: ${titleFromId(id)}`;
}

export function rogueliteTraitDescription(trait: string): string {
  // Search enemies and bosses for trait descriptions
  const enemy = ROGUELITE_ENEMIES.find(e => (e.skills as readonly string[]).includes(trait));
  if (enemy) return `Enemy trait "${titleFromId(trait)}" — used by ${enemy.displayName}.`;
  const boss = ROGUELITE_BOSSES.find(b => (b.skills as readonly string[]).includes(trait));
  if (boss) return `Boss trait "${titleFromId(trait)}" — used by ${boss.displayName}.`;
  return `Mechanic: ${titleFromId(trait)}.`;
}

export function titleFromId(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ── Rule Guide ──

export interface RuleGuidePage {
  title: string;
  body: string;
}

export const RULE_GUIDE_PAGES: RuleGuidePage[] = [
  {
    title: 'Basic Flow',
    body: 'Choose a mode, enter a lobby, pick a character and summoner skill, then start battle. The server owns all game results; the client only sends choices and renders state.',
  },
  {
    title: 'Game Modes',
    body: 'Classic: 1v1 duel.\nDuo 2v2: Two players per team, each controls two characters.\nPvE 1v1: Fight an AI opponent.\nRoguelite: Fight through stages, collect rewards, face bosses.',
  },
  {
    title: 'Dice & Attack',
    body: 'On your turn, select a valid target and roll the dice (1-6). The server sends available actions: normal attack, character skill, or summoner skill. Higher rolls give better attack damage.',
  },
  {
    title: 'Characters',
    body: 'Each character has unique timing: some react to low rolls, some heal, some guard, some add burst damage. Action buttons only light up when the server says the skill is usable. Check character details in the lobby or via the Detail button in battle.',
  },
  {
    title: 'Summoner Skills',
    body: 'Lucky +1: Increase current roll by 1 (max 6). Cooldown 2 turns.\nFirst Aid: Convert action into healing by roll amount. Cooldown 3 turns.\nIron Wall: Convert action into shield equal to roll. Cooldown 3 turns.\nFate Reroll: Reroll once, accept new result. Cooldown 3 turns.\nLast Stand: Emergency comeback, scales with low HP. Cooldown 3 turns.',
  },
  {
    title: 'Roguelite Basics',
    body: 'Fight through stages (max 15). Each stage has a room type: normal, elite, boss, event, shop, rest, or reward. After winning a battle, choose a reward. Between stages, pick your next route node.',
  },
  {
    title: 'Roguelite Rewards',
    body: 'Growth rewards: permanent stat boosts (HP, armor, damage).\nSkill rewards: new or upgraded character skills.\nBoss abilities: powerful endgame perks.\nStarter rewards: early-game core boosts.\nRarity: Common < Rare < Epic < Legendary.',
  },
  {
    title: 'Roguelite Mechanics',
    body: 'Fatigue: damage bonus increases over battle rounds.\nBoss stages: every 5 stages, a boss with unique mechanics appears.\nGold: earned from battles, spent in shops.\nPerks & Passives: stack from rewards, shown in status panel.\nMap: choose between available route nodes each stage.',
  },
  {
    title: 'Battle Controls',
    body: 'Roll: click after selecting a target.\nActions: choose normal attack, character skill, or summoner skill (if available).\nGuard Check: when enemy guards, roll to penetrate.\nSelf-Destruct: special action with self-damage control.\nRematch: available after game over.\nEmotes: send quick reactions during battle.',
  },
];

/** Get rule guide page by index. Fallback for out-of-range. */
export function getRuleGuidePage(index: number): RuleGuidePage {
  return RULE_GUIDE_PAGES[index] ?? { title: 'Guide', body: 'No guide content for this page.' };
}

/** Concatenated plain-text guide for InfoDialog fallback. */
export function ruleGuidePlainText(): string {
  return RULE_GUIDE_PAGES.map(p => `${p.title}\n${p.body}`).join('\n\n');
}
