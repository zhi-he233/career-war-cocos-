export type RogueliteMapRoomType =
  | "normal"
  | "elite"
  | "boss"
  | "event"
  | "shop"
  | "rest"
  | "reward";

export interface RogueliteRoomTypeConfig {
  type: RogueliteMapRoomType;
  label: string;
  icon: string;
  description: string;
  entersBattle: boolean;
  isRouteChoice: boolean;
}

export interface RogueliteMapNodeSelection {
  id: string;
  stage: number;
  type: RogueliteMapRoomType;
  enemyTemplateId?: string;
  bossTemplateId?: string;
  rewardTier?: string;
}

export const ROGUELITE_ROOM_TYPES = {
  normal: {
    type: "normal",
    label: "普通",
    icon: "⚔️",
    description: "普通战斗，主线体验，奖励普通。",
    entersBattle: true,
    isRouteChoice: true,
  },
  elite: {
    type: "elite",
    label: "精英",
    icon: "💀",
    description: "高风险战斗，奖励更好，可能给稀有奖励。",
    entersBattle: true,
    isRouteChoice: true,
  },
  boss: {
    type: "boss",
    label: "Boss",
    icon: "👑",
    description: "阶段强敌，可以作为路线目标或关键节点。",
    entersBattle: true,
    isRouteChoice: true,
  },
  event: {
    type: "event",
    label: "事件",
    icon: "❓",
    description: "问号事件，不一定战斗，可能有选择和代价。",
    entersBattle: false,
    isRouteChoice: true,
  },
  shop: {
    type: "shop",
    label: "商店",
    icon: "🛒",
    description: "花金币买回血、成长、技能或其他服务。",
    entersBattle: false,
    isRouteChoice: true,
  },
  rest: {
    type: "rest",
    label: "休息",
    icon: "🔥",
    description: "回血、强化、清负面或换取小奖励。",
    entersBattle: false,
    isRouteChoice: true,
  },
  reward: {
    type: "reward",
    label: "奖励",
    icon: "🎁",
    description: "不战斗，直接拿奖励或选择奖励。",
    entersBattle: false,
    isRouteChoice: true,
  },
} as const satisfies Record<RogueliteMapRoomType, RogueliteRoomTypeConfig>;

export const ROGUELITE_ROOM_TYPE_LABELS: Record<RogueliteMapRoomType, string> = {
  normal: ROGUELITE_ROOM_TYPES.normal.label,
  elite: ROGUELITE_ROOM_TYPES.elite.label,
  boss: ROGUELITE_ROOM_TYPES.boss.label,
  event: ROGUELITE_ROOM_TYPES.event.label,
  shop: ROGUELITE_ROOM_TYPES.shop.label,
  rest: ROGUELITE_ROOM_TYPES.rest.label,
  reward: ROGUELITE_ROOM_TYPES.reward.label,
};

export const ROGUELITE_ROOM_TYPE_ICONS: Record<RogueliteMapRoomType, string> = {
  normal: ROGUELITE_ROOM_TYPES.normal.icon,
  elite: ROGUELITE_ROOM_TYPES.elite.icon,
  boss: ROGUELITE_ROOM_TYPES.boss.icon,
  event: ROGUELITE_ROOM_TYPES.event.icon,
  shop: ROGUELITE_ROOM_TYPES.shop.icon,
  rest: ROGUELITE_ROOM_TYPES.rest.icon,
  reward: ROGUELITE_ROOM_TYPES.reward.icon,
};
