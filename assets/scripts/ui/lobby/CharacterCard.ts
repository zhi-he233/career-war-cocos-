import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName } from '../../core/DisplayText';
import type { Character, CharacterId } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('CharacterCard')
export class CharacterCard extends Component {
  @property({ type: Label })
  nameLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Label })
  tagLabel: Label | null = null;

  @property({ type: Label })
  descriptionLabel: Label | null = null;

  @property({ type: SpriteFrame })
  normalFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  selectedFrame: SpriteFrame | null = null;

  @property({ type: Label })
  takenLabel: Label | null = null;

  characterId: CharacterId = '';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(character: Character, selected: boolean, takenBy: string | null = null): void {
    this.characterId = character.id;
    const isTaken = takenBy !== null && !selected;
    if (this.nameLabel) this.nameLabel.string = characterName(character.id);
    if (this.hpLabel) this.hpLabel.string = `HP ${character.maxHp}`;
    if (this.tagLabel) {
      const tags = [character.role, character.difficulty].filter(Boolean);
      this.tagLabel.string = tags.join(' / ');
    }
    if (this.descriptionLabel) {
      this.descriptionLabel.string = character.shortDescription ?? character.description?.[0] ?? '';
    }
    if (this.takenLabel) {
      this.takenLabel.string = isTaken ? `Taken: ${takenBy}` : '';
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = selected && this.selectedFrame ? this.selectedFrame : this.normalFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    if (selected) {
      sprite.color = new Color(255, 226, 140, 255);
    } else if (isTaken) {
      sprite.color = new Color(180, 180, 180, 255);
    } else {
      sprite.color = new Color(255, 255, 255, 255);
    }

    // Disable button when taken
    const button = this.node.getComponent(Button);
    if (button) button.interactable = !isTaken;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(200, 92);
    this.node.getComponent(Button) ?? this.node.addComponent(Button);
    if (this.normalFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.normalFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.nameLabel ??= this.makeLabel('NameLabel', 0, 30, 180, 24, 17);
    this.hpLabel ??= this.makeLabel('HpLabel', -54, 6, 80, 20, 13);
    this.tagLabel ??= this.makeLabel('TagLabel', 38, 6, 110, 20, 12);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 0, -26, 176, 28, 12);
    this.takenLabel ??= this.makeLabel('TakenLabel', 0, -44, 176, 16, 10);
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
