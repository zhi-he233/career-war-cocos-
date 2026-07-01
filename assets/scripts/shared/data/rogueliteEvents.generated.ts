import type { RogueliteEventDraft } from "./rogueliteEvents";

export const GENERATED_ROGUELITE_EVENTS = [
  {
    "id": "cracked_dice",
    "name": "裂纹骰子",
    "rarity": "common",
    "stage": "early",
    "description": "你捡到一颗有裂纹的骰子，里面似乎还残留着上一位挑战者的运气。",
    "choices": [
      {
        "label": "用它投一次",
        "effect": "从普通成长池三选一",
        "cost": "下一场战斗开始时失去 3 生命",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3,
            "note": "TODO: 后续可改为下一场战斗开始时结算。"
          }
        ]
      },
      {
        "label": "砸碎取芯",
        "effect": "获得 20 金币",
        "cost": "没有成长奖励",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ]
      }
    ],
    "notes": "前期教学，低风险。"
  },
  {
    "id": "old_shield_wall",
    "name": "旧盾墙",
    "rarity": "common",
    "stage": "early",
    "description": "一面残破的大盾插在墙边，盾面上全是拳印。",
    "choices": [
      {
        "label": "拆下护板",
        "effect": "获得 4 护盾或防御类普通成长",
        "cost": "失去 20 金币",
        "effects": [
          {
            "type": "gain_start_shield_next_battle",
            "value": 4
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 金币消耗尚未接入。"
          }
        ]
      },
      {
        "label": "绕过去",
        "effect": "回复 5 生命",
        "cost": "没有额外奖励",
        "effects": [
          {
            "type": "heal",
            "value": 5
          }
        ]
      }
    ],
    "notes": "护盾流入口。"
  },
  {
    "id": "blood_stained_glove",
    "name": "染血拳套",
    "rarity": "common",
    "stage": "early",
    "description": "擂台角落放着一副旧拳套，拳套还没完全干。",
    "choices": [
      {
        "label": "戴上拳套",
        "effect": "从普通成长池三选一（伤害类）",
        "cost": "失去 3 生命",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3
          }
        ]
      },
      {
        "label": "擦掉血迹",
        "effect": "回复 5 生命",
        "cost": "失去一次奖励刷新机会",
        "effects": [
          {
            "type": "heal",
            "value": 5
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 奖励刷新机会尚未接入。"
          }
        ]
      }
    ],
    "notes": "爆发流入口。"
  },
  {
    "id": "dice_gambler",
    "name": "骰子赌徒",
    "rarity": "uncommon",
    "stage": "any",
    "description": "一个赌徒拦住你，提出用一场投骰决定战利品归属。",
    "choices": [
      {
        "label": "跟他赌",
        "effect": "预览稀有奖励池，投出 4 点或以上可从稀有奖励池三选一",
        "cost": "若投出 1-3，下一场敌人生命 +6，伤害 +1",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "rare",
            "note": "TODO: 稀有奖励池暂时降级为基础成长池。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 投骰胜负与下一场敌人强化尚未接入。"
          }
        ]
      },
      {
        "label": "不赌，收买他",
        "effect": "获得 20 金币",
        "cost": "失去 3 生命",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3
          }
        ]
      }
    ],
    "notes": "骰点对决。TODO: 稀有奖励池事件抽取逻辑尚未接入。"
  },
  {
    "id": "black_market_map",
    "name": "黑市地图",
    "rarity": "uncommon",
    "stage": "mid",
    "description": "墙上贴着一张被撕烂的地图，标出了一条通往黑市的暗路。",
    "choices": [
      {
        "label": "走暗路",
        "effect": "下一层 50% 概率额外生成商店或奖励房",
        "cost": "下一场敌人额外获得 4 护盾",
        "effects": [
          {
            "type": "todo",
            "note": "TODO: 商店/奖励房出现概率变化尚未接入。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 下一场敌人护盾变化尚未接入。"
          }
        ]
      },
      {
        "label": "记下路线",
        "effect": "获得 20 金币",
        "cost": "没有地图收益",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ]
      }
    ],
    "notes": "地图事件。TODO: 额外生成房间逻辑尚未接入。"
  },
  {
    "id": "armor_debt",
    "name": "欠债护甲",
    "rarity": "uncommon",
    "stage": "mid",
    "description": "铁匠愿意先把护甲借给你，但要你之后用战利品来还。",
    "choices": [
      {
        "label": "先穿再说",
        "effect": "获得护甲或开局护盾成长",
        "cost": "下一次奖励少一个选项",
        "effects": [
          {
            "type": "gain_start_shield_next_battle",
            "value": 4
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 下一次奖励少一个选项尚未接入。"
          }
        ]
      },
      {
        "label": "拒绝赊账",
        "effect": "获得 20 金币",
        "cost": "没有防御收益",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ]
      }
    ],
    "notes": "构筑交换。TODO: 奖励选项减少逻辑尚未接入。"
  },
  {
    "id": "blood_pool",
    "name": "斗场血池",
    "rarity": "rare",
    "stage": "mid",
    "description": "血池里浮着破碎的职业徽章，靠近时能听到心跳声。",
    "choices": [
      {
        "label": "喝一口",
        "effect": "从普通成长池三选一（吸血/回复类）",
        "cost": "失去 6 生命",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 6
          }
        ]
      },
      {
        "label": "洗掉伤口",
        "effect": "回复 15 生命",
        "cost": "无法获得奖励",
        "effects": [
          {
            "type": "heal",
            "value": 15
          }
        ]
      }
    ],
    "notes": "高风险回复。"
  },
  {
    "id": "sealed_skill_book",
    "name": "封印技能书",
    "rarity": "rare",
    "stage": "mid",
    "description": "一本技能书被锁链缠住，封面写着“只给敢赌命的人”。",
    "choices": [
      {
        "label": "撕开封印",
        "effect": "从角色技能池三选一",
        "cost": "获得一个临时负面效果",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "character_skill",
            "note": "TODO: 事件角色技能池暂时降级为基础成长池。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 临时负面效果尚未接入。"
          }
        ]
      },
      {
        "label": "卖给商人",
        "effect": "获得 45 金币",
        "cost": "失去技能机会",
        "effects": [
          {
            "type": "gain_gold",
            "value": 45
          }
        ]
      }
    ],
    "notes": "角色技能入口。TODO: 临时负面效果尚未接入。"
  },
  {
    "id": "gunpowder_barrel",
    "name": "火药桶",
    "rarity": "common",
    "stage": "any",
    "description": "角落堆着几桶火药，旁边还有枪手留下的弹壳。",
    "choices": [
      {
        "label": "装进拳套",
        "effect": "下一场第一次攻击伤害 +4",
        "cost": "开局失去 3 生命",
        "effects": [
          {
            "type": "todo",
            "note": "TODO: 下一场第一次攻击伤害变化尚未接入。"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3
          }
        ]
      },
      {
        "label": "卖掉火药",
        "effect": "获得 20 金币",
        "cost": "无战斗强化",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ]
      }
    ],
    "notes": "先手爆发。"
  },
  {
    "id": "dragon_shadow",
    "name": "龙影掠过",
    "rarity": "rare",
    "stage": "late",
    "description": "一道龙影从塔顶掠过，短暂照亮了你前方的路线。",
    "choices": [
      {
        "label": "追随龙影",
        "effect": "从稀有奖励池三选一（偏向穿透类）",
        "cost": "下一场敌人伤害 +1",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "rare",
            "note": "TODO: 稀有奖励池暂时降级为基础成长池。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 下一场敌人伤害变化尚未接入。"
          }
        ]
      },
      {
        "label": "原地观察",
        "effect": "看见后续 3 层路线信息",
        "cost": "没有奖励",
        "effects": [
          {
            "type": "todo",
            "note": "TODO: 路线预览尚未接入。"
          }
        ]
      }
    ],
    "notes": "后期稀有事件。TODO: 稀有奖励池和路线预览事件逻辑尚未接入。"
  },
  {
    "id": "shield_forge",
    "name": "护盾熔炉",
    "rarity": "uncommon",
    "stage": "any",
    "description": "熔炉中流动着蓝色护盾碎片，似乎能把防御转化为攻击。",
    "choices": [
      {
        "label": "投入护盾碎片",
        "effect": "从普通成长池三选一（护盾/盾击类）",
        "cost": "失去 6 生命或 20 金币",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 6,
            "note": "TODO: 之后可让玩家在生命和金币代价中选择。"
          }
        ]
      },
      {
        "label": "冷却熔炉",
        "effect": "回复 10 生命",
        "cost": "没有奖励",
        "effects": [
          {
            "type": "heal",
            "value": 10
          }
        ]
      }
    ],
    "notes": "护盾流核心事件。"
  },
  {
    "id": "reaper_contract",
    "name": "收割契约",
    "rarity": "rare",
    "stage": "late",
    "description": "一张黑色契约浮在半空，上面写着：击败残血者，获得更多。",
    "choices": [
      {
        "label": "签下契约",
        "effect": "从普通成长池三选一（收割/斩杀类）",
        "cost": "低于半血时受到伤害 +2",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 低血受伤变化尚未接入。"
          }
        ]
      },
      {
        "label": "烧掉契约",
        "effect": "删除一个负面效果",
        "cost": "失去 3 生命",
        "effects": [
          {
            "type": "todo",
            "note": "TODO: 删除负面效果尚未接入。"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3
          }
        ]
      }
    ],
    "notes": "后期风险收益。TODO: 负面效果删除尚未接入事件流程。"
  },
  {
    "id": "fake_treasure",
    "name": "假宝箱",
    "rarity": "common",
    "stage": "any",
    "description": "你发现一个宝箱，但锁孔旁边有新鲜的抓痕。",
    "choices": [
      {
        "label": "强行打开",
        "effect": "获得随机奖励（20 金币 / 4 护盾 / 从普通成长池三选一）",
        "cost": "50% 概率失去 3 生命",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth",
            "note": "TODO: 随机奖励暂时降级为基础成长池三选一。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 50% 概率生命损失尚未接入。"
          }
        ]
      },
      {
        "label": "谨慎拆锁",
        "effect": "获得 20 金币",
        "cost": "没有随机奖励",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ]
      }
    ],
    "notes": "普通随机事件。"
  },
  {
    "id": "mirror_duel",
    "name": "镜像决斗",
    "rarity": "rare",
    "stage": "mid",
    "description": "镜子里出现了另一个你，他的拳头比你更快。",
    "choices": [
      {
        "label": "接受决斗",
        "effect": "下一场敌人生命 +6，伤害 +1；胜利后从稀有奖励池三选一",
        "cost": "立即失去 3 生命",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "rare",
            "note": "TODO: 稀有奖励池暂时降级为基础成长池。"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3
          },
          {
            "type": "todo",
            "note": "TODO: 下一场敌人生命和伤害变化尚未接入。"
          }
        ]
      },
      {
        "label": "打碎镜子",
        "effect": "从普通成长池三选一",
        "cost": "失去 20 金币",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 金币消耗尚未接入。"
          }
        ]
      }
    ],
    "notes": "挑战事件。TODO: 稀有奖励池事件抽取逻辑尚未接入。"
  },
  {
    "id": "broken_banner",
    "name": "断裂战旗",
    "rarity": "common",
    "stage": "early",
    "description": "一面断裂战旗倒在路边，上面写着上一支队伍的名字。",
    "choices": [
      {
        "label": "举起战旗",
        "effect": "获得生命上限或战斗本能成长",
        "cost": "下一场敌人伤害 +1",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 下一场敌人伤害变化尚未接入。"
          }
        ]
      },
      {
        "label": "埋葬战旗",
        "effect": "回复 5 生命",
        "cost": "没有成长",
        "effects": [
          {
            "type": "heal",
            "value": 5
          }
        ]
      }
    ],
    "notes": "叙事补强。"
  },
  {
    "id": "coin_rain",
    "name": "金币雨",
    "rarity": "uncommon",
    "stage": "any",
    "description": "斗技场上方突然落下一阵金币，观众在欢呼。",
    "choices": [
      {
        "label": "冲进去捡",
        "effect": "获得 45 金币",
        "cost": "失去 3 生命",
        "effects": [
          {
            "type": "gain_gold",
            "value": 45
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3
          }
        ]
      },
      {
        "label": "保持警惕",
        "effect": "获得 4 护盾",
        "cost": "没有金币",
        "effects": [
          {
            "type": "gain_start_shield_next_battle",
            "value": 4
          }
        ]
      }
    ],
    "notes": "金币事件。"
  },
  {
    "id": "cursed_dice_cup",
    "name": "诅咒骰盅",
    "rarity": "rare",
    "stage": "any",
    "description": "骰盅自己开始摇晃，里面传来低笑声。",
    "choices": [
      {
        "label": "掀开骰盅",
        "effect": "获得骰子类奖励",
        "cost": "获得一个负面效果",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 负面效果尚未接入。"
          }
        ]
      },
      {
        "label": "封住骰盅",
        "effect": "删除一个负面效果",
        "cost": "失去 20 金币",
        "effects": [
          {
            "type": "todo",
            "note": "TODO: 删除负面效果尚未接入。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 金币消耗尚未接入。"
          }
        ]
      }
    ],
    "notes": "骰子流事件。TODO: 负面效果尚未接入事件流程。"
  },
  {
    "id": "flame_trial",
    "name": "火焰试炼",
    "rarity": "uncommon",
    "stage": "mid",
    "description": "火焰领主的标记在地面燃烧，只有攻击欲望足够强的人才能通过。",
    "choices": [
      {
        "label": "踏入火圈",
        "effect": "从普通成长池三选一（火焰/伤害类）",
        "cost": "下一场开始时受到 3 伤害",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 3,
            "note": "TODO: 后续可改为下一场战斗开始时结算。"
          }
        ]
      },
      {
        "label": "绕过火圈",
        "effect": "回复 5 生命",
        "cost": "失去奖励机会",
        "effects": [
          {
            "type": "heal",
            "value": 5
          }
        ]
      }
    ],
    "notes": "火焰流入口。"
  },
  {
    "id": "vampire_altar",
    "name": "吸血祭坛",
    "rarity": "uncommon",
    "stage": "mid",
    "description": "祭坛上刻着一句话：用血换血，才算公平。",
    "choices": [
      {
        "label": "献血",
        "effect": "从普通成长池三选一（吸血/回复类）",
        "cost": "失去 6 生命",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "growth"
          }
        ],
        "costs": [
          {
            "type": "lose_hp",
            "value": 6
          }
        ]
      },
      {
        "label": "破坏祭坛",
        "effect": "获得 20 金币",
        "cost": "无法获得吸血奖励",
        "effects": [
          {
            "type": "gain_gold",
            "value": 20
          }
        ]
      }
    ],
    "notes": "吸血流入口。"
  },
  {
    "id": "cycle_bell",
    "name": "轮回钟声",
    "rarity": "rare",
    "stage": "late",
    "description": "远处传来轮回钟声，斗技塔即将进入下一轮加码。",
    "choices": [
      {
        "label": "提前适应",
        "effect": "从稀有奖励池三选一",
        "cost": "后续 3 场敌人伤害 +1",
        "effects": [
          {
            "type": "reward_choice",
            "rewardPool": "rare",
            "note": "TODO: 稀有奖励池暂时降级为基础成长池。"
          }
        ],
        "costs": [
          {
            "type": "todo",
            "note": "TODO: 后续 3 场敌人伤害变化尚未接入。"
          }
        ]
      },
      {
        "label": "稳住节奏",
        "effect": "回复 12 生命",
        "cost": "不获得奖励",
        "effects": [
          {
            "type": "heal",
            "value": 12
          }
        ]
      }
    ],
    "notes": "进入下一轮循环的信号。TODO: 稀有奖励池事件抽取逻辑尚未接入。"
  }
] as const satisfies readonly RogueliteEventDraft[];
