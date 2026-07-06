import { _decorator, Button, Color, Component, EventTouch, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

export type RewardCardState = 'available' | 'selected' | 'disabled' | 'taken';

const RARITY_INDEX: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const RARITY_COLOR: Record<string, Color> = {
  common: new Color(162, 155, 142, 255),
  rare: new Color(102, 144, 219, 255),
  epic: new Color(185, 104, 217, 255),
  legendary: new Color(230, 176, 74, 255),
};

@ccclass('RewardCard')
export class RewardCard extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  subtitleLabel: Label | null = null;

  @property({ type: Label })
  descriptionLabel: Label | null = null;

  @property({ type: Label })
  tagLabel: Label | null = null;

  @property({ type: Button })
  infoButton: Button | null = null;

  @property({ type: [SpriteFrame] })
  rarityFrames: SpriteFrame[] = [];

  rewardId = '';
  state: RewardCardState = 'available';

  /** Called when the info ("?") button is clicked. Set by parent scene. */
  onInfo: (() => void) | null = null;

  /** Map rarity string to array index for rarityFrames. */
  static rarityIndexForRarity(rarity: string): number {
    return RARITY_INDEX[rarity] ?? 0;
  }

  /** Map rarity string to accent color. */
  static colorForRarity(rarity: string): Color {
    return RARITY_COLOR[rarity] ?? RARITY_COLOR.common;
  }

  onLoad(): void {
    this.ensureMinimalUi();
    if (this.infoButton) {
      this.infoButton.node.on(Button.EventType.CLICK, () => this.onInfo?.(), this);
      // Prevent touch from bubbling to parent card Button, which would trigger selection
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

  render(
    id: string,
    title: string,
    subtitle = '',
    description = '',
    rarityIndex = 0,
    selected = false,
    state: RewardCardState = selected ? 'selected' : 'available',
  ): void {
    this.rewardId = id;
    this.state = state;
    if (this.titleLabel) this.titleLabel.string = title;
    if (this.subtitleLabel) this.subtitleLabel.string = subtitle;
    if (this.descriptionLabel) this.descriptionLabel.string = description;
    if (this.tagLabel) this.tagLabel.string = state !== 'available' ? this.tagForState(state) : '';

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.rarityFrames[rarityIndex] ?? this.rarityFrames[0] ?? null;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.colorForState(state);
  }

  /**
   * Extended render that accepts rarity string and tags.
   * Tags are shown on the tagLabel when the card is in 'available' state.
   */
  renderRich(
    id: string,
    title: string,
    subtitle: string,
    description: string,
    rarity: string,
    tags: string[],
    state: RewardCardState,
  ): void {
    const rarityIndex = RewardCard.rarityIndexForRarity(rarity);
    this.render(id, title, subtitle, description, rarityIndex, state === 'selected', state);
    if (this.tagLabel && state === 'available' && tags.length > 0) {
      this.tagLabel.string = tags.slice(0, 3).join(' · ');
      this.tagLabel.color = RewardCard.colorForRarity(rarity);
    }
  }

  private tagForState(state: RewardCardState): string {
    if (state === 'selected') return 'SELECTED';
    if (state === 'disabled') return 'WAIT';
    if (state === 'taken') return 'TAKEN';
    return '';
  }

  private colorForState(state: RewardCardState): Color {
    if (state === 'selected') return new Color(255, 226, 140, 255);
    if (state === 'disabled') return new Color(142, 135, 122, 255);
    if (state === 'taken') return new Color(186, 232, 168, 255);
    return new Color(255, 255, 255, 255);
  }

  /** Activate or deactivate the card's interactable state. */
  setInteractable(enabled: boolean): void {
    const button = this.node.getComponent(Button);
    if (button) button.interactable = enabled;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(620, 86);
    this.node.getComponent(Button) ?? this.node.addComponent(Button);

    this.titleLabel ??= this.makeLabel('TitleLabel', -135, 22, 260, 26, 18);
    this.subtitleLabel ??= this.makeLabel('SubtitleLabel', 155, 22, 240, 24, 14);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 0, -12, 560, 34, 14);
    this.tagLabel ??= this.makeLabel('TagLabel', -245, -32, 150, 20, 12);
    this.infoButton ??= this.makeInfoButton('InfoButton', 274, 0, 36, 32);
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
