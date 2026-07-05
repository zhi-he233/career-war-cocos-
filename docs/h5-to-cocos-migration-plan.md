# H5 → Cocos Creator 迁移跟踪清单

> 最后更新：2026-07-06 | 基于 H5 App.vue + 全部 Vue 组件 vs Cocos 脚本 + Prefab 的逐项对比

## 状态标记

| 标记 | 含义 |
|---|---|
| ✅ | 已完成，功能对齐 |
| 🟡 | 部分完成，缺关键功能 |
| ❌ | 缺失，尚未开始 |
| ⏭️ | 暂不迁移（低优先级/依赖未就绪） |

---

## 一、H5 场景 → Cocos 场景映射

| H5 路由/页面 | Cocos Scene | 状态 | 脚本文件 | 备注 |
|---|---|---|---|---|
| `/` HomePage | `Home.scene` | 🟡 | `HomeScene.ts` (296行) | 三种模式入口已有，缺 PvP 房间列表 |
| `/modes` PvpModePage | 并入 `Home.scene` | 🟡 | 同上 | 模式选择逻辑在 HomeScene 内联，无独立场景 |
| `/room/:roomId` LobbyPage | `Lobby.scene` + 4个子场景 | 🟡 | `LobbyScene.ts` (243行) | Classic1v1Lobby/DuoLobby/PveLobby/RogueliteLobby 共享基类 |
| `/room/:roomId/battle` BattlePage | `Battle.scene` | 🟡 | `BattleScene.ts` (304行) | 核心战斗流程可用，缺反馈层 |
| (roguelite phases) | `Roguelite.scene` + `RogueliteBattle.scene` | 🟡 | `RogueliteScene.ts` (287行) | 五种 phase 功能可用，UI 是文字按钮 |
| `/profile` ProfilePage | `Profile.scene` | 🟡 | ProfilePanel prefab | ProfileService 已抽离，缺服务端 API |
| AuthDialog | 无独立场景 | ❌ | `AuthManager.ts` | REST 封装已就绪，缺 AuthDialog prefab |
| RuleGuideDialog | `RuleGuidePanel.prefab` | ✅ | 系统 prefab | Home 已接入 |

---

## 二、BattlePage 子组件迁移状态

### 2.1 战斗 UI 组件

| H5 组件 (.vue) | Cocos 对应 | 状态 | 关键缺失 |
|---|---|---|---|
| `CombatBoard.vue` | `BattleScene.ts` 内联 + `BattleSeat.prefab` | 🟡 | 座位网格布局、按模式切换（经典/肉鸽/2v2） |
| `BattleSeat.vue` | `BattleSeat.prefab` + `BattleSeat.ts` | 🟡 | `.active/.dead/.shielded/.selectable/.selected/.hit/.healed/.blocked` 视觉状态；精灵翻转 `.is-enemy`；表情气泡；房主标记；无敌标记 |
| `DicePanel.vue` | `DicePanel.prefab` + `DicePanel.ts` | 🟡 | 骰面图片切换已做，缺 `.jackpot-six` 金色发光、`.skill-ready` 状态、skill-hint 过渡动画 |
| `ActionSlots.vue` | `ActionSlots.prefab` + `ActionSlots.ts` | 🟡 | 四种类型独立样式（attack/character/summoner/roguelite）；自毁面板（1-9 扣血量） |
| `SelfPanel.vue` | `SelfPanel.prefab` | 🟡 | `.danger` 低血量红色；`.active` 当前回合高亮；`.compact` 紧凑模式 |
| `EmotePanel.vue` | `EmotePanel.prefab` | 🟡 | 6 个表情按钮已有；缺 `playerEmote` 事件接收和气泡显示 |
| `BattleLogDrawer.vue` | `BattleLogDrawer.prefab` + `BattleLog.ts` | 🟡 | 时间戳格式 `HH:MM:SS`；最新条目 `.newest` 高亮 |
| `PlayerDetailDialog.vue` | `PlayerDetailDialog.prefab` | 🟡 | 状态圆点（绿/红/灰）；头像环；4 格统计面板（HP/护盾/状态/最近骰点）；职业技能列表 |
| `BattleUnitDetailCard.vue` | 无独立 prefab | ❌ | 已并入 PlayerDetailDialog prefab |
| Rematch panel | `RematchPanel.prefab` | 🟡 | GameOver 阶段显示面板，需验证 `readyForRematch` 到服务器的完整回路 |

### 2.2 肉鸽 UI 组件

| H5 组件 (.vue) | Cocos 对应 | 状态 | 关键缺失 |
|---|---|---|---|
| `RogueliteRunMap.vue` | 无 | ❌ | 可拖拽+滚轮全屏地图；SVG 曲线连线（done/active/next/locked 四种状态）；资源栏（HP/金币/关卡/Boss距离） |
| `RogueliteMapNode.vue` | `RogueliteMapNode.prefab` | 🟡 | 7 种类型颜色主题 ✅；6 种状态 ✅；3 种尺寸（Boss 最大）；浮动/按压动画 |
| `RogueliteRewardChoice.vue` | `RewardCard.prefab` | 🟡 | 4 种稀有度色；选中发光；`selected/pending/disabled/taken` 状态已做 ✅ |
| `RogueliteEventChoice.vue` | `EventChoiceCard.prefab` | 🟡 | 毛玻璃背景；A/B 字母徽章；效果/代价定义列表 |
| `RogueliteRoomPanel.vue` | 无独立 prefab | ❌ | 商店（物品+价格+购买）、休息（行动按钮）、事件预览。当前 RogueliteScene 内联渲染 |
| `RoguelitePanel.vue` | `RogueliteStatusPanel.prefab` | 🟡 | 深度详情：Boss 状态 chip、动态资源（命运筹码/蓄力）、词条面板（三组分类）；`CurrencyBar` + `BuffIcon` 已组成 ✅ |
| `RogueliteStatusCompact.vue` | `RogueliteStatusCompact.prefab` | 🟡 | 战斗中紧凑条；阶段类型色；狂化疲劳指示器；词条预览（最多3+Lv） |
| `RogueliteEventHeader.prefab` | ✅ 已做 | 事件标题/稀有度/阶段/描述 |
| `ShopItemCard.prefab` | ✅ 已做 | 价格/效果/金币不足禁用 |
| `ShopControlBar.prefab` | ✅ 已做 | 商店标题/金币/刷新/离开 |

### 2.3 大厅 UI 组件

| H5 组件 (.vue) | Cocos 对应 | 状态 | 关键缺失 |
|---|---|---|---|
| `PlayerListPanel.vue` | `PlayerListItem.prefab` | 🟡 | 房主标记、离线状态、踢人按钮、空位显示 |
| `ClassicCharacterPicker.vue` | `CharacterCard.prefab` | 🟡 | 搜索框、筛选标签（全部/简单/普通/复杂/专家）、分页（每页12）、随机职业 |
| `SummonerSkillPanel.vue` | `SummonerSkillCard.prefab` | 🟡 | 冷却标签、描述、详情弹窗 |
| `CharacterDetailDialog.vue` | `CharacterDetailDialog.prefab` | 🟡 | 头像、名称、称号、HP、标签、技能描述（编号+文字） |
| `SummonerSkillDetailDialog.vue` | `SummonerSkillDetailDialog.prefab` | 🟡 | 技能名称、冷却标签、描述、选择/关闭按钮 |
| `RoomSettingsPanel.vue` | `RoomSettingsPanel.prefab` | 🟡 | 模式选择、最大人数、重复职业复选框；房主只读显示 |
| `DuoSlotPicker.vue` | `DuoSlotPicker.prefab` | 🟡 | 双槽位角色+技能选择；已占用禁用 |
| `RogueliteIntroPanel.vue` | 无 | ❌ | "固定从拳手开始"说明文字 |
| `LobbyStartBar.vue` | `LobbyStartBar.prefab` | 🟡 | 开始按钮 + 条件判断（三种模式不同逻辑） |
| `LobbyTabs.vue` | 无 | ❌ | 玩家/设置/召唤师/角色标签切换。当前 LobbyScene 全部平铺 |

### 2.4 系统与体验组件

| H5 组件 | Cocos 对应 | 状态 | 关键缺失 |
|---|---|---|---|
| AuthDialog | 无 prefab | ❌ | AuthManager 已就绪，缺登录/注册/退出 UI |
| ProfilePage | `ProfilePanel.prefab` + `ProfileService.ts` | 🟡 | 离线可看 ✅，缺 `/api/profile/me` 在线刷新 |
| RuleGuideDialog | `RuleGuidePanel.prefab` | ✅ | Home 已接入 |
| FocusHint (tutorial) | 无 | ❌ | 肉鸽新手教程（地图节点→投骰→选奖励 3 步） |
| Toast/Error 反馈 | `ToastLayer.prefab` + `GameManager.showToast()` | ✅ | 四个场景已引用 |
| Skill toast / Character highlight | 无 | ❌ | 技能触发弹出提示、角色高亮覆盖层 |
| Floating damage/heal/block | `BattleScene.spawnFloatingEffect()` | 🟡 | 已做基础版本，缺大伤害放大、颜色区分 |

---

## 三、Socket 事件对齐

### 3.1 服务端 → 客户端 (8 个 on 事件)

| H5 事件 | Cocos NetworkManager | GameManager 处理 | 状态 |
|---|---|---|---|
| `characters` | ✅ `networkManager.on('characters', ...)` | ✅ → emit `GameEvents.CharactersUpdated` | ✅ |
| `gameStateUpdated` | ✅ `networkManager.on('gameStateUpdated', ...)` | ✅ `handleRoomUpdate()` → emit `RoomUpdated` | ✅ |
| `roomListUpdated` | ✅ `networkManager.on('roomListUpdated', ...)` | ✅ → emit `GameEvents.RoomListUpdated` | ✅ |
| `battleLogAdded` | ✅ `networkManager.on('battleLogAdded', ...)` | ✅ → emit `GameEvents.BattleLogAdded` | ✅ |
| `playerEmote` | ✅ `networkManager.on('playerEmote', ...)` | ✅ → emit `GameEvents.PlayerEmote` | ✅ |
| `gameOver` | ✅ `networkManager.on('gameOver', ...)` | ✅ → emit `GameEvents.GameOver` + toast winner | ✅ |
| `errorMessage` | ✅ `networkManager.on('errorMessage', ...)` | ✅ → emit `GameEvents.ErrorMessage` + toast | ✅ |
| `kickedFromRoom` | ✅ `networkManager.on('kickedFromRoom', ...)` | ✅ → clearRoom + emit + back to Home | ✅ |
| `clientPong` | ✅ `networkManager.on('clientPong', ...)` | ✅ → 计算 `lastRttMs` | ✅ |

### 3.2 客户端 → 服务端 (28 个 emit 事件)

| H5 事件 | Cocos ServerActions 方法 | 状态 |
|---|---|---|
| `createRoom` | `createRoom(payload, callback)` | ✅ |
| `joinRoom` | `joinRoom(payload, callback)` | ✅ |
| `resumeRoom` | `resumeRoom(payload, callback)` | ✅ |
| `leaveRoom` | `leaveRoom(callback)` | ✅ |
| `requestRoomList` | `requestRoomList(callback)` | ✅ |
| `chooseCharacter` | `chooseCharacter(characterId)` | ✅ |
| `chooseSummonerSkill` | `chooseSummonerSkill(skillId)` | ✅ |
| `chooseDuoSlotCharacter` | `chooseDuoSlotCharacter(slotIndex, characterId)` | ✅ |
| `chooseDuoSlotSummonerSkill` | `chooseDuoSlotSummonerSkill(slotIndex, skillId)` | ✅ |
| `updateRoomSettings` | `updateRoomSettings(settings)` | ✅ |
| `startGame` | `startGame()` | ✅ |
| `selectTarget` | `selectTarget(targetId, callback?)` | ✅ |
| `selectActor` | `selectActor(actorId)` | ✅ |
| `rollDice` | `rollDice()` | ✅ |
| `rollGuardCheck` | `rollGuardCheck()` | ✅ |
| `confirmRollDecision` | `confirmRollDecision(payload, callback?)` | ✅ |
| `readyForRematch` | `readyForRematch()` | ✅ |
| `sendEmote` | `sendEmote(emoteId)` | ✅ |
| `chooseRogueliteReward` | `chooseRogueliteReward(rewardId)` | ✅ |
| `chooseRogueliteEventOption` | `chooseRogueliteEventOption(choiceId)` | ✅ |
| `chooseRogueliteContinue` | `chooseRogueliteContinue(choice, mapNode?)` | ✅ |
| `buyRogueliteShopItem` | `buyRogueliteShopItem(itemId)` | ✅ |
| `useRogueliteRestAction` | `useRogueliteRestAction(actionId)` | ✅ |
| `leaveRogueliteRoom` | `leaveRogueliteRoom()` | ✅ |
| `kickPlayer` | `kickPlayer(playerId)` | ✅ |
| `clientPing` | 未封装 | ⏭️ |

**emit 侧结论**：25 个事件已封装，缺 `clientPing`（低优先级）。

**on 侧结论**：**6 个服务端事件未注册监听**（battleLogAdded、playerEmote、gameOver、errorMessage、kickedFromRoom），这是 P1 的阻塞项。

---

## 四、H5 App.vue 能力对照

| App.vue 能力 | Cocos 实现位置 | 状态 |
|---|---|---|
| Socket 连接管理 | `NetworkManager.ts` — 动态加载 socket.io.js | ✅ |
| 客户端 ID 持久化 (`sessionStorage`) | `HomeScene.getClientId()` → `sys.localStorage` | ✅ |
| 房间恢复 (`tryResumeRoom`) | `HomeScene.tryAutoResume()` | ✅ |
| URL 路由同步 (phase → URL) | `GameManager.routeByPhase()` → `director.loadScene()` | ✅ |
| 错误消息 toast | `GameManager.showToast()` → `ToastLayer.prefab` | ✅ |
| Ack 回调模式 | `emitWithAck()` in App.vue → `emitAck()` in GameManager | ✅ |
| 离开确认弹窗 | ❌ 无 | ❌ |
| 连接状态诊断 (RTT/transport) | ❌ 无 | ⏭️ |
| 邀请房间 (query param) | ❌ 无（依赖 URL 参数，原生不可用） | ⏭️ |
| 昵称持久化 | `localStorage『career-war-nickname』` | 🟡 仅用 clientId |

---

## 五、脚本层完备性

### Helpers / ViewModels

| 文件 | 状态 | 行数 | 备注 |
|---|---|---|---|
| `BattlePlayerHelpers.ts` | ✅ | 252 | getActor/canTarget/hpPercent/playerStatus/buildSeatTags/diffFloatingEffects 等 18 个纯函数 |
| `RogueliteHelpers.ts` | ✅ | 258 | rogueliteEnemyTypeLabel/stageType/buildRoguelitePanelVM 等 20+ 函数 |
| `DiceAnimator.ts` | ✅ | 170 | idle→fast→slow→pause→reveal 状态机，DicePanel 已集成 |
| `EmoteHelper.ts` | ✅ | 83 | 6 个表情定义 + 冷却 + 自动过期 + trySend/addIncoming/tick |
| `BattleUiState.ts` | ✅ | 69 | 弹窗/抽屉/详情可见性管理 |
| `ViewModels.ts` | ✅ | 185 | 11 个 ViewModel 接口定义 |
| `ViewModelBuilders.ts` | ✅ | 185 | buildSeatViewModel/buildDicePanelVM/buildSelfPanelVM 等工厂函数 |
| `DisplayText.ts` | 🟡 | 52 | characterName/summonerSkillName 使用英文 fallback，需对齐中文名 |
| `AuthManager.ts` | ✅ | 186 | register/login/logout/me/updateProfile，credentials: 'include' ✅ |

### Managers

| 文件 | 状态 | 行数 | 备注 |
|---|---|---|---|
| `NetworkManager.ts` | ✅ | 213 | 动态加载 socket.io、pending 队列、断线事件、autoConnect |
| `GameManager.ts` | 🟡 | 217 | Room 持有、autoRouteScenes、showToast ✅；缺 6 个 on 事件注册 |
| `ServerActions.ts` | ✅ | 115 | 25 个事件全部封装，含 confirmRollDecision |

---

## 六、第一批阻塞项（必须在后续工作前解决）

### P0 阻塞 — 无（本文档即为 P0 产物）

### P1 阻塞 — 协议与状态底座 ✅ 已完成 (2026-07-06)

| # | 阻塞项 | 状态 |
|---|---|---|
| 1 | NetworkManager 缺 6 个 on 事件注册 | ✅ 已在 GameManager.onLoad 注册全部 9 个事件 |
| 2 | GameManager 未分发 battleLogAdded/playerEmote | ✅ GameEvents 新增 7 个事件名，GameManager 提供 onBattleLogAdded/onPlayerEmote/... 订阅 |
| 3 | NetworkManager 无 ack 超时保护 | ✅ 8s 超时，timer 清理、stale 响应防护 |
| 4 | 断线重连后无状态恢复确认 | ✅ tryResumeOnReconnect + pendingResumeOnReconnect 标记 |

### P1.1 修补 ✅ (2026-07-06)
- Stale emit：超时 timer 在真实 ack 到达时自动清理；disconnect 时清空全部 pending + timer
- 本地缓存：`clearRoom()` 清 room/playerId/localStorage；`leaveRoom()` 发服务器 + 兜底清理
- 事件补充：`characters` → CharactersUpdated、`roomListUpdated` → RoomListUpdated、`clientPong` → lastRttMs

### P4 阻塞 — 大厅

| # | 阻塞项 | 影响范围 |
|---|---|---|
| 5 | CharacterCard 无筛选/搜索/分页 | 15 个角色全部平铺，未来角色多了无法使用 |
| 6 | PlayerListItem 无踢人/离线状态 | 房主无法管理房间，离线玩家无法识别 |
| 7 | DuoSlotPicker 未验证 2v2 完整流程 | 双人选角可能选出冲突配置 |

### P5 阻塞 — 战斗

| # | 阻塞项 | 影响范围 |
|---|---|---|
| 8 | BattleSeat 无视觉状态 class | 用户看不出谁在行动、谁被选中、谁受伤害 |
| 9 | DicePanel 缺 skill-ready/jackpot-six 状态 | 技能触发提示不可见 |
| 10 | ActionSlots 四类型无视觉区分 | 普攻/技能/召唤师技能外观一样 |

---

## 七、迁移阶段总览

| 阶段 | 名称 | 状态 | 核心产出 |
|---|---|---|---|
| **P0** | 迁移清单 | ✅ 本文档 | h5-to-cocos-migration-plan.md |
| **P1** | 协议与状态底座 | 🔴 待开始 | 补齐 6 个 on 事件、ack 超时、断线恢复 |
| **P2** | 首页和模式入口 | 🟡 | 补齐房间列表、邀请加入、错误状态提示 |
| **P3** | 登录与档案 | 🟡 | AuthDialog prefab、ProfileService 在线刷新 |
| **P4** | 大厅迁移 | 🟡 | 筛选/分页/踢人/房间设置/2v2 槽位 |
| **P5** | 战斗核心闭环 | 🟡 | 视觉状态、DicePanel 动画完善、防重复点击 |
| **P6** | 表情/反馈/规则 | 🔴 待开始 | EmotePanel 接入事件、技能 toast、飘字完善 |
| **P7** | 肉鸽流程 | 🟡 | RogueliteRunMap 地图、路线连线、pending 锁 |
| **P8** | UI prefab 化 | 🟡 | ensureMinimalUi 收敛、缺失态规范化 |
| **P9** | 数据/文本/编码 | 🟡 | 中文化、DisplayText 统一入口 |
| **P10** | 测试与维护 | 🟡 | cocos-test-checklist 更新、helper 单元测试 |

---

## 八、下一步行动

按用户要求的执行顺序：**P0 → P1 → P4 → P5 → P7**。

**当前 P0 已完成**。下一步执行 **P1：协议与状态底座**，具体任务：

1. 在 NetworkManager/GameManager 注册 6 个缺失的 on 事件
2. 在 GameManager 中转发 battleLogAdded/playerEmote/gameOver 到场景事件
3. 给 emitAck 加 8 秒超时 + toast 提示
4. 完善断线重连后的状态验证
