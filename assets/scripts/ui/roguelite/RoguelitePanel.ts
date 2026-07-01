import { _decorator, Component, Label } from 'cc';
import { GameManager } from '../../core/GameManager';
import { titleFromId } from '../../core/DisplayText';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('RoguelitePanel')
export class RoguelitePanel extends Component {
  @property({ type: Label })
  stageLabel: Label | null = null;

  @property({ type: Label })
  goldLabel: Label | null = null;

  @property({ type: Label })
  buffsLabel: Label | null = null;

  private gameManager: GameManager | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
  }

  private render(room: Room): void {
    const run = room.roguelite;
    if (this.stageLabel) {
      this.stageLabel.string = run ? `Stage ${run.stage} / ${run.maxStage}` : 'Not started';
    }
    if (this.goldLabel) {
      this.goldLabel.string = `Gold ${run?.runGold ?? 0}`;
    }
    if (this.buffsLabel) {
      this.buffsLabel.string = run?.appliedRewards?.map((reward) => titleFromId(reward.type)).join(', ') ?? '';
    }
  }
}
