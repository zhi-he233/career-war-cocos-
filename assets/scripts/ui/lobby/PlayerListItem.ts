import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
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

  @property({ type: Button })
  kickButton: Button | null = null;

  @property({ type: SpriteFrame })
  normalFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  selfFrame: SpriteFrame | null = null;

  private _kickHandler: ((player: Player) => void) | null = null;
  private _currentPlayer: Player | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.kickButton?.node.on(Button.EventType.CLICK, this.onKickClick, this);
  }

  onDestroy(): void {
    this.kickButton?.node.off(Button.EventType.CLICK, this.onKickClick, this);
  }

  render(player: Player | null, index: number, localClientId: string, isHost: boolean, onKick?: (player: Player) => void): void {
    this._currentPlayer = player;
    this._kickHandler = onKick ?? null;

    if (!player) {
      if (this.nameLabel) this.nameLabel.string = `Seat ${index + 1}: Empty`;
      if (this.roleLabel) this.roleLabel.string = '';
      if (this.stateLabel) this.stateLabel.string = 'EMPTY';
      if (this.kickButton) this.kickButton.node.active = false;
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
    // Show kick button only for host kicking non-host, non-self players
    if (this.kickButton) {
      this.kickButton.node.active = isHost && !player.isHost && !isSelf;
    }
    this.applyFrame(isSelf, player.isOnline === false);
  }

  private onKickClick(): void {
    if (this._currentPlayer && this._kickHandler) {
      this._kickHandler(this._currentPlayer);
    }
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

    this.nameLabel ??= this.makeLabel('NameLabel', -210, 10, 200, 24, 16);
    this.roleLabel ??= this.makeLabel('RoleLabel', 20, 10, 260, 24, 14);
    this.stateLabel ??= this.makeLabel('StateLabel', 220, 10, 120, 24, 12);
    this.kickButton ??= this.makeKickButton('KickButton', 280, 10, 48, 28);
  }

  private makeKickButton(name: string, x: number, y: number, width: number, height: number): Button {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    const label = node.getChildByName('Label') ?? (() => { const n = new Node('Label'); node.addChild(n); n.setPosition(Vec3.ZERO); n.addComponent(UITransform).setContentSize(width, height); return n; })();
    const lbl = label.getComponent(Label) ?? label.addComponent(Label);
    lbl.string = 'X';
    lbl.fontSize = 12;
    lbl.lineHeight = 16;
    lbl.color = new Color(180, 70, 70, 255);
    node.active = false;
    return button;
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
