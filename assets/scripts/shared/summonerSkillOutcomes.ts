import type { SkillOutcome } from "./skillOutcomes";
import type { SummonerSkillId } from "./types";

export interface SummonerRollChange {
  nextRoll: number;
  message: string;
}

export function createFirstAidOutcome(roll: number): SkillOutcome {
  return {
    damage: 0,
    healing: roll,
    shieldGain: 0,
    selfDamage: 0,
    ignoresShield: false,
    grantsInvincible: false,
    executesTarget: false,
    flameMarksToAdd: 0,
    clearsFlameMarks: false,
    entersGuarding: false,
    dice: [roll],
    skillMessages: [`急救术发动，本次不攻击，回复 ${roll} 点血`],
    skillHints: []
  };
}

export function createIronWallOutcome(roll: number): SkillOutcome {
  return {
    damage: 0,
    healing: 0,
    shieldGain: roll,
    selfDamage: 0,
    ignoresShield: false,
    grantsInvincible: false,
    executesTarget: false,
    flameMarksToAdd: 0,
    clearsFlameMarks: false,
    entersGuarding: false,
    dice: [roll],
    skillMessages: [`铁壁发动，本次不攻击，获得 ${roll} 点护盾`],
    skillHints: []
  };
}

export function applyLastStandOutcome(baseOutcome: SkillOutcome): SkillOutcome {
  return {
    ...baseOutcome,
    damage: baseOutcome.damage + 2,
    selfDamage: 2,
    skillMessages: [
      ...baseOutcome.skillMessages,
      "破釜发动，本次最终伤害 +2，自己受到 2 点反噬伤害"
    ],
    skillHints: [...baseOutcome.skillHints]
  };
}

export function createNonAttackSummonerSkillOutcome(skillId: SummonerSkillId, roll: number): SkillOutcome | undefined {
  if (skillId === "first_aid") return createFirstAidOutcome(roll);
  if (skillId === "iron_wall") return createIronWallOutcome(roll);
  return undefined;
}

export function createSummonerRollChange(
  skillId: SummonerSkillId,
  currentRoll: number,
  options: { reroll?: number } = {}
): SummonerRollChange | undefined {
  if (skillId === "lucky_plus_one") {
    const nextRoll = Math.min(6, currentRoll + 1);
    return {
      nextRoll,
      message: `发动幸运骰，骰点变为 ${nextRoll} 点`
    };
  }

  if (skillId === "fate_reroll") {
    if (typeof options.reroll !== "number") throw new Error("命运重掷需要新的骰点");
    return {
      nextRoll: options.reroll,
      message: `命运重掷发动，新的骰点为 ${options.reroll} 点`
    };
  }

  return undefined;
}
