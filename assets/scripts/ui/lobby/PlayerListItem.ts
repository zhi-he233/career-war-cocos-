import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import type { Player } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('PlayerListItem')
export class PlayerListItem extends Component {
  @property({ type: Label })
  nameLabel: Label | null = null;

  @property({ type: Label })
  roleLabel: Label | null = null;

  @property({ type: Label })
  stateLabel: Label | null = null;

  @property({ type: SpriteFrame })
  normalFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  selfFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(player: Player | null, index: number, localClientId: string): void {
    if (!player) {
      if (this.nameLabel) this.nameLabel.string = `Seat ${index + 1}: Empty`;
      if (this.roleLabel) this.roleLabel.string = '';
      if (this.stateLabel) this.stateLabel.string = 'EMPTY';
      this.applyFrame(false, false);
      return;
    }

    const isSelf = player.clientId === localClientId || player.controllerId === localClientId;
    if (this.nameLabel) this.nameLabel.string = `${index + 1}. ${player.nickname}`;
    if (this.roleLabel) this.roleLabel.string = `${characterName(player.characterId)} / ${summonerSkillName(player.summonerSkillId)}`;
    if (this.stateLabel) {
      const tags = [
        player.isHost ? 'HOST' : '',
        player.isBot ? 'AI' : '',
        player.isOnline === false ? 'OFF' : 'ON',
        isSelf ? 'YOU' : '',
      ].filter(Boolean);
      this.stateLabel.string = tags.join(' ');
    }
    this.applyFrame(isSelf, player.isOnline === false);
  }

  private applyFrame(isSelf: boolean, offline: boolean): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = isSelf && this.selfFrame ? this.selfFrame : this.normalFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.color = offline ? new Color(150, 150, 150, 255) : isSelf ? new Color(255, 232, 150, 255) : new Color(255, 255, 255, 255);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(620, 52);
    if (this.normalFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.normalFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.nameLabel ??= this.makeLabel('NameLabel', -190, 10, 220, 24, 16);
    this.roleLabel ??= this.makeLabel('RoleLabel', 40, 10, 260, 24, 14);
    this.stateLabel ??= this.makeLabel('StateLabel', 240, 10, 110, 24, 13);
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
