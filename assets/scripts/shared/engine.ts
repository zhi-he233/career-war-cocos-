import { characters } from "./characters";
import { resolveSkill, type SkillOutcome } from "./skillOutcomes";
import {
  applyLastStandOutcome,
  createNonAttackSummonerSkillOutcome,
  createSummonerRollChange,
  type SummonerRollChange
} from "./summonerSkillOutcomes";
import { characterSkillDescription, getAvailableCharacterReactionSkill } from "./characterSkills";
import {
  applyDamageToPlayer,
  applyDirectDamageToPlayer,
  applyHealingToPlayer,
  applyHpHealingToPlayer,
  getCombatArmor
} from "./combatMath";
import { resolveRogueliteDicePerks } from "./rogueliteDice";
import {
  createSummonerChangedRollResolution,
  getAllowedRollDecisionAction,
  normalizeRollDecisionChoice
} from "./rollDecisions";
import { getNextAlivePlayerIndex, getNextDuoControllerId } from "./turnOrder";
import type {
  ActionSnapshot,
  CharacterHighlight,
  CharacterReactionSkillId,
  CharacterId,
  Effect,
  GameEvent,
  PendingRoll,
  PendingRollDecision,
  RollDecisionAvailableAction,
  Player,
  RollDecisionChoice,
  Room,
  RollResult,
  SkillHint,
  SummonerSkillId
} from "./types";

export type DiceRoller = () => number;
export type IdFactory = () => string;

interface EngineContext {
  now: () => number;
  makeId: IdFactory;
  rollDice: DiceRoller;
}

type SkillHintDraft = Pick<SkillHint, "text" | "valueText"> & {
  key: string;
};

/** Per-level stat effects for growth perks (used by 战利品 on-kill upgrade). */
const GROWTH_PERK_UPGRADE: Record<string, (p: Player) => void> = {
  heavy_punch: (p) => { p.rogueliteDamageBonus = (p.rogueliteDamageBonus ?? 0) + 1; p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 2); },
  iron_body: (p) => { p.rogueliteArmorBonus = (p.rogueliteArmorBonus ?? 0) + 1; p.rogueliteStartShield = (p.rogueliteStartShield ?? 0) + 2; },
  breathing_recovery: (p) => { p.maxHp += 5; p.hp = Math.min(p.maxHp, p.hp + 5); },
  blood_punch: (p) => { p.rogueliteDamageBonus = (p.rogueliteDamageBonus ?? 0) + 1; },
  battle_instinct: (p) => { p.rogueliteDamageBonus = (p.rogueliteDamageBonus ?? 0) + 1; p.roguelitePostBattleHealBonus = (p.roguelitePostBattleHealBonus ?? 0) + 2; p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 2); },
  guard_training: (p) => { p.maxHp += 4; p.hp = Math.min(p.maxHp, p.hp + 4); p.rogueliteStartShield = (p.rogueliteStartShield ?? 0) + 3; },
  vitality_boost: (p) => { p.maxHp += 6; p.hp = Math.min(p.maxHp, p.hp + 4); },
  shield_wall: (p) => { p.shield += 4; p.rogueliteStartShield = (p.rogueliteStartShield ?? 0) + 4; },
  first_strike: (p) => { p.rogueliteDamageBonus = (p.rogueliteDamageBonus ?? 0) + 3; },
  low_hp_armor: (p) => { p.rogueliteLowHpArmor = (p.rogueliteLowHpArmor ?? 0) + 2; },
  comeback: (p) => { p.rogueliteComebackDamage = (p.rogueliteComebackDamage ?? 0) + 3; },
  low_roll_defense: (p) => { p.rogueliteLowRollDefenseShield = (p.rogueliteLowRollDefenseShield ?? 0) + 3; },
  shield_strike: (p) => { p.rogueliteShieldStrikeBonus = (p.rogueliteShieldStrikeBonus ?? 0) + 2; },
  drink_blood: (_p) => { /* per-level heal handled in finishAction via perkStacks */ },
};

/** Max stacks for growth perks (mirrors balance doc). */
const GROWTH_PERK_MAX: Record<string, number> = {
  vitality_boost: 3, shield_wall: 3, first_strike: 3, low_hp_armor: 3,
  kill_heal: 3, drink_blood: 3, comeback: 2, low_roll_defense: 3,
  shield_strike: 3, shield_overload: 1, sturdy_bulwark: 1,
  fate_tokens: 1, low_roll_charge: 1, desperate_reroll: 1, lucky_floor: 1,
};

function tryUpgradeRogueliteGrowthPerk(player: Player, _events: GameEvent[], _ctx: Pick<EngineContext, "now" | "makeId">): string | null {
  const stacks = player.roguelitePerkStacks ?? {};
  const eligible = Object.keys(stacks).filter((perkId) => {
    if (!(perkId in GROWTH_PERK_UPGRADE)) return false;
    const max = GROWTH_PERK_MAX[perkId];
    if (max && (stacks[perkId] ?? 0) >= max) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  const picked = eligible[Math.floor(Math.random() * eligible.length)];
  player.roguelitePerkStacks ??= {};
  player.roguelitePerkStacks[picked] = (player.roguelitePerkStacks[picked] ?? 0) + 1;
  GROWTH_PERK_UPGRADE[picked]?.(player);
  return `${picked} 升级至 Lv.${player.roguelitePerkStacks[picked]}`;
}

export function createPlayer(id: string, clientId: string, nickname: string, isHost: boolean): Player {
  return { id, clientId, nickname, isHost, isOnline: true, summonerSkillId: "lucky_plus_one", summonerSkillCooldown: 0, hp: 0, maxHp: 0, shield: 0, zhaoZilongHitCount: 0, flameMarks: 0, guarding: false, isDead: false };
}

const SUMMONER_SKILL_CONFIGS: Record<SummonerSkillId, { initialCooldown: number }> = {
  lucky_plus_one: { initialCooldown: 2 },
  first_aid: { initialCooldown: 0 },
  iron_wall: { initialCooldown: 0 },
  fate_reroll: { initialCooldown: 0 },
  last_stand: { initialCooldown: 0 }
};

export function getSummonerSkillInitialCooldown(skillId: SummonerSkillId | undefined): number {
  return SUMMONER_SKILL_CONFIGS[skillId ?? "lucky_plus_one"].initialCooldown;
}

function getSummonerSkillCooldown(player: Player, baseCooldown: number): number {
  const reduction = player.rogueliteSummonerCooldownReduction ?? 0;
  return Math.max(1, baseCooldown - reduction);
}

export function chooseCharacter(room: Room, playerId: string, characterId: CharacterId): GameEvent {
  const player = getPlayerOrThrow(room, playerId);
  const character = characters[characterId];
    player.characterId = characterId;
  if (room.phase === "lobby") {
    player.maxHp = character.maxHp;
    player.hp = getInitialHp(characterId, character.maxHp);
    player.shield = 0;
    player.zhaoZilongHitCount = 0;
    player.flameMarks = 0;
    player.guarding = false;
    player.isDead = false;
    player.isOnline = true;
  }
  return makeEvent(Date.now, randomEventId, "chooseCharacter", `${player.nickname} 选择了职业 ${character.name}`, player.id);
}

export function canStartGame(room: Room): { ok: true } | { ok: false; reason: string } {
  if (room.players.length < 2) return { ok: false, reason: "至少需要 2 名玩家" };
  if (room.players.length > 8) return { ok: false, reason: "最多支持 8 名玩家" };
  if (room.players.some((player) => !player.characterId)) return { ok: false, reason: "所有玩家都需要先选择职业" };
  return { ok: true };
}

export function startGame(room: Room, ctx: Pick<EngineContext, "now" | "makeId">): GameEvent[] {
  const readiness = canStartGame(room);
  if (!readiness.ok) throw new Error((readiness as { ok: false; reason: string }).reason);

  room.phase = "battle";
  room.activePlayerIndex = Math.floor(Math.random() * room.players.length);
  room.effects = [];
  room.snapshots = [];
  room.previousFinalDamage = 0;
  room.pendingRoll = undefined;
  room.pendingRollDecision = undefined;
  room.pendingGuardCheck = undefined;
  room.guardCheckCompletedForActorId = undefined;
  room.rematchReadyPlayerIds = [];
  room.winnerId = undefined;
  room.highlight = undefined;
  room.skillHints = undefined;

  for (const player of room.players) {
    const character = characters[player.characterId as CharacterId];
    player.maxHp = character.maxHp;
    player.hp = getInitialHp(player.characterId as CharacterId, character.maxHp);
    player.shield = 0;
    player.zhaoZilongHitCount = 0;
    player.flameMarks = 0;
    player.guarding = false;
    player.isDead = false;
    player.isOnline = true;
    player.summonerSkillId ??= "lucky_plus_one";
    player.summonerSkillCooldown = getSummonerSkillInitialCooldown(player.summonerSkillId);
    player.selectedTargetId = undefined;
  }

  const firstPlayer = room.players[room.activePlayerIndex];
  const events = [
    makeEvent(ctx.now, ctx.makeId, "startGame", "游戏开始"),
    makeEvent(ctx.now, ctx.makeId, "turn", `随机先手：${firstPlayer?.nickname ?? "未知玩家"}`, firstPlayer?.id),
    makeTurnEvent(room, ctx)
  ];
  room.battleLog.unshift(...events);
  return events;
}

export function resetToLobbyForRematch(room: Room): void {
  if (room.gameMode === "duo_2v2") {
    resetDuoToLobbyForRematch(room);
    return;
  }

  room.phase = "lobby";
  room.activePlayerIndex = 0;
  room.effects = [];
  room.battleLog = [];
  room.snapshots = [];
  room.previousFinalDamage = 0;
  room.pendingRoll = undefined;
  room.pendingRollDecision = undefined;
  room.pendingGuardCheck = undefined;
  room.guardCheckCompletedForActorId = undefined;
  room.rematchReadyPlayerIds = [];
  room.winnerId = undefined;
  room.highlight = undefined;
  room.skillHints = undefined;

  for (const player of room.players) {
    player.characterId = undefined;
    player.hp = 0;
    player.maxHp = 0;
    player.shield = 0;
    player.zhaoZilongHitCount = 0;
    player.flameMarks = 0;
    player.guarding = false;
    player.isDead = false;
    player.isOnline = true;
    player.summonerSkillId ??= "lucky_plus_one";
    player.summonerSkillCooldown = 0;
    player.selectedTargetId = undefined;
  }
}

function resetDuoToLobbyForRematch(room: Room): void {
  const controllers = getDuoControllerPlayers(room);

  room.phase = "lobby";
  room.activePlayerIndex = 0;
  room.effects = [];
  room.battleLog = [];
  room.snapshots = [];
  room.previousFinalDamage = 0;
  room.pendingRoll = undefined;
  room.pendingRollDecision = undefined;
  room.pendingGuardCheck = undefined;
  room.guardCheckCompletedForActorId = undefined;
  room.rematchReadyPlayerIds = [];
  room.winnerId = undefined;
  room.winnerTeamId = undefined;
  room.activeControllerId = undefined;
  room.selectedActorId = undefined;
  room.controllerTurnOrder = undefined;
  room.highlight = undefined;
  room.skillHints = undefined;
  room.players = controllers;

  if (!room.players.some((player) => player.id === room.hostId)) {
    room.hostId = room.players[0]?.id ?? room.hostId;
  }
  for (const player of room.players) {
    player.isHost = player.id === room.hostId;
  }
}

function getDuoControllerPlayers(room: Room): Player[] {
  const controllerIds: string[] = [];
  for (const controllerId of room.controllerTurnOrder ?? []) {
    if (!controllerIds.includes(controllerId)) controllerIds.push(controllerId);
  }
  for (const player of room.players) {
    const controllerId = player.controllerId;
    if (controllerId && !controllerIds.includes(controllerId)) controllerIds.push(controllerId);
  }

  return controllerIds.map((controllerId) => {
    const units = room.players.filter((player) => player.controllerId === controllerId || player.id === controllerId);
    const source = units[0];
    const nickname = source ? getDuoControllerNickname(source) : controllerId;
    return {
      id: controllerId,
      clientId: source?.clientId ?? "",
      nickname,
      isHost: room.hostId === controllerId || units.some((player) => player.isHost),
      isOnline: units.some((player) => player.isOnline),
      summonerSkillId: source?.summonerSkillId ?? "lucky_plus_one",
      summonerSkillCooldown: 0,
      hp: 0,
      maxHp: 0,
      shield: 0,
      zhaoZilongHitCount: 0,
      flameMarks: 0,
      guarding: false,
      isDead: false,
      selectedTargetId: undefined
    };
  });
}

function getDuoControllerNickname(player: Player): string {
  if (player.slotIndex === undefined) return player.nickname;
  const suffix = ` 角色${player.slotIndex + 1}`;
  return player.nickname.endsWith(suffix) ? player.nickname.slice(0, -suffix.length) : player.nickname;
}

export function selectTarget(room: Room, playerId: string, targetId: string, requesterId?: string): void {
  if (room.pendingRoll) throw new Error("请先完成继续投骰");
  if (room.pendingRollDecision) throw new Error("请先完成投后选择");
  if (room.pendingGuardCheck) throw new Error("请先完成架盾判定");

  if (room.gameMode === "duo_2v2") {
    const controllerId = requesterId ?? playerId;
    if (!room.selectedActorId) throw new Error("请先选择行动角色");
    if (room.activeControllerId !== controllerId) throw new Error("只有当前控制者可以选择目标");
    const actor = getPlayerOrThrow(room, room.selectedActorId);
    if (actor.isDead) throw new Error("行动角色已死亡");
    if (actor.controllerId !== controllerId) throw new Error("只能控制自己的角色选择目标");
    const target = getPlayerOrThrow(room, targetId);
    if (target.isDead) throw new Error("不能选择已死亡玩家");
    if (target.id === actor.id) throw new Error("不能攻击自己");
    if (target.teamId === actor.teamId) throw new Error("不能选择己方队伍");
    actor.selectedTargetId = targetId;
    return;
  }

  // classic mode
  const active = getActivePlayer(room);
  if (active.id !== playerId) throw new Error("只有当前行动玩家可以选择目标");
  const target = getPlayerOrThrow(room, targetId);
  if (target.id === playerId) throw new Error("不能攻击自己");
  if (target.isDead) throw new Error("不能选择已死亡玩家");
  active.selectedTargetId = targetId;
}

export function rollForActivePlayer(room: Room, playerId: string, ctx: EngineContext, requesterId?: string): RollResult {
  if (room.phase !== "battle") throw new Error("游戏尚未开始");
  room.skillHints = undefined;
  if (room.pendingGuardCheck) throw new Error("请先完成架盾判定");

  if (room.gameMode === "duo_2v2") {
    const controllerId = requesterId ?? playerId;
    if (room.activeControllerId !== controllerId) throw new Error("还没有轮到你");
    const controllerGuardCheckStarted = beginControllerGuardCheckIfNeeded(room, controllerId);
    if (controllerGuardCheckStarted) return { room, events: [] };
    if (!room.selectedActorId) throw new Error("请先选择行动角色");
    const actor = getPlayerOrThrow(room, room.selectedActorId);
    if (actor.isDead) throw new Error("死亡角色不能行动");
    if (!actor.characterId) throw new Error("行动角色没有职业");
    if (room.pendingRollDecision) throw new Error("请先完成投后选择");
    if (room.pendingRoll) {
      return resolvePendingRoll(room, actor.id, ctx);
    }
    if (!actor.selectedTargetId) throw new Error("请先选择一个目标");
    const target = getPlayerOrThrow(room, actor.selectedTargetId);
    if (target.isDead || target.teamId === actor.teamId) throw new Error("请先选择一个存活敌人");

    saveSnapshot(room, actor.id, ctx);
    expireEffectsAtTurnStart(room, actor.id);
    decrementSummonerCooldown(actor);
    const events: GameEvent[] = [];
    applyTurnStartCharacterEffects(room, actor, events, ctx);

    const first = ctx.rollDice();
    const actorCharacter = characters[actor.characterId];
    events.push(makeEvent(ctx.now, ctx.makeId, "roll", `${actor.nickname}（${actorCharacter.name}）投出了 ${first} 点`, actor.id, target.id, [first]));

    room.pendingRollDecision = createPendingRollDecision(room, actor, target, first, events[0].id, ctx);
    room.battleLog.unshift(...events);
    return { room, events };
  }

  // classic mode
  const actor = getActivePlayer(room);
  if (actor.id !== playerId) throw new Error("还没有轮到你");
  if (actor.isDead) throw new Error("死亡玩家不能行动");
  if (!actor.characterId) throw new Error("当前玩家没有职业");

  if (room.pendingRollDecision) throw new Error("请先完成投后选择");

  if (room.pendingRoll) {
    return resolvePendingRoll(room, playerId, ctx);
  }

  const guardCheckStarted = beginGuardCheckIfNeeded(room, actor.id);
  if (guardCheckStarted) return { room, events: [] };

  const target = actor.selectedTargetId ? getPlayerOrThrow(room, actor.selectedTargetId) : undefined;
  if (!target || target.isDead || target.id === actor.id) throw new Error("请先选择一个存活敌人");

  saveSnapshot(room, actor.id, ctx);
  expireEffectsAtTurnStart(room, actor.id);
  decrementSummonerCooldown(actor);
  const events: GameEvent[] = [];
  applyTurnStartCharacterEffects(room, actor, events, ctx);

  let first = ctx.rollDice();

  const dicePerks = resolveRogueliteDicePerks({
    roll: first,
    isRoguelite: room.gameMode === "pve_roguelite",
    actorIsBot: Boolean(actor.isBot),
    hasFateTokens: Boolean(actor.roguelitePerkStacks?.["fate_tokens"]),
    fateTokens: actor.rogueliteFateTokens,
    hasLuckyFloor: Boolean(actor.roguelitePerkStacks?.["lucky_floor"]),
    consecutiveLowRolls: actor.rogueliteConsecutiveLowRolls,
    hasLowRollCharge: Boolean(actor.roguelitePerkStacks?.["low_roll_charge"]),
    lowRollCharge: actor.rogueliteLowRollCharge,
    lowRollDefenseShield: actor.rogueliteLowRollDefenseShield,
    shield: actor.shield
  });
  if (dicePerks.applied) {
    first = dicePerks.roll;
    if (dicePerks.fateTokens !== undefined) actor.rogueliteFateTokens = dicePerks.fateTokens;
    if (dicePerks.consecutiveLowRolls !== undefined) actor.rogueliteConsecutiveLowRolls = dicePerks.consecutiveLowRolls;
    if (dicePerks.lowRollCharge !== undefined) actor.rogueliteLowRollCharge = dicePerks.lowRollCharge;
    if (dicePerks.shield !== undefined) actor.shield = dicePerks.shield;
    for (const message of dicePerks.messages) {
      events.push(makeEvent(ctx.now, ctx.makeId, "skill", message, actor.id));
    }
  }

  const actorCharacter = characters[actor.characterId];
  events.push(makeEvent(ctx.now, ctx.makeId, "roll", `${actor.nickname}（${actorCharacter.name}）投出了 ${first} 点`, actor.id, target.id, [first]));

  room.pendingRollDecision = createPendingRollDecision(room, actor, target, first, events[0].id, ctx);
  room.battleLog.unshift(...events);
  return { room, events };
}

export function serializeRoom(room: Room): Room {
  return JSON.parse(JSON.stringify(room)) as Room;
}

export function confirmRollDecision(
  room: Room,
  playerId: string,
  decisionId: string,
  choice: RollDecisionChoice,
  ctx: EngineContext,
  summonerSkillId?: SummonerSkillId,
  selfDamageAmount?: number,
  requesterId?: string
): RollResult {
  const decision = room.pendingRollDecision;
  if (!decision || decision.id !== decisionId || decision.phase !== "waiting_reaction") throw new Error("投后选择已失效");
  if (room.phase !== "battle") throw new Error("游戏尚未开始");

  let actor: Player;

  if (room.gameMode === "duo_2v2") {
    const controllerId = requesterId ?? playerId;
    actor = getPlayerOrThrow(room, decision.actorId);
    if (actor.isDead) throw new Error("行动角色已死亡");
    if (actor.controllerId !== controllerId) throw new Error("行动角色不属于当前控制者");
  } else {
    // classic
    if (decision.actorId !== playerId) throw new Error("只有当前行动玩家可以选择");
    actor = getPlayerOrThrow(room, decision.actorId);
    if (getActivePlayer(room).id !== actor.id) throw new Error("还没有轮到你");
  }

  const target = getPlayerOrThrow(room, decision.targetId);

  if (actor.isDead) throw new Error("死亡玩家不能行动");
  if (!actor.characterId) throw new Error("当前玩家没有职业");

  const rollEvent = findRollEvent(room, decision.rollEventId) ?? makeEvent(ctx.now, ctx.makeId, "roll", `${actor.nickname} 投出了 ${decision.rawRoll} 点`, actor.id, target.id, [decision.rawRoll]);

  const normalizedChoice = normalizeRollDecisionChoice(choice);
  const selectedAction = getAllowedRollDecisionAction(decision, normalizedChoice, summonerSkillId);

  if (normalizedChoice === "summoner_skill") {
    return confirmSummonerSkill(room, actor, target, decision, rollEvent, ctx, summonerSkillId);
  }

  if (normalizedChoice === "character_skill") {
    if (!decision.canUseCharacterSkill || !decision.availableCharacterSkillId) throw new Error("当前没有可发动的职业技能");
    room.pendingRollDecision = undefined;
    const pending = createPendingRoll(actor, target, decision.currentRoll);
    if (pending && (decision.availableCharacterSkillId === "gunslinger_barrage" || decision.availableCharacterSkillId === "vampire_blood_rite")) {
      room.pendingRoll = pending;
      const events = [makeEvent(ctx.now, ctx.makeId, "skill", pending.message, actor.id, target.id, [decision.currentRoll])];
      room.skillHints = createSkillHints([pendingSkillHintDraft(pending.type)], actor.id, rollEvent.id, ctx);
      room.battleLog.unshift(...events);
      return { room, events };
    }

    const outcome = resolveSkill(actor.characterId, decision.currentRoll, room.previousFinalDamage, actor.hp, actor.maxHp, target.hp, target.maxHp, actor.guarding ?? false, target.flameMarks ?? 0, { useOptionalCharacterSkill: true, selfDamageAmount });
    return finishDecisionAction(room, actor, target, outcome, rollEvent, ctx);
  }

  if (normalizedChoice === "roguelite_skill") {
    const skillId = (selectedAction.skillId as string) ?? "";

    if (skillId === "gunner_triple_shot") {
      // Two-roll pattern: first roll (6) triggers, second roll determines damage
      room.pendingRollDecision = undefined;
      const pending: PendingRoll = {
        playerId: actor.id,
        type: "roguelite_gunner_triple_shot",
        targetId: target.id,
        sourceRoll: decision.rawRoll,
        characterId: actor.characterId!,
        message: "枪手技能发动：进行技能骰投掷！"
      };
      room.pendingRoll = pending;
      const events = [makeEvent(ctx.now, ctx.makeId, "skill", `投出 ${decision.rawRoll} 点，发动枪手技能！请继续投技能骰`, actor.id, target.id, [decision.rawRoll])];
      room.battleLog.unshift(...events);
      return { room, events };
    }

    // Other roguelite skills resolve immediately
    room.pendingRollDecision = undefined;
    const outcome = resolveSkill(actor.characterId, decision.currentRoll, room.previousFinalDamage, actor.hp, actor.maxHp, target.hp, target.maxHp, actor.guarding ?? false, target.flameMarks ?? 0, { useOptionalCharacterSkill: false });
    outcome.rogueliteSkillId = skillId;
    return finishDecisionAction(room, actor, target, outcome, rollEvent, ctx);
  }

  if (normalizedChoice !== "normal_attack") throw new Error("未知的投后选择");
  room.pendingRollDecision = undefined;
  const outcome = resolveSkill(actor.characterId, decision.currentRoll, room.previousFinalDamage, actor.hp, actor.maxHp, target.hp, target.maxHp, actor.guarding ?? false, target.flameMarks ?? 0, { useOptionalCharacterSkill: false });
  return finishDecisionAction(room, actor, target, outcome, rollEvent, ctx);
}

function confirmSummonerSkill(
  room: Room,
  actor: Player,
  target: Player,
  decision: PendingRollDecision,
  rollEvent: GameEvent,
  ctx: EngineContext,
  requestedSkillId?: SummonerSkillId
): RollResult {
  if (room.gameMode === "pve_roguelite") throw new Error("肉鸽模式不能发动召唤师技能");
  const skillId = requestedSkillId ?? decision.availableSummonerSkillId;
  ensureSummonerSkill(actor);
  if (!skillId || skillId !== decision.availableSummonerSkillId || skillId !== actor.summonerSkillId) throw new Error("当前没有可发动的召唤师技能");
  if (decision.isFollowUpRoll) throw new Error("继续投骰不能发动召唤师技能");
  if (decision.usedSummonerSkillId) throw new Error("本次行动已经发动过召唤师技能");
  if ((actor.summonerSkillCooldown ?? 0) > 0) throw new Error("召唤师技能冷却中");

  if (skillId === "first_aid" || skillId === "iron_wall") {
    actor.summonerSkillCooldown = getSummonerSkillCooldown(actor, 3);
    room.pendingRollDecision = undefined;
    const outcome = createNonAttackSummonerSkillOutcome(skillId, decision.currentRoll)!;
    return finishDecisionAction(room, actor, target, outcome, rollEvent, ctx);
  }

  if (skillId === "last_stand") {
    const outcome = applyLastStandOutcome(resolveSkill(actor.characterId as CharacterId, decision.currentRoll, room.previousFinalDamage, actor.hp, actor.maxHp, target.hp, target.maxHp, actor.guarding ?? false, target.flameMarks ?? 0, { useOptionalCharacterSkill: false }));
    actor.summonerSkillCooldown = getSummonerSkillCooldown(actor, 3);
    room.pendingRollDecision = undefined;
    return finishDecisionAction(room, actor, target, outcome, rollEvent, ctx);
  }

  if (skillId === "lucky_plus_one") {
    const rollChange = createSummonerRollChange(skillId, decision.currentRoll)!;
    return confirmChangedRollSummonerSkill(room, actor, target, decision, rollEvent, ctx, skillId, rollChange);
  }

  if (skillId === "fate_reroll") {
    const rollChange = createSummonerRollChange(skillId, decision.currentRoll, { reroll: ctx.rollDice() })!;
    return confirmChangedRollSummonerSkill(room, actor, target, decision, rollEvent, ctx, skillId, rollChange);
  }

  throw new Error("未知的召唤师技能");
}

function confirmChangedRollSummonerSkill(
  room: Room,
  actor: Player,
  target: Player,
  decision: PendingRollDecision,
  rollEvent: GameEvent,
  ctx: EngineContext,
  skillId: SummonerSkillId,
  rollChange: SummonerRollChange
): RollResult {
  actor.summonerSkillCooldown = getSummonerSkillCooldown(actor, 3);
  rollEvent.dice = [rollChange.nextRoll];
  rollEvent.message = `${actor.nickname} ${rollChange.message}`;

  const characterSkill = getAvailableCharacterReactionSkill(actor.characterId, rollChange.nextRoll);
  const nextActions = createAvailableActions(room, actor, target, rollChange.nextRoll, characterSkill, undefined, true);
  const resolution = createSummonerChangedRollResolution(decision, {
    id: ctx.makeId(),
    nextRoll: rollChange.nextRoll,
    characterSkill,
    availableActions: nextActions,
    usedSummonerSkillId: skillId
  });

  if (resolution.shouldWaitForCharacterSkill) {
    room.pendingRollDecision = resolution.decision;
    return { room, events: [] };
  }

  room.pendingRollDecision = undefined;
  const outcome = resolveSkill(actor.characterId as CharacterId, rollChange.nextRoll, room.previousFinalDamage, actor.hp, actor.maxHp, target.hp, target.maxHp, actor.guarding ?? false, target.flameMarks ?? 0, { useOptionalCharacterSkill: false });
  return finishDecisionAction(room, actor, target, outcome, rollEvent, ctx);
}

function finishDecisionAction(room: Room, actor: Player, target: Player, outcome: SkillOutcome, rollEvent: GameEvent, ctx: EngineContext): RollResult {
  room.battleLog = room.battleLog.filter((event) => event.id !== rollEvent.id);
  return finishAction(room, actor, target, outcome, [rollEvent], ctx);
}

function createPendingRollDecision(
  room: Room,
  actor: Player,
  target: Player,
  roll: number,
  rollEventId: string,
  ctx: Pick<EngineContext, "now" | "makeId">
): PendingRollDecision {
  const characterSkill = getAvailableCharacterReactionSkill(actor.characterId, roll);
  const summonerSkill = getAvailableSummonerSkill(room, actor, target, roll);
  const actions = createAvailableActions(room, actor, target, roll, characterSkill, summonerSkill, false);

  return {
    id: ctx.makeId(),
    actorId: actor.id,
    targetId: target.id,
    rawRoll: roll,
    currentRoll: roll,
    phase: "waiting_reaction",
    canUseCharacterSkill: Boolean(characterSkill),
    availableCharacterSkillId: characterSkill?.id,
    availableCharacterSkillName: characterSkill?.name,
    availableSummonerSkillId: summonerSkill?.id,
    availableSummonerSkillName: summonerSkill?.name,
    availableActions: actions,
    rollEventId,
    createdAt: ctx.now(),
    isFollowUpRoll: false
  };
}

function createAvailableActions(
  room: Room,
  actor: Player,
  target: Player,
  roll: number,
  characterSkill: { id: CharacterReactionSkillId; name: string } | undefined,
  summonerSkill: { id: SummonerSkillId; name: string } | undefined,
  usedSummonerSkillThisAction: boolean
): RollDecisionAvailableAction[] {
  const actions: RollDecisionAvailableAction[] = [
    {
      id: "normal_attack",
      label: "普通攻击",
      enabled: true,
      description: `使用 🎲 ${roll} 进行普通结算`,
      reason: undefined
    }
  ];

  if (characterSkill) {
    actions.push({
      id: "character_skill",
      label: `发动【${characterSkill.name}】`,
      enabled: true,
      description: characterSkillDescription(characterSkill.id, roll),
      skillId: characterSkill.id,
      skillName: characterSkill.name,
      requiresSelfDamageAmount: characterSkill.id === "self_destruct"
    });
  }

  if (summonerSkill) {
    actions.push({
      id: "summoner_skill",
      label: `发动【${summonerSkill.name}】`,
      enabled: true,
      description: summonerSkillDescription(summonerSkill.id, roll),
      skillId: summonerSkill.id,
      skillName: summonerSkill.name
    });
  }

  // Roguelite character skills — only for human players in roguelite mode
  if (room.gameMode === "pve_roguelite" && !actor.isBot) {
    const gunnerLevel = actor.roguelitePerkStacks?.["gunner_triple_shot"] ?? 0;
    if (gunnerLevel > 0) {
      const canUse = (gunnerLevel >= 3 && roll >= 5) || roll === 6;
      if (canUse) {
        actions.push({
          id: "roguelite_skill",
          label: "枪手技能：三倍射击",
          enabled: true,
          description: gunnerLevel >= 2 ? `造成三倍伤害，额外 +3（Lv.${gunnerLevel}）` : "造成三倍伤害",
          skillId: "gunner_triple_shot" as unknown as SummonerSkillId,
          skillName: "三倍射击"
        });
      }
    }
  }

  return actions;
}

function summonerSkillDescription(skillId: SummonerSkillId, roll: number): string {
  if (skillId === "lucky_plus_one") return `🎲 ${roll} → 🎲 ${Math.min(6, roll + 1)}`;
  if (skillId === "first_aid") return `本次改为回复自己 ${roll} 点`;
  if (skillId === "iron_wall") return `本次改为获得 ${roll} 点护盾`;
  if (skillId === "fate_reroll") return "重新投一次，必须接受新结果";
  return "本次伤害 +2，自己受 2 点反噬";
}

function summonerSkillUnavailableReason(room: Room, actor: Player, target: Player, roll: number, usedSummonerSkillThisAction: boolean): string {
  ensureSummonerSkill(actor);
  if (usedSummonerSkillThisAction) return "本次行动已使用";
  if (actor.isDead) return "死亡玩家不可用";
  if ((actor.summonerSkillCooldown ?? 0) > 0) return `冷却中：${actor.summonerSkillCooldown} 次行动`;
  return "当前不可用";
}

function getAvailableSummonerSkill(room: Room, actor: Player, target: Player, roll: number): { id: SummonerSkillId; name: string } | undefined {
  if (room.gameMode === "pve_roguelite") return undefined;
  if (!actor.summonerSkillId) return undefined;
  ensureSummonerSkill(actor);
  if (actor.isDead || (actor.summonerSkillCooldown ?? 0) > 0) return undefined;
  const skillId = actor.summonerSkillId as SummonerSkillId;
  return { id: skillId, name: summonerSkillName(skillId) };
}

function ensureSummonerSkill(player: Player): void {
  player.summonerSkillId ??= "lucky_plus_one";
  player.summonerSkillCooldown ??= 0;
}

function decrementSummonerCooldown(player: Player): void {
  ensureSummonerSkill(player);
  player.summonerSkillCooldown = Math.max(0, (player.summonerSkillCooldown ?? 0) - 1);
}

function summonerSkillName(skillId: SummonerSkillId): string {
  if (skillId === "first_aid") return "急救术";
  if (skillId === "iron_wall") return "铁壁";
  if (skillId === "fate_reroll") return "命运重掷";
  if (skillId === "last_stand") return "破釜";
  return "幸运骰";
}

function findRollEvent(room: Room, rollEventId: string): GameEvent | undefined {
  return room.battleLog.find((event) => event.id === rollEventId && event.type === "roll");
}

function resolvePendingRoll(room: Room, playerId: string, ctx: EngineContext): RollResult {
  const pending = room.pendingRoll;
  if (!pending) throw new Error("没有待继续投骰");
  if (pending.playerId !== playerId) throw new Error("只有触发技能的玩家可以继续投骰");

  const actor = getPlayerOrThrow(room, pending.playerId);
  const target = pending.targetId ? getPlayerOrThrow(room, pending.targetId) : undefined;
  if (!target || target.isDead) throw new Error("目标已不存在或已死亡");

  const second = ctx.rollDice();
  const dice = [pending.sourceRoll, second];
  const events: GameEvent[] = [
    makeEvent(ctx.now, ctx.makeId, "roll", `${actor.nickname} 继续投骰，投出了 ${second} 点`, actor.id, target.id, dice)
  ];

  let outcome: SkillOutcome;
  if (pending.type === "gunslinger_bonus_damage") {
    outcome = {
      damage: second * 3,
      healing: 0,
      shieldGain: 0,
      selfDamage: 0,
      ignoresShield: false,
      grantsInvincible: false,
      executesTarget: false,
      flameMarksToAdd: 0,
      clearsFlameMarks: false,
      entersGuarding: false,
      dice,
      skillMessages: [`枪手第二次骰点 ${second} x3，最终伤害 ${second * 3}`],
      skillHints: []
    };
  } else if (pending.type === "roguelite_gunner_triple_shot") {
    // Roguelite gunslinger skill: second roll is the base, ×3 applied in finishAction
    outcome = {
      damage: second,
      healing: 0,
      shieldGain: 0,
      selfDamage: 0,
      ignoresShield: false,
      grantsInvincible: false,
      executesTarget: false,
      flameMarksToAdd: 0,
      clearsFlameMarks: false,
      entersGuarding: false,
      dice,
      skillMessages: [`枪手技能骰为 ${second} 点`],
      skillHints: [{ key: "gunner-triple-shot", text: "三倍射击！" }],
      rogueliteSkillId: "gunner_triple_shot"
    };
  } else if (pending.type === "vampire_bonus_heal") {
    outcome = {
      damage: 0,
      healing: second * 3,
      shieldGain: 0,
      selfDamage: 0,
      ignoresShield: false,
      grantsInvincible: false,
      executesTarget: false,
      flameMarksToAdd: 0,
      clearsFlameMarks: false,
      entersGuarding: false,
      dice,
      skillMessages: [`吸血鬼第二次骰点 ${second} x3，回复 ${second * 3} 点血`],
      skillHints: []
    };
  } else {
    throw new Error("未知的继续投骰类型");
  }

  room.pendingRoll = undefined;
  return finishAction(room, actor, target, outcome, events, ctx);
}

function createPendingRoll(actor: Player, target: Player, first: number): PendingRoll | undefined {
  if (actor.characterId === "gunslinger" && first === 6) {
    return {
      playerId: actor.id,
      type: "gunslinger_bonus_damage",
      targetId: target.id,
      sourceRoll: first,
      characterId: actor.characterId,
      message: "枪手触发暴击！请继续投骰"
    };
  }
  if (actor.characterId === "vampire" && first === 6) {
    return {
      playerId: actor.id,
      type: "vampire_bonus_heal",
      targetId: target.id,
      sourceRoll: first,
      characterId: actor.characterId,
      message: "吸血鬼触发吸血恢复！请继续投骰"
    };
  }
  return undefined;
}

function pendingSkillHintDraft(type: PendingRoll["type"]): SkillHintDraft {
  if (type === "gunslinger_bonus_damage") {
    return { key: "gunslinger-6", text: "连射准备！" };
  }
  if (type === "vampire_bonus_heal") {
    return { key: "vampire-6", text: "血祭回复准备！" };
  }
  return { key: type, text: "技能准备！" };
}

function finishAction(room: Room, actor: Player, target: Player, outcome: SkillOutcome, events: GameEvent[], ctx: EngineContext): RollResult {
  const actorHpAtActionStart = actor.hp;
  const rollId = events.find((event) => event.type === "roll")?.id;
  const previousOwnRoll = findPreviousOwnRoll(room, actor.id);
  const skillHintDrafts = [...outcome.skillHints];

  for (const message of outcome.skillMessages) {
    events.push(makeEvent(ctx.now, ctx.makeId, "skill", `${actor.nickname} 触发技能：${message}`, actor.id, target.id, outcome.dice));
  }

  if (outcome.grantsInvincible) {
    room.effects = room.effects.filter((effect) => !(effect.type === "invincible" && effect.sourcePlayerId === actor.id));
    room.effects.push({
      id: ctx.makeId(),
      type: "invincible",
      sourcePlayerId: actor.id,
      expiresAtSourceTurnStartPlayerId: actor.id
    });
  }

  // ── Roguelite Boss Skills (pre-damage) ──
  if (room.gameMode === "pve_roguelite" && actor.isBot && actor.rogueliteBossId) {
    const bossState = actor.rogueliteBossState ?? {};
    const firstRoll = outcome.dice[0] ?? 0;

    if (actor.rogueliteBossId === "boss_boxer_king") {
      // 蓄力: roll 1 or 2 → gain charge, no damage
      if (firstRoll === 1 || firstRoll === 2) {
        bossState.charge = ((bossState.charge as number) ?? 0) + 1;
        outcome.damage = 0;
        outcome.skillMessages.push("小Boss：拳王开始蓄力，下一次攻击更危险！");
        skillHintDrafts.push({ key: "boss-charge", text: "蓄力！" });
      }
      // 重拳: consume charge for extra damage
      const charge = (bossState.charge as number) ?? 0;
      if (charge > 0 && outcome.damage > 0) {
        const extraDamage = charge * 3;
        outcome.damage += extraDamage;
        outcome.skillMessages.push(`拳王释放蓄力重拳！额外伤害 +${extraDamage}！`);
        skillHintDrafts.push({ key: "boss-heavy-punch", text: "蓄力重拳！", valueText: `+${extraDamage}` });
        bossState.charge = 0;
      }
      // 狂暴: HP < 50% → damage +2
      if (outcome.damage > 0) {
        if (!bossState.enraged && actor.hp < actor.maxHp * 0.5) {
          bossState.enraged = true;
          outcome.skillMessages.push("拳王进入狂暴状态，伤害 +2！");
        }
        if (bossState.enraged) outcome.damage += 2;
      }
      actor.rogueliteBossState = bossState;
    }

    if (actor.rogueliteBossId === "boss_blood_demon") {
      // 血盾: roll 3 → gain shield, no attack
      if (firstRoll === 3) {
        outcome.damage = 0;
        outcome.shieldGain = 4;
        outcome.skillMessages.push("血魔凝聚血盾，获得 4 点护盾！");
      }
      // 血祭: HP < 40% → heal + shield (once)
      if (!bossState.bloodSacrificeUsed && actor.hp < actor.maxHp * 0.4 && actor.hp > 0) {
        bossState.bloodSacrificeUsed = true;
        outcome.healing += 5;
        outcome.shieldGain += 3;
        outcome.skillMessages.push("血魔发动血祭，回复 5 点生命并获得 3 点护盾！");
      }
      actor.rogueliteBossState = bossState;
    }

    if (actor.rogueliteBossId === "boss_shield_guard") {
      if (firstRoll === 1 || firstRoll === 2) {
        outcome.damage = 0;
        outcome.shieldGain = 5;
        bossState.guarding = true;
        bossState.guardReduction = 2;
        outcome.skillMessages.push("山盾守卫架起巨盾，获得 5 点护盾并准备减伤！");
        skillHintDrafts.push({ key: "boss-guard", text: "架盾！" });
      }
      actor.rogueliteBossState = bossState;
    }

    if (actor.rogueliteBossId === "boss_god_berserker" && outcome.damage > 0) {
      const missingHp = Math.max(0, actor.maxHp - actor.hp);
      outcome.damage += missingHp;
      outcome.skillMessages.push(`神狂战狂战增伤：已损失生命 +${missingHp}！`);
      skillHintDrafts.push({ key: "god-berserker-fury", text: "狂战增伤", valueText: `+${missingHp}` });
      actor.rogueliteBossState = bossState;
    }

    // ── 赌命庄家 Boss ──
    if (actor.rogueliteBossId === "boss_gambler_dealer") {
      // 骰子操控: roll 1-3 → reroll (must accept)
      if (firstRoll >= 1 && firstRoll <= 3) {
        const reroll = ctx.rollDice();
        outcome.dice = [reroll];
        outcome.damage = reroll;
        outcome.skillMessages.push(`赌命庄家投出 ${firstRoll}，发动骰子操控，重投为 ${reroll}！`);
      }
      // 庄家通吃: HP < 30% → damage +3
      if (actor.hp < actor.maxHp * 0.3 && outcome.damage > 0) {
        if (!bossState.lowHpMode) {
          bossState.lowHpMode = true;
          outcome.skillMessages.push("赌命庄家发动庄家通吃，伤害 +3！");
        }
        if (bossState.lowHpMode) outcome.damage += 3;
      }
      actor.rogueliteBossState = bossState;
    }

    // ── Elite: 铁皮精英 ──
    if (actor.rogueliteBossId === "elite_iron_skin") {
      // 每回合开始获得 2 护盾
      outcome.shieldGain += 2;
      // Passive armor in getArmor
    }

    // ── Elite: 狂暴精英 ──
    if (actor.rogueliteBossId === "elite_berserker" && outcome.damage > 0) {
      if (actor.hp < actor.maxHp * 0.5) {
        outcome.damage += 3;
        outcome.skillMessages.push("狂暴精英低血狂暴，伤害 +3！");
      }
    }

    // ── 普通怪：破盾兵 ──
    if (actor.rogueliteBossId === "normal_shield_breaker" && outcome.damage > 0) {
      const targetShield = target.shield;
      if (targetShield > 0) {
        outcome.damage += 2;
        outcome.skillMessages.push("破盾兵击中护盾，额外 +2 伤害！");
      }
    }

    // ── 普通怪：赌徒 ──
    if (actor.rogueliteBossId === "normal_gambler") {
      if (firstRoll === 1) {
        outcome.damage = 0;
        outcome.selfDamage = 1;
        outcome.skillMessages.push("赌徒失手，自伤 1 点！");
      }
      if (firstRoll === 6 && outcome.damage > 0) {
        outcome.damage += 2;
        outcome.skillMessages.push("赌徒大赢，本次伤害 +2！");
      }
    }

    // ── 精英：收割精英 ──
    if (actor.rogueliteBossId === "elite_reaper" && outcome.damage > 0) {
      if (target.hp < target.maxHp * 0.4) {
        outcome.damage += 2;
        outcome.skillMessages.push("收割精英嗅到残血，伤害 +2！");
      }
    }
  }

  // Roguelite boss ability: berserker_blood (stackable)
  const berserkerLevel = actor.roguelitePerkStacks?.["berserker_blood"] ?? 0;
  if (berserkerLevel > 0 && outcome.damage > 0) {
    const missingHp = Math.max(0, actor.maxHp - actor.hp);
    const baseBonus = Math.floor(missingHp / 2);
    const extraBonus = (berserkerLevel - 1) * 2;
    const totalBonus = baseBonus + extraBonus;
    if (totalBonus > 0) {
      outcome.damage += totalBonus;
      outcome.skillMessages.push(`狂怒之血 Lv.${berserkerLevel} 触发，额外伤害 +${totalBonus}`);
      skillHintDrafts.push({ key: "berserker-blood", text: "狂怒之血", valueText: `+${totalBonus}` });
    }
  }

  // Roguelite boss ability: dragon_courage (stackable)
  const dragonLevel = actor.roguelitePerkStacks?.["dragon_courage"] ?? 0;
  if (dragonLevel > 0 && outcome.damage > 0) {
    outcome.ignoresShield = true;
    const extraDamage = dragonLevel - 1;
    if (extraDamage > 0) {
      outcome.damage += extraDamage;
      outcome.skillMessages.push(`龙胆之力 Lv.${dragonLevel} 触发，额外伤害 +${extraDamage}`);
    }
  }

  // Roguelite growth stats — damage bonus
  let growthBonus = actor.rogueliteDamageBonus ?? 0;
  // Perk: 翻盘之力 — extra damage when HP < 50%
  if ((actor.rogueliteComebackDamage ?? 0) > 0 && actor.hp < actor.maxHp * 0.5) {
    growthBonus += actor.rogueliteComebackDamage!;
  }
  // Perk: 盾击 — bonus damage when actor has shield
  if ((actor.rogueliteShieldStrikeBonus ?? 0) > 0 && actor.shield > 0 && outcome.damage > 0 && !actor.isBot) {
    growthBonus += actor.rogueliteShieldStrikeBonus!;
    outcome.skillMessages.push(`盾击触发，拥有护盾，伤害 +${actor.rogueliteShieldStrikeBonus}`);
  }
  // Perk: 护盾过载 — once per stage, first attack with shield
  if (actor.roguelitePerkStacks?.["shield_overload"] && !actor.rogueliteShieldOverloadUsed && actor.shield > 0 && outcome.damage > 0 && !actor.isBot) {
    const consumed = Math.min(10, actor.shield);
    actor.shield -= consumed;
    const extraDamage = Math.floor(consumed / 2);
    if (extraDamage > 0) {
      growthBonus += extraDamage;
      outcome.skillMessages.push(`护盾过载触发，消耗 ${consumed} 护盾，额外伤害 +${extraDamage}`);
    }
    actor.rogueliteShieldOverloadUsed = true;
  }
  // Perk: 低点蓄力 — consume charge on high-roll attack
  const lowCharge = actor.rogueliteLowRollCharge ?? 0;
  if (lowCharge > 0 && outcome.damage > 0 && !actor.isBot) {
    const roll = outcome.dice[0] ?? 0;
    if (roll >= 5) {
      const chargeBonus = lowCharge * 2;
      growthBonus += chargeBonus;
      outcome.skillMessages.push(`低点蓄力触发，消耗 ${lowCharge} 层蓄力，额外伤害 +${chargeBonus}`);
      actor.rogueliteLowRollCharge = 0;
    }
  }
  if (growthBonus > 0 && outcome.damage > 0) {
    outcome.damage += growthBonus;
    if (growthBonus > (actor.rogueliteDamageBonus ?? 0)) {
      outcome.skillMessages.push(`伤害计算：骰点基础 ${outcome.damage - growthBonus} + 成长加成 ${growthBonus} = ${outcome.damage}`);
    }
  }

  // Roguelite character skills — only via selectable action (outcome.rogueliteSkillId)
  if (outcome.rogueliteSkillId === "gunner_triple_shot" && outcome.damage > 0) {
    const gunnerLevel = actor.roguelitePerkStacks?.["gunner_triple_shot"] ?? actor.rogueliteSkillStacks?.["gunner_triple_shot"] ?? 0;
    const baseWithBonuses = outcome.damage;
    outcome.damage = baseWithBonuses * 3;
    if (gunnerLevel >= 2) outcome.damage += 3;
    outcome.skillMessages.push("枪手技能发动：三倍射击！");
    outcome.skillMessages.push(`三倍结算：（技能骰基础 ${baseWithBonuses}）×3 = ${outcome.damage}${gunnerLevel >= 2 ? `（含 Lv.${gunnerLevel} 额外 +3）` : ""}`);
    skillHintDrafts.push({ key: "gunner-triple-shot", text: "三倍射击！", valueText: `-${outcome.damage}` });
  }

  // Zhao Zilong roguelite passive: pierce shield/armor on all attacks
  const zhaoyunPierceLevel = actor.roguelitePerkStacks?.["zhaoyun_pierce"] ?? actor.rogueliteSkillStacks?.["zhaoyun_pierce"] ?? 0;
  if ((outcome.rogueliteSkillId === "zhaoyun_pierce" || zhaoyunPierceLevel > 0) && outcome.damage > 0) {
    outcome.ignoresShield = true;
    const extraDamage = Math.max(0, Math.min(2, zhaoyunPierceLevel - 1));
    outcome.damage += extraDamage;
    outcome.skillMessages.push("赵子龙技能发动：破阵！本次攻击无视护盾和护甲。");
    if (extraDamage > 0) outcome.skillMessages.push(`穿透伤害额外 +${extraDamage}`);
  }

  if (room.gameMode === "pve_roguelite" && outcome.damage > 0) {
    const fatigueBonus = getRogueliteFatigueBonus(room);
    if (fatigueBonus > 0) {
      outcome.damage += fatigueBonus;
      events.push(makeEvent(ctx.now, ctx.makeId, "skill", `狂化加成：本次攻击伤害 +${fatigueBonus}`, actor.id, target.id, outcome.dice));
    }
  }

  let finalDamage = 0;
  let hpDamage = 0;
  const invincible = hasInvincible(room);
  if (outcome.executesTarget) {
    if (invincible) {
      outcome.executesTarget = false;
      events.push(makeEvent(ctx.now, ctx.makeId, "damage", "全员无敌生效，本次伤害为 0", actor.id, target.id, outcome.dice, 0));
    } else {
      const targetHpBeforeDamage = target.hp;
      const damageResult = applyDamage(room, target, outcome.damage, outcome.ignoresShield);
      finalDamage = damageResult.damage;
      hpDamage = damageResult.hpDamage;
      applyGodBerserkerThresholdProtection(target, targetHpBeforeDamage, events, ctx, outcome.dice);
      if (target.isDead) {
        events.push(makeEvent(ctx.now, ctx.makeId, "damage", `${actor.nickname} 处决 ${target.nickname}，造成 ${finalDamage} 点伤害并斩杀`, actor.id, target.id, outcome.dice, finalDamage));
        skillHintDrafts.push({ key: "execution-assassin-execute", text: "处决！" });
        events.push(makeEvent(ctx.now, ctx.makeId, "death", `${target.nickname} 已死亡`, target.id));
      } else {
        outcome.executesTarget = false;
        events.push(makeEvent(ctx.now, ctx.makeId, "damage", `${actor.nickname} 处决未达成，对 ${target.nickname} 造成 ${finalDamage} 点伤害`, actor.id, target.id, outcome.dice, finalDamage));
      }
    }
  } else if (outcome.damage > 0) {
    if (invincible) {
      events.push(makeEvent(ctx.now, ctx.makeId, "damage", "全员无敌生效，本次伤害为 0", actor.id, target.id, outcome.dice, 0));
    } else {
      const targetHpBeforeDamage = target.hp;
      const damageResult = applyDamage(room, target, outcome.damage, outcome.ignoresShield);
      finalDamage = damageResult.damage;
      hpDamage = damageResult.hpDamage;
      applyGodBerserkerThresholdProtection(target, targetHpBeforeDamage, events, ctx, outcome.dice);
      const shieldText = outcome.ignoresShield ? "（无视护盾）" : "";
      events.push(makeEvent(ctx.now, ctx.makeId, "damage", `${actor.nickname} 对 ${target.nickname} 造成 ${finalDamage} 点伤害${shieldText}`, actor.id, target.id, outcome.dice, finalDamage));
      if (actor.characterId === "zhaoZilong" && finalDamage > 0) {
        skillHintDrafts.push({ key: "zhaoZilong-ignore-shield", text: "无视护盾！" });
      }
      // ── 神狂战生命阈值 ──
      if (target.rogueliteBossId === "boss_god_berserker" && !target.isDead && finalDamage > 0) {
        const bs = target.rogueliteBossState ?? {};
        const hpAfterDamage = target.hp;
        const thresholds: Array<{ key: string; value: number }> = [
          { key: "t15", value: 15 }, { key: "t10", value: 10 }, { key: "t5", value: 5 }, { key: "t1", value: 1 }
        ];
        for (const t of thresholds) {
          if (bs[t.key] === true && hpAfterDamage < t.value) {
            target.hp = t.value;
            target.isDead = false;
            const newState = { ...bs, [t.key]: false };
            if (t.value === 1) {
              newState.dyingAfterAttack = true;
              events.push(makeEvent(ctx.now, ctx.makeId, "skill", "神狂战濒死不倒！它将在最后一击后死亡！", target.id, undefined, outcome.dice));
            }
            target.rogueliteBossState = newState;
            events.push(makeEvent(ctx.now, ctx.makeId, "skill", `神狂战触发生命阈值：血量锁定在 ${t.value}！`, target.id, undefined, outcome.dice));
            break;
          }
        }
      }

      // ── 赌命庄家 赌注：玩家投6 → Boss获护盾 ──
      if (target.rogueliteBossId === "boss_gambler_dealer" && (outcome.dice[0] ?? 0) === 6 && !actor.isBot && finalDamage > 0) {
        target.shield += 3;
        events.push(makeEvent(ctx.now, ctx.makeId, "skill", "赌命庄家发动赌注，玩家投出 6，获得 3 点护盾！", target.id, undefined, outcome.dice));
      }

      if (target.isDead) {
        events.push(makeEvent(ctx.now, ctx.makeId, "death", `${target.nickname} 已死亡`, target.id));
        // Perk: 战利品 — upgrade a random non-maxed growth perk on kill
        const killHealStacks = actor.roguelitePerkStacks?.["kill_heal"] ?? 0;
        if (killHealStacks > 0 && !actor.isBot) {
          for (let i = 0; i < killHealStacks; i++) {
            const upgraded = tryUpgradeRogueliteGrowthPerk(actor, events, ctx);
            if (upgraded) {
              events.push(makeEvent(ctx.now, ctx.makeId, "skill", `战利品触发：${upgraded}`, actor.id, undefined, outcome.dice));
            }
          }
        }
      }
    }
  } else {
    events.push(makeEvent(ctx.now, ctx.makeId, "damage", `${actor.nickname} 本次没有造成伤害`, actor.id, target.id, outcome.dice, 0));
  }

  if (outcome.flameMarksToAdd > 0) {
    target.flameMarks = (target.flameMarks ?? 0) + outcome.flameMarksToAdd;
    events.push(makeEvent(ctx.now, ctx.makeId, "skill", `${target.nickname} 获得 ${outcome.flameMarksToAdd} 层火焰印记，当前 ${target.flameMarks} 层`, actor.id, target.id, outcome.dice));
  }

  if (room.gameMode === "pve_roguelite" && !actor.isBot && finalDamage > 0) {
    const flameLordLevel = actor.rogueliteSkillStacks?.["flame_lord_mark"] ?? 0;
    if (flameLordLevel > 0) {
      target.flameMarks = (target.flameMarks ?? 0) + flameLordLevel;
      events.push(makeEvent(ctx.now, ctx.makeId, "skill", `火焰领主技能触发，添加 ${flameLordLevel} 层火焰印记。当前 ${target.flameMarks} 层`, actor.id, target.id, outcome.dice));
    }
  }

  if (outcome.clearsFlameMarks) {
    target.flameMarks = 0;
    events.push(makeEvent(ctx.now, ctx.makeId, "skill", `${target.nickname} 的火焰印记被清空`, actor.id, target.id, outcome.dice));
  }

  if (outcome.entersGuarding) {
    actor.guarding = true;
    events.push(makeEvent(ctx.now, ctx.makeId, "skill", `${actor.nickname} 进入架盾状态`, actor.id, undefined, outcome.dice));
  }

  if (actor.characterId === "zhaoZilong" && hpDamage > 0) {
    actor.zhaoZilongHitCount = ((actor.zhaoZilongHitCount ?? 0) + 1) % 3;
    if (actor.zhaoZilongHitCount === 0) {
      const hpGain = applyHpHealing(actor, 2);
      events.push(makeEvent(ctx.now, ctx.makeId, "heal", `${actor.nickname} 触发【龙胆】，回复 ${hpGain} 点血`, actor.id, undefined, outcome.dice, undefined, hpGain));
      skillHintDrafts.push({ key: "zhaoZilong-dragon-guts", text: "龙胆！", valueText: `+${hpGain}` });
    }
  }

  // Roguelite boss ability: vampire_instinct (stackable)
  const vampireLevel = actor.roguelitePerkStacks?.["vampire_instinct"] ?? 0;
  if (vampireLevel > 0 && hpDamage > 0) {
    const healAmount = 2 * vampireLevel;
    const { hpGain, shieldGain } = applyHealing(actor, healAmount, { overflowToShield: true });
    const shieldText = shieldGain > 0 ? `，溢出 ${shieldGain} 点转为护盾` : "";
    events.push(makeEvent(ctx.now, ctx.makeId, "heal", `${actor.nickname} 吸血本能 Lv.${vampireLevel} 回复 ${hpGain} 点血${shieldText}`, actor.id, undefined, outcome.dice, undefined, hpGain));
    if (shieldGain > 0) {
      skillHintDrafts.push({ key: "vampire-instinct", text: "吸血本能", valueText: `+${hpGain}` });
    }
  }

  if (room.gameMode === "pve_roguelite" && !actor.isBot) {
    const vampireSkillLevel = actor.rogueliteSkillStacks?.["vampire_skill"] ?? 0;
    if (vampireSkillLevel > 0 && hpDamage > 0) {
      const hpGain = applyHpHealing(actor, vampireSkillLevel);
      if (hpGain > 0) {
        events.push(makeEvent(ctx.now, ctx.makeId, "heal", `吸血鬼技能 Lv.${vampireSkillLevel} 触发，回复 ${hpGain} 点生命。`, actor.id, undefined, outcome.dice, undefined, hpGain));
      } else {
        events.push(makeEvent(ctx.now, ctx.makeId, "skill", `吸血鬼技能 Lv.${vampireSkillLevel} 触发，但生命已满。`, actor.id, undefined, outcome.dice));
      }
    }
  }

  // Roguelite passive: blood_punch (stackable via perkStacks)
  const bloodPunchLevel = actor.roguelitePerkStacks?.["blood_punch"] ?? 0;
  if (bloodPunchLevel > 0 && hpDamage > 0) {
    const hpGain = applyHpHealing(actor, bloodPunchLevel);
    if (hpGain > 0) {
      events.push(makeEvent(ctx.now, ctx.makeId, "heal", `${actor.nickname} 吸血拳法 Lv.${bloodPunchLevel} 回复 ${hpGain} 点血`, actor.id, undefined, outcome.dice, undefined, hpGain));
    }
  }

  // Perk: 饮血 — heal 3 per level on direct attack HP damage
  const drinkBloodLevel = actor.roguelitePerkStacks?.["drink_blood"] ?? 0;
  if (drinkBloodLevel > 0 && hpDamage > 0 && !actor.isBot) {
    const hpGain = applyHpHealing(actor, drinkBloodLevel * 3);
    if (hpGain > 0) {
      events.push(makeEvent(ctx.now, ctx.makeId, "heal", `饮血 Lv.${drinkBloodLevel} 回复 ${hpGain} 点血`, actor.id, undefined, outcome.dice, undefined, hpGain));
    }
  }

  if (room.gameMode === "pve_roguelite" && !actor.isBot) {
    const drinkBloodLevel = actor.roguelitePerkStacks?.["drink_blood"] ?? 0;
    if (drinkBloodLevel > 0 && hpDamage > 0) {
      const hpGain = applyHpHealing(actor, drinkBloodLevel);
      if (hpGain > 0) {
        events.push(makeEvent(ctx.now, ctx.makeId, "heal", `饮血触发，回复 ${hpGain} 生命。`, actor.id, undefined, outcome.dice, undefined, hpGain));
      } else {
        events.push(makeEvent(ctx.now, ctx.makeId, "skill", "饮血触发，但生命已满。", actor.id, undefined, outcome.dice));
      }
    }
  }

  // ── Roguelite Boss Skills (post-damage) ──
  if (room.gameMode === "pve_roguelite" && actor.isBot && actor.rogueliteBossId) {
    const bossState = actor.rogueliteBossState ?? {};

    if (actor.rogueliteBossId === "boss_blood_demon") {
      // 吸血攻击: after dealing HP damage → heal 2
      if (hpDamage > 0) {
        const bossHeal = applyHpHealing(actor, 2);
        if (bossHeal > 0) {
          events.push(makeEvent(ctx.now, ctx.makeId, "heal", `血魔吸取生命，回复 ${bossHeal} 点生命！`, actor.id, undefined, outcome.dice, undefined, bossHeal));
        }
      }
    }

    if (actor.rogueliteBossId === "boss_shield_guard") {
      // 盾击反击: if guarding and took damage → counter
      if (bossState.guarding && finalDamage > 0 && !actor.isDead) {
        const counterDmg = applyDirectDamage(target, 2);
        events.push(makeEvent(ctx.now, ctx.makeId, "damage", `山盾守卫盾击反击，造成 ${counterDmg} 点伤害！`, actor.id, target.id, outcome.dice, counterDmg));
        if (target.isDead) events.push(makeEvent(ctx.now, ctx.makeId, "death", `${target.nickname} 已死亡`, target.id));
        bossState.guarding = false;
        bossState.guardReduction = 0;
      }
      actor.rogueliteBossState = bossState;
    }

    // ── 神狂战濒死一击后死亡 ──
    if (actor.rogueliteBossId === "boss_god_berserker" && actor.rogueliteBossState?.dyingAfterAttack === true && !actor.isDead) {
      actor.hp = 0;
      actor.isDead = true;
      events.push(makeEvent(ctx.now, ctx.makeId, "death", "神狂战燃尽最后生命，倒下了！", actor.id));
    }

  }

  if (outcome.healing > 0) {
    const { hpGain, shieldGain } = applyHealing(actor, outcome.healing, { overflowToShield: actor.characterId === "vampire" });
    const shieldText = shieldGain > 0 ? `，溢出 ${shieldGain} 点转为护盾` : "";
    events.push(makeEvent(ctx.now, ctx.makeId, "heal", `${actor.nickname} 回复 ${hpGain} 点血${shieldText}`, actor.id, undefined, outcome.dice, undefined, hpGain));
    if (actor.characterId === "vampire" && shieldGain > 0) {
      skillHintDrafts.push({ key: "vampire-overflow-shield", text: "溢出转护盾！" });
    }
  }

  if (outcome.shieldGain > 0) {
    actor.shield += outcome.shieldGain;
    events.push(makeEvent(ctx.now, ctx.makeId, "skill", `${actor.nickname} 获得 ${outcome.shieldGain} 点护盾`, actor.id, undefined, outcome.dice));
  }

  if (outcome.selfDamage > 0) {
    const backlashDamage = applyDirectDamage(actor, outcome.selfDamage);
    events.push(makeEvent(ctx.now, ctx.makeId, "damage", `${actor.nickname} 受到 ${backlashDamage} 点反噬伤害`, actor.id, actor.id, outcome.dice, backlashDamage));
    if (actor.isDead) events.push(makeEvent(ctx.now, ctx.makeId, "death", `${actor.nickname} 已死亡`, actor.id));
  }

  room.skillHints = createSkillHints(skillHintDrafts, actor.id, rollId, ctx);
  room.highlight = createCharacterHighlight(actor, outcome, finalDamage, actorHpAtActionStart, previousOwnRoll, rollId, ctx);
  room.pendingRollDecision = undefined;
  room.previousFinalDamage = finalDamage;
  actor.selectedTargetId = undefined;

    const winner = getWinner(room);
  if (winner) {
    room.phase = "gameOver";
    if (room.gameMode === "duo_2v2" && room.winnerTeamId) {
      const winnerTeamName = room.winnerTeamId === "A" ? "A 队" : "B 队";
      const firstWinner = room.players.find((p) => p.teamId === room.winnerTeamId && !p.isDead);
      room.winnerId = firstWinner?.id ?? winner.id;
      events.push(makeEvent(ctx.now, ctx.makeId, "victory", `${winnerTeamName} 获胜！`, room.winnerId));
    } else {
      room.winnerId = winner.id;
      events.push(makeEvent(ctx.now, ctx.makeId, "victory", `${winner.nickname} 获胜！`, winner.id));
    }
    room.battleLog.unshift(...events);
    return { room, events, gameOver: { winnerId: room.winnerId, winnerName: `${winner.nickname}` } };
  }

  room.guardCheckCompletedForActorId = undefined;
  advanceTurn(room);
  advanceRogueliteBattleRound(room, events, ctx);
  if (room.gameMode === "duo_2v2") {
    const controllerId = room.activeControllerId;
    if (controllerId) beginControllerGuardCheckIfNeeded(room, controllerId);
  } else {
    beginGuardCheckIfNeeded(room, getActivePlayer(room).id);
  }
  events.push(makeTurnEvent(room, ctx));
  room.battleLog.unshift(...events);
  return { room, events };
}

function createSkillHints(
  drafts: SkillHintDraft[],
  actorId: string,
  rollId: string | undefined,
  ctx: Pick<EngineContext, "makeId">
): SkillHint[] | undefined {
  const uniqueDrafts = drafts.filter((draft, index) => drafts.findIndex((item) => item.key === draft.key) === index);
  if (uniqueDrafts.length === 0) return undefined;
  return uniqueDrafts.map((draft) => ({
    id: rollId ? `${rollId}:${draft.key}` : ctx.makeId(),
    actorId,
    text: draft.text,
    valueText: draft.valueText,
    rollId
  }));
}

function createCharacterHighlight(
  actor: Player,
  outcome: SkillOutcome,
  finalDamage: number,
  actorHpAtActionStart: number,
  previousOwnRoll: GameEvent | undefined,
  rollId: string | undefined,
  ctx: Pick<EngineContext, "makeId">
): CharacterHighlight | undefined {
  const diceKey = outcome.dice.join("-");
  const base = {
    actorId: actor.id,
    rollId
  };

  if (actor.characterId === "gunslinger" && diceKey === "6-6" && finalDamage === 18) {
    return {
      id: ctx.makeId(),
      type: "big_damage",
      title: "爆头！",
      valueText: "-18",
      ...base
    };
  }

  if (actor.characterId === "vampire" && diceKey === "6-6" && outcome.healing === 18) {
    return {
      id: ctx.makeId(),
      type: "big_heal",
      title: "血祭回复！",
      valueText: "+18",
      ...base
    };
  }

  if (actor.characterId === "berserker" && actorHpAtActionStart <= 2 && finalDamage >= 15) {
    return {
      id: ctx.makeId(),
      type: "big_damage",
      title: "暴怒！",
      valueText: `-${finalDamage}`,
      ...base
    };
  }

  if (actor.characterId === "execution_assassin" && outcome.executesTarget) {
    return {
      id: ctx.makeId(),
      type: "big_damage",
      title: "处决！",
      valueText: "斩杀",
      ...base
    };
  }

  if (actor.characterId === "fearless_assassin" && actorHpAtActionStart === actor.maxHp && finalDamage >= 9) {
    return {
      id: ctx.makeId(),
      type: "big_damage",
      title: "无畏突袭！",
      valueText: `-${finalDamage}`,
      ...base
    };
  }

  if (actor.characterId === "stone_titan" && outcome.dice[0] === 6 && finalDamage > 0) {
    return {
      id: ctx.makeId(),
      type: "big_damage",
      title: "巨岩碾压！",
      valueText: `-${finalDamage}`,
      ...base
    };
  }

  if (actor.characterId === "paladin" && outcome.grantsInvincible && previousOwnRoll?.dice?.[0] === 4) {
    return {
      id: ctx.makeId(),
      type: "streak",
      title: "神圣庇护！",
      valueText: "连续守护",
      ...base
    };
  }

  return undefined;
}

function findPreviousOwnRoll(room: Room, actorId: string): GameEvent | undefined {
  return room.battleLog.find((event) => event.type === "roll" && event.playerId === actorId);
}

export function beginGuardCheckIfNeeded(room: Room, actorId: string, controllerId?: string): boolean {
  if (room.pendingGuardCheck) return room.pendingGuardCheck.actorId === actorId;
  if (room.guardCheckCompletedForActorId === actorId) return false;
  const actor = getPlayerOrThrow(room, actorId);
  if (actor.characterId !== "mountain_shield" || !actor.guarding || actor.isDead) return false;
  room.pendingGuardCheck = { actorId, controllerId };
  return true;
}

export function beginControllerGuardCheckIfNeeded(room: Room, controllerId: string): boolean {
  if (room.gameMode !== "duo_2v2") return false;
  if (room.pendingGuardCheck) return room.pendingGuardCheck.controllerId === controllerId;
  const actor = room.players.find((player) =>
    player.controllerId === controllerId &&
    player.characterId === "mountain_shield" &&
    player.guarding &&
    !player.isDead &&
    room.guardCheckCompletedForActorId !== player.id
  );
  if (!actor) return false;
  room.pendingGuardCheck = { actorId: actor.id, controllerId };
  return true;
}

export function resolveGuardCheck(room: Room, actorId: string, ctx: EngineContext): RollResult {
  const pending = room.pendingGuardCheck;
  if (!pending || pending.actorId !== actorId) throw new Error("当前没有需要结算的架盾判定");
  const actor = getPlayerOrThrow(room, actorId);
  if (actor.characterId !== "mountain_shield") throw new Error("只有山盾需要架盾判定");
  if (!actor.guarding) throw new Error("山盾当前不在架盾状态");

  const guardRoll = ctx.rollDice();
  if (guardRoll >= 5) actor.guarding = false;
  room.pendingGuardCheck = undefined;
  room.guardCheckCompletedForActorId = actor.id;

  const resultText = guardRoll <= 4 ? "架盾继续" : "架盾结束";
  const event = makeEvent(ctx.now, ctx.makeId, "guardCheck", `${actor.nickname} 架盾判定 ${guardRoll}：${resultText}`, actor.id, undefined, [guardRoll]);
  room.battleLog.unshift(event);
  return { room, events: [event] };
}

function applyTurnStartCharacterEffects(room: Room, actor: Player, events: GameEvent[], ctx: EngineContext): void {
  if (actor.characterId === "crescent_moon") {
    const hpGain = applyHpHealing(actor, 2);
    events.push(makeEvent(ctx.now, ctx.makeId, "heal", `${actor.nickname} 月相恢复，回复 ${hpGain} 点血`, actor.id, undefined, undefined, undefined, hpGain));
  }
}

function applyGodBerserkerThresholdProtection(
  target: Player,
  hpBeforeDamage: number,
  events: GameEvent[],
  ctx: Pick<EngineContext, "now" | "makeId">,
  dice: number[]
): boolean {
  if (target.rogueliteBossId !== "boss_god_berserker") return false;
  const bs = target.rogueliteBossState ?? {};
  const thresholds: Array<{ key: string; value: number }> = [
    { key: "t15", value: 15 },
    { key: "t10", value: 10 },
    { key: "t5", value: 5 },
    { key: "t1", value: 1 }
  ];
  const crossed = thresholds.find((threshold) => bs[threshold.key] === true && hpBeforeDamage > threshold.value && target.hp < threshold.value);
  if (!crossed) return false;

  target.hp = crossed.value;
  target.isDead = false;
  const newState = { ...bs, [crossed.key]: false };
  for (const threshold of thresholds) {
    if (threshold.value >= crossed.value) newState[threshold.key] = false;
  }
  if (crossed.value === 1) {
    newState.dyingAfterAttack = true;
    events.push(makeEvent(ctx.now, ctx.makeId, "skill", "神狂战濒死不倒！它将在最后一击后死亡！", target.id, undefined, dice));
  }
  target.rogueliteBossState = newState;
  events.push(makeEvent(ctx.now, ctx.makeId, "skill", `神狂战触发生命阈值：血量锁定在 ${crossed.value}`, target.id, undefined, dice));
  return true;
}

function applyDamage(room: Room, target: Player, incomingDamage: number, ignoresShield: boolean): { damage: number; hpDamage: number } {
  const armor = ignoresShield ? 0 : getArmor(room, target);
  const { player, damage, hpDamage } = applyDamageToPlayer(target, incomingDamage, { armor, ignoresShield });
  Object.assign(target, player);
  return { damage, hpDamage };
}

function getArmor(room: Room, target: Player): number {
  return getCombatArmor(target, {
    gameMode: room.gameMode,
    activeAttacker: room.players[room.activePlayerIndex],
    hasMountainShieldGroupArmor: hasMountainShieldGroupArmor(room, target)
  });
}

function hasMountainShieldGroupArmor(room: Room, target: Player): boolean {
  return room.players.some((player) => {
    if (player.characterId !== "mountain_shield" || !player.guarding || player.isDead) return false;
    if (room.gameMode === "duo_2v2") return Boolean(player.teamId && target.teamId && player.teamId === target.teamId);
    return player.id === target.id;
  });
}

function applyDirectDamage(target: Player, incomingDamage: number): number {
  const { player, hpDamage } = applyDirectDamageToPlayer(target, incomingDamage);
  Object.assign(target, player);
  return hpDamage;
}

function executeTarget(target: Player): number {
  const hpDamage = target.hp;
  target.hp = 0;
  target.isDead = true;
  return hpDamage;
}

function applyHealing(player: Player, amount: number, options: { overflowToShield?: boolean } = {}): { hpGain: number; shieldGain: number } {
  const { player: nextPlayer, hpGain, shieldGain } = applyHealingToPlayer(player, amount, options);
  Object.assign(player, nextPlayer);
  return { hpGain, shieldGain };
}

function applyHpHealing(player: Player, amount: number): number {
  const { player: nextPlayer, hpGain } = applyHpHealingToPlayer(player, amount);
  Object.assign(player, nextPlayer);
  return hpGain;
}

function saveSnapshot(room: Room, currentPlayerId: string, ctx: Pick<EngineContext, "now" | "makeId">): void {
  const snapshot: ActionSnapshot = {
    id: ctx.makeId(),
    createdAt: ctx.now(),
    currentPlayerId,
    players: JSON.parse(JSON.stringify(room.players)) as Player[],
    effects: JSON.parse(JSON.stringify(room.effects)) as Effect[],
    activePlayerIndex: room.activePlayerIndex,
    previousFinalDamage: room.previousFinalDamage
  };
  room.snapshots.push(snapshot);
  if (room.snapshots.length > 50) room.snapshots.shift();
}

function expireEffectsAtTurnStart(room: Room, playerId: string): void {
  room.effects = room.effects.filter((effect) => effect.expiresAtSourceTurnStartPlayerId !== playerId);
}

function hasInvincible(room: Room): boolean {
  return room.effects.some((effect) => effect.type === "invincible");
}

function advanceTurn(room: Room): void {
  if (room.gameMode === "duo_2v2") {
    const nextControllerId = getNextDuoControllerId(room.controllerTurnOrder, room.activeControllerId);
    if (!nextControllerId) return;
    room.activeControllerId = nextControllerId;
    room.selectedActorId = undefined;
    for (const player of room.players) {
      if (player.controllerId !== nextControllerId) {
        player.selectedTargetId = undefined;
      }
    }
    return;
  }

  room.activePlayerIndex = getNextAlivePlayerIndex(room.players, room.activePlayerIndex);
}

function getRogueliteFatigueBonus(room: Room): number {
  if (room.gameMode !== "pve_roguelite") return 0;
  const round = room.roguelite?.battleRound ?? 1;
  return Math.max(0, Math.floor((round - 7) / 2));
}

function advanceRogueliteBattleRound(room: Room, events: GameEvent[], ctx: Pick<EngineContext, "now" | "makeId">): void {
  if (room.gameMode !== "pve_roguelite" || room.phase !== "battle") return;
  const roguelite = room.roguelite;
  if (!roguelite) return;

  roguelite.battleRound = (roguelite.battleRound ?? 1) + 1;
  const fatigueBonus = getRogueliteFatigueBonus(room);
  const previousAnnouncedBonus = roguelite.fatigueAnnouncedBonus ?? 0;
  roguelite.fatigueBonus = fatigueBonus;

  if (roguelite.battleRound === 9 && previousAnnouncedBonus === 0) {
    events.push(makeEvent(ctx.now, ctx.makeId, "system", "战斗进入狂化，双方伤害提升！"));
  }
  if (fatigueBonus > previousAnnouncedBonus) {
    events.push(makeEvent(ctx.now, ctx.makeId, "system", `狂化加深，双方攻击伤害 +${fatigueBonus}。`));
    roguelite.fatigueAnnouncedBonus = fatigueBonus;
  }
}

function getWinner(room: Room): Player | undefined {
  if (room.gameMode === "duo_2v2") {
    const teamA = room.players.filter((player) => player.teamId === "A" && !player.isDead);
    const teamB = room.players.filter((player) => player.teamId === "B" && !player.isDead);
    if (teamA.length === 0) {
      const winner = room.players.find((player) => player.teamId === "B" && !player.isDead);
      if (winner) {
        room.winnerTeamId = "B";
        return { ...winner }; // return a B team player but we'll use winnerTeamId
      }
    }
    if (teamB.length === 0) {
      const winner = room.players.find((player) => player.teamId === "A" && !player.isDead);
      if (winner) {
        room.winnerTeamId = "A";
        return winner;
      }
    }
    return undefined;
  }
  // classic mode
  const alive = room.players.filter((player) => !player.isDead);
  return alive.length === 1 ? alive[0] : undefined;
}

function getActivePlayer(room: Room): Player {
  const player = room.players[room.activePlayerIndex];
  if (!player) throw new Error("当前行动玩家不存在");
  return player;
}

function getPlayerOrThrow(room: Room, playerId: string): Player {
  const player = room.players.find((item) => item.id === playerId);
  if (!player) throw new Error("玩家不存在");
  return player;
}

function makeTurnEvent(room: Room, ctx: Pick<EngineContext, "now" | "makeId">): GameEvent {
  if (room.gameMode === "duo_2v2") {
    const controllerId = room.activeControllerId;
    if (!controllerId) throw new Error("2V2 控制者未指定");
    const controller = room.players.find((p) => p.controllerId === controllerId);
    const name = controller?.nickname ?? "未知玩家";
    return makeEvent(ctx.now, ctx.makeId, "turn", `轮到 ${name} 选择行动角色`, controllerId);
  }
  // classic mode
  const player = getActivePlayer(room);
  return makeEvent(ctx.now, ctx.makeId, "turn", `轮到 ${player.nickname} 行动`, player.id);
}

function makeEvent(
  now: () => number,
  makeId: IdFactory,
  type: GameEvent["type"],
  message: string,
  playerId?: string,
  targetId?: string,
  dice?: number[],
  damage?: number,
  healing?: number
): GameEvent {
  return { id: makeId(), createdAt: now(), type, message, playerId, targetId, dice, damage, healing };
}

function randomEventId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getInitialHp(characterId: CharacterId, maxHp: number): number {
  return characterId === "crescent_moon" ? 3 : maxHp;
}
