export interface RogueliteDicePerkInput {
  roll: number;
  isRoguelite: boolean;
  actorIsBot: boolean;
  hasFateTokens?: boolean;
  fateTokens?: number;
  hasLuckyFloor?: boolean;
  consecutiveLowRolls?: number;
  hasLowRollCharge?: boolean;
  lowRollCharge?: number;
  lowRollDefenseShield?: number;
  shield?: number;
}

export interface RogueliteDicePerkResult {
  applied: boolean;
  roll: number;
  fateTokens?: number;
  consecutiveLowRolls?: number;
  lowRollCharge?: number;
  shield?: number;
  messages: string[];
}

export function resolveRogueliteDicePerks(input: RogueliteDicePerkInput): RogueliteDicePerkResult {
  if (!input.isRoguelite || input.actorIsBot) {
    return { applied: false, roll: input.roll, messages: [] };
  }

  let roll = input.roll;
  const messages: string[] = [];
  const result: RogueliteDicePerkResult = { applied: true, roll, messages };

  if (input.hasFateTokens) {
    let fateTokens = input.fateTokens ?? 0;
    if (roll === 1 || roll === 2) {
      fateTokens += 1;
      result.fateTokens = fateTokens;
      messages.push(`命运筹码 +1（${fateTokens}/3）`);
    }
    if (fateTokens >= 3) {
      const boosted = Math.min(6, roll + 1);
      if (boosted !== roll) {
        fateTokens -= 3;
        roll = boosted;
        result.fateTokens = fateTokens;
        messages.push(`命运筹码触发，骰点 +1 → ${roll}`);
      }
    }
  }

  if (input.hasLuckyFloor) {
    let consecutiveLowRolls = input.consecutiveLowRolls ?? 0;
    if (roll <= 2) {
      consecutiveLowRolls += 1;
    } else {
      consecutiveLowRolls = 0;
    }
    if (consecutiveLowRolls >= 2) {
      roll = Math.max(roll, 4);
      consecutiveLowRolls = 0;
      messages.push("幸运保底触发，骰点保底为 4");
    }
    result.consecutiveLowRolls = consecutiveLowRolls;
  }

  if (input.hasLowRollCharge && roll >= 1 && roll <= 3) {
    const lowRollCharge = (input.lowRollCharge ?? 0) + 1;
    result.lowRollCharge = lowRollCharge;
    messages.push(`低点蓄力 +1（${lowRollCharge} 层）`);
  }

  const defenseShield = input.lowRollDefenseShield ?? 0;
  if (defenseShield > 0 && (roll === 1 || roll === 2)) {
    result.shield = (input.shield ?? 0) + defenseShield;
    messages.push(`低点防御触发，获得 ${defenseShield} 护盾`);
  }

  result.roll = roll;
  return result;
}
