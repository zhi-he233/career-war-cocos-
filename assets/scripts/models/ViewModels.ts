/**
 * ViewModel interfaces: display-layer types that bridge shared/ types to UI components.
 * Pure data — no socket calls, no Cocos dependencies beyond basic interfaces.
 */

// ── BattleSeat ──

export interface SeatViewModel {
  playerId: string;
  playerNumber: number;
  nickname: string;
  isDead: boolean;
  isActive: boolean;
  isSelectable: boolean;
  isSelected: boolean;
  isSelf: boolean;
  characterName: string;
  summonerSkillName: string;
  hp: number;
  maxHp: number;
  hpPercent: number;
  shield: number;
  statusText: string;
  lastRollText: string;
  seatTags: string[];
  attackableLabel: string;
  targetLabel: string;
  isHost: boolean;
  isBot: boolean;
  hasInvincible: boolean;
  guardBadges: string[];
  isOnline: boolean;
}

// ── DicePanel ──

export interface DicePanelViewModel {
  currentRoll: number;
  lastRollDice: string[];
  rollPhase: 'idle' | 'fast' | 'slow' | 'pause' | 'reveal';
  isReady: boolean;
  hasRolled: boolean;
  title: string;
  detail: string;
  skillText: string;
  skillHints: SkillHintVM[];
  showRollButton: boolean;
  canRoll: boolean;
  rollButtonText: string;
}

export interface SkillHintVM {
  id: string;
  text: string;
  valueText?: string;
}

// ── ActionSlots ──

export interface ActionSlotVM {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  requiresSelfDamage: boolean;
  settling: boolean;
}

export interface SelfDestructOptionVM {
  amount: number;
  damage: number;
  disabled: boolean;
}

// ── SelfPanel ──

export interface SelfPanelVM {
  nickname: string;
  characterName: string;
  hp: number;
  maxHp: number;
  hpPercent: number;
  shield: number;
  isDead: boolean;
  isCurrentTurn: boolean;
  statusTags: string[];
  skillHintText: string;
  lastRollText: string;
}

// ── Roguelite Panel ──

export interface RogueliteBossStateChip {
  key: string;
  text: string;
  kind: 'normal' | 'enraged' | 'guarding' | 'broken';
}

export interface RoguelitePerkVM {
  id: string;
  name: string;
  level: number;
  description: string;
  category: 'growth' | 'skill' | 'boss';
}

export interface RogueliteRewardOptionVM {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tags: string[];
  icon: string;
}

export interface RoguelitePanelVM {
  enabled: boolean;
  stage: number;
  round: number;
  stageType: string;
  stageTypeLabel: string;
  phaseText: string;
  boss?: {
    name: string;
    typeLabel: string;
    hp: number;
    maxHp: number;
    shield: number;
    skills: string[];
    stateChips: RogueliteBossStateChip[];
  };
  enemy?: {
    name: string;
    typeLabel: string;
    hpBonus: number;
    shieldBonus: number;
    damageBonus: number;
    description?: string;
    skills: string[];
  };
  enemyTraits?: string[];
  fatigue?: {
    battleRound: number;
    bonus: number;
  };
  perks: {
    growth: RoguelitePerkVM[];
    skills: RoguelitePerkVM[];
    boss: RoguelitePerkVM[];
  };
  rewardPhase?: {
    title: string;
    hint: string;
    options: RogueliteRewardOptionVM[];
  };
  continuePhase?: {
    hint: string;
    nextStage: number;
  };
  resources?: {
    fateTokens?: { current: number; max: number };
    lowRollCharge?: number;
    consecutiveLowRolls?: { current: number; max: number };
    shieldOverloadUsed?: boolean;
  };
}

// ── Battle Log ──

export interface BattleLogEntryVM {
  timestamp: number;
  message: string;
  type: string;
}

// ── Map / Route ──

export interface RouteNodeVM {
  id: string;
  stage: number;
  type: string;
  typeLabel: string;
  icon: string;
  description: string;
  enemyTemplateId?: string;
  bossTemplateId?: string;
}

export interface RouteMapVM {
  stage: number;
  clearedNode: RouteNodeVM | null;
  availableNodes: RouteNodeVM[];
  previewNodes: RouteNodeVM[];
}
