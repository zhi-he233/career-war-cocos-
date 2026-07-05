import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BuffIcon')
export class BuffIcon extends Component {
  @property({ type: Label })
  nameLabel: Label | null = null;

  @property({ type: Label })
  countLabel: Label | null = null;

  @property({ type: SpriteFrame })
  iconFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  backgroundFrame: SpriteFrame | null = null;

  buffId = '';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(id: string, label: string, count = 1): void {
    this.buffId = id;
    this.ensureMinimalUi();
    if (this.nameLabel) this.nameLabel.string = label;
    if (this.countLabel) this.countLabel.string = count > 1 ? `x${count}` : '';

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.backgroundFrame ?? this.iconFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.backgroundFrame || this.iconFrame ? new Color(255, 255, 255, 255) : new Color(88, 62, 34, 230);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(92, 42);
    }
    this.nameLabel ??= this.makeLabel('NameLabel', -8, 1, 66, 28, 12);
    this.countLabel ??= this.makeLabel('CountLabel', 31, -10, 38, 18, 11);
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
    label.color = new Color(255, 238, 196, 255);
    return label;
  }
}
