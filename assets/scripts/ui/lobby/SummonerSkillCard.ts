import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { summonerSkillName } from '../../core/DisplayText';
import type { SummonerSkillId } from '../../shared/types';

const { ccclass, property } = _decorator;

const SUMMONER_SKILL_SHORT_TEXT: Record<SummonerSkillId, string> = {
  lucky_plus_one: '骰点 +1',
  first_aid: '回复自身',
  iron_wall: '获得护盾',
  fate_reroll: '重掷骰子',
  last_stand: '残血反击',
};

@ccclass('SummonerSkillCard')
export class SummonerSkillCard extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  descriptionLabel: Label | null = null;

  @property({ type: Label })
  selectedLabel: Label | null = null;

  @property({ type: SpriteFrame })
  normalFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  selectedFrame: SpriteFrame | null = null;

  skillId: SummonerSkillId = 'lucky_plus_one';

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(skillId: SummonerSkillId, selected: boolean): void {
    this.skillId = skillId;
    if (this.titleLabel) this.titleLabel.string = summonerSkillName(skillId);
    if (this.descriptionLabel) this.descriptionLabel.string = SUMMONER_SKILL_SHORT_TEXT[skillId] ?? '';
    if (this.selectedLabel) this.selectedLabel.string = selected ? '已选择' : '';

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = selected && this.selectedFrame ? this.selectedFrame : this.normalFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = selected ? new Color(255, 226, 140, 255) : new Color(255, 255, 255, 255);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(620, 82);
    this.node.getComponent(Button) ?? this.node.addComponent(Button);
    if (this.normalFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.normalFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', -220, 18, 160, 28, 18);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 30, -2, 430, 34, 15);
    this.selectedLabel ??= this.makeLabel('SelectedLabel', 235, 18, 120, 24, 13);
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
