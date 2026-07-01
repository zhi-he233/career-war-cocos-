import { _decorator, Button, Component, Label, Node, ProgressBar, UITransform, Vec3 } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import { ServerActions } from '../../core/ServerActions';
import { canLocalAct, hpPercent, playerStatus, guardBadges, statusBadges, lastRollText } from '../../helpers/BattlePlayerHelpers';
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

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  rollLabel: Label | null = null;

  @property({ type: ProgressBar })
  hpBar: ProgressBar | null = null;

  @property({ type: Node })
  deadMask: Node | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private player: Player | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
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
    if (!this.player) {
      this.clear();
      return;
    }

    const p = this.player;

    if (this.nameLabel) this.nameLabel.string = p.nickname;
    if (this.hpLabel) this.hpLabel.string = `${p.hp} / ${p.maxHp}`;
    if (this.shieldLabel) this.shieldLabel.string = p.shield > 0 ? `Shield ${p.shield}` : '';
    if (this.characterLabel) {
      const badges = [...guardBadges(p, room), ...statusBadges(p)];
      const badgeText = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
      this.characterLabel.string = `${characterName(p.characterId)} / ${summonerSkillName(p.summonerSkillId)}${badgeText}`;
    }
    if (this.statusLabel) {
      this.statusLabel.string = playerStatus(p, room);
    }
    if (this.rollLabel) {
      this.rollLabel.string = lastRollText(p, room);
    }
    if (this.hpBar) {
      this.hpBar.progress = hpPercent(p) / 100;
    }
    if (this.deadMask) {
      this.deadMask.active = p.isDead;
    }
    const btn = this.node.getComponent(Button);
    if (btn) btn.interactable = !p.isDead;
  }

  private clear(): void {
    if (this.nameLabel) this.nameLabel.string = 'Empty';
    if (this.hpLabel) this.hpLabel.string = '-- / --';
    if (this.shieldLabel) this.shieldLabel.string = '';
    if (this.characterLabel) this.characterLabel.string = '';
    if (this.statusLabel) this.statusLabel.string = '';
    if (this.rollLabel) this.rollLabel.string = '';
    if (this.hpBar) this.hpBar.progress = 0;
    if (this.deadMask) this.deadMask.active = false;
  }

  private selectAsTarget(): void {
    const room = this.gameManager?.getRoom();
    if (!this.player || !room) return;
    const clientId = this.gameManager?.localClientId ?? '';
    if (!canLocalAct(room, clientId)) return;
    if (this.player.isDead) return;
    this.serverActions.selectTarget(this.player.id);
  }

  // ── Boilerplate UI helpers ──

  private ensureMinimalUi(): void {
    const t = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (t.contentSize.width <= 0) t.setContentSize(310, 190);

    this.node.getComponent(Button) ?? this.node.addComponent(Button);

    this.nameLabel     ??= this.makeLabel('NameLabel',      0,  68, 290, 32, 20);
    this.characterLabel ??= this.makeLabel('CharacterLabel', 0,  34, 290, 28, 15);
    this.statusLabel   ??= this.makeLabel('StatusLabel',    0,   6, 290, 24, 14);
    this.hpLabel       ??= this.makeLabel('HpLabel',        0, -18, 290, 28, 18);
    this.shieldLabel   ??= this.makeLabel('ShieldLabel',    0, -44, 290, 26, 15);
    this.rollLabel     ??= this.makeLabel('RollLabel',      0, -66, 290, 24, 14);
    this.deadMask      ??= this.makeNode('DeadMask',        0,   0, 300, 180);
    this.deadMask.active = false;
  }

  private makeNode(name: string, x: number, y: number, w: number, h: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const t = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    t.setContentSize(w, h);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, w: number, h: number, fs: number): Label {
    const node = this.makeNode(name, x, y, w, h);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fs;
    label.lineHeight = fs + 5;
    label.enableWrapText = true;
    return label;
  }
}
