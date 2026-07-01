import { _decorator, Component, Label } from 'cc';
import { GameManager } from '../../core/GameManager';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('BattleLog')
export class BattleLog extends Component {
  @property({ type: Label })
  logLabel: Label | null = null;

  @property
  maxLines = 12;

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
    if (!this.logLabel) return;
    this.logLabel.string = room.battleLog
      .slice(0, this.maxLines)
      .map((event) => event.message)
      .join('\n');
  }
}
