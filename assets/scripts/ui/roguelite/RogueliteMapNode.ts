import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

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

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(id: string, title: string, type: string, status: 'current' | 'available' | 'locked' | 'cleared' | 'preview' = 'available'): void {
    this.nodeId = id;
    if (this.iconLabel) this.iconLabel.string = this.iconForType(type);
    if (this.titleLabel) this.titleLabel.string = title;
    if (this.statusLabel) this.statusLabel.string = status.toUpperCase();

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.typeFrames[this.frameIndexForType(type)] ?? this.typeFrames[0] ?? null;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = status === 'locked'
      ? new Color(120, 120, 120, 210)
      : status === 'current'
        ? new Color(255, 232, 150, 255)
        : new Color(255, 255, 255, 255);
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
