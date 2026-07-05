import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import type { RogueliteEventChoice } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('EventChoiceCard')
export class EventChoiceCard extends Component {
  @property({ type: Label })
  keyLabel: Label | null = null;

  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  effectLabel: Label | null = null;

  @property({ type: Label })
  costLabel: Label | null = null;

  @property({ type: SpriteFrame })
  cardFrame: SpriteFrame | null = null;

  choiceId: RogueliteEventChoice['id'] | '' = '';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(choice: RogueliteEventChoice, index = 0): void {
    this.choiceId = choice.id;
    this.ensureMinimalUi();
    if (this.keyLabel) this.keyLabel.string = choice.id.toUpperCase();
    if (this.titleLabel) this.titleLabel.string = choice.label;
    if (this.effectLabel) this.effectLabel.string = choice.effect || 'No effect';
    if (this.costLabel) this.costLabel.string = choice.cost ? `Cost: ${choice.cost}` : 'Cost: none';

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.cardFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.cardFrame
      ? new Color(255, 255, 255, 255)
      : index % 2 === 0
        ? new Color(244, 213, 150, 245)
        : new Color(232, 194, 124, 245);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 104);
    }
    this.node.getComponent(Button) ?? this.node.addComponent(Button);
    this.keyLabel ??= this.makeLabel('KeyLabel', -268, 20, 58, 42, 24);
    this.titleLabel ??= this.makeLabel('TitleLabel', 20, 28, 470, 28, 18);
    this.effectLabel ??= this.makeLabel('EffectLabel', 20, -4, 470, 34, 14);
    this.costLabel ??= this.makeLabel('CostLabel', 20, -36, 470, 24, 13);
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
