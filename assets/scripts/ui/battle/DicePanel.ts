import { _decorator, Button, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import type { Player, Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('DicePanel')
export class DicePanel extends Component {
  @property({ type: Label })
  diceLabel: Label | null = null;

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Button })
  rollButton: Button | null = null;

  private gameManager: GameManager | null = null;
  private room: Room | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.rollButton?.node.on(Button.EventType.CLICK, this.rollDice, this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.rollButton?.node.off(Button.EventType.CLICK, this.rollDice, this);
  }

  rollDice(): void {
    const room = this.room;
    const actor = room?.players[room.activePlayerIndex];
    if (!room || !actor || room.pendingRollDecision || !this.canLocalAct(room)) return;

    const target = actor.selectedTargetId
      ? room.players.find((player) => player.id === actor.selectedTargetId && this.canTarget(actor, player))
      : room.players.find((player) => this.canTarget(actor, player));

    const emitRoll = () => this.gameManager?.emitAck('rollDice', {});
    if (!target || actor.selectedTargetId === target.id) {
      emitRoll();
      return;
    }

    this.gameManager?.emitAck('selectTarget', { targetId: target.id }, () => emitRoll());
  }

  private render(room: Room): void {
    this.room = room;
    const latestRoll = this.latestEvents(room).find((event) => event.type === 'roll' && event.dice?.length);
    if (this.diceLabel) {
      this.diceLabel.string = room.pendingRollDecision
        ? String(room.pendingRollDecision.currentRoll)
        : latestRoll?.dice?.join(' / ') ?? '-';
    }
    if (this.statusLabel) {
      this.statusLabel.string = room.pendingRollDecision ? 'Choose an action' : 'Ready to roll';
    }
    if (this.rollButton) {
      this.rollButton.interactable = room.phase === 'battle' && !room.pendingRollDecision && this.canLocalAct(room);
    }
  }

  private canTarget(actor: Player, target: Player): boolean {
    if (target.id === actor.id || target.isDead) return false;
    if (actor.teamId && target.teamId) return actor.teamId !== target.teamId;
    return true;
  }

  private canLocalAct(room: Room): boolean {
    const actor = room.players[room.activePlayerIndex];
    const localClientId = this.gameManager?.localClientId;
    if (!actor || actor.isDead || actor.isBot || !localClientId) return false;
    return actor.clientId === localClientId || actor.controllerId === localClientId;
  }

  private latestEvents(room: Room): Room['battleLog'] {
    return [...room.battleLog].sort((a, b) => b.createdAt - a.createdAt);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(320, 190);
    }

    this.statusLabel ??= this.ensureLabel('StatusLabel', 0, 58, 300, 34, 18);
    this.diceLabel ??= this.ensureLabel('DiceLabel', 0, 10, 300, 54, 34);
    this.rollButton ??= this.ensureButton('RollButton', 'Roll', 0, -58, 220, 52, 24);
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.ensureNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    return label;
  }

  private ensureButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.ensureNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const label = this.ensureChildLabel(node, 'Label', width, height, fontSize);
    label.string = text;
    return button;
  }

  private ensureChildLabel(parent: Node, name: string, width: number, height: number, fontSize: number): Label {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(Vec3.ZERO);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    return label;
  }
}
