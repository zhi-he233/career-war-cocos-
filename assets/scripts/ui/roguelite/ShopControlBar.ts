import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ShopControlBar')
export class ShopControlBar extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  goldLabel: Label | null = null;

  @property({ type: Label })
  refreshLabel: Label | null = null;

  @property({ type: Button })
  refreshButton: Button | null = null;

  @property({ type: Button })
  leaveButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  private refreshHandler: (() => void) | null = null;
  private leaveHandler: (() => void) | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.refreshButton?.node.on(Button.EventType.CLICK, this.handleRefresh, this);
    this.leaveButton?.node.on(Button.EventType.CLICK, this.handleLeave, this);
  }

  onDestroy(): void {
    this.refreshButton?.node.off(Button.EventType.CLICK, this.handleRefresh, this);
    this.leaveButton?.node.off(Button.EventType.CLICK, this.handleLeave, this);
  }

  setHandlers(refreshHandler: () => void, leaveHandler: () => void): void {
    this.refreshHandler = refreshHandler;
    this.leaveHandler = leaveHandler;
  }

  render(payload: { gold: number; refreshPrice: number; canRefresh: boolean; serverRefreshAvailable: boolean }): void {
    this.ensureMinimalUi();
    if (this.titleLabel) this.titleLabel.string = 'Shop';
    if (this.goldLabel) this.goldLabel.string = `Gold ${payload.gold}`;
    if (this.refreshLabel) {
      this.refreshLabel.string = payload.serverRefreshAvailable
        ? `Refresh ${payload.refreshPrice}g`
        : 'Refresh not wired';
    }
    if (this.refreshButton) this.refreshButton.interactable = payload.canRefresh && payload.serverRefreshAvailable;
    this.applyFrame(this.node, this.panelFrame, new Color(42, 30, 18, 225));
    this.applyButtonFrame(this.refreshButton);
    this.applyButtonFrame(this.leaveButton);
  }

  private handleRefresh(): void {
    this.refreshHandler?.();
  }

  private handleLeave(): void {
    this.leaveHandler?.();
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 74);
    }
    this.titleLabel ??= this.makeLabel('TitleLabel', -235, 14, 120, 28, 22);
    this.goldLabel ??= this.makeLabel('GoldLabel', -75, 14, 130, 26, 17);
    this.refreshLabel ??= this.makeLabel('RefreshLabel', 85, 14, 170, 26, 14);
    this.refreshButton ??= this.makeButton('RefreshButton', 'Refresh', 150, -18, 142, 38, 15);
    this.leaveButton ??= this.makeButton('LeaveButton', 'Leave', 270, -18, 112, 38, 15);
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
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

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    const label = this.makeLabel('Label', 0, 0, width, height, fontSize);
    label.node.parent = node;
    label.node.setPosition(Vec3.ZERO);
    label.string = text;
    return button;
  }

  private applyFrame(node: Node, frame: SpriteFrame | null, fallback: Color): void {
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    if (frame) {
      sprite.spriteFrame = frame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
      return;
    }
    sprite.color = fallback;
  }

  private applyButtonFrame(button: Button | null): void {
    if (!button) return;
    this.applyFrame(button.node, this.buttonFrame, new Color(201, 157, 84, 255));
    if (!this.buttonFrame) return;
    button.normalSprite = this.buttonFrame;
    button.hoverSprite = this.buttonFrame;
    button.pressedSprite = this.buttonFrame;
    button.disabledSprite = this.buttonFrame;
    button.target = button.node;
  }
}
