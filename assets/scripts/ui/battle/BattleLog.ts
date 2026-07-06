import { _decorator, Color, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { latestEvents } from '../../helpers/BattlePlayerHelpers';
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
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
  }

  render(room: Room): void {
    if (!this.logLabel) return;
    this.logLabel.string = latestEvents(room, this.maxLines)
      .map((event, index) => {
        const newest = index === 0 ? ' NEW' : '';
        return `${this.formatTime(event.createdAt)}${newest}  ${event.message}`;
      })
      .join('\n');
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(680, 300);
    }
    const pw = transform.contentSize.width || 680;
    const ph = transform.contentSize.height || 300;

    this.logLabel ??= this.ensureLabel('LogLabel', 0, 0, pw - 20, ph - 20, 16);
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);

    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return label;
  }
}
