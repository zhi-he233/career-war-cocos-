import { _decorator, Component, Label, Node, UITransform, Vec3 } from 'cc';
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
    this.ensureMinimalUi();
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

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(680, 150);
    }

    this.stageLabel ??= this.ensureLabel('StageLabel', -220, 40, 210, 34, 19);
    this.goldLabel ??= this.ensureLabel('GoldLabel', 0, 40, 180, 34, 19);
    this.buffsLabel ??= this.ensureLabel('BuffsLabel', 0, -30, 640, 70, 16);
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
    return label;
  }
}
