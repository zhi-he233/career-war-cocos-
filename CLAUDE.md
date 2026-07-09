# Career War Cocos — 项目架构

> 最后更新：2026-07-02 | Cocos Creator 3.8.8

## 目录结构

```
career-war-cocos/
├── assets/
│   ├── scenes/                    # Cocos 场景文件
│   │   ├── Home.scene             # 主页/菜单
│   │   ├── Lobby.scene            # 角色选择大厅
│   │   ├── Battle.scene           # 战斗主界面
│   │   └── Roguelite.scene        # 肉鸽模式
│   └── scripts/
│       ├── shared/                # 从 career-war/shared/ 复制的游戏引擎（纯 TS，20 个文件）
│       │   ├── engine.ts          (1727行) 核心引擎
│       │   ├── types.ts           (396行)  全部类型定义
│       │   ├── skillOutcomes.ts   (247行)  15 角色技能结算
│       │   ├── combatMath.ts      (112行)  战斗数学
│       │   ├── ...                (其余 16 个文件)
│       │   └── data/              (12 个数据文件)
│       ├── network/
│       │   └── NetworkManager.ts  (213行) Socket.IO 封装，动态加载 socket.io.js
│       ├── core/
│       │   ├── GameManager.ts     (217行) 中央调度器，持有 Room，事件总线
│       │   ├── GameEvents.ts      (10行)  事件名常量
│       │   ├── ServerActions.ts   (115行) 25 个已封装的服务器事件
│       │   └── DisplayText.ts     (52行)  角色/技能名称映射
│       ├── scenes/
│       │   ├── HomeScene.ts       (296行) 主页：创建/加入房间、房间列表
│       │   ├── LobbyScene.ts      (243行) 大厅：角色选择、技能选择
│       │   ├── BattleScene.ts     (304行) 战斗：目标选择、骰子、行动
│       │   └── RogueliteScene.ts  (287行) 肉鸽：奖励/事件/商店/地图选路
│       ├── ui/
│       │   ├── battle/
│       │   │   ├── BattleSeat.ts  (106行) 单个战斗座位
│       │   │   ├── DicePanel.ts   (138行) 骰子面板
│       │   │   ├── ActionSlots.ts (145行) 行动按钮
│       │   │   └── BattleLog.ts   (62行)  战斗日志
│       │   └── roguelite/
│       │       └── RoguelitePanel.ts (71行) 肉鸽状态 HUD
│       └── prototype/
│           ├── BattlePrototype.ts (390行) 离线战斗测试（无需服务器）
│           └── BattlePrototype.scene
├── package.json                   # Cocos 3.8.8, socket.io-client ^4.8.3
└── tsconfig.json                  # 继承 temp/tsconfig.cocos.json
```

## 架构分层

```
┌── UI Layer (场景 + 组件) ───────────────────────────────┐
│  HomeScene  LobbyScene  BattleScene  RogueliteScene      │
│  BattleSeat  DicePanel  ActionSlots  BattleLog           │
└──────────────────┬───────────────────────────────────────┘
                   ↑ GameEvents (Cocos node events)
┌── ViewModel Layer (新增) ───────────────────────────────┐
│  ViewModels.ts — 展示层类型定义                           │
│  BattlePlayerHelpers.ts — 纯函数，Room/Player → 展示数据  │
│  DiceAnimator.ts — 骰子动画状态机                         │
│  EmoteHelper.ts — 表情冷却/管理                          │
└──────────────────┬───────────────────────────────────────┘
                   ↑
┌── Core Layer ───────────────────────────────────────────┐
│  GameManager (单例) — 持有 Room，场景路由，事件分发        │
│  ServerActions — 类型安全的 emitAck 封装 (25个事件)       │
│  DisplayText — 角色/技能名称映射                          │
│  GameEvents — 事件名常量                                 │
└──────────────────┬───────────────────────────────────────┘
                   ↑
┌── Network Layer ────────────────────────────────────────┐
│  NetworkManager (单例) — Socket.IO 动态加载               │
│  AuthManager (单例) — REST API 认证封装                   │
│  连接管理、pending 队列、断线事件                          │
└──────────────────┬───────────────────────────────────────┘
                   ↑ Socket.IO + REST
┌── Server (career-war/server/) ──────────────────────────┐
│  游戏权威、房间管理、Bot AI                                │
└──────────────────────────────────────────────────────────┘
                   ↑ (import)
┌── Shared Engine (assets/scripts/shared/) ───────────────┐
│  纯 TS 游戏逻辑、类型、数据（从 career-war/shared/ 复制）  │
└──────────────────────────────────────────────────────────┘
```

## 关键设计

### NetworkManager 动态加载
不 `import "socket.io-client"`，而是运行时从服务器加载 `<script>` 标签，通过 `window.io` 全局变量获取。这是 Cocos Web 构建的标准做法。

### GameManager 事件流
```
NetworkManager 收到 socket 事件
  → GameManager._onRoomUpdated() / _onStatusUpdated()
  → this.node.emit(GameEvents.RoomUpdated, room)
  → 各 Scene/UI Component 的 onRoomUpdated() 收到回调
```

### shared/ 引用方式
shared/ 代码被**完整复制**到 `assets/scripts/shared/` 下（不是 npm workspace）。
Cocos Creator 要求所有脚本在 `assets/` 内。所有 import 使用相对路径 `../shared/xxx`。

## 变更记录 (2026-07-02)

### 新增文件
| 文件 | 行数 | 用途 |
|---|---|---|
| `models/ViewModels.ts` | 185 | 展示层类型：SeatVM, DicePanelVM, ActionSlotVM, RoguelitePanelVM 等 |
| `helpers/BattlePlayerHelpers.ts` | 252 | 纯函数库：getActor, canTarget, canLocalAct, hpPercent, playerStatus, buildSeatTags 等 |
| `helpers/DiceAnimator.ts` | 170 | 骰子动画状态机：idle→fast→slow→pause→reveal→idle |
| `helpers/EmoteHelper.ts` | 113 | 表情管理：6 个表情定义、冷却控制、自动过期 |
| `managers/AuthManager.ts` | 186 | REST API 认证：register/login/logout/me/updateProfile/refreshCharacters |

### 修改文件
| 文件 | 变更 |
|---|---|
| `core/ServerActions.ts` | 新增 8 个事件：resumeRoom, leaveRoom, kickPlayer, rollGuardCheck, readyForRematch, sendEmote, chooseDuoSlotCharacter, chooseDuoSlotSummonerSkill；补充 confirmRollDecision。总计 25 个 |
| `core/GameManager.ts` | 新增 localPlayerId 字段 + setLocalPlayerId()；handleAckResponse 现在也处理 playerId；新增 sys import |
| `scenes/HomeScene.ts` | 新增 tryAutoResume() — 启动时自动检测已保存的房间并重连；全部 emitAck 调用改用 ServerActions；移除冗余 applyRoomUpdate |
| `scenes/BattleScene.ts` | 新增 ServerActions 实例；selectTarget/rollDice/confirmAction 改用 ServerActions |

### 目录结构（更新后）
```
assets/scripts/
├── core/
│   ├── GameManager.ts        # 中央调度器 (修改: +playerId支持)
│   ├── GameEvents.ts         # 事件名常量
│   ├── ServerActions.ts      # 25 个服务器事件封装 (修改: +8个事件)
│   └── DisplayText.ts        # 角色/技能名称映射
├── managers/
│   └── AuthManager.ts        # (新增) REST API 认证
├── models/
│   └── ViewModels.ts         # (新增) 展示层类型定义
├── helpers/
│   ├── BattlePlayerHelpers.ts# (新增) 战斗显示逻辑纯函数
│   ├── DiceAnimator.ts       # (新增) 骰子动画状态机
│   └── EmoteHelper.ts        # (新增) 表情系统
├── network/
│   └── NetworkManager.ts     # Socket.IO 封装
├── scenes/
│   ├── HomeScene.ts          # 主页 (修改: +auto-resume)
│   ├── LobbyScene.ts         # 大厅
│   ├── BattleScene.ts        # 战斗
│   └── RogueliteScene.ts     # 肉鸽
├── ui/
│   ├── battle/
│   │   ├── BattleSeat.ts     # 战斗座位
│   │   ├── DicePanel.ts      # 骰子面板
│   │   ├── ActionSlots.ts    # 行动按钮
│   │   └── BattleLog.ts      # 战斗日志
│   └── roguelite/
│       └── RoguelitePanel.ts # 肉鸽状态HUD
├── shared/                   # 游戏引擎 (20个文件)
│   ├── engine.ts, types.ts, skillOutcomes.ts, combatMath.ts, ...
│   └── data/                 # 12 个数据文件
└── prototype/
    └── BattlePrototype.ts    # 离线战斗测试
```

---

## 中文文件编码安全规则

本项目源码、配置和文档默认使用 UTF-8。处理包含中文的文件时，必须遵守以下规则：

1. 如果终端输出出现乱码、问号、替换字符 `�` 或异常中文：
   - 立即视为"终端显示编码异常"；
   - 不得根据乱码推测原文；
   - 不得复制乱码内容写回文件；
   - 不得因为显示乱码而修改、删除或重新输入原有中文。

2. 终端显示内容不能作为中文源码的唯一依据。必须使用以下任一可靠方式重新读取：
   - 编辑器或文件读取工具；
   - `Get-Content -Raw -Encoding UTF8 <file>`；
   - Python：`open(path, encoding="utf-8", errors="strict")`；
   - Node.js：`fs.readFileSync(path, "utf8")`。

3. 如果 UTF-8 严格读取失败，先检测文件真实编码、BOM 和换行符，再报告问题。未经确认不得自动转码。

4. 补丁匹配失败时：
   - 不得直接改用"按行号盲目替换"；
   - 不得整文件重写；
   - 应使用稳定的英文标识符、函数名、组件名、标签结构作为修改锚点；
   - 修改范围必须尽可能小。

5. 写入文件时必须保留：
   - 原始编码；
   - BOM 状态；
   - CRLF/LF 换行格式；
   - 未涉及区域的原始内容。

6. 修改完成后必须检查：
   - `git diff --check`；
   - `git diff -- <file>`；
   - 中文是否仍然正常；
   - 是否新增了 `�`、异常问号或乱码字节。

7. 如果无法可靠读取中文内容，停止修改并明确说明风险，不得继续猜测执行。

8. 严禁仅因为 PowerShell 显示乱码，就认定源文件内容已经损坏。

---

## 强制编码工作流（防止返工、省Token、提高准确度）

> ⚠️ **每次写代码必须遵循此流程。跳过步骤是返工和浪费Token的根本原因。**

### 写代码前（必做）

**1. 任务规划 — 使用 `career-war-orchestrator`**（如果在 career-war 目录下操作）

- 任务分类（UI / 逻辑 / 服务端 / 肉鸽数据）
- 明确允许改哪些文件、禁止改哪些文件
- 输出 Task Brief

> 原则：一次只做一件事。如果任务包含多个类别，拆成多个子任务分别执行。

**2. 复杂逻辑 — 使用 `prototype`（LOGIC分支）**

如果任务涉及以下任一种情况，**必须先建终端原型**：
- 新增角色技能逻辑
- 修改战斗结算（damage/heal/shield）
- 状态机/回合顺序
- 任何你"不太确定"的逻辑

> 原型用 `tsx` 运行，纯 TypeScript，验证通过后再写 Cocos 代码。

**3. 复杂设计 — 使用 `codebase-design` + `grilling`**

### 写代码时（必做）

**4. 测试驱动 — 使用 `tdd`**

```
RED → GREEN → REFACTOR（一次一个功能）
```

Cocos 客户端代码难以单元测试的场景，先用 prototype 跑通逻辑，再写 UI。

### 写代码后（必做）

**5. 自查 — 使用 `review`**
**6. 验证 — 跑 `npm run build`（Cocos 构建）**

### 遇到Bug时

**7. 结构化诊断 — 使用 `diagnosing-bugs`**

### Token节省原则

- 每次任务只读必要文件
- 先定位再修改
- 回答控制在200字以内
- 新会话比超长会话更省

---

## 共享引擎关键 API

```typescript
// engine.ts
createPlayer(id, clientId, nickname, isHost): Player
chooseCharacter(room, playerId, characterId): void
startGame(room, ctx): void
rollForActivePlayer(room, playerId, ctx, controllerId?): RollResult
confirmRollDecision(room, playerId, decisionId, choice, ctx, ...): void

// combatMath.ts
getCombatArmor(target, context): number
applyDamageToPlayer(target, damage, options): DamageResult
applyHealingToPlayer(player, amount, options): HealingResult

// skillOutcomes.ts
resolveSkill(characterId, roll, ...): SkillOutcome
```

## ServerActions 完整列表 (25 个事件):

createRoom, joinRoom, resumeRoom, leaveRoom, requestRoomList,
chooseCharacter, chooseSummonerSkill, chooseDuoSlotCharacter, chooseDuoSlotSummonerSkill,
updateRoomSettings, startGame, kickPlayer,
selectTarget, selectActor, rollDice, rollGuardCheck,
confirmRollDecision, readyForRematch,
chooseRogueliteReward, chooseRogueliteEventOption, chooseRogueliteContinue,
buyRogueliteShopItem, useRogueliteRestAction, leaveRogueliteRoom,
sendEmote
