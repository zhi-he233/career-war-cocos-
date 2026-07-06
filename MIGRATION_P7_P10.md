# Career War Cocos 迁移合入记录 — P7 → P10

> **合入日期**：2026-07-06
> **范围**：肉鸽 UI 卡牌化 · 战斗表情 · 规则统一 · 稳定性修复 · Prefab 回退 · 维护清理
> **最终状态**：`npx tsc --noEmit` 零错误，全部锁链闭环，全部 prefab 有回退，全部生命周期配对完整

---

## 1. 肉鸽 UI 与锁链（P7）

### 1.1 奖励选择卡牌化（P7.2）

| 文件 | 变更 |
|------|------|
| `ui/roguelite/RewardCard.ts` | 新增 `renderRich()` 标签渲染、`rarityIndexForRarity()`/`colorForRarity()` 静态方法、`RARITY_INDEX`/`RARITY_COLOR` 表、`onInfo` 回调、`setInteractable()`、Info 按钮 `propagationStopped` 阻止冒泡 |
| `scenes/RogueliteScene.ts` | 新增 `pendingRewardId` 锁字段、`chooseReward()` 锁链、`syncPendingReward()`、`showRewardInfo()` InfoDialog 集成 |

### 1.2 事件选择卡牌化（P7.3）

| 文件 | 变更 |
|------|------|
| `ui/roguelite/EventChoiceCard.ts` | 重写为三态组件（`available`/`selected`/`disabled`），新增 `setState()`、`setInteractable()`、`highlightCost()`、`RISK_COLOR` 表、Info 按钮 `propagationStopped` |
| `scenes/RogueliteScene.ts` | 新增 `pendingEventChoiceId` 锁、`chooseEventOption()` 锁链、`syncPendingEvent()`、`eventCostRiskHint()` 辅助、空 choices 保护 |

### 1.3 商店 UI 链硬化（P7.4）

| 文件 | 变更 |
|------|------|
| `scenes/RogueliteScene.ts` | 新增 `pendingShopAction` 锁、`buyShopItem()`/`leaveShop()` 锁链、`syncPendingShop()`、ShopControlBar 集成、回退按钮 `canBuy` 守卫 |

### 1.4 休息 UI 链硬化（P7.5）

| 文件 | 变更 |
|------|------|
| `scenes/RogueliteScene.ts` | 新增 `pendingRestActionId` 锁、`useRestAction()` 锁链、`syncPendingRest()` |

### 1.5 地图路线可视化（P7.6）

| 文件 | 变更 |
|------|------|
| `helpers/RogueliteHelpers.ts` | 新增 `buildRouteMapView()` 返回 `RouteMapVM`、`roomTypeDescription()`、`toRouteNodeVM()` |
| `models/ViewModels.ts` | 新增 `RouteNodeVM`、`RouteMapVM` 类型（替换旧 `MapNodeVM`） |
| `scenes/RogueliteScene.ts` | `renderRouteMap()` 替换 `createRouteMap()`，Graphics 边线绘制 `drawRouteEdges()`，`renderActions()` 开头 `Graphics.clear()` 防残留，Info 按钮全部状态可用 |
| `ui/roguelite/RogueliteMapNode.ts` | Info 按钮 + `propagationStopped`，`onInfo` 回调 |

### 1.6 Boss/敌人详情面板（P7.7）

| 文件 | 变更 |
|------|------|
| `core/DisplayText.ts` | 新增 `rogueliteEnemyDescription()`、`rogueliteBossDescription()`、`rogueliteTraitDescription()` |
| `helpers/RogueliteHelpers.ts` | 新增 `RogueliteEnemyDetailVM` + `buildRogueliteEnemyDetailVM()`，gameMode 统一为 `?? settings?.gameMode` |
| `scenes/BattleScene.ts` | 新增 `enemyDetailButton` + `openEnemyDetail()` with InfoDialog sections |
| `ui/roguelite/RogueliteStatusCompact.ts` | 新增 `enemyLabel`（敌人类型 + 词条数），gameMode 统一 |
| `ui/roguelite/RogueliteStatusPanel.ts` | `buffLabel` 增强敌人类型 + 词条前缀 |

---

## 2. 表情与规则（P8）

### 2.1 战斗表情 UI（P8.1）

| 文件 | 变更 |
|------|------|
| `ui/battle/EmoteBar.ts` | **新文件**（~145 行）。6 按钮组件，`EMOTE_DEFS` 驱动，EmoteHelper 冷却，0.25s setInterval 刷新，prefab/code 双路径，`onSendEmote` 回调，`addIncoming()`，`resetCooldown()` |
| `helpers/EmoteHelper.ts` | 新增 `remainingCooldownMs` getter、`resetCooldown()` ack 失败恢复 |
| `core/ServerActions.ts` | `sendEmote` 补 `callback?` 参数 |
| `scenes/BattleScene.ts` | EmoteBar 集成 + `onPlayerEmote` 订阅 + `spawnEmoteFloat()` 动画，duo `controllerId` 匹配，ack 失败 `resetCooldown()` |

### 2.2 规则说明统一（P8.2）

| 文件 | 变更 |
|------|------|
| `core/DisplayText.ts` | 新增 `RULE_GUIDE_PAGES`（9 页）、`getRuleGuidePage()`、`ruleGuidePlainText()` |
| `ui/system/RuleGuidePanel.ts` | 移除本地 `RULE_PAGES` 常量，改为导入 `RULE_GUIDE_PAGES`，修复 `makeButton` label 共享 bug |
| `scenes/BattleScene.ts` | 新增 `helpButton` + `openRuleGuide()`（RuleGuidePanel / InfoDialog 回退） |
| `scenes/RogueliteScene.ts` | 新增 `helpButton` + `openRuleGuide()` |
| `scenes/HomeScene.ts` | 硬编码回退替换为 `ruleGuidePlainText()` |

---

## 3. 稳定性修复（P9）

### 3.1 锁链归一化

| 位置 | 问题 | 修复 |
|------|------|------|
| `BattleScene.selectTarget` | 无锁 | 加 `setPendingLock()` + `clearPendingOnAckFailure` |
| `BattleScene.rollDice` | 无 ack 回调 | 加 callback → `clearPendingOnAckFailure` |
| `BattleScene.rollGuardCheck` | 无 ack 回调 | 加 callback → `clearPendingOnAckFailure` |
| `BattleScene.handleActionConfirm` | 无 ack 回调 | 加 callback → `clearPendingOnAckFailure` |
| `BattleSeat.selectAsTarget` | 绕过 BattleScene 直接调 ServerActions | 改为 `onSelectActor`/`onSelectTarget` 回调，BattleScene 统一接管 |
| `ServerActions.selectActor` | 无 callback 参数 | 补 `callback?` |
| 全部 timeout | 6s 不一致 | 统一 8s（匹配 NetworkManager ack timeout） |
| `RogueliteScene.finishRogueliteRun` | 无锁 | 加 `pendingRouteNodeId = 'finish'` 锁 |

### 3.2 路由一致性

| 位置 | 问题 | 修复 |
|------|------|------|
| `GameManager.getSceneNameForPhase` | `room.gameMode` 无 fallback | 加 `?? room.settings?.gameMode` |
| `HomeScene.sceneForRoom` | `room.gameMode` 无 fallback | 加 `?? room.settings?.gameMode` |

### 3.3 Null 安全

| 位置 | 问题 | 修复 |
|------|------|------|
| `RogueliteScene` event choices | 空数组无提示 | 加 `choices.length === 0` 保护 |
| `eventCostRiskHint` | `choice.cost.toLowerCase()` 可能 crash | `(choice.cost ?? '').toLowerCase()` |
| `RogueliteHelpers` 非 Boss 敌人描述 | 无 DisplayText fallback | `info?.description \|\| rogueliteEnemyDescription(id)` |
| `RogueliteStatusCompact` 词条计数 | 只计 Boss | 改为 `getRogueliteBossSkills(bot).length`（覆盖 normal/elite） |
| `BattleScene` gameMode 检查 | `room.roguelite` 不一致 | 统一为 `(room.gameMode ?? room.settings?.gameMode) === 'pve_roguelite'` |
| Duo emote 匹配 | 缺少 `controllerId` | 加 `p.controllerId === event.playerId` |
| `RuleGuidePanel` label 共享 | Prev/Next/Close 共用同一个 Label 节点 | 改为各按钮子节点独立创建 |

---

## 4. Prefab 回退与布局（P10）

### 4.1 覆盖率（28/28）

| 场景 | Prefab 数 | 回退方式 |
|------|----------|----------|
| BattleScene | 14 | `ensurePrefabNode` → `ensureNode` + `addComponent` |
| RogueliteScene | 12 | prefab 存在 → card/header/bar，否则 → `createButton`/`createText` |
| HomeScene | 2 | `if (prefab)` 创建，方法级 InfoDialog/Graphics 手动回退 |
| LobbyScene | 2 | Node + `addComponent(RoomSettingsPanel/DuoSlotPicker)` |

### 4.2 布局修复

- BattleScene bottom 按钮重排：`helpButton(-295) detail(-190) enemy(-45) log(105)`
- EmoteBar y=-385→-410（避免 SelfPanel 重叠）
- bottom 按钮 y=-610→-590（远离 safe-area 边缘）
- RogueliteScene helpButton 移至 y=490（避免 LogLabel 重叠）

### 4.3 Graphics 泄漏修复

- `renderActions()` 开头：`this.actionListNode.getComponent(Graphics)?.clear()` 防止阶段切换残留

---

## 5. 维护清理（P10.1）

| 清理项 | 详情 |
|--------|------|
| `settings.gameMode` 裸访问 | 7 处全部改为 `settings?.gameMode`（LobbyScene ×5、RoomSettingsPanel、ProfilePanel） |
| `createDebugUi` 遗留 | HomeScene 中 `@property createDebugUi` 属性 + 条件守卫全部移除，`ensureMinimalUi()` 无条件调用 |
| 死 `??= null` 表达式 | RogueliteStatusPanel ×3、BattleScene ×2 移除 |

---

## 6. 最终验收结果

### 6.1 Pass 1 — 静态审计 ✅

| 维度 | 结果 |
|------|------|
| BattleScene 6 锁链 | 全闭环（selectTarget / rollDice / rollGuardCheck / handleActionConfirm / handleSeatSelectActor / handleSeatSelectTarget） |
| RogueliteScene 5 锁链 | 全闭环（reward / event / shop ×2 / rest）+ continue/finish |
| 路由一致性 | 6 处全部 `?? settings?.gameMode` |
| `settings?.gameMode` 裸访问 | 零残留 |
| BattleSeat 协议隔离 | 零 `serverActions.` |
| Prefab fallback | 28/28 覆盖 |
| Event 生命周期 | 29/29 组件 on/off 配对完整 |

### 6.2 Pass 2 — 构建验证 ✅

- `npx tsc --noEmit`：零错误
- `npm run build`：该项目无 npm build 脚本（Cocos Creator 3.8.8，Web 构建走编辑器面板或 Creator CLI）

---

## 7. 已知非阻塞项

| 项 | 说明 | 影响 |
|----|------|------|
| Shop refresh | `refreshShop()` 仅显示 toast "not connected to server yet"，未接服务器 | 刷新按钮无实际功能，不阻塞 |
| `createShopControlBar` 冗余 setHandlers | 内部先设原始 server 调用，`renderActions` 立即覆盖为锁链版本 | 无功能影响，仅代码冗余 |
| Cocos Web 构建 | 项目无 npm build 脚本，需在 Cocos Creator 编辑器中执行构建 | 非代码问题，属构建流程 |
| BattleScene render 同步清锁 | `!room.pendingRollDecision && !room.pendingGuardCheck` 比 RogueliteScene 逐 phase 检查更激进 | 安全：最坏情况用户多点一次 |

---

## 8. 变更文件总览

```
core/ServerActions.ts           (+1 callback param: selectActor, sendEmote)
core/DisplayText.ts             (+12 方法: 敌人/Boss/词条描述, 规则页)
core/GameManager.ts             (路由 gameMode fallback 修复)

scenes/BattleScene.ts           (+6 锁链, enemy detail, emote, rule guide, seat callbacks)
scenes/RogueliteScene.ts        (+5 锁字段, card/render/InfoDialog, route map, helpButton)
scenes/HomeScene.ts             (移除 createDebugUi, ruleGuidePlainText)
scenes/LobbyScene.ts            (prefab fallback ×2, settings?.gameMode ×5)

models/ViewModels.ts            (RouteNodeVM, RouteMapVM, RogueliteEnemyDetailVM)
helpers/RogueliteHelpers.ts     (buildRouteMapView, buildRogueliteEnemyDetailVM, roomTypeDescription)
helpers/EmoteHelper.ts          (remainingCooldownMs, resetCooldown)
helpers/BattlePlayerHelpers.ts  (gameMode ?? settings?.gameMode)

ui/battle/BattleSeat.ts         (-ServerActions, +onSelectActor/onSelectTarget)
ui/battle/EmoteBar.ts           (NEW: 6-button emote UI, ~145 lines)
ui/roguelite/RewardCard.ts      (renderRich, rarity tables, info button)
ui/roguelite/EventChoiceCard.ts (3-state, highlightCost, info button)
ui/roguelite/RogueliteMapNode.ts (info button all-status)
ui/roguelite/RogueliteStatusCompact.ts (enemyLabel, gameMode fix)
ui/roguelite/RogueliteStatusPanel.ts   (buffLabel enhanced, dead ??= removed)
ui/system/RuleGuidePanel.ts     (import RULE_GUIDE_PAGES, label sharing fix)
ui/lobby/RoomSettingsPanel.ts   (settings?.gameMode)

Removed: HomeScene.createDebugUi, 5 dead ??= null expressions
```

---

## 9. 合入签署

| 角色 | 状态 |
|------|------|
| 静态审计 | ✅ Pass 1 通过 |
| 类型检查 | ✅ `npx tsc --noEmit` 零错误 |
| 锁链闭环 | ✅ 11 条主干锁链 + 渲染同步清锁 |
| 协议隔离 | ✅ UI 组件不再直接持有 ServerActions |
| Prefab 回退 | ✅ 28/28 全覆盖 |
| 生命周期 | ✅ 29/29 组件配对完整 |
| **合入建议** | **通过，可合入** |
