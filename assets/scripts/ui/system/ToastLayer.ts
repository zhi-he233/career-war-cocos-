import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { GameEvents } from '../../core/GameEvents';
import { GameManager } from '../../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('ToastLayer')
export class ToastLayer extends Component {
  @property({ type: Label })
  messageLabel: Label | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property
  defaultDuration = 1.6;

  private gameManager: GameManager | null = null;
  private readonly handleToastBound = (message: string, duration?: number) => this.show(message, duration);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.node.on(GameEvents.ToastRequested, this.handleToastBound, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.gameManager?.node.off(GameEvents.ToastRequested, this.handleToastBound, this);
  }

  show(message: string, duration = this.defaultDuration): void {
    this.ensureMinimalUi();
    this.node.active = true;
    this.node.setSiblingIndex(999);
    if (this.messageLabel) this.messageLabel.string = message;

    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
    opacity.opacity = 0;
    tween(opacity)
      .stop()
      .to(0.12, { opacity: 255 })
      .delay(Math.max(0.4, duration))
      .to(0.18, { opacity: 0 })
      .call(() => {
        this.node.active = false;
      })
      .start();
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(560, 56);
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(36, 21, 10, 230);
    }

    this.messageLabel ??= this.makeLabel('MessageLabel', 0, 0, 520, 42, 18);
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return label;
  }
}
