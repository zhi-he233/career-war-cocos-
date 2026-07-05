import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { latestEvents } from '../../helpers/BattlePlayerHelpers';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('BattleLogDrawer')
export class BattleLogDrawer extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  logLabel: Label | null = null;

  @property({ type: Button })
  closeButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  @property
  maxLines = 30;

  private gameManager: GameManager | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.closeButton?.node.on(Button.EventType.CLICK, this.close, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.closeButton?.node.off(Button.EventType.CLICK, this.close, this);
  }

  open(room: Room): void {
    this.node.active = true;
    this.node.setSiblingIndex(999);
    this.applyPanelFrame();
    this.applyButtonFrame(this.closeButton);
    this.render(room);
  }

  close(): void {
    this.node.active = false;
  }

  render(room: Room): void {
    if (!this.node.active) return;
    if (this.titleLabel) this.titleLabel.string = `Battle Log  (${room.battleLog.length})`;
    if (this.logLabel) {
      this.logLabel.string = latestEvents(room, this.maxLines)
        .map((event) => `${this.formatTime(event.createdAt)}  ${event.message}`)
        .join('\n');
    }
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
      transform.setContentSize(660, 760);
    }

    this.applyPanelFrame();

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 320, 590, 42, 24, new Color(57, 34, 17, 255));
    this.logLabel ??= this.makeLabel('LogLabel', 0, 0, 590, 590, 17, new Color(57, 34, 17, 255));
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 0, -330, 170, 52, 20);
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color): Label {
    const node = this.makeNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    label.color = color;
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    if (this.buttonFrame) {
      sprite.spriteFrame = this.buttonFrame;
      button.normalSprite = this.buttonFrame;
      button.hoverSprite = this.buttonFrame;
      button.pressedSprite = this.buttonFrame;
      button.disabledSprite = this.buttonFrame;
      button.target = node;
    } else {
      sprite.color = new Color(201, 157, 84, 255);
    }

    const label = this.makeLabel('Label', 0, 0, width, height, fontSize, new Color(57, 34, 17, 255));
    label.node.parent = node;
    label.node.setPosition(Vec3.ZERO);
    label.string = text;
    return button;
  }

  private applyButtonFrame(button: Button | null): void {
    if (!button || !this.buttonFrame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = this.buttonFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = this.buttonFrame;
    button.hoverSprite = this.buttonFrame;
    button.pressedSprite = this.buttonFrame;
    button.disabledSprite = this.buttonFrame;
    button.target = button.node;
  }

  private applyPanelFrame(): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
      return;
    }
    sprite.color = new Color(38, 28, 18, 235);
  }
}
