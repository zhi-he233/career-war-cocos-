import { _decorator, Button, Color, Component, EventTouch, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

export type RogueliteMapNodeStatus = 'current' | 'available' | 'locked' | 'cleared' | 'preview';

@ccclass('RogueliteMapNode')
export class RogueliteMapNode extends Component {
  @property({ type: Label })
  iconLabel: Label | null = null;

  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Button })
  infoButton: Button | null = null;

  @property({ type: [SpriteFrame] })
  typeFrames: SpriteFrame[] = [];

  nodeId = '';
  nodeType = '';
  status: RogueliteMapNodeStatus = 'available';

  /** Called when the info ("?") button is clicked. Set by parent scene. */
  onInfo: (() => void) | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    if (this.infoButton) {
      this.infoButton.node.on(Button.EventType.CLICK, () => this.onInfo?.(), this);
      this.infoButton.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
        event.propagationStopped = true;
      });
    }
  }

  onDestroy(): void {
    if (this.infoButton) {
      this.infoButton.node.off(Button.EventType.CLICK);
      this.infoButton.node.off(Node.EventType.TOUCH_START);
    }
  }

  render(id: string, title: string, type: string, status: RogueliteMapNodeStatus = 'available'): void {
    this.nodeId = id;
    this.nodeType = type;
    this.status = status;
    if (this.iconLabel) this.iconLabel.string = this.iconForType(type);
    if (this.titleLabel) this.titleLabel.string = title;
    if (this.statusLabel) this.statusLabel.string = this.labelForStatus(status);

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.typeFrames[this.frameIndexForType(type)] ?? this.typeFrames[0] ?? null;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.colorForTypeAndStatus(type, status);

    // Info button available for all statuses; selection is gated by Button.interactable
    if (this.infoButton) {
      this.infoButton.node.active = true;
    }
  }

  /** Enable or disable the node's selection button. */
  setInteractable(enabled: boolean): void {
    const button = this.node.getComponent(Button);
    if (button) button.interactable = enabled;
  }

  private iconForType(type: string): string {
    if (type === 'boss') return 'BOSS';
    if (type === 'elite') return 'ELITE';
    if (type === 'shop') return 'SHOP';
    if (type === 'rest') return 'REST';
    if (type === 'event') return 'EVENT';
    if (type === 'reward') return 'REWARD';
    return 'BATTLE';
  }

  private frameIndexForType(type: string): number {
    if (type === 'boss') return 3;
    if (type === 'elite') return 2;
    if (type === 'shop') return 1;
    if (type === 'rest') return 1;
    if (type === 'event') return 2;
    if (type === 'reward') return 1;
    return 0;
  }

  private labelForStatus(status: RogueliteMapNodeStatus): string {
    if (status === 'available') return 'CHOOSE';
    if (status === 'cleared') return 'CLEARED';
    if (status === 'current') return 'SELECTED';
    if (status === 'preview') return 'NEXT';
    return 'LOCKED';
  }

  private colorForTypeAndStatus(type: string, status: RogueliteMapNodeStatus): Color {
    if (status === 'locked') return new Color(110, 110, 110, 190);
    if (status === 'cleared') return new Color(155, 210, 155, 230);
    if (status === 'current') return new Color(255, 232, 150, 255);
    if (status === 'preview') return new Color(185, 190, 205, 210);
    if (type === 'boss') return new Color(235, 160, 215, 255);
    if (type === 'elite') return new Color(245, 178, 135, 255);
    if (type === 'shop') return new Color(245, 218, 135, 255);
    if (type === 'rest') return new Color(180, 228, 170, 255);
    if (type === 'event') return new Color(165, 205, 245, 255);
    if (type === 'reward') return new Color(255, 226, 140, 255);
    return new Color(255, 255, 255, 255);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(170, 92);
    this.node.getComponent(Button) ?? this.node.addComponent(Button);

    this.iconLabel ??= this.makeLabel('IconLabel', -15, 20, 120, 24, 15);
    this.titleLabel ??= this.makeLabel('TitleLabel', 0, -4, 150, 24, 14);
    this.statusLabel ??= this.makeLabel('StatusLabel', 0, -28, 150, 20, 11);
    this.infoButton ??= this.makeInfoButton('InfoButton', 70, 24, 30, 26);
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeInfoButton(name: string, x: number, y: number, width: number, height: number): Button {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const t = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    t.setContentSize(width, height);

    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const labelNode = node.getChildByName('Label') ?? new Node('Label');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const lt = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    lt.setContentSize(width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = '?';
    label.fontSize = 14;
    label.lineHeight = 18;
    label.color = new Color(140, 110, 70, 255);
    return button;
  }
}
