import { _decorator, Button, Component, Label, Node, ProgressBar, UITransform, Vec3 } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import type { Player, Room } from '../../shared/types';
import { GameManager } from '../../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('BattleSeat')
export class BattleSeat extends Component {
  @property
  playerIndex = 0;

  @property({ type: Label })
  nameLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Label })
  shieldLabel: Label | null = null;

  @property({ type: Label })
  characterLabel: Label | null = null;

  @property({ type: ProgressBar })
  hpBar: ProgressBar | null = null;

  @property({ type: Node })
  deadMask: Node | null = null;

  private gameManager: GameManager | null = null;
  private player: Player | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.node.on(Button.EventType.CLICK, this.selectAsTarget, this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.node.off(Button.EventType.CLICK, this.selectAsTarget, this);
  }

  private render(room: Room): void {
    this.player = room.players[this.playerIndex] ?? null;
    this.renderPlayer(this.player);
  }

  private renderPlayer(player: Player | null): void {
    if (this.nameLabel) this.nameLabel.string = player?.nickname ?? 'Empty';
    if (this.hpLabel) this.hpLabel.string = player ? `${player.hp} / ${player.maxHp}` : '-- / --';
    if (this.shieldLabel) this.shieldLabel.string = player && player.shield > 0 ? `Shield ${player.shield}` : '';
    if (this.characterLabel) {
      this.characterLabel.string = player ? `${characterName(player.characterId)} / ${summonerSkillName(player.summonerSkillId)}` : '';
    }
    if (this.hpBar) {
      this.hpBar.progress = player && player.maxHp > 0 ? Math.max(0, Math.min(1, player.hp / player.maxHp)) : 0;
    }
    if (this.deadMask) {
      this.deadMask.active = player?.isDead === true;
    }
  }

  private selectAsTarget(): void {
    if (!this.player || this.player.isDead) return;
    this.gameManager?.emitAck('selectTarget', { targetId: this.player.id });
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(310, 170);
    }
    this.node.getComponent(Button) ?? this.node.addComponent(Button);

    this.nameLabel ??= this.ensureLabel('NameLabel', 0, 58, 290, 34, 20);
    this.characterLabel ??= this.ensureLabel('CharacterLabel', 0, 24, 290, 30, 16);
    this.hpLabel ??= this.ensureLabel('HpLabel', 0, -12, 290, 30, 18);
    this.shieldLabel ??= this.ensureLabel('ShieldLabel', 0, -44, 290, 28, 16);
    this.deadMask ??= this.ensureNode('DeadMask', 0, 0, 300, 160);
    this.deadMask.active = false;
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.ensureNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    return label;
  }
}
