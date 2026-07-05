import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import type { RogueliteShopItemDraft } from '../../shared/data/rogueliteShop';

const { ccclass, property } = _decorator;

@ccclass('ShopItemCard')
export class ShopItemCard extends Component {
  @property({ type: Label })
  nameLabel: Label | null = null;

  @property({ type: Label })
  typeLabel: Label | null = null;

  @property({ type: Label })
  priceLabel: Label | null = null;

  @property({ type: Label })
  effectLabel: Label | null = null;

  @property({ type: Label })
  limitLabel: Label | null = null;

  @property({ type: SpriteFrame })
  cardFrame: SpriteFrame | null = null;

  itemId = '';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(item: RogueliteShopItemDraft, canBuy = true): void {
    this.itemId = item.id;
    this.ensureMinimalUi();
    if (this.nameLabel) this.nameLabel.string = item.name;
    if (this.typeLabel) this.typeLabel.string = item.type.toUpperCase();
    if (this.priceLabel) this.priceLabel.string = `${item.price}g`;
    if (this.effectLabel) this.effectLabel.string = item.effect;
    if (this.limitLabel) this.limitLabel.string = item.limit;

    const button = this.node.getComponent(Button) ?? this.node.addComponent(Button);
    button.interactable = canBuy;

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.cardFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = canBuy
      ? new Color(255, 255, 255, 255)
      : new Color(130, 130, 130, 210);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 96);
    }
    this.node.getComponent(Button) ?? this.node.addComponent(Button);
    this.nameLabel ??= this.makeLabel('NameLabel', -95, 26, 330, 28, 18);
    this.typeLabel ??= this.makeLabel('TypeLabel', -258, -20, 86, 24, 13);
    this.priceLabel ??= this.makeLabel('PriceLabel', 248, 24, 90, 28, 19);
    this.effectLabel ??= this.makeLabel('EffectLabel', 25, -7, 430, 32, 14);
    this.limitLabel ??= this.makeLabel('LimitLabel', 25, -35, 430, 22, 12);
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
    label.color = new Color(57, 34, 17, 255);
    return label;
  }
}
