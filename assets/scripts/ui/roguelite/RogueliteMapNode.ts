import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

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

  @property({ type: [SpriteFrame] })
  typeFrames: SpriteFrame[] = [];

  nodeId = '';
  status: RogueliteMapNodeStatus = 'available';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(id: string, title: string, type: string, status: RogueliteMapNodeStatus = 'available'): void {
    this.nodeId = id;
    this.status = status;
    if (this.iconLabel) this.iconLabel.string = this.iconForType(type);
    if (this.titleLabel) this.titleLabel.string = title;
    if (this.statusLabel) this.statusLabel.string = this.labelForStatus(status);

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.typeFrames[this.frameIndexForType(type)] ?? this.typeFrames[0] ?? null;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.colorForTypeAndStatus(type, status);
  }

  private iconForType(type: string): string {
    if (type === 'boss') return 'BOSS';
    if (type === 'elite') return 'ELITE';
    if (type === 'shop') return 'SHOP';
    if (type === 'rest') return 'REST';
    if (type === 'event') return 'EVENT';
    return 'BATTLE';
  }

  private frameIndexForType(type: string): number {
    if (type === 'boss') return 3;
    if (type === 'elite') return 2;
    if (type === 'shop') return 1;
    if (type === 'rest') return 1;
    if (type === 'event') return 2;
    return 0;
  }

  private labelForStatus(status: RogueliteMapNodeStatus): string {
    if (status === 'available') return 'CHOOSE';
    if (status === 'cleared') return 'CLEARED';
    if (status === 'current') return 'CURRENT';
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

    this.iconLabel ??= this.makeLabel('IconLabel', 0, 20, 150, 24, 15);
    this.titleLabel ??= this.makeLabel('TitleLabel', 0, -4, 150, 24, 14);
    this.statusLabel ??= this.makeLabel('StatusLabel', 0, -28, 150, 20, 11);
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
}
