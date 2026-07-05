import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { summonerSkillName, summonerSkillDescription } from '../../core/DisplayText';
import type { SummonerSkillId } from '../../shared/types';

const { ccclass, property } = _decorator;

const SUMMONER_SKILL_COOLDOWNS: Record<SummonerSkillId, string> = {
  lucky_plus_one: 'Cooldown 2 turns',
  first_aid: 'Cooldown 3 turns',
  iron_wall: 'Cooldown 3 turns',
  fate_reroll: 'Cooldown 3 turns',
  last_stand: 'Cooldown 3 turns',
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
    if (this.titleLabel) this.titleLabel.string = summonerSkillName(skillId);
    if (this.cooldownLabel) this.cooldownLabel.string = SUMMONER_SKILL_COOLDOWNS[skillId] ?? '';
    if (this.descriptionLabel) this.descriptionLabel.string = summonerSkillDescription(skillId);
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
