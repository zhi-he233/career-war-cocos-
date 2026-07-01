import type { CharacterId, SkillHint } from "./types";

type SkillHintDraft = Pick<SkillHint, "text" | "valueText"> & {
  key: string;
};

export interface SkillOutcome {
  damage: number;
  healing: number;
  shieldGain: number;
  selfDamage: number;
  ignoresShield: boolean;
  grantsInvincible: boolean;
  executesTarget: boolean;
  flameMarksToAdd: number;
  clearsFlameMarks: boolean;
  entersGuarding: boolean;
  dice: number[];
  skillMessages: string[];
  skillHints: SkillHintDraft[];
  rogueliteSkillId?: string;
}

export function resolveSkill(
  characterId: CharacterId,
  first: number,
  previousFinalDamage: number,
  actorHp: number,
  actorMaxHp: number,
  targetHp: number,
  targetMaxHp: number,
  actorGuarding: boolean,
  targetFlameMarks: number,
  options: { useOptionalCharacterSkill?: boolean; selfDamageAmount?: number } = {}
): SkillOutcome {
  const outcome: SkillOutcome = {
    damage: first,
    healing: 0,
    shieldGain: 0,
    selfDamage: 0,
    ignoresShield: false,
    grantsInvincible: false,
    executesTarget: false,
    flameMarksToAdd: 0,
    clearsFlameMarks: false,
    entersGuarding: false,
    dice: [first],
    skillMessages: [],
    skillHints: []
  };
  if (characterId === "boxer") return outcome;

  if (characterId === "gunslinger") {
    outcome.damage = Math.max(0, first - 1);
    if (first === 1 && options.useOptionalCharacterSkill) {
      outcome.damage = previousFinalDamage;
      outcome.skillMessages.push(`枪手 1 点复制上一名玩家最终伤害，伤害为 ${outcome.damage}`);
      outcome.skillHints.push({ key: "gunslinger-1", text: "复制伤害！" });
    }
    return outcome;
  }

  if (characterId === "vampire") {
    if (first === 3) {
      outcome.damage = 0;
      outcome.skillMessages.push("吸血鬼 3 点无伤");
    } else if (first === 1 && options.useOptionalCharacterSkill) {
      outcome.damage = 1;
      outcome.healing = 2;
      outcome.skillMessages.push("吸血鬼 1 点造成 1 伤害并回复 2 血");
      outcome.skillHints.push({ key: "vampire-1", text: "吸血回复！" });
    }
    return outcome;
  }

  // Zhao Zilong balance rule: only roll 4 is no-damage; it is not a skill and roll 1 is not no-damage.
  // Uses the same generic no-damage pattern as vampire roll 3, paladin roll 1, stone_titan rolls 1-4.
  if (characterId === "zhaoZilong") {
    outcome.ignoresShield = true;
    if (first === 4) {
      outcome.damage = 0;
      outcome.skillMessages.push("赵子龙投出 4，本次无伤害");
    } else {
      outcome.skillMessages.push("赵子龙造成伤害时无视护盾");
    }
    return outcome;
  }

  if (characterId === "assassin") {
    outcome.damage = first === 1 ? 3 : first + 1;
    outcome.skillMessages.push(first === 1 ? "刺客 1 点造成 3 点伤害" : "刺客基础伤害 +1");
    return outcome;
  }

  if (characterId === "paladin") {
    if (first === 1) {
      outcome.damage = 0;
      outcome.skillMessages.push("圣骑士 1 点无伤");
    } else if (first === 4 && options.useOptionalCharacterSkill) {
      outcome.skillMessages.push("圣骑士 4 点触发全员无敌，持续到圣骑士下一次行动开始前");
      outcome.skillHints.push({ key: "paladin-4", text: "全员无敌！" });
      outcome.grantsInvincible = true;
      outcome.shieldGain += 3;
    }
  }

  if (characterId === "berserker") {
    const missingHp = Math.max(0, actorMaxHp - actorHp);
    outcome.damage = first + missingHp;
    outcome.skillMessages.push(`狂战士已损失 ${missingHp} 点血，本次伤害 +${missingHp}`);
    if (missingHp > 0) {
      outcome.skillHints.push({ key: "berserker-low-hp-damage", text: "残血增伤", valueText: `+${missingHp}` });
    }
    return outcome;
  }

  if (characterId === "stone_titan") {
    if (first <= 4) {
      outcome.damage = 0;
      outcome.skillMessages.push("巨石泰坦低点数未造成伤害");
    } else if (first === 6 && options.useOptionalCharacterSkill) {
      outcome.damage = 9;
      outcome.skillMessages.push("巨石泰坦 6 点造成 9 点伤害");
      outcome.skillHints.push({ key: "stone-titan-6", text: "巨岩碾压！" });
    }
    return outcome;
  }

  if (characterId === "fearless_assassin") {
    if (first === 1) {
      outcome.damage = 0;
      outcome.skillMessages.push("刺客（无畏）1 点无伤");
      return outcome;
    }

    let bonus = 0;
    if (actorHp === actorMaxHp) bonus = 3;
    else if (actorHp > 10) bonus = 2;
    else if (actorHp > 5) bonus = 1;

    outcome.damage = first + bonus;
    if (bonus > 0) {
      outcome.skillMessages.push(`刺客（无畏）血量健康，伤害 +${bonus}`);
      outcome.skillHints.push({ key: "fearless-assassin-hp-bonus", text: "无畏增伤", valueText: `+${bonus}` });
    }
    return outcome;
  }

  if (characterId === "execution_assassin") {
    if (first === 1) {
      outcome.damage = 0;
      outcome.skillMessages.push("刺客（斩）1 点无伤");
      return outcome;
    }

    if (targetHp <= 3) {
      outcome.executesTarget = true;
      outcome.skillMessages.push("刺客（斩）发动处决，斩杀残血目标");
      return outcome;
    }

    let bonus = 0;
    if (targetHp < targetMaxHp * 0.5) bonus = 2;
    else if (targetHp < targetMaxHp * 0.75) bonus = 1;

    outcome.damage = first + bonus;
    if (bonus > 0) {
      outcome.skillMessages.push(`刺客（斩）针对残血目标，伤害 +${bonus}`);
      outcome.skillHints.push({ key: "execution-assassin-low-hp-bonus", text: "残血收割", valueText: `+${bonus}` });
    }
    return outcome;
  }

  if (characterId === "self_destructor") {
    if (first === 1) {
      outcome.damage = 0;
      outcome.skillMessages.push("自爆人 1 点无伤");
      return outcome;
    }
    if (first === 6 && options.useOptionalCharacterSkill) {
      const selfDamageAmount = typeof options.selfDamageAmount === "number" ? options.selfDamageAmount : 0;
      if (!Number.isInteger(selfDamageAmount) || selfDamageAmount < 1 || selfDamageAmount > 9) throw new Error("请选择 1 到 9 点自爆扣血");
      if (selfDamageAmount > actorHp) throw new Error("自爆扣血量不能超过当前血量");
      outcome.damage = selfDamageAmount * 2;
      outcome.selfDamage = selfDamageAmount;
      outcome.skillMessages.push(`自爆人扣除自己 ${selfDamageAmount} 点血，对目标造成 ${outcome.damage} 点普通伤害`);
      return outcome;
    }
    return outcome;
  }

  if (characterId === "war_knight") {
    outcome.damage = Math.max(0, first - 1);
    outcome.skillMessages.push("战争骑士造成伤害 -1");
    if (first === 3 && options.useOptionalCharacterSkill) {
      outcome.damage = 0;
      outcome.healing = 3;
      outcome.skillMessages.push("战争骑士 3 点回复 3 点血");
    }
    return outcome;
  }

  if (characterId === "crescent_moon") {
    outcome.damage = first + 2;
    if (first === 6 && options.useOptionalCharacterSkill) {
      outcome.damage = 9;
    }
    outcome.skillMessages.push(first === 6 && options.useOptionalCharacterSkill ? "残月者 6 点造成 9 点伤害" : "残月者伤害 +2");
    return outcome;
  }

  if (characterId === "fire_lord") {
    if (first === 3) {
      outcome.damage = 0;
      if (options.useOptionalCharacterSkill) {
        outcome.flameMarksToAdd = 1;
        outcome.skillMessages.push("火焰领主发动火焰印记：附加 1 层火焰印记");
      } else {
        outcome.skillMessages.push("火焰领主普通攻击 3 点无效果");
      }
    } else if (first === 6 && options.useOptionalCharacterSkill) {
      outcome.damage = targetFlameMarks * 3;
      outcome.clearsFlameMarks = true;
      outcome.skillMessages.push(`火焰领主爆发 ${targetFlameMarks} 层火焰印记，造成 ${outcome.damage} 点普通伤害`);
    } else {
      outcome.flameMarksToAdd = 1;
      outcome.skillMessages.push("火焰领主添加 1 层火焰印记");
    }
    return outcome;
  }

  if (characterId === "mountain_shield") {
    if (first === 6 && options.useOptionalCharacterSkill) {
      outcome.damage = 0;
      outcome.entersGuarding = true;
      outcome.skillMessages.push("山盾进入架盾状态");
    } else {
      const guardingPenalty = actorGuarding ? 1 : 0;
      outcome.damage = Math.max(0, first - 1 - guardingPenalty);
      outcome.skillMessages.push(actorGuarding ? "山盾架盾中，造成伤害 -2" : "山盾造成伤害 -1");
    }
    return outcome;
  }

  return outcome;
}

