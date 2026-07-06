import { _decorator, Button, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, instantiate, tween, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { characterName, ruleGuidePlainText, summonerSkillName } from '../core/DisplayText';
import { RuleGuidePanel } from '../ui/system/RuleGuidePanel';
import { getActor, canTarget, canLocalAct, canResolveDecision, latestEvents, diffFloatingEffects } from '../helpers/BattlePlayerHelpers';
import { buildRogueliteEnemyDetailVM } from '../helpers/RogueliteHelpers';
import { ActionSlots } from '../ui/battle/ActionSlots';
import { BattleLog } from '../ui/battle/BattleLog';
import { BattleLogDrawer } from '../ui/battle/BattleLogDrawer';
import { BattleSeat } from '../ui/battle/BattleSeat';
import { EmoteBar } from '../ui/battle/EmoteBar';
import { DicePanel } from '../ui/battle/DicePanel';
import { PlayerDetailDialog } from '../ui/battle/PlayerDetailDialog';
import { RematchPanel } from '../ui/battle/RematchPanel';
import { SelfPanel } from '../ui/battle/SelfPanel';
import { RogueliteStatusCompact } from '../ui/roguelite/RogueliteStatusCompact';
import { ToastLayer } from '../ui/system/ToastLayer';
import { InfoDialog } from '../ui/system/InfoDialog';
import type { EmoteId, Player, PlayerEmoteEvent, RollActionType, RollDecisionAvailableAction, RollDecisionChoice, Room, SummonerSkillId } from '../shared/types';

const { ccclass, property } = _decorator;

@ccclass('BattleScene')
export class BattleScene extends Component {
  @property({ type: Label })
  phaseLabel: Label | null = null;

  @property({ type: Label })
  playersLabel: Label | null = null;

  @property({ type: Label })
  diceLabel: Label | null = null;

  @property({ type: Label })
  logLabel: Label | null = null;

  @property({ type: Node })
  targetListNode: Node | null = null;

  @property({ type: Node })
  actionListNode: Node | null = null;

  @property({ type: Button })
  rollButton: Button | null = null;

  @property({ type: Button })
  openLogButton: Button | null = null;

  @property({ type: Button })
  openDetailButton: Button | null = null;

  @property({ type: Button })
  enemyDetailButton: Button | null = null;

  @property({ type: Button })
  helpButton: Button | null = null;

  @property({ type: Button })
  exitButton: Button | null = null;

  @property({ type: DicePanel })
  dicePanel: DicePanel | null = null;

  @property({ type: ActionSlots })
  actionSlots: ActionSlots | null = null;

  @property({ type: BattleLog })
  battleLog: BattleLog | null = null;

  @property({ type: SelfPanel })
  selfPanel: SelfPanel | null = null;

  @property({ type: BattleLogDrawer })
  battleLogDrawer: BattleLogDrawer | null = null;

  @property({ type: PlayerDetailDialog })
  playerDetailDialog: PlayerDetailDialog | null = null;

  @property({ type: RematchPanel })
  rematchPanel: RematchPanel | null = null;

  @property({ type: ToastLayer })
  toastLayer: ToastLayer | null = null;

  @property({ type: RogueliteStatusCompact })
  rogueliteStatusCompact: RogueliteStatusCompact | null = null;

  @property({ type: EmoteBar })
  emoteBar: EmoteBar | null = null;

  @property({ type: RuleGuidePanel })
  ruleGuidePanel: RuleGuidePanel | null = null;

  @property({ type: Prefab })
  battleSeatPrefab: Prefab | null = null;

  @property({ type: Prefab })
  dicePanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  actionSlotsPrefab: Prefab | null = null;

  @property({ type: Prefab })
  battleLogPrefab: Prefab | null = null;

  @property({ type: Prefab })
  selfPanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  battleLogDrawerPrefab: Prefab | null = null;

  @property({ type: Prefab })
  playerDetailDialogPrefab: Prefab | null = null;

  @property({ type: Prefab })
  rematchPanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  toastLayerPrefab: Prefab | null = null;

  @property({ type: Prefab })
  infoDialogPrefab: Prefab | null = null;

  @property({ type: Prefab })
  emoteBarPrefab: Prefab | null = null;

  @property({ type: Prefab })
  ruleGuidePanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  rogueliteStatusCompactPrefab: Prefab | null = null;

  @property({ type: Prefab })
  buffIconPrefab: Prefab | null = null;

  @property({ type: SpriteFrame })
  parchmentFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  seatFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  actionFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  attackFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  skillFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  defendFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  endFrame: SpriteFrame | null = null;

  @property({ type: [SpriteFrame] })
  diceFaces: SpriteFrame[] = [];

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private infoDialog: InfoDialog | null = null;
  private room: Room | null = null;
  private prevRoom: Room | null = null;
  private statusText = '';
  private pendingAction = false;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private exitTapTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);
  private readonly handlePlayerEmoteReceivedBound = (event: PlayerEmoteEvent) => this.onEmoteReceived(event);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);
    this.gameManager.onPlayerEmote(this.handlePlayerEmoteReceivedBound, this);
    this.rollButton?.node.on(Button.EventType.CLICK, this.rollDice, this);
    this.openLogButton?.node.on(Button.EventType.CLICK, this.openBattleLogDrawer, this);
    this.openDetailButton?.node.on(Button.EventType.CLICK, this.openLocalPlayerDetail, this);
    this.enemyDetailButton?.node.on(Button.EventType.CLICK, this.openEnemyDetail, this);
    this.helpButton?.node.on(Button.EventType.CLICK, this.openRuleGuide, this);
    this.exitButton?.node.on(Button.EventType.CLICK, this.onExitClick, this);

    const room = this.gameManager.getRoom();
    this.statusText = this.gameManager.getStatus();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.clearPendingLock();
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
    this.gameManager?.offPlayerEmote(this.handlePlayerEmoteReceivedBound, this);
    this.rollButton?.node.off(Button.EventType.CLICK, this.rollDice, this);
    this.openLogButton?.node.off(Button.EventType.CLICK, this.openBattleLogDrawer, this);
    this.openDetailButton?.node.off(Button.EventType.CLICK, this.openLocalPlayerDetail, this);
    this.enemyDetailButton?.node.off(Button.EventType.CLICK, this.openEnemyDetail, this);
    this.helpButton?.node.off(Button.EventType.CLICK, this.openRuleGuide, this);
    this.exitButton?.node.off(Button.EventType.CLICK, this.onExitClick, this);
  }

  private render(room: Room): void {
    // Floating damage/heal effects
    const effects = diffFloatingEffects(this.prevRoom, room);
    for (const fx of effects) {
      this.spawnFloatingEffect(fx.playerId, fx.value, fx.type);
    }
    this.prevRoom = room;
    this.room = room;

    // Clear pending action lock when server state changes
    if (this.pendingAction && !room.pendingRollDecision && !room.pendingGuardCheck) {
      this.clearPendingLock();
    }

    // Drive DicePanel display + animation
    if (this.dicePanel) {
      this.dicePanel.render(room);
    }
    if (this.actionSlots) {
      this.actionSlots.render(room, this.gameManager?.localClientId ?? '');
    }
    if (this.battleLog) {
      this.battleLog.render(room);
    }
    if (this.selfPanel) {
      this.selfPanel.render(room);
    }
    if (this.rematchPanel) {
      this.rematchPanel.render(room, this.getLocalPlayerId(room));
    }
    if (this.rogueliteStatusCompact) {
      this.rogueliteStatusCompact.render(room);
    }

    // Enemy detail button only visible in pve_roguelite
    if (this.enemyDetailButton) {
      const isRoguelite = (room.gameMode ?? room.settings?.gameMode) === 'pve_roguelite';
      this.enemyDetailButton.node.active = isRoguelite;
    }

    // Emote bar hidden during gameOver
    if (this.emoteBar) {
      this.emoteBar.node.active = room.phase !== 'gameOver';
    }

    const actor = this.getActor(room);
    const decision = room.pendingRollDecision;

    if (this.phaseLabel) {
      const title = room.phase === 'gameOver'
        ? `Game Over | Winner: ${this.getPlayerName(room.winnerId)}`
        : `Battle | Active: ${actor?.nickname ?? '-'}`;
      this.phaseLabel.string = `${title}\n${this.statusText}`;
    }

    if (this.playersLabel && !this.selfPanel) {
      this.playersLabel.string = room.players
        .map((player, index) => this.playerLine(room, player, index))
        .join('\n');
    }

    if (this.diceLabel) {
      const latestRoll = this.latestRoll(room);
      this.updateDiceFaceSprite(decision?.currentRoll ?? latestRoll);
      this.diceLabel.string = decision
        ? `Roll ${decision.currentRoll} | ${this.getPlayerName(decision.actorId)} -> ${this.getPlayerName(decision.targetId)}`
        : latestRoll
          ? `Last roll ${latestRoll}`
          : 'Select target, then roll';
    }

    if (this.logLabel && !this.battleLog) {
      this.logLabel.string = this.latestEvents(room, 12).map((event) => event.message).join('\n');
    }

    if (this.rollButton) {
      this.rollButton.node.active = room.phase === 'battle' && !decision && !this.pendingAction;
      this.rollButton.interactable = (this.canLocalAct(room) || this.canLocalGuardCheck(room)) && !this.pendingAction;
    }

    this.renderTargets(room);
  }

  private renderTargets(room: Room): void {
    if (!this.targetListNode) return;
    this.clearChildren(this.targetListNode);

    const actor = this.getActor(room);
    const targets = actor ? room.players.filter((player) => this.canTarget(actor, player)) : [];
    targets.forEach((player, index) => {
      const selected = actor?.selectedTargetId === player.id;
      const button = this.createButton(
        `Target_${player.id}`,
        `${selected ? '> ' : ''}${player.nickname}\nHP ${player.hp}/${player.maxHp}`,
        -220 + index * 220,
        0,
        205,
        58,
        16,
        this.targetListNode!
      );
      button.interactable = this.canLocalAct(room) && !room.pendingRollDecision;
      button.node.on(Button.EventType.CLICK, () => this.selectTarget(player.id), this);
    });
  }

  private renderStatus(status: string): void {
    this.statusText = status;
    if (this.room) this.render(this.room);
  }

  private selectTarget(targetId: string): void {
    if (!this.room || !this.canLocalAct(this.room) || this.pendingAction) return;
    this.setPendingLock();
    this.serverActions.selectTarget(targetId, (response) => this.clearPendingOnAckFailure(response));
  }

  private rollDice(): void {
    if (this.pendingAction) return;
    const room = this.room;
    if (!room || room.pendingRollDecision) return;

    const clientId = this.gameManager?.localClientId ?? '';

    // Guard check: use pendingGuardCheck.actorId directly, not getActor()
    if (room.pendingGuardCheck) {
      const guardActorId = room.pendingGuardCheck.actorId;
      const guardActor = room.players.find(p => p.id === guardActorId);
      if (guardActor && (guardActor.clientId === clientId || guardActor.controllerId === clientId)) {
        this.setPendingLock();
        this.dicePanel?.startRoll('guard');
        this.serverActions.rollGuardCheck((response) => this.clearPendingOnAckFailure(response));
        return;
      }
    }

    const actor = this.getActor(room);
    if (!actor || !this.canLocalAct(room)) return;

    const target = actor.selectedTargetId
      ? room.players.find((player) => player.id === actor.selectedTargetId && this.canTarget(actor, player))
      : room.players.find((player) => this.canTarget(actor, player));

    if (!target) return;

    // All validations passed — lock and emit
    this.setPendingLock();
    this.dicePanel?.startRoll('normal');

    const emitRoll = () => this.serverActions.rollDice((response) => this.clearPendingOnAckFailure(response));
    if (actor.selectedTargetId === target.id) {
      emitRoll();
      return;
    }

    this.serverActions.selectTarget(target.id, (response) => {
      if (this.clearPendingOnAckFailure(response)) return;
      emitRoll();
    });
  }

  /** Lock UI actions while waiting for server ack. Cleared on next room update or 8s timeout. */
  private setPendingLock(): void {
    this.pendingAction = true;
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = setTimeout(() => this.clearPendingLock(), 8000);
  }

  private clearPendingLock(): void {
    this.pendingAction = false;
    if (this.pendingTimer) { clearTimeout(this.pendingTimer); this.pendingTimer = null; }
  }

  /** Exit button handler. Direct leave on gameOver; double-tap confirm mid-battle. */
  private onExitClick(): void {
    if (!this.room) return;
    if (this.room.phase === 'gameOver') {
      this.gameManager?.leaveRoom();
      return;
    }
    // Mid-battle: require double-tap within 3s to prevent accidental exit
    if (this.exitTapTimer) {
      clearTimeout(this.exitTapTimer);
      this.exitTapTimer = null;
      this.gameManager?.leaveRoom();
      return;
    }
    this.exitTapTimer = setTimeout(() => { this.exitTapTimer = null; }, 3000);
    this.gameManager?.showToast('Tap again to confirm exit', 1.6);
  }

  private clearPendingOnAckFailure(response: unknown): boolean {
    const failed = !!response && typeof response === 'object' && (response as { ok?: unknown }).ok === false;
    if (failed) this.clearPendingLock();
    return failed;
  }

  /** Unified action confirm — called by ActionSlots.onConfirm. Owns lock/emit/unlock. */
  private handleActionConfirm(actionType: RollActionType, selfDamageAmount: number): void {
    const decision = this.room?.pendingRollDecision;
    if (!this.room || !decision || !this.canResolveDecision(this.room) || this.pendingAction) return;

    const action = (decision.availableActions ?? []).find(a => a.id === actionType);
    if (action?.enabled === false) return;

    this.setPendingLock();
    this.serverActions.confirmRollDecision({
      roomId: this.room.id,
      pendingDecisionId: decision.id,
      decisionId: decision.id,
      actionType,
      choice: actionType as RollDecisionChoice,
      skillId: action?.skillId,
      summonerSkillId: actionType === 'summoner_skill' ? action?.skillId as SummonerSkillId : undefined,
      selfDamageAmount: action?.requiresSelfDamageAmount ? selfDamageAmount : undefined,
    }, (response) => this.clearPendingOnAckFailure(response));
  }

  showInfo(title: string, body: string): void {
    if (this.infoDialogPrefab && !this.infoDialog?.node?.isValid) {
      const node = this.ensurePrefabNode('InfoDialog', this.infoDialogPrefab, 0, 20, 520, 440, this.node);
      node.setSiblingIndex(998);
      this.infoDialog = node.getComponent(InfoDialog) ?? node.addComponent(InfoDialog);
    }
    if (this.infoDialog) {
      this.infoDialog.show(title, body);
    } else {
      this.gameManager?.showToast(body.slice(0, 120), 3);
    }
  }

  private openBattleLogDrawer(): void {
    if (!this.room || !this.battleLogDrawer) return;
    this.battleLogDrawer.open(this.room);
  }

  private openLocalPlayerDetail(): void {
    if (!this.room) return;
    const player = this.gameManager?.getLocalPlayer()
      ?? this.getActor(this.room)
      ?? this.room.players.find((item) => !item.isBot)
      ?? this.room.players[0];
    if (!player) return;
    // Use PlayerDetailDialog if available, otherwise fallback to InfoDialog
    if (this.playerDetailDialog) {
      this.playerDetailDialog.open(player.id, this.room);
    } else {
      const charName = characterName(player.characterId);
      const skillName = summonerSkillName(player.summonerSkillId);
      const body = [
        `HP ${player.hp}/${player.maxHp}  Shield ${player.shield}`,
        `Character: ${charName}`,
        `Summoner Skill: ${skillName}`,
        player.isDead ? 'Status: Dead' : `Status: ${player.isOnline === false ? 'Offline' : 'Active'}`,
      ].join('\n');
      this.showInfo(player.nickname, body);
    }
  }

  /** Open enemy/boss detail in InfoDialog. Only called in pve_roguelite. */
  private openEnemyDetail(): void {
    if (!this.room) return;
    // Lazy-create InfoDialog if needed
    if (this.infoDialogPrefab && !this.infoDialog?.node?.isValid) {
      const node = this.ensurePrefabNode('InfoDialog', this.infoDialogPrefab, 0, 20, 520, 440, this.node);
      node.setSiblingIndex(998);
      this.infoDialog = node.getComponent(InfoDialog) ?? node.addComponent(InfoDialog);
    }
    if (!this.infoDialog) return;

    const vm = buildRogueliteEnemyDetailVM(this.room);
    if (!vm.hasData) {
      this.gameManager?.showToast('No enemy data available.', 1.4);
      return;
    }

    const sections = [
      { heading: 'Type', content: `${vm.typeLabel} (${vm.stageType})` },
      { heading: 'Stage', content: `Stage ${vm.stage}` },
      { heading: 'HP / Shield', content: `${vm.hp} / ${vm.maxHp} HP  |  Shield ${vm.shield}` },
    ];
    if (vm.traits.length > 0) {
      sections.push({ heading: `Traits (${vm.traits.length})`, content: vm.traitDescriptions.slice(0, 5).join(' | ') });
    }
    if (vm.bossStateChips.length > 0) {
      sections.push({
        heading: 'Boss State',
        content: vm.bossStateChips.map(c => `${c.text} [${c.kind}]`).join(' | '),
      });
    }
    if (vm.enemyTemplateId) {
      sections.push({ heading: 'Template ID', content: vm.enemyTemplateId });
    }
    if (vm.bossId) {
      sections.push({ heading: 'Boss ID', content: vm.bossId });
    }

    this.infoDialog?.show(
      `${vm.name} — ${vm.typeLabel}`,
      vm.description,
      sections,
    );
  }

  /** Open rule guide panel or fallback to InfoDialog. */
  private openRuleGuide(): void {
    if (this.ruleGuidePanel) {
      this.ruleGuidePanel.open();
    } else {
      this.showInfo('Rule Guide', ruleGuidePlainText());
    }
  }

  private playerLine(room: Room, player: Player, index: number): string {
    const activeMark = index === room.activePlayerIndex || player.id === room.selectedActorId ? '> ' : '  ';
    const targetMark = player.selectedTargetId ? ` -> ${this.getPlayerName(player.selectedTargetId)}` : '';
    const team = player.teamId ? ` Team ${player.teamId}` : '';
    const bot = player.isBot ? ' bot' : '';
    const dead = player.isDead ? ' dead' : '';
    return `${activeMark}${player.nickname}${team}${bot}${dead}\n${characterName(player.characterId)} / ${summonerSkillName(player.summonerSkillId)} | HP ${player.hp}/${player.maxHp} | Shield ${player.shield}${targetMark}`;
  }

  private canLocalAct(room: Room): boolean {
    return canLocalAct(room, this.gameManager?.localClientId ?? '');
  }

  private canLocalGuardCheck(room: Room): boolean {
    if (!room.pendingGuardCheck) return false;
    const clientId = this.gameManager?.localClientId ?? '';
    const actor = room.players.find(p => p.id === room.pendingGuardCheck!.actorId);
    return !!actor && (actor.clientId === clientId || actor.controllerId === clientId);
  }

  private canResolveDecision(room: Room): boolean {
    return canResolveDecision(room, this.gameManager?.localClientId ?? '');
  }

  private canTarget(actor: Player, target: Player): boolean {
    return canTarget(actor, target);
  }

  private getActor(room: Room): Player | null {
    return getActor(room);
  }

  private getPlayerName(playerId: string | undefined): string {
    if (!playerId) return '-';
    return this.room?.players.find((player) => player.id === playerId)?.nickname ?? playerId;
  }

  private getLocalPlayerId(room: Room): string | undefined {
    const clientId = this.gameManager?.localClientId ?? '';
    return room.players.find((player) => player.clientId === clientId || player.controllerId === clientId)?.id;
  }

  private latestRoll(room: Room): string {
    const event = this.latestEvents(room).find((item) => item.type === 'roll' && item.dice?.length);
    return event?.dice?.join('/') ?? '';
  }

  private latestEvents(room: Room, limit = room.battleLog.length): Room['battleLog'] {
    return latestEvents(room, limit);
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('BattleParchmentPanel', 0, -30, 680, 1120, this.parchmentFrame);
    const enemySeatNode = this.ensurePrefabNode('EnemySeatPanel', this.battleSeatPrefab, 0, 335, 640, 145, this.node);
    const playerSeatNode = this.ensurePrefabNode('PlayerSeatPanel', this.battleSeatPrefab, 0, -170, 640, 145, this.node);
    this.ensureSpriteNode('DiceFrame', 0, 72, 126, 126, this.diceFaces[0] ?? null);
    this.ensureBattleSeat(playerSeatNode, 0);
    this.ensureBattleSeat(enemySeatNode, 1);

    this.phaseLabel ??= this.ensureLabel('PhaseLabel', 0, 545, 680, 64, 20, this.node);
    this.targetListNode ??= this.ensureNode('TargetList', 0, 190, 660, 70, this.node);
    const dicePanelNode = this.ensurePrefabNode('DicePanelNode', this.dicePanelPrefab, 0, 70, 320, 210, this.node);
    this.dicePanel ??= dicePanelNode.getComponent(DicePanel) ?? dicePanelNode.addComponent(DicePanel);
    this.dicePanel.diceFaces = this.diceFaces;
    this.diceLabel ??= this.ensureLabel('DiceLabel', 0, 70, 640, 54, 24, this.node);
    this.rollButton ??= this.createButton('RollButton', 'Roll', 0, -35, 210, 56, 24, this.node);
    this.actionListNode ??= this.ensurePrefabNode('ActionList', this.actionSlotsPrefab, 0, -105, 660, 130, this.node);
    this.actionSlots ??= this.actionListNode.getComponent(ActionSlots) ?? this.actionListNode.addComponent(ActionSlots);
    this.actionSlots.attackFrame = this.attackFrame ?? this.actionFrame;
    this.actionSlots.skillFrame = this.skillFrame ?? this.actionFrame;
    this.actionSlots.summonerFrame = this.actionFrame ?? this.skillFrame;
    this.actionSlots.onConfirm = (actionType, selfDamageAmount) => this.handleActionConfirm(actionType, selfDamageAmount);

    const selfPanelNode = this.ensurePrefabNode('SelfPanel', this.selfPanelPrefab, 0, -315, 620, 140, this.node);
    this.selfPanel ??= selfPanelNode.getComponent(SelfPanel) ?? selfPanelNode.addComponent(SelfPanel);
    this.selfPanel.panelFrame = this.seatFrame ?? this.actionFrame;

    const battleLogNode = this.ensurePrefabNode('BattleLog', this.battleLogPrefab, 0, -520, 650, 140, this.node);
    this.battleLog ??= battleLogNode.getComponent(BattleLog) ?? battleLogNode.addComponent(BattleLog);
    this.battleLog.maxLines = 6;

    this.openDetailButton ??= this.createButton('OpenDetailButton', 'Detail', -84, -590, 100, 40, 16, this.node);
    this.enemyDetailButton ??= this.createButton('EnemyDetailButton', 'Enemy', 32, -590, 100, 40, 16, this.node);
    this.enemyDetailButton.node.active = false;
    this.openLogButton ??= this.createButton('OpenLogButton', 'Log', 148, -590, 100, 40, 16, this.node);

    const detailNode = this.ensurePrefabNode('PlayerDetailDialog', this.playerDetailDialogPrefab, 0, 20, 620, 430, this.node);
    this.playerDetailDialog ??= detailNode.getComponent(PlayerDetailDialog) ?? detailNode.addComponent(PlayerDetailDialog);
    this.playerDetailDialog.panelFrame = this.parchmentFrame;
    this.playerDetailDialog.buttonFrame = this.actionFrame;
    detailNode.setSiblingIndex(998);

    const drawerNode = this.ensurePrefabNode('BattleLogDrawer', this.battleLogDrawerPrefab, 0, 0, 660, 760, this.node);
    this.battleLogDrawer ??= drawerNode.getComponent(BattleLogDrawer) ?? drawerNode.addComponent(BattleLogDrawer);
    this.battleLogDrawer.panelFrame = this.parchmentFrame;
    this.battleLogDrawer.buttonFrame = this.actionFrame;
    drawerNode.setSiblingIndex(998);

    const rematchNode = this.ensurePrefabNode('RematchPanel', this.rematchPanelPrefab, 0, 20, 580, 350, this.node);
    this.rematchPanel ??= rematchNode.getComponent(RematchPanel) ?? rematchNode.addComponent(RematchPanel);
    this.rematchPanel.panelFrame = this.parchmentFrame;
    this.rematchPanel.buttonFrame = this.actionFrame;
    this.rematchPanel.setHandlers(() => this.serverActions.readyForRematch());
    rematchNode.setSiblingIndex(997);

    const toastNode = this.ensurePrefabNode('ToastLayer', this.toastLayerPrefab, 0, -535, 560, 48, this.node);
    this.toastLayer ??= toastNode.getComponent(ToastLayer) ?? toastNode.addComponent(ToastLayer);
    this.toastLayer.panelFrame = this.actionFrame ?? this.seatFrame;

    const compactNode = this.ensurePrefabNode('RogueliteStatusCompact', this.rogueliteStatusCompactPrefab, 0, 480, 620, 62, this.node);
    this.rogueliteStatusCompact ??= compactNode.getComponent(RogueliteStatusCompact) ?? compactNode.addComponent(RogueliteStatusCompact);
    this.rogueliteStatusCompact.panelFrame = this.actionFrame ?? this.seatFrame;
    this.rogueliteStatusCompact.buffIconPrefab = this.buffIconPrefab;
    compactNode.active = false;

    const emoteNode = this.ensurePrefabNode('EmoteBar', this.emoteBarPrefab, 0, -440, 620, 56, this.node);
    this.emoteBar ??= emoteNode.getComponent(EmoteBar) ?? emoteNode.addComponent(EmoteBar);
    this.emoteBar.buttonFrame = this.actionFrame;
    this.emoteBar.onSendEmote = (emoteId: EmoteId) => {
      this.serverActions.sendEmote(emoteId, (response: unknown) => {
        const ack = response as { ok?: boolean };
        if (ack?.ok === false) {
          this.emoteBar?.resetCooldown();
          this.gameManager?.showToast('Emote failed — try again.', 1.4);
        }
      });
    };

    // Rule guide panel (lazy)
    const guideNode = this.ensurePrefabNode('RuleGuidePanel', this.ruleGuidePanelPrefab, 0, 20, 620, 520, this.node);
    this.ruleGuidePanel ??= guideNode.getComponent(RuleGuidePanel) ?? guideNode.addComponent(RuleGuidePanel);
    this.ruleGuidePanel.panelFrame = this.parchmentFrame;
    this.ruleGuidePanel.buttonFrame = this.actionFrame;
    guideNode.setSiblingIndex(998);

    this.helpButton ??= this.createButton('HelpButton', '?', -176, -590, 44, 40, 20, this.node);
  }

  private ensureBattleSeat(node: Node, playerIndex: number): void {
    const seat = node.getComponent(BattleSeat) ?? node.addComponent(BattleSeat);
    seat.playerIndex = playerIndex;
    seat.seatFrame = this.seatFrame;
    seat.selectedFrame = this.actionFrame ?? this.seatFrame;
    seat.onSelectActor = (playerId: string) => this.handleSeatSelectActor(playerId);
    seat.onSelectTarget = (playerId: string) => this.handleSeatSelectTarget(playerId);
  }

  /** Unified handler for seat actor selection — goes through BattleScene lock chain. */
  private handleSeatSelectActor(playerId: string): void {
    if (!this.room || this.pendingAction) return;
    if (!canLocalAct(this.room, this.gameManager?.localClientId ?? '')) return;
    this.setPendingLock();
    this.serverActions.selectActor(playerId, (response) => this.clearPendingOnAckFailure(response));
  }

  /** Unified handler for seat target selection — goes through BattleScene lock chain. */
  private handleSeatSelectTarget(playerId: string): void {
    if (!this.room || this.pendingAction) return;
    const clientId = this.gameManager?.localClientId ?? '';
    if (!canLocalAct(this.room, clientId)) return;
    const actor = getActor(this.room);
    const target = this.room.players.find(p => p.id === playerId);
    if (!actor || !target || !canTarget(actor, target)) return;
    this.setPendingLock();
    this.serverActions.selectTarget(playerId, (response) => this.clearPendingOnAckFailure(response));
  }

  private ensurePrefabNode(name: string, prefab: Prefab | null, x: number, y: number, width: number, height: number, parent: Node): Node {
    if (!prefab) return this.ensureNode(name, x, y, width, height, parent);

    const existing = parent.getChildByName(name);
    if (existing) existing.destroy();

    const node = instantiate(prefab);
    node.name = name;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number, parent: Node): Node {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, parent: Node): Label {
    const node = this.ensureNode(name, x, y, width, height, parent);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return label;
  }

  private createButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number, parent: Node): Button {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));

    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);

    const button = node.addComponent(Button);
    button.interactable = true;
    this.applyButtonFrame(button, this.frameForButton(name));

    const labelNode = new Node('Label');
    node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(width, height);

    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return button;
  }

  private ensureSpriteNode(name: string, x: number, y: number, width: number, height: number, frame: SpriteFrame | null): Node {
    const node = this.ensureNode(name, x, y, width, height, this.node);
    if (frame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = frame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    node.setSiblingIndex(1);
    return node;
  }

  private frameForButton(name: string): SpriteFrame | null {
    if (name.startsWith('Target_')) return this.seatFrame;
    if (name === 'RollButton') return this.actionFrame ?? this.attackFrame;
    if (name.includes('normal_attack')) return this.attackFrame ?? this.actionFrame;
    if (name.includes('skill')) return this.skillFrame ?? this.actionFrame;
    if (name.includes('defend') || name.includes('guard')) return this.defendFrame ?? this.actionFrame;
    if (name.includes('end')) return this.endFrame ?? this.actionFrame;
    return this.actionFrame;
  }

  private applyButtonFrame(button: Button, frame: SpriteFrame | null): void {
    if (!frame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = frame;
    button.hoverSprite = frame;
    button.pressedSprite = frame;
    button.disabledSprite = frame;
    button.target = button.node;
  }

  private updateDiceFaceSprite(value: string | number | null | undefined): void {
    const roll = typeof value === 'number' ? value : Number(value);
    const frame = this.diceFaces[roll - 1] ?? null;
    const node = this.node.getChildByName('DiceFrame');
    if (!frame || !node) return;
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }

  /** Spawn a floating damage/heal/block number that tweens up and fades out. */
  private spawnFloatingEffect(playerId: string, value: number, type: 'damage' | 'heal' | 'block'): void {
    const labelNode = new Node(`Float_${type}_${value}_${Date.now()}`);
    this.node.addChild(labelNode);

    // Position near the center of the screen (above the battle area)
    const playerIdx = this.room?.players.findIndex(p => p.id === playerId) ?? -1;
    const x = playerIdx >= 0 ? (playerIdx - (this.room?.players.length ?? 1) / 2 + 0.5) * 180 : 0;
    labelNode.setPosition(new Vec3(x, 80, 0));

    const transform = labelNode.addComponent(UITransform);
    transform.setContentSize(120, 40);

    const label = labelNode.addComponent(Label);
    label.fontSize = type === 'damage' && value >= 8 ? 36 : 28;
    label.lineHeight = 36;
    label.enableWrapText = false;
    label.color = type === 'damage'
      ? new Color(255, 68, 68, 255)
      : type === 'heal'
        ? new Color(68, 255, 68, 255)
        : new Color(255, 170, 68, 255);
    label.string = type === 'damage' ? `-${value}` : type === 'heal' ? `+${value}` : `Block`;

    const opacity = labelNode.addComponent(UIOpacity);
    opacity.opacity = 255;

    tween(labelNode)
      .by(1.2, { position: new Vec3(0, 80, 0) })
      .start();
    tween(opacity)
      .delay(0.5)
      .to(0.7, { opacity: 0 })
      .call(() => labelNode.destroy())
      .start();
  }

  // ── Emotes ──

  /** Handle incoming emote from another player. */
  private onEmoteReceived(event: PlayerEmoteEvent): void {
    if (!this.room) return;
    const player = this.room.players.find(
      p => p.id === event.playerId || p.clientId === event.playerId || p.controllerId === event.playerId
    );
    const emoji = this.emoteBar?.addIncoming(event.playerId, event.emoteId) ?? event.emoteId;
    if (player) {
      this.spawnEmoteFloat(player.id, emoji);
    } else {
      // Fallback: show as center-screen brief message
      this.spawnEmoteFloat('', emoji);
    }
  }

  /** Show a floating emote bubble near the player's seat. Auto-destroys after animation. */
  private spawnEmoteFloat(playerId: string, emoji: string): void {
    const labelNode = new Node(`Emote_${playerId || 'center'}_${Date.now()}`);
    this.node.addChild(labelNode);

    // Position near player seat or center
    const playerIdx = playerId
      ? (this.room?.players.findIndex(p => p.id === playerId) ?? -1)
      : -1;
    const x = playerIdx >= 0
      ? (playerIdx - ((this.room?.players.length ?? 1) - 1) / 2) * 180
      : 0;
    labelNode.setPosition(new Vec3(x, 40, 0));
    labelNode.setSiblingIndex(990);

    const transform = labelNode.addComponent(UITransform);
    transform.setContentSize(120, 40);

    const label = labelNode.addComponent(Label);
    label.fontSize = 32;
    label.lineHeight = 36;
    label.enableWrapText = false;
    label.color = new Color(255, 238, 155, 255);
    label.string = emoji;

    const opacity = labelNode.addComponent(UIOpacity);
    opacity.opacity = 255;

    tween(labelNode)
      .by(1.2, { position: new Vec3(0, 70, 0) })
      .start();
    tween(opacity)
      .delay(0.6)
      .to(0.6, { opacity: 0 })
      .call(() => {
        if (labelNode?.isValid) labelNode.destroy();
      })
      .start();
  }
}
