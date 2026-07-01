import type { RogueliteRestSiteActionDraft } from "./rogueliteRestSites";

export const GENERATED_ROGUELITE_REST_SITE_ACTIONS = [
  {
    "id": "campfire_heal",
    "name": "营火疗伤",
    "effect": "回复 10 生命",
    "limit": "每次休息点只能选 1 次",
    "notes": "最基础选项。"
  },
  {
    "id": "weapon_drill",
    "name": "武器演练",
    "effect": "强化一个已有成长",
    "limit": "需要已有可强化成长",
    "notes": "偏构筑。"
  },
  {
    "id": "shield_repair",
    "name": "修补护甲",
    "effect": "下一场开始获得 8 护盾，或提升护盾类成长",
    "limit": "每次休息点 1 次",
    "notes": "护盾流。"
  },
  {
    "id": "blood_meditation",
    "name": "血池冥想",
    "effect": "回复 5 生命，并提高吸血/回复类奖励出现倾向",
    "limit": "需要已拥有 heal 标签奖励时更有效",
    "notes": "回复流。"
  },
  {
    "id": "dice_prayer",
    "name": "骰子祈愿",
    "effect": "提高骰子类奖励出现倾向，或获得一次重摇机会",
    "limit": "每次休息点 1 次",
    "notes": "骰子流。TODO: 重摇机会尚未接入休息点流程。"
  },
  {
    "id": "sharpen_first_hit",
    "name": "磨拳蓄势",
    "effect": "下一场第一次攻击伤害 +4",
    "limit": "不回复生命",
    "notes": "进攻选项。"
  },
  {
    "id": "reinforce_armor",
    "name": "加固甲片",
    "effect": "下一场受到的首次伤害 -3",
    "limit": "不回复生命",
    "notes": "防御选项。"
  },
  {
    "id": "sell_scraps",
    "name": "出售碎片",
    "effect": "获得 20 金币",
    "limit": "不回复生命",
    "notes": "贪心选项。"
  },
  {
    "id": "skip_for_trophy",
    "name": "不休息，拿战利品",
    "effect": "获得 20 金币或 4 护盾",
    "limit": "不回复生命",
    "notes": "高风险选项。"
  },
  {
    "id": "skill_focus",
    "name": "专注职业技能",
    "effect": "强化一个已有角色技能",
    "limit": "需要已有可强化技能",
    "notes": "中后期构筑。"
  }
] as const satisfies readonly RogueliteRestSiteActionDraft[];
