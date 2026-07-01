import type { GameMode, Player } from "./types";

export interface ArmorContext {
  gameMode?: GameMode;
  activeAttacker?: Player;
  hasMountainShieldGroupArmor?: boolean;
}

export interface DamageOptions {
  armor?: number;
  ignoresShield?: boolean;
}

export interface DamageResult {
  player: Player;
  damage: number;
  hpDamage: number;
  shieldBlocked: number;
}

export interface HealingOptions {
  overflowToShield?: boolean;
}

export interface HealingResult {
  player: Player;
  hpGain: number;
  shieldGain: number;
}

export function getCombatArmor(target: Player, context: ArmorContext = {}): number {
  let armor = 0;
  if (target.characterId === "war_knight") armor += 1;
  if (target.characterId === "mountain_shield") armor += 1;
  if (target.characterId === "mountain_shield" && target.guarding) armor += 1;
  if (context.hasMountainShieldGroupArmor) armor += 2;
  if (target.rogueliteArmorBonus) armor += target.rogueliteArmorBonus;
  const lowHpArmor = target.rogueliteLowHpArmor ?? 0;
  if (lowHpArmor > 0 && target.hp < target.maxHp * 0.5) {
    armor += lowHpArmor;
  }
  if (target.rogueliteBossId === "boss_shield_guard") armor += 1;
  if (target.rogueliteBossId === "elite_iron_skin") armor += 1;
  if (target.roguelitePerkStacks?.["sturdy_bulwark"] && target.shield > 0) armor += 1;

  const attacker = context.activeAttacker;
  if (context.gameMode === "pve_roguelite" && attacker?.isBot) {
    if (attacker.rogueliteBossId === "normal_armor_piercer") {
      armor = Math.max(0, armor - 1);
    }
    if (attacker.rogueliteBossId === "elite_armor_piercing") {
      const reduction = attacker.hp < attacker.maxHp * 0.5 ? 2 : 1;
      armor = Math.max(0, armor - reduction);
    }
  }

  const guardReduction = target.rogueliteBossState?.guardReduction as number | undefined;
  if (guardReduction && guardReduction > 0) armor += guardReduction;
  return armor;
}

export function applyDamageToPlayer(target: Player, incomingDamage: number, options: DamageOptions = {}): DamageResult {
  const player = clonePlayer(target);
  if (incomingDamage <= 0) {
    return { player, damage: 0, hpDamage: 0, shieldBlocked: 0 };
  }

  const damage = Math.max(0, incomingDamage - (options.armor ?? 0));
  let hpDamage = damage;
  let shieldBlocked = 0;

  if (options.ignoresShield !== true && player.shield > 0) {
    shieldBlocked = Math.min(player.shield, damage);
    player.shield -= shieldBlocked;
    hpDamage -= shieldBlocked;
  }

  player.hp = Math.max(0, player.hp - hpDamage);
  if (player.hp <= 0) player.isDead = true;
  return { player, damage, hpDamage, shieldBlocked };
}

export function applyDirectDamageToPlayer(target: Player, incomingDamage: number): DamageResult {
  const player = clonePlayer(target);
  if (incomingDamage <= 0) {
    return { player, damage: 0, hpDamage: 0, shieldBlocked: 0 };
  }

  player.hp = Math.max(0, player.hp - incomingDamage);
  if (player.hp <= 0) player.isDead = true;
  return { player, damage: incomingDamage, hpDamage: incomingDamage, shieldBlocked: 0 };
}

export function applyHealingToPlayer(player: Player, amount: number, options: HealingOptions = {}): HealingResult {
  const nextPlayer = clonePlayer(player);
  const missingHp = Math.max(0, nextPlayer.maxHp - nextPlayer.hp);
  const hpGain = Math.min(missingHp, amount);
  const overflow = Math.max(0, amount - hpGain);
  const shieldGain = options.overflowToShield === true ? overflow : 0;

  nextPlayer.hp += hpGain;
  if (shieldGain > 0) nextPlayer.shield += shieldGain;
  return { player: nextPlayer, hpGain, shieldGain };
}

export function applyHpHealingToPlayer(player: Player, amount: number): HealingResult {
  return applyHealingToPlayer(player, amount, { overflowToShield: false });
}

function clonePlayer(player: Player): Player {
  return { ...player };
}
