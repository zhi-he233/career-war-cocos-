import type { CharacterId, SummonerSkillId } from '../shared/types';

const CHARACTER_NAMES: Record<string, string> = {
  boxer: 'Boxer',
  gunslinger: 'Gunslinger',
  vampire: 'Vampire',
  zhaoZilong: 'Zhao Zilong',
  assassin: 'Assassin',
  paladin: 'Paladin',
  berserker: 'Berserker',
  stone_titan: 'Stone Titan',
  fearless_assassin: 'Fearless Assassin',
  execution_assassin: 'Execution Assassin',
  self_destructor: 'Self Destructor',
  war_knight: 'War Knight',
  crescent_moon: 'Crescent Moon',
  fire_lord: 'Fire Lord',
  mountain_shield: 'Mountain Shield',
};

const SUMMONER_SKILL_NAMES: Record<SummonerSkillId, string> = {
  lucky_plus_one: 'Lucky +1',
  first_aid: 'First Aid',
  iron_wall: 'Iron Wall',
  fate_reroll: 'Fate Reroll',
  last_stand: 'Last Stand',
};

export const SUMMONER_SKILL_IDS: SummonerSkillId[] = [
  'lucky_plus_one',
  'first_aid',
  'iron_wall',
  'fate_reroll',
  'last_stand',
];

export function characterName(characterId: CharacterId | undefined): string {
  if (!characterId) return 'No Character';
  return CHARACTER_NAMES[characterId] ?? titleFromId(characterId);
}

export function summonerSkillName(skillId: SummonerSkillId | undefined): string {
  if (!skillId) return 'No Skill';
  return SUMMONER_SKILL_NAMES[skillId] ?? titleFromId(skillId);
}

export function titleFromId(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
