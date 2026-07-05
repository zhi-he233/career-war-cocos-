# Cocos UI Migration Steps

## This Round

- Added reusable battle prefabs under `assets/prefabs/battle`.
  - `BattleSeat.prefab`
  - `DicePanel.prefab`
  - `ActionSlots.prefab`
  - `BattleLog.prefab`
  - `SelfPanel.prefab`
  - `EmotePanel.prefab`
  - `PlayerDetailDialog.prefab`
  - `BattleLogDrawer.prefab`
  - `RematchPanel.prefab`
- BattleSeat: add active / selectable / selected / dead / shield / host / offline / last-roll display.
- DicePanel: use dice face sprites first, with face-switch rolling animation and no position shake.
- ActionSlots: add separate visual states for attack / character skill / summoner skill, plus disabled feedback.
- BattleLog: render newest entries first with timestamps.
- SelfPanel: add a reusable local-player HUD component.
- EmotePanel: add reusable emote buttons and incoming emote bubbles.
- PlayerDetailDialog: reusable player inspection modal for nickname, HP, shield, target, tags, and skills.
- BattleLogDrawer: full battle log modal, newest entries first.
- RematchPanel: game-over panel wired to `readyForRematch`.
- BattleScene: auto-create and attach battle seat, dice, action, self HUD, and log components at runtime.
- BattleScene now has two small system entry buttons: `Detail` opens local/current player details, `Log` opens the full log drawer.
- Lobby prefabs:
  - `assets/prefabs/lobby/CharacterCard.prefab`
  - `assets/prefabs/lobby/PlayerListItem.prefab`
  - `assets/prefabs/lobby/DuoSlotPicker.prefab`
  - `assets/prefabs/lobby/CharacterDetailDialog.prefab`
  - `assets/prefabs/lobby/SummonerSkillDetailDialog.prefab`
  - `assets/prefabs/lobby/SummonerSkillCard.prefab`
  - `assets/prefabs/lobby/LobbyStartBar.prefab`
  - `assets/prefabs/lobby/RoomSettingsPanel.prefab`
- Roguelite prefabs:
  - `assets/prefabs/roguelite/RewardCard.prefab`
  - `assets/prefabs/roguelite/RogueliteMapNode.prefab`
  - `assets/prefabs/roguelite/RogueliteStatusPanel.prefab`
  - `assets/prefabs/roguelite/RogueliteStatusCompact.prefab`
  - `assets/prefabs/roguelite/RogueliteEventHeader.prefab`
  - `assets/prefabs/roguelite/EventChoiceCard.prefab`
  - `assets/prefabs/roguelite/ShopControlBar.prefab`
  - `assets/prefabs/roguelite/ShopItemCard.prefab`
- System prefabs:
  - `assets/prefabs/system/ToastLayer.prefab`
  - `assets/prefabs/system/RuleGuidePanel.prefab`
  - `assets/prefabs/system/BuffIcon.prefab`
  - `assets/prefabs/system/CurrencyBar.prefab`
- Profile prefabs:
  - `assets/prefabs/profile/ProfilePanel.prefab`
- LobbyScene now renders character cards and player list rows through prefabs first.
- LobbyScene now shows character / summoner-skill detail dialogs through prefabs.
- DuoLobby now has a reusable two-slot picker that writes selected character and skill into slot 1 or slot 2.
- LobbyScene now renders summoner skills, start status, and editable room settings through prefabs first.
- RogueliteScene now renders reward/event/shop/rest cards and route nodes through prefabs first.
- RogueliteScene now renders stage, gold, HP, phase, and buff summary through `RogueliteStatusPanel`.
- `RogueliteStatusPanel` now composes `CurrencyBar` and `BuffIcon` instead of keeping all resource display as plain text.
- `RogueliteStatusCompact` is now available in BattleScene and displays only during roguelite battle.
- Roguelite event choices now render through `EventChoiceCard`.
- Roguelite event title, rarity, stage, and description now render through `RogueliteEventHeader`.
- Roguelite shop title, gold, refresh status, and leave-shop action now render through `ShopControlBar`.
- Roguelite shop items now render through `ShopItemCard`, with local disabled feedback for not enough gold / already bought.
- RewardCard now supports available / selected / disabled / taken states.
- Roguelite reward choices now lock locally after selection, show selected/pending feedback, and unlock again if the server rejects or does not respond.
- RogueliteMapNode now supports current / available / locked / cleared / preview states with room-type colors.
- Roguelite continue phase now shows a small route preview: cleared previous node, selectable next route nodes, and preview nodes for the following stage.
- Roguelite route selection now locks locally after clicking and unlocks again if the server rejects or does not respond.
- HomeScene rule-book button now opens `RuleGuidePanel` when its prefab is bound.
- HomeScene, BattleScene, RogueliteBattle, and RogueliteScene now have `ToastLayer` prefab references.
- GameManager now exposes `showToast(message, duration)` and emits toast feedback for server ack success/failure.
- ProfileScene now renders through `ProfilePanel.prefab`.
- ProfileService now owns local profile generation / storage. UI does not read localStorage directly.

## Next Batch

1. Lobby UI
   - PlayerListPanel polish with kick button and ready state.
   - CharacterDetailDialog visual polish with portrait art.
   - SummonerSkillDetailDialog visual polish with icons.
   - DuoSlotPicker polish with occupied-character disabled states.
   - RoomSettingsPanel visual polish and host-only affordances.

2. Roguelite Core UI
   - Keep reward choices on RewardCard for now.
   - Server-side shop refresh action, if that rule is kept.

3. Roguelite Map
   - Draw route connection lines between visible map nodes.
   - Add a larger full-run map panel later if the route needs inspection outside the continue phase.

4. Profile Online Integration
   - Replace ProfileService local mock generation with real `/api/profile/me` when the server endpoint exists.
   - Add login/register UI only after deciding whether Cocos should own auth or reuse existing account flow.

5. System Panels
   - Toast / highlight layer.

## How To Replace Battle UI Art

These prefabs already run without manual node dragging:

- `assets/prefabs/battle/PlayerDetailDialog.prefab`
- `assets/prefabs/battle/BattleLogDrawer.prefab`
- `assets/prefabs/battle/RematchPanel.prefab`

In Cocos, open a prefab, select its root node, then check its script component.

- `Panel Frame`: drag a parchment / board / window sprite frame here.
- `Button Frame`: drag your button sprite frame here.
- Label and Button fields can stay empty. The script auto-creates fallback labels/buttons.
- If you want exact hand layout, create your own child Label/Button nodes inside the prefab, then drag them into those fields. The script will use your nodes instead of auto-created ones.

Battle scenes already reference these prefabs:

- `assets/scenes/Battle.scene`
- `assets/scenes/RogueliteBattle.scene`

Do not rebuild these as scene-only nodes. Keep them as prefabs so the same player detail, log drawer, and rematch behavior can be reused across normal battle and roguelite battle.

## Current System UI

- `ToastLayer.prefab` is a shared feedback layer. Scripts should call `GameManager.getInstance().showToast(...)` instead of making one-off toast nodes.
- `RuleGuidePanel.prefab` is the reusable rule book. Home already opens it from the existing rule-book button.
- `RogueliteStatusPanel.prefab` is the roguelite run header for non-battle roguelite phases. It shows stage, gold, HP, current phase, and a compact buff summary.
- `RogueliteStatusCompact.prefab` is the small roguelite run header for `RogueliteBattle.scene`; normal battle hides it.
- `EventChoiceCard.prefab` is only for A/B roguelite events.
- `RogueliteEventHeader.prefab` is the event phase header.
- `ShopItemCard.prefab` is only for shop goods.
- `ShopControlBar.prefab` is the shop phase header and control bar. Refresh is displayed but intentionally not connected until the server has a refresh socket action.
- `RewardCard.prefab` remains the generic card for reward choices, rest actions, and simple continue actions.
- `CurrencyBar.prefab` and `BuffIcon.prefab` are small shared parts meant to be composed inside larger panels.

## Current Profile UI

- `ProfilePanel.prefab` displays identity, level, PVP stats, roguelite stats, career summary, achievements, and current room snapshot.
- `ProfileService.ts` is the only place that generates or stores local profile data.
- The profile page is intentionally offline-capable right now. Do not wire UI directly to `AuthManager` or REST calls; put that work behind `ProfileService` later.

Do not move existing files under `assets/art`. Add new art beside the old files or in new directories only when needed, because moving imported assets can break Cocos SpriteFrame UUID references.

## Editing Rule

Do not move Home.scene layout unless explicitly requested. Home is treated as hand-tuned.

## Prefab Rule

Reusable UI must be prefab-first.

- Scenes should reference prefabs for repeated UI.
- Scripts may create fallback nodes only when a prefab is missing.
- Do not build long-term UI as scene-only runtime nodes.
- Good prefab candidates: seats, cards, buttons groups, dialogs, map nodes, reward cards, player list rows.
