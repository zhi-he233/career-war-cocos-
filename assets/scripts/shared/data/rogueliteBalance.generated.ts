import type { RogueliteBossBalance, RogueliteEnemyBalance, RogueliteRewardDraft } from "./rogueliteBalance";

export const GENERATED_ROGUELITE_ENEMIES = [
  {
    "id": "normal",
    "name": "普通兵",
    "enemyTemplateId": "normal_training_dummy",
    "displayName": "训练假人",
    "enemyKind": "monster",
    "spriteKey": "normal_training_dummy",
    "portraitKey": "normal_training_dummy",
    "baseCharacterId": "boxer",
    "stageType": "normal",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "无特殊机制"
    ],
    "description": "基础小怪。"
  },
  {
    "id": "normal_gambler",
    "name": "赌徒",
    "enemyTemplateId": "normal_gambler",
    "displayName": "赌徒",
    "enemyKind": "duelist",
    "spriteKey": "normal_gambler",
    "portraitKey": "normal_gambler",
    "baseCharacterId": "boxer",
    "stageType": "normal",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "赌徒：投 1 自伤 1，投 6 伤害 +2"
    ],
    "description": "波动型小怪。"
  },
  {
    "id": "normal_shield_breaker",
    "name": "破盾兵",
    "enemyTemplateId": "normal_shield_breaker",
    "displayName": "破盾兵",
    "enemyKind": "monster",
    "spriteKey": "normal_shield_breaker",
    "portraitKey": "normal_shield_breaker",
    "baseCharacterId": "boxer",
    "stageType": "normal",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "破盾：攻击护盾时额外 +2 伤害"
    ],
    "description": "克制护盾的小怪。"
  },
  {
    "id": "normal_armor_piercer",
    "name": "穿甲兵",
    "enemyTemplateId": "normal_armor_piercer",
    "displayName": "穿甲兵",
    "enemyKind": "monster",
    "spriteKey": "normal_armor_piercer",
    "portraitKey": "normal_armor_piercer",
    "baseCharacterId": "boxer",
    "stageType": "normal",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "穿甲：攻击无视 1 点护甲"
    ],
    "description": "克制护甲的小怪。"
  },
  {
    "id": "elite_iron_skin",
    "name": "铁皮精英",
    "enemyTemplateId": "elite_iron_skin",
    "displayName": "铁皮精英",
    "enemyKind": "monster",
    "spriteKey": "elite_iron_skin",
    "portraitKey": "elite_iron_skin",
    "baseCharacterId": "boxer",
    "stageType": "elite",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "铁皮：护甲 +1",
      "整备：每回合获得 2 护盾"
    ],
    "description": "防御型精英。"
  },
  {
    "id": "elite_berserker",
    "name": "狂暴精英",
    "enemyTemplateId": "elite_berserker",
    "displayName": "狂暴精英",
    "enemyKind": "monster",
    "spriteKey": "elite_berserker",
    "portraitKey": "elite_berserker",
    "baseCharacterId": "boxer",
    "stageType": "elite",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "狂暴：低于半血时伤害 +3"
    ],
    "description": "残血爆发精英。"
  },
  {
    "id": "elite_reaper",
    "name": "收割精英",
    "enemyTemplateId": "elite_reaper",
    "displayName": "收割精英",
    "enemyKind": "monster",
    "spriteKey": "elite_reaper",
    "portraitKey": "elite_reaper",
    "baseCharacterId": "boxer",
    "stageType": "elite",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "收割：目标低于 40% 生命时伤害 +2"
    ],
    "description": "压低血线后伤害提高的精英。"
  },
  {
    "id": "elite_armor_piercing",
    "name": "穿甲精英",
    "enemyTemplateId": "elite_armor_piercing",
    "displayName": "穿甲精英",
    "enemyKind": "monster",
    "spriteKey": "elite_armor_piercing",
    "portraitKey": "elite_armor_piercing",
    "baseCharacterId": "boxer",
    "stageType": "elite",
    "hpBonus": 0,
    "shieldBonus": 0,
    "damageBonus": 0,
    "skills": [
      "穿甲：无视 1 点护甲",
      "破势：自身低于半血时无视 2 点护甲"
    ],
    "description": "针对护甲流派的精英。"
  }
] as const satisfies readonly RogueliteEnemyBalance[];

export const GENERATED_ROGUELITE_BOSSES = [
  {
    "id": "boss_boxer_king",
    "name": "拳王",
    "enemyTemplateId": "boss_boxer_king",
    "displayName": "拳王",
    "enemyKind": "boss",
    "spriteKey": "boss_boxer_king",
    "portraitKey": "boss_boxer_king",
    "baseCharacterId": "boxer",
    "stageType": "boss",
    "baseHp": 18,
    "baseShield": 2,
    "skills": [
      "蓄力：投 1/2 获得 1 层蓄力",
      "重拳：攻击时每层蓄力 +3 伤害并清空",
      "狂暴：低于半血时伤害 +2"
    ],
    "description": "稳定蓄力和半血爆发的 Boss。"
  },
  {
    "id": "boss_blood_demon",
    "name": "血魔",
    "enemyTemplateId": "boss_blood_demon",
    "displayName": "血魔",
    "enemyKind": "boss",
    "spriteKey": "boss_blood_demon",
    "portraitKey": "boss_blood_demon",
    "baseCharacterId": "boxer",
    "stageType": "boss",
    "baseHp": 16,
    "baseShield": 0,
    "skills": [
      "嗜血：造成生命伤害后回复 2",
      "血盾：投到 3 时获得 4 护盾",
      "血祭：低于 40% 生命时一次性回复 5 并获得 3 护盾"
    ],
    "description": "低血量回复型 Boss。"
  },
  {
    "id": "boss_shield_guard",
    "name": "山盾守卫",
    "enemyTemplateId": "boss_shield_guard",
    "displayName": "山盾守卫",
    "enemyKind": "boss",
    "spriteKey": "boss_shield_guard",
    "portraitKey": "boss_shield_guard",
    "baseCharacterId": "boxer",
    "stageType": "boss",
    "baseHp": 14,
    "baseShield": 5,
    "skills": [
      "铁壁：护甲 +1",
      "架盾：投 1/2 获得 5 护盾并使本次受伤 -2",
      "盾反：受到生命伤害后反击 2"
    ],
    "description": "靠护盾和护甲拖慢战斗的 Boss。"
  },
  {
    "id": "boss_god_berserker",
    "name": "神狂战",
    "enemyTemplateId": "boss_god_berserker",
    "displayName": "神狂战",
    "enemyKind": "boss",
    "spriteKey": "boss_god_berserker",
    "portraitKey": "boss_god_berserker",
    "baseCharacterId": "boxer",
    "stageType": "boss",
    "baseHp": 20,
    "fixedHp": 20,
    "baseShield": 0,
    "skills": [
      "神怒：攻击附加已损失生命值",
      "濒死：进入 15/10/5/1 血阈值",
      "终击：死亡前完成最后一击"
    ],
    "description": "固定 20 血，强度来自残血爆发和终击机制。"
  },
  {
    "id": "boss_gambler_dealer",
    "name": "赌命庄家",
    "enemyTemplateId": "boss_gambler_dealer",
    "displayName": "赌命庄家",
    "enemyKind": "boss",
    "spriteKey": "boss_gambler_dealer",
    "portraitKey": "boss_gambler_dealer",
    "baseCharacterId": "boxer",
    "stageType": "boss",
    "baseHp": 16,
    "baseShield": 3,
    "skills": [
      "洗牌：投 1-3 时重投一次",
      "抽税：玩家投 6 时自身获得 3 护盾",
      "梭哈：低于 30% 生命时伤害 +3"
    ],
    "description": "骰点波动型 Boss。"
  }
] as const satisfies readonly RogueliteBossBalance[];

export const GENERATED_ROGUELITE_GROWTH_REWARDS = [
  {
    "name": "重拳训练",
    "description": "伤害 +1，生命上限 +2，回复 3。",
    "type": "heavy_punch_training",
    "value": 1,
    "tag": "burst"
  },
  {
    "name": "铁布衫",
    "description": "护甲 +1，每关开始护盾 +2。",
    "type": "iron_body",
    "value": 1,
    "tag": "armor"
  },
  {
    "name": "战斗喘息",
    "description": "最大生命 +5，获得时回复最大生命 40%，最低 8 点。",
    "type": "breathing_recovery",
    "value": 40,
    "tag": "heal"
  },
  {
    "name": "吸血拳法",
    "description": "伤害 +1，造成生命伤害后回复 1 生命。",
    "type": "blood_punch",
    "value": 1,
    "tag": "heal"
  },
  {
    "name": "战斗本能",
    "description": "伤害 +1，生命上限 +2，战后额外恢复 +2。",
    "type": "battle_instinct",
    "value": 1,
    "tag": "burst"
  },
  {
    "name": "防守训练",
    "description": "生命上限 +4，每关开始护盾 +3。",
    "type": "guard_training",
    "value": 4,
    "tag": "shield"
  },
  {
    "name": "生命强化",
    "description": "生命上限 +6，并回复 4 生命。",
    "type": "vitality_boost",
    "value": 6,
    "tag": "armor",
    "maxStacks": 3
  },
  {
    "name": "护盾壁垒",
    "description": "获得 4 护盾，每关开始护盾 +4。",
    "type": "shield_wall",
    "value": 4,
    "tag": "shield",
    "maxStacks": 3
  },
  {
    "name": "先手优势",
    "description": "攻击伤害 +3。",
    "type": "first_strike",
    "value": 3,
    "tag": "burst",
    "maxStacks": 3
  },
  {
    "name": "绝境护甲",
    "description": "生命低于一半时护甲 +2。",
    "type": "low_hp_armor",
    "value": 2,
    "tag": "low_hp",
    "maxStacks": 3
  },
  {
    "name": "战利品",
    "description": "击败敌人后升级一个成长。",
    "type": "kill_heal",
    "value": 1,
    "tag": "heal",
    "maxStacks": 3
  },
  {
    "name": "饮血",
    "description": "直接攻击造成生命伤害后回复 3 生命。",
    "type": "drink_blood",
    "value": 3,
    "tag": "heal",
    "maxStacks": 3
  },
  {
    "name": "翻盘之力",
    "description": "生命低于一半时，攻击伤害 +3。",
    "type": "comeback",
    "value": 3,
    "tag": "low_hp",
    "maxStacks": 2
  },
  {
    "name": "低点防御",
    "description": "投到 1 或 2 时获得 3 护盾。",
    "type": "low_roll_defense",
    "value": 3,
    "tag": "shield",
    "maxStacks": 3
  },
  {
    "name": "盾击",
    "description": "拥有护盾时攻击伤害 +2。",
    "type": "shield_strike",
    "value": 2,
    "tag": "shield",
    "maxStacks": 3
  },
  {
    "name": "护盾过载",
    "description": "每关一次，攻击时消耗最多 10 护盾并追加一半为伤害。",
    "type": "shield_overload",
    "value": 1,
    "tag": "shield",
    "maxStacks": 1
  },
  {
    "name": "稳固壁垒",
    "description": "有护盾时护甲 +1。",
    "type": "sturdy_bulwark",
    "value": 1,
    "tag": "shield",
    "maxStacks": 1
  },
  {
    "name": "命运筹码",
    "description": "投到 1/2 获得筹码，3 个筹码可让骰点 +1。",
    "type": "fate_tokens",
    "value": 1,
    "tag": "dice",
    "maxStacks": 1
  },
  {
    "name": "低点蓄力",
    "description": "投到 1/2/3 获得蓄力，投到 5/6 时每层 +2 伤害。",
    "type": "low_roll_charge",
    "value": 1,
    "tag": "dice",
    "maxStacks": 1
  },
  {
    "name": "孤注一掷",
    "description": "预留/显示型奖励。",
    "type": "desperate_reroll",
    "value": 1,
    "tag": "dice",
    "maxStacks": 1
  },
  {
    "name": "幸运保底",
    "description": "连续低点后，下一次投骰至少为 4。",
    "type": "lucky_floor",
    "value": 1,
    "tag": "dice",
    "maxStacks": 1
  }
] as const satisfies readonly RogueliteRewardDraft[];

export const GENERATED_ROGUELITE_CHARACTER_SKILL_REWARDS = [
  {
    "name": "枪手技能",
    "description": "Lv.1 投 6 时攻击伤害 x3；Lv.2 额外 +3；Lv.3 投 5/6 触发。",
    "type": "gunner_triple_shot",
    "value": 1,
    "maxStacks": 3
  },
  {
    "name": "吸血鬼技能",
    "description": "造成生命伤害后回复等同等级的生命。",
    "type": "vampire_skill",
    "value": 1,
    "maxStacks": 3
  },
  {
    "name": "赵子龙技能",
    "description": "攻击无视护盾和护甲；高等级增加穿透伤害 +1/+2/+4。",
    "type": "zhaoyun_pierce",
    "value": 1,
    "maxStacks": 3
  },
  {
    "name": "火焰领主技能",
    "description": "攻击命中后添加等同等级的火焰印记，按 6 可以引爆，每层造成 3 点伤害。",
    "type": "flame_lord_mark",
    "value": 1,
    "maxStacks": 3
  }
] as const satisfies readonly RogueliteRewardDraft[];

export const GENERATED_ROGUELITE_BOSS_ABILITY_REWARDS = [
  {
    "name": "狂怒之血",
    "description": "攻击额外造成已损失生命一半的伤害。",
    "type": "berserker_blood",
    "value": 0
  },
  {
    "name": "吸血本能",
    "description": "造成生命伤害后回复 2 生命，溢出转化为护盾。",
    "type": "vampire_instinct",
    "value": 2
  },
  {
    "name": "龙胆之力",
    "description": "攻击无视护盾和护甲，叠层后额外伤害 +1。",
    "type": "dragon_courage",
    "value": 0
  }
] as const satisfies readonly RogueliteRewardDraft[];

export const GENERATED_ROGUELITE_STARTER_REWARDS = [
  {
    "name": "重拳开局",
    "description": "伤害 +2，生命上限 +4，回复 4 生命。",
    "type": "starter_heavy_punch",
    "value": 2,
    "tag": "burst"
  },
  {
    "name": "吸血开局",
    "description": "伤害 +1，造成生命伤害后回复 2 生命。",
    "type": "starter_blood_punch",
    "value": 1,
    "tag": "heal"
  },
  {
    "name": "铁壁开局",
    "description": "护甲 +1，生命上限 +6，每关开始护盾 +3。",
    "type": "starter_iron_wall",
    "value": 1,
    "tag": "shield"
  },
  {
    "name": "续航开局",
    "description": "生命上限 +8，每关胜利后额外恢复 5 生命。",
    "type": "starter_recovery",
    "value": 8,
    "tag": "heal"
  }
] as const satisfies readonly RogueliteRewardDraft[];
