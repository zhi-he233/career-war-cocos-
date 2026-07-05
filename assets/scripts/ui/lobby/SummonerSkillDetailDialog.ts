import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { summonerSkillName } from '../../core/DisplayText';
import type { SummonerSkillId } from '../../shared/types';

const { ccclass, property } = _decorator;

const SUMMONER_SKILL_DETAILS: Record<SummonerSkillId, { cooldown: string; description: string }> = {
  lucky_plus_one: {
    cooldown: 'Cooldown 2',
    description: 'Increase the current roll by 1, up to 6. Best for reaching key skill numbers.',
  },
  first_aid: {
    cooldown: 'Cooldown 3',
    description: 'Convert this action into healing yourself by the current roll amount.',
  },
  iron_wall: {
    cooldown: 'Cooldown 3',
    description: 'Convert this action into gaining shield equal to the current roll.',
  },
  fate_reroll: {
    cooldown: 'Cooldown 3',
    description: 'Reroll once and accept the new result.',
  },
  last_stand: {
    cooldown: 'Cooldown 3',
    description: 'Emergency comeback skill. Use when low HP or under pressure.',
  },
};

@ccclass('SummonerSkillDetailDialog')
export class SummonerSkillDetailDialog extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  cooldownLabel: Label | null = null;

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

  render(skillId: SummonerSkillId): void {
    this.node.active = true;
    const detail = SUMMONER_SKILL_DETAILS[skillId];
    if (this.titleLabel) this.titleLabel.string = summonerSkillName(skillId);
    if (this.cooldownLabel) this.cooldownLabel.string = detail.cooldown;
    if (this.descriptionLabel) this.descriptionLabel.string = detail.description;
  }

  close(): void {
    this.node.active = false;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(540, 320);
    if (this.panelFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 105, 480, 38, 25);
    this.cooldownLabel ??= this.makeLabel('CooldownLabel', 0, 62, 420, 26, 17);
    this.descriptionLabel ??= this.makeLabel('DescriptionLabel', 0, -25, 460, 120, 17);
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 0, -120, 170, 50, 20);
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
    const labelNode = node.getChildByName('Label') ?? new Node('Label');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const transform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.color = new Color(57, 34, 17, 255);
    return button;
  }
}
