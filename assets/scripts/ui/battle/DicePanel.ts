import { _decorator, Button, Component, Label } from 'cc';
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
    if (!room || !actor || room.pendingRollDecision) return;

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
    const latestRoll = room.battleLog.find((event) => event.type === 'roll' && event.dice?.length);
    if (this.diceLabel) {
      this.diceLabel.string = room.pendingRollDecision
        ? String(room.pendingRollDecision.currentRoll)
        : latestRoll?.dice?.join(' / ') ?? '-';
    }
    if (this.statusLabel) {
      this.statusLabel.string = room.pendingRollDecision ? 'Choose an action' : 'Ready to roll';
    }
    if (this.rollButton) {
      const actor = room.players[room.activePlayerIndex];
      this.rollButton.interactable = room.phase === 'battle' && !room.pendingRollDecision && actor?.isBot !== true;
    }
  }

  private canTarget(actor: Player, target: Player): boolean {
    if (target.id === actor.id || target.isDead) return false;
    if (actor.teamId && target.teamId) return actor.teamId !== target.teamId;
    return true;
  }
}
