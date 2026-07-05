import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

export type RewardCardState = 'available' | 'selected' | 'disabled' | 'taken';

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

  @property({ type: [SpriteFrame] })
  rarityFrames: SpriteFrame[] = [];

  rewardId = '';
  state: RewardCardState = 'available';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(
    id: string,
    title: string,
    subtitle = '',
    description = '',
    rarityIndex = 0,
    selected = false,
    state: RewardCardState = selected ? 'selected' : 'available'
  ): void {
    this.rewardId = id;
    this.state = state;
    if (this.titleLabel) this.titleLabel.string = title;
    if (this.subtitleLabel) this.subtitleLabel.string = subtitle;
    if (this.descriptionLabel) this.descriptionLabel.string = description;
    if (this.tagLabel) this.tagLabel.string = this.tagForState(state);

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = this.rarityFrames[rarityIndex] ?? this.rarityFrames[0] ?? null;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = this.colorForState(state);
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

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(620, 86);
    this.node.getComponent(Button) ?? this.node.addComponent(Button);

    this.titleLabel ??= this.makeLabel('TitleLabel', -135, 22, 260, 26, 18);
    this.subtitleLabel ??= this.makeLabel('SubtitleLabel', 155, 22, 240, 24, 14);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 0, -10, 560, 34, 14);
    this.tagLabel ??= this.makeLabel('TagLabel', 244, -32, 110, 20, 12);
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
