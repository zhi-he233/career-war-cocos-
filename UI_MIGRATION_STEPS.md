# Cocos UI Migration Steps

## This Round

- BattleSeat: add active / selectable / selected / dead / shield / host / offline / last-roll display.
- DicePanel: use dice face sprites first, with face-switch rolling animation and no position shake.
- ActionSlots: add separate visual states for attack / character skill / summoner skill, plus disabled feedback.
- BattleLog: render newest entries first with timestamps.
- SelfPanel: add a reusable local-player HUD component.
- EmotePanel: add reusable emote buttons and incoming emote bubbles.
- BattleScene: auto-create and attach battle seat, dice, action, self HUD, and log components at runtime.

## Next Batch

1. PlayerDetailDialog
   - Full-screen modal.
   - Status dot, avatar ring, HP / shield / status / last roll stats.
   - Character skills and tags.

2. Lobby UI
   - PlayerListPanel with host / online / bot / empty seat states.
   - CharacterDetailDialog and SummonerSkillDetailDialog.
   - DuoSlotPicker for 2V2 two-slot selection.

3. Roguelite Core UI
   - RogueliteStatusCompact for battle.
   - RogueliteRewardChoice cards.
   - RogueliteEventChoice A / B modal.

4. Roguelite Map
   - Run map nodes.
   - Room type color states.
   - Available / locked / cleared / current node states.

5. System Panels
   - BattleLogDrawer.
   - RematchPanel.
   - Toast / highlight layer.

## Editing Rule

Do not move Home.scene layout unless explicitly requested. Home is treated as hand-tuned.
