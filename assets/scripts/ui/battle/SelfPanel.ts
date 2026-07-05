import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { buildSelfPanelVM } from '../../models/ViewModelBuilders';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('SelfPanel')
export class SelfPanel extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Label })
  shieldLabel: Label | null = null;

  @property({ type: Label })
  tagsLabel: Label | null = null;

  @property({ type: Label })
  skillHintLabel: Label | null = null;

  @property({ type: Label })
  lastRollLabel: Label | null = null;

  @property({ type: Node })
  hpFillNode: Node | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  private gameManager: GameManager | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
  }

  render(room: Room): void {
    const player = this.gameManager?.getLocalPlayer() ?? room.players.find((item) => !item.isBot) ?? null;
    if (!player) {
      this.clear();
      return;
    }

    const vm = buildSelfPanelVM(room, player, this.gameManager?.localClientId ?? '');
    if (this.titleLabel) this.titleLabel.string = `${vm.nickname} / ${vm.characterName}`;
    if (this.hpLabel) this.hpLabel.string = `HP ${vm.hp} / ${vm.maxHp}`;
    if (this.shieldLabel) this.shieldLabel.string = vm.shield > 0 ? `Shield ${vm.shield}` : '';
    if (this.tagsLabel) this.tagsLabel.string = vm.statusTags.join(' | ');
    if (this.skillHintLabel) this.skillHintLabel.string = vm.skillHintText;
    if (this.lastRollLabel) this.lastRollLabel.string = vm.lastRollText;
    if (this.hpFillNode) {
      const fillTransform = this.hpFillNode.getComponent(UITransform) ?? this.hpFillNode.addComponent(UITransform);
      fillTransform.setContentSize(Math.max(0, 560 * vm.hpPercent / 100), 12);
      const sprite = this.hpFillNode.getComponent(Sprite);
      if (sprite) sprite.color = vm.hpPercent <= 30 ? new Color(202, 52, 45, 255) : new Color(79, 180, 92, 255);
    }

    const panelSprite = this.node.getComponent(Sprite);
    if (panelSprite) {
      if (vm.isDead) panelSprite.color = new Color(105, 105, 105, 255);
      else if (vm.isCurrentTurn) panelSprite.color = new Color(255, 238, 184, 255);
      else if (vm.shield > 0) panelSprite.color = new Color(220, 238, 255, 255);
      else panelSprite.color = new Color(255, 255, 255, 255);
    }
  }

  private clear(): void {
    if (this.titleLabel) this.titleLabel.string = 'No player';
    if (this.hpLabel) this.hpLabel.string = '';
    if (this.shieldLabel) this.shieldLabel.string = '';
    if (this.tagsLabel) this.tagsLabel.string = '';
    if (this.skillHintLabel) this.skillHintLabel.string = '';
    if (this.lastRollLabel) this.lastRollLabel.string = '';
    if (this.hpFillNode) {
      const ft = this.hpFillNode.getComponent(UITransform) ?? this.hpFillNode.addComponent(UITransform);
      ft.setContentSize(0, 12);
    }
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 150);
    }
    if (this.panelFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 50, 580, 28, 19);
    this.hpLabel ??= this.makeLabel('HpLabel', -170, 18, 240, 24, 16);
    this.shieldLabel ??= this.makeLabel('ShieldLabel', 150, 18, 220, 24, 16);
    this.hpFillNode ??= this.makeHpFillNode();
    this.tagsLabel ??= this.makeLabel('TagsLabel', 0, -18, 580, 24, 14);
    this.skillHintLabel ??= this.makeLabel('SkillHintLabel', 0, -44, 580, 24, 14);
    this.lastRollLabel ??= this.makeLabel('LastRollLabel', 0, -68, 580, 22, 13);
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
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeHpFillNode(): Node {
    const node = this.makeNode('HpFill', -280, 0, 560, 12);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.color = new Color(79, 180, 92, 255);
    return node;
  }
}
