import type { RogueliteShopItemDraft, RogueliteShopRules } from "./rogueliteShop";

export const GENERATED_ROGUELITE_SHOP_RULES = {
  "itemsPerVisit": 3,
  "canRefresh": true,
  "refreshPrice": 20,
  "canBuyHeal": true,
  "canBuySkill": true,
  "canBuyGrowth": true,
  "canRemoveNegative": true,
  "canBuyRouteInfo": false,
  "canBuyTemporaryBoost": true
} as const satisfies RogueliteShopRules;

export const GENERATED_ROGUELITE_SHOP_ITEMS = [
  {
    "id": "minor_healing_potion",
    "name": "小瓶回血药",
    "type": "heal",
    "price": 25,
    "stage": "any",
    "effect": "回复 6 生命",
    "limit": "每次商店 1 次",
    "notes": "基础回血商品。"
  },
  {
    "id": "large_healing_potion",
    "name": "大瓶回血药",
    "type": "heal",
    "price": 55,
    "stage": "mid_late",
    "effect": "回复 14 生命",
    "limit": "每次商店 1 次",
    "notes": "中后期保命。"
  },
  {
    "id": "shield_patch",
    "name": "护盾补片",
    "type": "relic",
    "price": 35,
    "stage": "any",
    "effect": "下一场开始获得 6 护盾",
    "limit": "每次商店 1 次",
    "notes": "便宜防御。"
  },
  {
    "id": "iron_plate",
    "name": "铁甲片",
    "type": "perk",
    "price": 60,
    "stage": "any",
    "effect": "从普通成长池三选一（防御类）",
    "limit": "不限",
    "notes": "护甲/护盾流。"
  },
  {
    "id": "spiked_gauntlet",
    "name": "尖刺拳套",
    "type": "perk",
    "price": 65,
    "stage": "any",
    "effect": "从普通成长池三选一（伤害类）",
    "limit": "不限",
    "notes": "爆发流。"
  },
  {
    "id": "blood_vial",
    "name": "血瓶",
    "type": "perk",
    "price": 70,
    "stage": "mid_late",
    "effect": "从普通成长池三选一（回复/吸血类）",
    "limit": "不限",
    "notes": "回复流。"
  },
  {
    "id": "lucky_dice",
    "name": "幸运骰子",
    "type": "perk",
    "price": 75,
    "stage": "mid_late",
    "effect": "从普通成长池三选一（骰子类）",
    "limit": "不限",
    "notes": "骰子流。"
  },
  {
    "id": "skill_scroll",
    "name": "职业技能卷轴",
    "type": "skill",
    "price": 95,
    "stage": "mid_late",
    "effect": "从角色技能池三选一",
    "limit": "每次商店 1 次",
    "notes": "构筑入口。"
  },
  {
    "id": "dragon_scale",
    "name": "龙鳞碎片",
    "type": "relic",
    "price": 110,
    "stage": "late",
    "effect": "从稀有奖励池三选一（偏向穿透类）",
    "limit": "每次商店 1 次",
    "notes": "后期稀有。TODO: 稀有奖励池商店抽取逻辑尚未接入。"
  },
  {
    "id": "cleansing_salt",
    "name": "净化盐",
    "type": "remove",
    "price": 80,
    "stage": "any",
    "effect": "删除一个负面效果",
    "limit": "每次商店 1 次",
    "notes": "价格偏高。TODO: 负面效果删除尚未接入商店流程。"
  },
  {
    "id": "blacksmith_hammer",
    "name": "铁匠锤",
    "type": "relic",
    "price": 85,
    "stage": "any",
    "effect": "升级一个已有成长",
    "limit": "每次商店 1 次",
    "notes": "构筑强化。"
  },
  {
    "id": "reroll_coupon",
    "name": "重摇券",
    "type": "reroll",
    "price": 30,
    "stage": "any",
    "effect": "刷新当前商店商品",
    "limit": "每次商店 2 次",
    "notes": "可和刷新价格联动。"
  },
  {
    "id": "cracked_relic_box",
    "name": "裂纹遗物盒",
    "type": "relic",
    "price": 45,
    "stage": "any",
    "effect": "随机获得 20 金币或 4 护盾",
    "limit": "每次商店 1 次",
    "notes": "便宜随机商品。"
  },
  {
    "id": "cursed_relic_box",
    "name": "诅咒遗物盒",
    "type": "relic",
    "price": 30,
    "stage": "mid_late",
    "effect": "获得 45 金币，但附带一个负面效果",
    "limit": "每次商店 1 次",
    "notes": "高风险低价格。TODO: 负面效果尚未接入商店流程。"
  },
  {
    "id": "battle_map",
    "name": "斗技塔地图",
    "type": "relic",
    "price": 50,
    "stage": "any",
    "effect": "预览后续 3 层路线或提高奖励房出现概率",
    "limit": "每次商店 1 次",
    "notes": "地图系统候选，不进入当前可购买池。TODO: 路线预览和奖励房概率逻辑尚未接入。"
  },
  {
    "id": "opening_bell",
    "name": "开场铃",
    "type": "relic",
    "price": 45,
    "stage": "any",
    "effect": "下一场第一次攻击伤害 +4",
    "limit": "每次商店 1 次",
    "notes": "临时爆发。"
  },
  {
    "id": "emergency_shield",
    "name": "应急护符",
    "type": "relic",
    "price": 55,
    "stage": "mid_late",
    "effect": "低于半血时获得 8 护盾（每场 1 次）",
    "limit": "每次商店 1 次",
    "notes": "保命道具。TODO: 临时触发逻辑尚未接入商店流程。"
  },
  {
    "id": "flame_oil",
    "name": "火焰油",
    "type": "relic",
    "price": 55,
    "stage": "mid_late",
    "effect": "下一场攻击命中附加 2 层火焰标记",
    "limit": "每次商店 1 次",
    "notes": "火焰流。TODO: 临时火焰标记逻辑尚未接入商店流程。"
  },
  {
    "id": "blood_contract",
    "name": "血契纸",
    "type": "relic",
    "price": 65,
    "stage": "mid_late",
    "effect": "失去 5 生命，从稀有奖励池三选一",
    "limit": "每次商店 1 次",
    "notes": "风险换强度。TODO: 稀有奖励池商店抽取逻辑尚未接入。"
  },
  {
    "id": "boss_trophy",
    "name": "Boss 战利品",
    "type": "skill",
    "price": 130,
    "stage": "late",
    "effect": "从 Boss 能力池三选一",
    "limit": "每次商店 1 次",
    "notes": "后期爽点。TODO: Boss 能力商店购买流程尚未接入。"
  }
] as const satisfies readonly RogueliteShopItemDraft[];

export const GENERATED_ROGUELITE_ACTIVE_SHOP_ITEM_IDS = [
  "minor_healing_potion",
  "large_healing_potion",
  "shield_patch",
  "iron_plate",
  "spiked_gauntlet",
  "blood_vial",
  "lucky_dice",
  "skill_scroll",
  "cleansing_salt",
  "blacksmith_hammer",
  "reroll_coupon",
  "cracked_relic_box",
  "opening_bell"
] as const;
