import { _decorator, Button, Color, Component, Label, Node, ProgressBar, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { ServerActions } from '../../core/ServerActions';
import { canLocalAct, canTarget, getActor } from '../../helpers/BattlePlayerHelpers';
import { buildSeatViewModel } from '../../models/ViewModelBuilders';
import type { SeatViewModel } from '../../models/ViewModels';
import type { Player, Room } from '../../shared/types';

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

  @property({ type: Label })
  markLabel: Label | null = null;

  @property({ type: Label })
  tagLabel: Label | null = null;

  @property({ type: Label })
  hostLabel: Label | null = null;

  @property({ type: ProgressBar })
  hpBar: ProgressBar | null = null;

  @property({ type: Node })
  hpFillNode: Node | null = null;

  @property({ type: Node })
  deadMask: Node | null = null;

  @property({ type: SpriteFrame })
  seatFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  selectedFrame: SpriteFrame | null = null;

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

  render(room: Room): void {
    this.player = room.players[this.playerIndex] ?? null;
    if (!this.player) {
      this.clear();
      return;
    }

    const vm = buildSeatViewModel(room, this.player, this.playerIndex, this.gameManager?.localClientId ?? '');
    if (this.nameLabel) this.nameLabel.string = `${vm.playerNumber}. ${vm.nickname}`;
    if (this.hpLabel) this.hpLabel.string = `HP ${vm.hp} / ${vm.maxHp}`;
    if (this.shieldLabel) this.shieldLabel.string = vm.shield > 0 ? `Shield ${vm.shield}` : '';
    if (this.characterLabel) this.characterLabel.string = `${vm.characterName} / ${vm.summonerSkillName}`;
    if (this.statusLabel) this.statusLabel.string = vm.statusText;
    if (this.rollLabel) this.rollLabel.string = vm.lastRollText;
    if (this.markLabel) this.markLabel.string = this.buildMarkText(vm);
    if (this.tagLabel) this.tagLabel.string = vm.seatTags.slice(0, 3).join(' | ');
    if (this.hostLabel) this.hostLabel.string = vm.isHost ? 'HOST' : vm.isBot ? 'AI' : vm.isOnline ? '' : 'OFF';

    if (this.hpBar) this.hpBar.progress = vm.hpPercent / 100;
    if (this.hpFillNode) {
      const transform = this.hpFillNode.getComponent(UITransform);
      transform?.setContentSize(Math.max(0, 260 * vm.hpPercent / 100), 10);
      const sprite = this.hpFillNode.getComponent(Sprite);
      if (sprite) sprite.color = vm.hpPercent <= 30 ? new Color(198, 56, 48, 255) : new Color(72, 178, 95, 255);
    }
    if (this.deadMask) this.deadMask.active = vm.isDead;

    this.applyVisualState(vm);

    const button = this.node.getComponent(Button);
    if (button) {
      const clientId = this.gameManager?.localClientId ?? '';
      const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
      // In duo mode, own characters must be clickable for actor selection
      const isDuoOwn = mode === 'duo_2v2' && this.isOwnPlayer(this.player, clientId) && canLocalAct(room, clientId);
      button.interactable = isDuoOwn || this.isSelectableTarget(room, this.player);
    }
  }

  private isOwnPlayer(player: Player, clientId: string): boolean {
    return player.clientId === clientId || player.controllerId === clientId;
  }

  private clear(): void {
    if (this.nameLabel) this.nameLabel.string = 'Empty';
    if (this.hpLabel) this.hpLabel.string = '-- / --';
    if (this.shieldLabel) this.shieldLabel.string = '';
    if (this.characterLabel) this.characterLabel.string = '';
    if (this.statusLabel) this.statusLabel.string = '';
    if (this.rollLabel) this.rollLabel.string = '';
    if (this.markLabel) this.markLabel.string = '';
    if (this.tagLabel) this.tagLabel.string = '';
    if (this.hostLabel) this.hostLabel.string = '';
    if (this.hpBar) this.hpBar.progress = 0;
    if (this.hpFillNode) this.hpFillNode.getComponent(UITransform)?.setContentSize(0, 10);
    if (this.deadMask) this.deadMask.active = false;
  }

  private selectAsTarget(): void {
    const room = this.gameManager?.getRoom();
    if (!this.player || !room) return;
    const clientId = this.gameManager?.localClientId ?? '';
    if (!canLocalAct(room, clientId)) return;

    // Duo mode: clicking your own team member selects them as the actor
    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    if (mode === 'duo_2v2' && this.isOwnPlayer(this.player, clientId)) {
      this.serverActions.selectActor(this.player.id);
      return;
    }

    if (!this.isSelectableTarget(room, this.player)) return;
    this.serverActions.selectTarget(this.player.id);
  }

  private isSelectableTarget(room: Room, player: Player): boolean {
    const actor = getActor(room);
    if (!actor || !canLocalAct(room, this.gameManager?.localClientId ?? '')) return false;
    return canTarget(actor, player);
  }

  private buildMarkText(vm: SeatViewModel): string {
    const marks: string[] = [];
    if (vm.isActive) marks.push('ACT');
    if (vm.isSelectable) marks.push('TARGET');
    if (vm.isSelected) marks.push('SELECTED');
    if (vm.hasInvincible) marks.push('INV');
    return marks.join('  ');
  }

  private applyVisualState(vm: SeatViewModel): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    sprite.spriteFrame = vm.isSelected && this.selectedFrame ? this.selectedFrame : this.seatFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;

    if (vm.isDead) {
      sprite.color = new Color(72, 72, 72, 255);
    } else if (vm.isSelected) {
      sprite.color = new Color(255, 224, 128, 255);
    } else if (vm.isActive) {
      sprite.color = new Color(255, 246, 210, 255);
    } else if (vm.isSelectable) {
      sprite.color = new Color(218, 238, 255, 255);
    } else if (!vm.isOnline) {
      sprite.color = new Color(145, 145, 145, 255);
    } else {
      sprite.color = new Color(255, 255, 255, 255);
    }

    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
    opacity.opacity = vm.isDead ? 155 : 255;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0) transform.setContentSize(310, 190);

    this.node.getComponent(Button) ?? this.node.addComponent(Button);
    if (this.seatFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.seatFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.nameLabel ??= this.makeLabel('NameLabel', 0, 50, 290, 28, 19);
    this.hostLabel ??= this.makeLabel('HostLabel', 122, 50, 54, 24, 13);
    this.characterLabel ??= this.makeLabel('CharacterLabel', 0, 22, 290, 24, 15);
    this.tagLabel ??= this.makeLabel('TagLabel', 0, 0, 290, 22, 13);
    this.statusLabel ??= this.makeLabel('StatusLabel', 0, -22, 290, 22, 14);
    this.hpLabel ??= this.makeLabel('HpLabel', 0, -45, 290, 24, 16);
    this.hpFillNode ??= this.makeHpFillNode();
    this.shieldLabel ??= this.makeLabel('ShieldLabel', -86, -68, 126, 22, 13);
    this.rollLabel ??= this.makeLabel('RollLabel', 70, -68, 150, 22, 13);
    this.markLabel ??= this.makeLabel('MarkLabel', 0, 76, 270, 24, 13);
    this.deadMask ??= this.makeNode('DeadMask', 0, 0, 300, 180);
    this.applyDeadMaskStyle(this.deadMask);
    this.deadMask.active = false;
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
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = name === 'MarkLabel' ? new Color(255, 224, 128, 255) : new Color(57, 34, 17, 255);
    return label;
  }

  private makeHpFillNode(): Node {
    const node = this.makeNode('HpFill', -130, -58, 260, 10);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.color = new Color(72, 178, 95, 255);
    return node;
  }

  private applyDeadMaskStyle(node: Node): void {
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.color = new Color(0, 0, 0, 145);
    const labelNode = node.getChildByName('DeadLabel') ?? new Node('DeadLabel');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const transform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    transform.setContentSize(260, 42);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = 'DEAD';
    label.fontSize = 28;
    label.lineHeight = 34;
    label.color = new Color(255, 230, 200, 255);
  }
}
