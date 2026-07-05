import type { CharacterId, GameMode, SummonerSkillId } from '../shared/types';
import { characterList } from '../shared/characters';

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

export function titleFromId(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
