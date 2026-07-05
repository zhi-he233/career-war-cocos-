import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName } from '../../core/DisplayText';
import type { Character } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('CharacterDetailDialog')
export class CharacterDetailDialog extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  statLabel: Label | null = null;

  @property({ type: Label })
  tagLabel: Label | null = null;

  @property({ type: Label })
  descriptionLabel: Label | null = null;

  @property({ type: Button })
  closeButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.closeButton?.node.on(Button.EventType.CLICK, this.close, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.closeButton?.node.off(Button.EventType.CLICK, this.close, this);
  }

  render(character: Character): void {
    this.node.active = true;
    if (this.titleLabel) this.titleLabel.string = characterName(character.id);
    if (this.statLabel) this.statLabel.string = `HP ${character.maxHp}`;
    if (this.tagLabel) {
      const tags = [
        character.title,
        character.role,
        character.difficulty,
        ...(character.tags ?? []),
      ].filter(Boolean);
      this.tagLabel.string = tags.join(' / ');
    }
    if (this.descriptionLabel) {
      const lines = character.fullDescription?.length
        ? character.fullDescription
        : character.description?.length
          ? character.description
          : [character.shortDescription ?? 'No description.'];
      this.descriptionLabel.string = lines.join('\n');
    }
  }

  close(): void {
    this.node.active = false;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(620, 420);
    if (this.panelFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 160, 560, 40, 26);
    this.statLabel ??= this.makeLabel('StatLabel', -210, 112, 160, 28, 18);
    this.tagLabel ??= this.makeLabel('TagLabel', 65, 112, 360, 28, 16);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 0, -15, 540, 210, 16);
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 0, -165, 180, 52, 20);
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.makeNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    const label = this.makeNode('Label', 0, 0, width, height);
    if (label.parent !== node) {
      label.removeFromParent();
      node.addChild(label);
    }
    const textLabel = label.getComponent(Label) ?? label.addComponent(Label);
    textLabel.string = text;
    textLabel.fontSize = fontSize;
    textLabel.lineHeight = fontSize + 5;
    textLabel.color = new Color(57, 34, 17, 255);
    return button;
  }
}
