import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import { GameManager } from '../../core/GameManager';
import { buildSeatViewModel } from '../../models/ViewModelBuilders';
import type { Player, Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('PlayerDetailDialog')
export class PlayerDetailDialog extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  statsLabel: Label | null = null;

  @property({ type: Label })
  tagsLabel: Label | null = null;

  @property({ type: Label })
  skillLabel: Label | null = null;

  @property({ type: Button })
  closeButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  private gameManager: GameManager | null = null;
  private playerId: string | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.renderCurrent(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.closeButton?.node.on(Button.EventType.CLICK, this.close, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.closeButton?.node.off(Button.EventType.CLICK, this.close, this);
  }

  open(playerId: string, room: Room): void {
    this.playerId = playerId;
    this.node.active = true;
    this.node.setSiblingIndex(999);
    this.applyPanelFrame();
    this.applyButtonFrame(this.closeButton);
    this.renderCurrent(room);
  }

  close(): void {
    this.node.active = false;
    this.playerId = null;
  }

  render(player: Player, room: Room): void {
    this.playerId = player.id;
    this.node.active = true;
    this.applyPanelFrame();
    this.applyButtonFrame(this.closeButton);
    this.renderPlayer(player, room);
  }

  private renderCurrent(room: Room): void {
    if (!this.node.active || !this.playerId) return;
    const player = room.players.find((item) => item.id === this.playerId);
    if (!player) {
      this.close();
      return;
    }
    this.renderPlayer(player, room);
  }

  private renderPlayer(player: Player, room: Room): void {
    const index = Math.max(0, room.players.findIndex((item) => item.id === player.id));
    const vm = buildSeatViewModel(room, player, index, this.gameManager?.localClientId ?? '');
    const team = player.teamId ? `Team ${player.teamId}` : 'Solo';
    const role = player.isBot ? 'AI' : player.isHost ? 'Host' : 'Player';
    const targetName = player.selectedTargetId
      ? room.players.find((item) => item.id === player.selectedTargetId)?.nickname ?? player.selectedTargetId
      : '-';

    if (this.titleLabel) this.titleLabel.string = `${player.nickname}  |  ${characterName(player.characterId)}`;
    if (this.statusLabel) this.statusLabel.string = `${role} / ${team} / ${vm.statusText}`;
    if (this.statsLabel) {
      this.statsLabel.string = [
        `HP ${player.hp} / ${player.maxHp}`,
        `Shield ${player.shield}`,
        `Target ${targetName}`,
        vm.lastRollText || 'No roll yet',
      ].join('\n');
    }
    if (this.tagsLabel) this.tagsLabel.string = vm.seatTags.length ? vm.seatTags.join('  |  ') : 'No status tags';
    if (this.skillLabel) {
      this.skillLabel.string = [
        `Character: ${characterName(player.characterId)}`,
        `Summoner: ${summonerSkillName(player.summonerSkillId)}`,
        player.summonerSkillCooldown ? `Cooldown: ${player.summonerSkillCooldown}` : 'Cooldown: ready',
      ].join('\n');
    }
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 430);
    }

    this.applyPanelFrame();

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 165, 560, 42, 24, new Color(57, 34, 17, 255));
    this.statusLabel ??= this.makeLabel('StatusLabel', 0, 122, 560, 28, 17, new Color(89, 58, 28, 255));
    this.statsLabel ??= this.makeLabel('StatsLabel', -150, 22, 250, 132, 18, new Color(57, 34, 17, 255));
    this.skillLabel ??= this.makeLabel('SkillLabel', 145, 22, 270, 132, 18, new Color(57, 34, 17, 255));
    this.tagsLabel ??= this.makeLabel('TagsLabel', 0, -98, 560, 72, 16, new Color(89, 58, 28, 255));
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 0, -170, 170, 52, 20);
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color): Label {
    const node = this.makeNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    label.color = color;
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    if (this.buttonFrame) {
      sprite.spriteFrame = this.buttonFrame;
      button.normalSprite = this.buttonFrame;
      button.hoverSprite = this.buttonFrame;
      button.pressedSprite = this.buttonFrame;
      button.disabledSprite = this.buttonFrame;
      button.target = node;
    } else {
      sprite.color = new Color(201, 157, 84, 255);
    }

    const label = this.makeLabel('Label', 0, 0, width, height, fontSize, new Color(57, 34, 17, 255));
    label.node.parent = node;
    label.node.setPosition(Vec3.ZERO);
    label.string = text;
    return button;
  }

  private applyButtonFrame(button: Button | null): void {
    if (!button || !this.buttonFrame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = this.buttonFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = this.buttonFrame;
    button.hoverSprite = this.buttonFrame;
    button.pressedSprite = this.buttonFrame;
    button.disabledSprite = this.buttonFrame;
    button.target = button.node;
  }

  private applyPanelFrame(): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
      return;
    }
    sprite.color = new Color(38, 28, 18, 225);
  }
}
