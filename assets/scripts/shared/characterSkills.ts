import type { CharacterId, CharacterReactionSkillId } from "./types";

export interface CharacterReactionSkill {
  id: CharacterReactionSkillId;
  name: string;
}

const CHARACTER_REACTION_SKILLS: Record<string, CharacterReactionSkill> = {
  "stone_titan:6": { id: "stone_titan_crush", name: "碾压" },
  "gunslinger:1": { id: "gunslinger_copy_damage", name: "复制伤害" },
  "gunslinger:6": { id: "gunslinger_barrage", name: "连射" },
  "vampire:1": { id: "vampire_life_steal", name: "吸血" },
  "vampire:6": { id: "vampire_blood_rite", name: "血祭回复" },
  "paladin:4": { id: "paladin_invincible", name: "全员无敌" },
  "self_destructor:6": { id: "self_destruct", name: "自爆" },
  "war_knight:3": { id: "war_knight_heal", name: "战争复苏" },
  "crescent_moon:6": { id: "crescent_moon_strike", name: "残月斩" },
  "fire_lord:3": { id: "fire_lord_spark", name: "火焰印记" },
  "fire_lord:6": { id: "fire_lord_burst", name: "火焰爆发" },
  "mountain_shield:6": { id: "mountain_shield_guard", name: "架盾" }
};

export function getAvailableCharacterReactionSkill(characterId: CharacterId | undefined, roll: number): CharacterReactionSkill | undefined {
  if (!characterId) return undefined;
  return CHARACTER_REACTION_SKILLS[`${characterId}:${roll}`];
}

export function activeCharacterSkillReason(characterId: CharacterId | undefined, roll: number): string {
  const skill = getAvailableCharacterReactionSkill(characterId, roll);
  if (!skill) return "当前骰点不能发动";
  return characterSkillDescription(skill.id, roll);
}

export function characterSkillDescription(skillId: CharacterReactionSkillId, roll: number): string {
  if (skillId === "stone_titan_crush") return `消耗 🎲 ${roll}，发动碾压造成 9 点伤害`;
  if (skillId === "gunslinger_copy_damage") return `消耗 🎲 ${roll}，复制上一名玩家刚刚造成的最终伤害`;
  if (skillId === "gunslinger_barrage") return `消耗 🎲 ${roll}，继续投骰造成额外伤害`;
  if (skillId === "vampire_life_steal") return `消耗 🎲 ${roll}，造成 1 点伤害并回复 2 点血`;
  if (skillId === "vampire_blood_rite") return `消耗 🎲 ${roll}，继续投骰并根据结果回复生命`;
  if (skillId === "self_destruct") return "选择扣除自己 1-9 点血量，对目标造成双倍普通伤害";
  if (skillId === "war_knight_heal") return `消耗 🎲 ${roll}，回复 3 点血，不造成伤害`;
  if (skillId === "crescent_moon_strike") return `消耗 🎲 ${roll}，造成固定 9 点伤害`;
  if (skillId === "fire_lord_spark") return `消耗 🎲 ${roll}，不造成伤害并添加 1 层火焰印记`;
  if (skillId === "fire_lord_burst") return "爆发目标身上的火焰印记，每层造成 3 点普通伤害并清空";
  if (skillId === "mountain_shield_guard") return `消耗 🎲 ${roll}，进入架盾状态，不造成伤害`;
  return `消耗 🎲 ${roll}，全员无敌，自己获得护盾`;
}
