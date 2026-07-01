import type { EditableCharacter } from "./characters";

export const GENERATED_CHARACTERS = [
  {
    "id": "boxer",
    "name": "拳手",
    "title": "attack",
    "description": "没有额外规则，按骰点造成伤害。",
    "maxHp": 20,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "新手推荐",
      "攻击",
      "稳定"
    ],
    "difficulty": "simple",
    "sortOrder": 1,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "boxer"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "1 点",
        "description": "造成 1 点伤害。"
      },
      {
        "roll": 2,
        "name": "2 点",
        "description": "造成 2 点伤害。"
      },
      {
        "roll": 3,
        "name": "3 点",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 4,
        "name": "4 点",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 5,
        "name": "5 点",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 6,
        "name": "6 点",
        "description": "造成 6 点伤害。"
      }
    ],
    "role": "attack",
    "shortDescription": "没有额外规则，按骰点造成伤害。",
    "fullDescription": [
      "无技能",
      "投到几点造成几点伤害"
    ],
    "isImplemented": true
  },
  {
    "id": "gunslinger",
    "name": "枪手",
    "title": "burst",
    "description": "低保伤害偏低，但 6 点能打出高额爆发。",
    "maxHp": 18,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "爆发",
      "连投"
    ],
    "difficulty": "complex",
    "sortOrder": 2,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "gunslinger"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "复制伤害",
        "description": "可复制上一名玩家的最终伤害；普通攻击造成 0 点伤害。"
      },
      {
        "roll": 2,
        "name": "低火力射击",
        "description": "造成 1 点伤害。"
      },
      {
        "roll": 3,
        "name": "射击",
        "description": "造成 2 点伤害。"
      },
      {
        "roll": 4,
        "name": "射击",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 5,
        "name": "射击",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 6,
        "name": "连射",
        "description": "可再投一次，第二次骰点 x3 作为额外伤害；普通攻击造成 5 点伤害。"
      }
    ],
    "role": "burst",
    "shortDescription": "低保伤害偏低，但 6 点能打出高额爆发。",
    "fullDescription": [
      "基础伤害 -1",
      "6 点再投一次，第二次骰点 x3",
      "1 点复制上一名玩家最终伤害"
    ],
    "isImplemented": true
  },
  {
    "id": "vampire",
    "name": "吸血鬼",
    "title": "healing",
    "description": "靠吸血和额外回复维持生存。",
    "maxHp": 15,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "治疗",
      "续航",
      "特殊"
    ],
    "difficulty": "complex",
    "sortOrder": 3,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "vampire"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "吸血",
        "description": "可造成 1 点伤害并回复 2 点生命。"
      },
      {
        "roll": 2,
        "name": "爪击",
        "description": "造成 2 点伤害。"
      },
      {
        "roll": 3,
        "name": "血雾",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 4,
        "name": "爪击",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 5,
        "name": "爪击",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 6,
        "name": "血祭回复",
        "description": "可再投一次，并按第二次骰点 x3 回复生命，溢出变护盾；普通攻击造成 6 点伤害。"
      }
    ],
    "role": "healing",
    "shortDescription": "靠吸血和额外回复维持生存。",
    "fullDescription": [
      "3 点无伤",
      "1 点造成 1 伤害并回复 2 血",
      "6 点再投一次，回复骰点 x3，溢出变护盾"
    ],
    "isImplemented": true
  },
  {
    "id": "zhaoZilong",
    "name": "赵子龙",
    "title": "attack",
    "description": "攻击能无视护盾，连续造成血量伤害后会回复自己。",
    "maxHp": 20,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "新手推荐",
      "攻击",
      "破盾"
    ],
    "difficulty": "normal",
    "sortOrder": 4,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "zhaoZilong"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "破盾一击",
        "description": "造成 1 点伤害，并无视护盾。"
      },
      {
        "roll": 2,
        "name": "破盾二连",
        "description": "造成 2 点伤害，并无视护盾。"
      },
      {
        "roll": 3,
        "name": "破盾突刺",
        "description": "造成 3 点伤害，并无视护盾。"
      },
      {
        "roll": 4,
        "name": "龙影闪避",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 5,
        "name": "破盾强袭",
        "description": "造成 5 点伤害，并无视护盾。"
      },
      {
        "roll": 6,
        "name": "破盾猛攻",
        "description": "造成 6 点伤害，并无视护盾。"
      }
    ],
    "role": "attack",
    "shortDescription": "攻击能无视护盾，连续造成血量伤害后会回复自己。",
    "fullDescription": [
      "4 点无伤：投出 4 时不造成伤害，自动跳过行动",
      "造成伤害时无视护盾",
      "龙胆：每成功造成 3 次血量伤害后，回复 2 点血，触发后计数清零。"
    ],
    "isImplemented": true
  },
  {
    "id": "assassin",
    "name": "刺客",
    "title": "burst",
    "description": "血量较低，但基础输出更凶。",
    "maxHp": 15,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "爆发",
      "低血量"
    ],
    "difficulty": "normal",
    "sortOrder": 5,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "assassin"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "要害刺击",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 2,
        "name": "刺击",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 3,
        "name": "刺击",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 4,
        "name": "刺击",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 5,
        "name": "刺击",
        "description": "造成 6 点伤害。"
      },
      {
        "roll": 6,
        "name": "刺击",
        "description": "造成 7 点伤害。"
      }
    ],
    "role": "burst",
    "shortDescription": "血量较低，但基础输出更凶。",
    "fullDescription": [
      "基础伤害 +1",
      "1 点造成 3 点伤害"
    ],
    "isImplemented": true
  },
  {
    "id": "paladin",
    "name": "圣骑士",
    "title": "defense",
    "description": "能制造全员无敌窗口，并在发动时保护自己。",
    "maxHp": 20,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "防御",
      "特殊",
      "团队"
    ],
    "difficulty": "complex",
    "sortOrder": 6,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "paladin"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "守势",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 2,
        "name": "圣击",
        "description": "造成 2 点伤害。"
      },
      {
        "roll": 3,
        "name": "圣击",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 4,
        "name": "圣盾庇护",
        "description": "可使全员无敌到自己下次行动开始前，并获得 3 点护盾；普通攻击造成 4 点伤害。"
      },
      {
        "roll": 5,
        "name": "圣击",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 6,
        "name": "圣击",
        "description": "造成 6 点伤害。"
      }
    ],
    "role": "defense",
    "shortDescription": "能制造全员无敌窗口，并在发动时保护自己。",
    "fullDescription": [
      "1 点无伤",
      "4 点全员无敌，持续到圣骑士下一次行动开始前",
      "发动 4 点技能时，圣骑士自己获得 3 点护盾。"
    ],
    "isImplemented": true
  },
  {
    "id": "berserker",
    "name": "狂战士",
    "title": "burst",
    "description": "高风险高回报，残血时爆发极高。",
    "maxHp": 10,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "爆发",
      "高手",
      "低血量"
    ],
    "difficulty": "expert",
    "sortOrder": 7,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "berserker"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "1 点狂击",
        "description": "造成 1 点基础伤害，并追加已损失生命值等量伤害。"
      },
      {
        "roll": 2,
        "name": "2 点狂击",
        "description": "造成 2 点基础伤害，并追加已损失生命值等量伤害。"
      },
      {
        "roll": 3,
        "name": "3 点狂击",
        "description": "造成 3 点基础伤害，并追加已损失生命值等量伤害。"
      },
      {
        "roll": 4,
        "name": "4 点狂击",
        "description": "造成 4 点基础伤害，并追加已损失生命值等量伤害。"
      },
      {
        "roll": 5,
        "name": "5 点狂击",
        "description": "造成 5 点基础伤害，并追加已损失生命值等量伤害。"
      },
      {
        "roll": 6,
        "name": "6 点狂击",
        "description": "造成 6 点基础伤害，并追加已损失生命值等量伤害。"
      }
    ],
    "role": "burst",
    "shortDescription": "高风险高回报，残血时爆发极高。",
    "fullDescription": [
      "血量很低，但越残血伤害越高",
      "损失了多少血，本次攻击就额外增加多少伤害"
    ],
    "isImplemented": true
  },
  {
    "id": "stone_titan",
    "name": "巨石泰坦",
    "title": "defense",
    "description": "血量极高，但低点数经常打不出伤害。",
    "maxHp": 30,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "防御",
      "重装",
      "高血量",
      "低频爆发"
    ],
    "difficulty": "simple",
    "sortOrder": 8,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "stone_titan"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "沉重迟缓",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 2,
        "name": "沉重迟缓",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 3,
        "name": "沉重迟缓",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 4,
        "name": "沉重迟缓",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 5,
        "name": "巨岩重击",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 6,
        "name": "碾压",
        "description": "可造成 9 点伤害；普通攻击造成 6 点伤害。"
      }
    ],
    "role": "defense",
    "shortDescription": "血量极高，但低点数经常打不出伤害。",
    "fullDescription": [
      "巨石泰坦拥有 30 点血量。",
      "投到 1、2、3、4 时不会造成伤害。",
      "投到 5 时造成 5 点伤害；投到 6 时造成 9 点伤害。"
    ],
    "isImplemented": true
  },
  {
    "id": "fearless_assassin",
    "name": "刺客（无畏）",
    "title": "burst",
    "description": "血量越健康，攻击越凶。",
    "maxHp": 15,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "爆发",
      "血量收益"
    ],
    "difficulty": "normal",
    "sortOrder": 9,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "fearless_assassin"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "观察",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 2,
        "name": "无畏刺击",
        "description": "造成 2 点基础伤害，生命越健康额外伤害越高。"
      },
      {
        "roll": 3,
        "name": "无畏刺击",
        "description": "造成 3 点基础伤害，生命越健康额外伤害越高。"
      },
      {
        "roll": 4,
        "name": "无畏刺击",
        "description": "造成 4 点基础伤害，生命越健康额外伤害越高。"
      },
      {
        "roll": 5,
        "name": "无畏刺击",
        "description": "造成 5 点基础伤害，生命越健康额外伤害越高。"
      },
      {
        "roll": 6,
        "name": "无畏刺击",
        "description": "造成 6 点基础伤害，生命越健康额外伤害越高。"
      }
    ],
    "role": "burst",
    "shortDescription": "血量越健康，攻击越凶。",
    "fullDescription": [
      "刺客（无畏）最大血量 15。",
      "投到 1 时无伤。",
      "满血时伤害 +3；血量高于 10 时伤害 +2；血量高于 5 时伤害 +1；血量小于等于 5 时造成普通伤害。"
    ],
    "isImplemented": true
  },
  {
    "id": "execution_assassin",
    "name": "刺客（斩）",
    "title": "attack",
    "description": "擅长收割残血目标。",
    "maxHp": 15,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "收割",
      "斩杀",
      "残血收割"
    ],
    "difficulty": "complex",
    "sortOrder": 10,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "execution_assassin"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "潜伏",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 2,
        "name": "处决刺击",
        "description": "造成 2 点基础伤害；目标血量越低伤害越高，目标生命小于等于 3 时可处决。"
      },
      {
        "roll": 3,
        "name": "处决刺击",
        "description": "造成 3 点基础伤害；目标血量越低伤害越高，目标生命小于等于 3 时可处决。"
      },
      {
        "roll": 4,
        "name": "处决刺击",
        "description": "造成 4 点基础伤害；目标血量越低伤害越高，目标生命小于等于 3 时可处决。"
      },
      {
        "roll": 5,
        "name": "处决刺击",
        "description": "造成 5 点基础伤害；目标血量越低伤害越高，目标生命小于等于 3 时可处决。"
      },
      {
        "roll": 6,
        "name": "处决刺击",
        "description": "造成 6 点基础伤害；目标血量越低伤害越高，目标生命小于等于 3 时可处决。"
      }
    ],
    "role": "attack",
    "shortDescription": "擅长收割残血目标。",
    "fullDescription": [
      "刺客（斩）最大血量 15。",
      "投到 1 时无伤。",
      "目标血量越低，伤害越高；目标血量低于最大血量的 3/4 时伤害 +1，低于 1/2 时伤害 +2。",
      "若目标当前血量小于等于 3，则可尝试处决；只有本次最终结算后生命扣到 0 才会斩杀。"
    ],
    "isImplemented": true
  },
  {
    "id": "self_destructor",
    "name": "自爆人",
    "title": "burst",
    "description": "用自己的血量换取爆发伤害。",
    "maxHp": 20,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "爆发",
      "高风险"
    ],
    "difficulty": "complex",
    "sortOrder": 11,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "self_destructor"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "哑火",
        "description": "本次不造成伤害。"
      },
      {
        "roll": 2,
        "name": "攻击",
        "description": "造成 2 点伤害。"
      },
      {
        "roll": 3,
        "name": "攻击",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 4,
        "name": "攻击",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 5,
        "name": "攻击",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 6,
        "name": "自爆",
        "description": "可扣除自己 1-9 点生命，对目标造成扣血量 x2 的普通伤害；也可普通攻击造成 6 点伤害。"
      }
    ],
    "role": "burst",
    "shortDescription": "用自己的血量换取爆发伤害。",
    "fullDescription": [
      "自爆人最大血量 20。",
      "投到 1 时无伤。",
      "投到 6 时可以普通攻击造成 6 点伤害；也可以发动自爆：选择扣除自己 1 到 9 点血量，然后对目标造成扣血量 x2 的普通伤害，最高 18。",
      "扣血直接扣除自爆人血量，不经过自己的护盾；不能选择超过当前血量的扣血量。"
    ],
    "isImplemented": true
  },
  {
    "id": "war_knight",
    "name": "战争骑士",
    "title": "defense",
    "description": "攻势较稳，拥有护甲和少量回复。",
    "maxHp": 20,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "防御",
      "护甲",
      "续航"
    ],
    "difficulty": "normal",
    "sortOrder": 12,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "war_knight"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "钝击",
        "description": "造成 0 点伤害。"
      },
      {
        "roll": 2,
        "name": "钝击",
        "description": "造成 1 点伤害。"
      },
      {
        "roll": 3,
        "name": "战争复苏",
        "description": "可回复 3 点生命；普通攻击造成 2 点伤害。"
      },
      {
        "roll": 4,
        "name": "钝击",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 5,
        "name": "钝击",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 6,
        "name": "钝击",
        "description": "造成 5 点伤害。"
      }
    ],
    "role": "defense",
    "shortDescription": "攻势较稳，拥有护甲和少量回复。",
    "fullDescription": [
      "战争骑士最大血量 20。",
      "自己造成伤害 -1，最低为 0。",
      "护甲 +1。",
      "投到 3 时可以普通攻击造成 2 点伤害；也可以发动技能回复 3 点血，不能超过最大血量。"
    ],
    "isImplemented": true
  },
  {
    "id": "crescent_moon",
    "name": "残月者",
    "title": "burst",
    "description": "开局极脆，但会逐步恢复并打出高伤害。",
    "maxHp": 15,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "爆发",
      "续航",
      "低血量"
    ],
    "difficulty": "complex",
    "sortOrder": 13,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "crescent_moon"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "残月斩",
        "description": "造成 3 点伤害。"
      },
      {
        "roll": 2,
        "name": "残月斩",
        "description": "造成 4 点伤害。"
      },
      {
        "roll": 3,
        "name": "残月斩",
        "description": "造成 5 点伤害。"
      },
      {
        "roll": 4,
        "name": "残月斩",
        "description": "造成 6 点伤害。"
      },
      {
        "roll": 5,
        "name": "残月斩",
        "description": "造成 7 点伤害。"
      },
      {
        "roll": 6,
        "name": "满月一击",
        "description": "可造成固定 9 点伤害；普通攻击造成 8 点伤害。"
      }
    ],
    "role": "burst",
    "shortDescription": "开局极脆，但会逐步恢复并打出高伤害。",
    "fullDescription": [
      "残月者最大血量 15，初始血量 3。",
      "每到自己行动开始时回复 2 点血，不能超过最大血量。",
      "普通伤害为骰点 +2。",
      "投到 6 时可以普通攻击造成 8 点伤害；也可以发动技能造成固定 9 点伤害。"
    ],
    "isImplemented": true
  },
  {
    "id": "fire_lord",
    "name": "火焰领主",
    "title": "attack",
    "description": "通过叠加火焰印记制造爆发窗口。",
    "maxHp": 16,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "攻击",
      "印记",
      "爆发"
    ],
    "difficulty": "complex",
    "sortOrder": 14,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "fire_lord"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "火焰打击",
        "description": "造成 1 点伤害，并给目标添加 1 层火焰印记。"
      },
      {
        "roll": 2,
        "name": "火焰打击",
        "description": "造成 2 点伤害，并给目标添加 1 层火焰印记。"
      },
      {
        "roll": 3,
        "name": "火焰印记",
        "description": "可不造成伤害并添加 1 层火焰印记；普通攻击不造成伤害。"
      },
      {
        "roll": 4,
        "name": "火焰打击",
        "description": "造成 4 点伤害，并给目标添加 1 层火焰印记。"
      },
      {
        "roll": 5,
        "name": "火焰打击",
        "description": "造成 5 点伤害，并给目标添加 1 层火焰印记。"
      },
      {
        "roll": 6,
        "name": "火焰爆发",
        "description": "可引爆目标火焰印记，每层造成 3 点普通伤害并清空；普通攻击造成 6 点伤害并添加 1 层印记。"
      }
    ],
    "role": "attack",
    "shortDescription": "通过叠加火焰印记制造爆发窗口。",
    "fullDescription": [
      "火焰领主最大血量 16。",
      "投到 3 时普通攻击不造成伤害且不添加火焰印记；也可以发动火焰印记技能，不造成伤害并添加 1 层火焰印记。",
      "每次普通攻击敌方时，给目标添加 1 层火焰印记。",
      "投到 6 时可以普通攻击造成 6 点伤害并添加 1 层火焰印记；也可以发动技能，爆发目标身上的火焰印记，每层造成 3 点普通伤害，爆发后清空目标火焰印记。"
    ],
    "isImplemented": true
  },
  {
    "id": "mountain_shield",
    "name": "山盾",
    "title": "defense",
    "description": "用架盾状态保护自己和队友。",
    "maxHp": 25,
    "avatarUrl": "",
    "spriteUrl": "",
    "tags": [
      "防御",
      "护甲",
      "团队"
    ],
    "difficulty": "complex",
    "sortOrder": 15,
    "availability": {
      "classic": true,
      "duo": true,
      "pve": true,
      "roguelite": true,
      "hidden": false
    },
    "implementation": {
      "mode": "code_driven",
      "handlerId": "mountain_shield"
    },
    "diceFaces": [
      {
        "roll": 1,
        "name": "盾击",
        "description": "造成 0 点伤害；架盾时仍为 0 点。"
      },
      {
        "roll": 2,
        "name": "盾击",
        "description": "造成 1 点伤害；架盾时造成 0 点。"
      },
      {
        "roll": 3,
        "name": "盾击",
        "description": "造成 2 点伤害；架盾时造成 1 点。"
      },
      {
        "roll": 4,
        "name": "盾击",
        "description": "造成 3 点伤害；架盾时造成 2 点。"
      },
      {
        "roll": 5,
        "name": "盾击",
        "description": "造成 4 点伤害；架盾时造成 3 点。"
      },
      {
        "roll": 6,
        "name": "架盾",
        "description": "可进入架盾状态；普通攻击造成 5 点伤害，架盾时造成 4 点。"
      }
    ],
    "role": "defense",
    "shortDescription": "用架盾状态保护自己和队友。",
    "fullDescription": [
      "山盾最大血量 25。",
      "自己造成伤害 -1，护甲 +1。",
      "投到 6 时可以普通攻击造成 5 点伤害，若正在架盾则造成 4 点伤害；也可以发动技能进入架盾状态，不额外造成伤害。",
      "架盾状态下，山盾自己的伤害额外 -1，自己的护甲额外 +1，所有队友包括山盾自己获得团体护甲 +2。",
      "每到山盾行动开始时先投骰，1-4 继续架盾，5-6 结束架盾。"
    ],
    "isImplemented": true
  }
] as const satisfies readonly EditableCharacter[];
