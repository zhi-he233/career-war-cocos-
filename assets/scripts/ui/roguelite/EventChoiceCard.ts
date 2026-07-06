import { _decorator, Button, Color, Component, EventTouch, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import type { RogueliteEventChoice } from '../../shared/types';

const { ccclass, property } = _decorator;

export type EventChoiceCardState = 'available' | 'selected' | 'disabled';

const STATE_COLOR: Record<EventChoiceCardState, Color> = {
  available: new Color(255, 255, 255, 255),
  selected: new Color(255, 226, 140, 255),
  disabled: new Color(142, 135, 122, 255),
};

const RISK_COLOR: Record<string, Color> = {
  lose_hp: new Color(218, 78, 62, 255),
  lose_gold: new Color(210, 140, 50, 255),
  start_battle: new Color(218, 120, 60, 255),
  heal: new Color(98, 186, 108, 255),
  gain_gold: new Color(220, 182, 80, 255),
  gain_start_shield_next_battle: new Color(102, 160, 212, 255),
  gain_start_damage_next_battle: new Color(198, 120, 80, 255),
  reward_choice: new Color(185, 104, 217, 255),
};

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

  @property({ type: Button })
  infoButton: Button | null = null;

  @property({ type: SpriteFrame })
  cardFrame: SpriteFrame | null = null;

  choiceId: RogueliteEventChoice['id'] | '' = '';
  state: EventChoiceCardState = 'available';

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

  render(choice: RogueliteEventChoice, index = 0): void {
    this.choiceId = choice.id;
    this.state = 'available';
    this.ensureMinimalUi();
    if (this.keyLabel) this.keyLabel.string = choice.id.toUpperCase();
    if (this.titleLabel) this.titleLabel.string = choice.label;
    if (this.effectLabel) this.effectLabel.string = choice.effect || 'No effect';
    if (this.costLabel) this.costLabel.string = choice.cost ? `Cost: ${choice.cost}` : 'Cost: none';

    this.applyCardFrame(index);
  }

  /** Set visual state without changing choice data. */
  setState(state: EventChoiceCardState): void {
    this.state = state;
    const sprite = this.node.getComponent(Sprite);
    if (sprite) sprite.color = STATE_COLOR[state];
    if (this.keyLabel) this.keyLabel.string = state === 'selected' ? '>' : state === 'disabled' ? '·' : this.choiceId.toUpperCase();
  }

  /** Enable or disable the card's button. */
  setInteractable(enabled: boolean): void {
    const button = this.node.getComponent(Button);
    if (button) button.interactable = enabled;
  }

  /** Highlight cost text with risk color when cost mentions hp/gold/battle. */
  highlightCost(riskHint: string): void {
    if (!this.costLabel) return;
    const color = RISK_COLOR[riskHint] ?? new Color(162, 132, 94, 255);
    this.costLabel.color = color;
  }

  private applyCardFrame(index: number): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.cardFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.cardFrame
      ? new Color(255, 255, 255, 255)
      : this.fallbackColor(index);
  }

  private fallbackColor(index: number): Color {
    const colors = [
      new Color(244, 213, 150, 245),
      new Color(232, 194, 124, 245),
      new Color(220, 178, 110, 245),
    ];
    return colors[index % colors.length];
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 104);
    }
    this.node.getComponent(Button) ?? this.node.addComponent(Button);
    this.keyLabel ??= this.makeLabel('KeyLabel', -268, 20, 58, 42, 24);
    this.titleLabel ??= this.makeLabel('TitleLabel', 20, 28, 430, 28, 18);
    this.effectLabel ??= this.makeLabel('EffectLabel', 20, -4, 470, 34, 14);
    this.costLabel ??= this.makeLabel('CostLabel', 20, -36, 470, 24, 13);
    this.infoButton ??= this.makeInfoButton('InfoButton', 278, 0, 36, 32);
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
    label.fontSize = 16;
    label.lineHeight = 20;
    label.color = new Color(140, 110, 70, 255);
    return button;
  }
}
