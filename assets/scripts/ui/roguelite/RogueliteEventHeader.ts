import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { titleFromId } from '../../core/DisplayText';
import type { RoguelitePendingEvent } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('RogueliteEventHeader')
export class RogueliteEventHeader extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  rarityLabel: Label | null = null;

  @property({ type: Label })
  descriptionLabel: Label | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(event: RoguelitePendingEvent): void {
    this.ensureMinimalUi();
    if (this.titleLabel) this.titleLabel.string = event.name || titleFromId(event.id);
    if (this.rarityLabel) this.rarityLabel.string = `${event.rarity.toUpperCase()} / ${event.stage.toUpperCase()}`;
    if (this.descriptionLabel) this.descriptionLabel.string = event.description || 'Choose one option.';

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.panelFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.panelFrame ? new Color(255, 255, 255, 255) : this.colorForRarity(event.rarity);
  }

  private colorForRarity(rarity: RoguelitePendingEvent['rarity']): Color {
    if (rarity === 'rare') return new Color(210, 176, 255, 235);
    if (rarity === 'uncommon') return new Color(190, 228, 180, 235);
    return new Color(236, 206, 148, 235);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 118);
    }
    this.titleLabel ??= this.makeLabel('TitleLabel', -95, 34, 380, 34, 22);
    this.rarityLabel ??= this.makeLabel('RarityLabel', 225, 34, 140, 26, 13);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 0, -22, 560, 58, 16);
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
    label.color = new Color(57, 34, 17, 255);
    return label;
  }
}
