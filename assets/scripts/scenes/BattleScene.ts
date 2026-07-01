import { _decorator, Button, Color, Component, Label, Node, UITransform, Vec3, tween, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { characterName, summonerSkillName } from '../core/DisplayText';
import { getActor, canTarget, canLocalAct, canResolveDecision, latestEvents, diffFloatingEffects } from '../helpers/BattlePlayerHelpers';
import { DicePanel } from '../ui/battle/DicePanel';
import type { Player, RollActionType, RollDecisionAvailableAction, RollDecisionChoice, Room, SummonerSkillId } from '../shared/types';

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

  @property({ type: DicePanel })
  dicePanel: DicePanel | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private room: Room | null = null;
  private prevRoom: Room | null = null;
  private statusText = '';
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);
    this.rollButton?.node.on(Button.EventType.CLICK, this.rollDice, this);

    const room = this.gameManager.getRoom();
    this.statusText = this.gameManager.getStatus();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
    this.rollButton?.node.off(Button.EventType.CLICK, this.rollDice, this);
  }

  private render(room: Room): void {
    // Floating damage/heal effects
    const effects = diffFloatingEffects(this.prevRoom, room);
    for (const fx of effects) {
      this.spawnFloatingEffect(fx.playerId, fx.value, fx.type);
    }
    this.prevRoom = room;
    this.room = room;

    // Drive DicePanel display + animation
    if (this.dicePanel) {
      this.dicePanel.render(room);
    }

    const actor = this.getActor(room);
    const decision = room.pendingRollDecision;

    if (this.phaseLabel) {
      const title = room.phase === 'gameOver'
        ? `Game Over | Winner: ${this.getPlayerName(room.winnerId)}`
        : `Battle | Active: ${actor?.nickname ?? '-'}`;
      this.phaseLabel.string = `${title}\n${this.statusText}`;
    }

    if (this.playersLabel) {
      this.playersLabel.string = room.players
        .map((player, index) => this.playerLine(room, player, index))
        .join('\n');
    }

    if (this.diceLabel) {
      const latestRoll = this.latestRoll(room);
      this.diceLabel.string = decision
        ? `Roll ${decision.currentRoll} | ${this.getPlayerName(decision.actorId)} -> ${this.getPlayerName(decision.targetId)}`
        : latestRoll
          ? `Last roll ${latestRoll}`
          : 'Select target, then roll';
    }

    if (this.logLabel) {
      this.logLabel.string = this.latestEvents(room, 12).map((event) => event.message).join('\n');
    }

    if (this.rollButton) {
      this.rollButton.node.active = room.phase === 'battle' && !decision;
      this.rollButton.interactable = this.canLocalAct(room);
    }

    this.renderTargets(room);
    this.renderActions(room);
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

  private renderActions(room: Room): void {
    if (!this.actionListNode) return;
    this.clearChildren(this.actionListNode);

    const decision = room.pendingRollDecision;
    const actions = decision?.availableActions ?? [];
    if (!decision) {
      this.ensureActionHint('Roll first to reveal action choices.');
      return;
    }

    if (actions.length === 0) {
      const button = this.createButton('Action_normal_attack', 'Attack', 0, 0, 220, 58, 20, this.actionListNode);
      button.interactable = this.canResolveDecision(room);
      button.node.on(Button.EventType.CLICK, () => this.confirmAction('normal_attack'), this);
      return;
    }

    actions.forEach((action, index) => {
      const button = this.createButton(
        `Action_${action.id}_${index}`,
        `${action.label || action.id}\n${action.enabled ? '' : action.reason ?? 'disabled'}`,
        -220 + index * 220,
        0,
        205,
        64,
        15,
        this.actionListNode!
      );
      button.interactable = action.enabled === true && this.canResolveDecision(room);
      button.node.on(Button.EventType.CLICK, () => this.confirmAction(action.id, action), this);
    });
  }

  private ensureActionHint(text: string): void {
    const label = this.ensureLabel('ActionHint', 0, 0, 650, 44, 18, this.actionListNode ?? this.node);
    label.string = text;
  }

  private renderStatus(status: string): void {
    this.statusText = status;
    if (this.room) this.render(this.room);
  }

  private selectTarget(targetId: string): void {
    if (!this.room || !this.canLocalAct(this.room)) return;
    this.serverActions.selectTarget(targetId);
  }

  private rollDice(): void {
    const room = this.room;
    const actor = room ? this.getActor(room) : null;
    if (!room || !actor || room.pendingRollDecision || !this.canLocalAct(room)) return;

    const target = actor.selectedTargetId
      ? room.players.find((player) => player.id === actor.selectedTargetId && this.canTarget(actor, player))
      : room.players.find((player) => this.canTarget(actor, player));

    if (!target) return;

    // Start dice roll animation
    this.dicePanel?.startRoll(room.pendingGuardCheck ? 'guard' : 'normal');

    const emitRoll = () => this.serverActions.rollDice();
    if (actor.selectedTargetId === target.id) {
      emitRoll();
      return;
    }

    this.serverActions.selectTarget(target.id, () => emitRoll());
  }

  private confirmAction(actionType: RollActionType, action?: RollDecisionAvailableAction): void {
    const decision = this.room?.pendingRollDecision;
    if (!this.room || !decision || !this.canResolveDecision(this.room)) return;

    this.serverActions.confirmRollDecision({
      roomId: this.room.id,
      pendingDecisionId: decision.id,
      decisionId: decision.id,
      actionType,
      choice: actionType as RollDecisionChoice,
      skillId: action?.skillId,
      summonerSkillId: actionType === 'summoner_skill' ? action?.skillId as SummonerSkillId : undefined,
      selfDamageAmount: action?.requiresSelfDamageAmount ? 1 : undefined,
    });
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

  private latestRoll(room: Room): string {
    const event = this.latestEvents(room).find((item) => item.type === 'roll' && item.dice?.length);
    return event?.dice?.join('/') ?? '';
  }

  private latestEvents(room: Room, limit = room.battleLog.length): Room['battleLog'] {
    return latestEvents(room, limit);
  }

  private ensureMinimalUi(): void {
    this.phaseLabel ??= this.ensureLabel('PhaseLabel', 0, 545, 680, 64, 20, this.node);
    this.playersLabel ??= this.ensureLabel('PlayersLabel', 0, 375, 680, 265, 17, this.node);
    this.targetListNode ??= this.ensureNode('TargetList', 0, 160, 680, 74, this.node);
    this.diceLabel ??= this.ensureLabel('DiceLabel', 0, 65, 680, 58, 28, this.node);
    this.rollButton ??= this.createButton('RollButton', 'Roll', 0, -25, 220, 60, 26, this.node);
    this.actionListNode ??= this.ensureNode('ActionList', 0, -125, 680, 80, this.node);
    this.logLabel ??= this.ensureLabel('BattleLogLabel', 0, -360, 690, 360, 16, this.node);
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
    return button;
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
}
