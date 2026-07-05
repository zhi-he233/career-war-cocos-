import { _decorator, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, instantiate } from 'cc';
import { titleFromId } from '../../core/DisplayText';
import { GameManager } from '../../core/GameManager';
import { getLocalPlayer } from '../../helpers/BattlePlayerHelpers';
import type { Room } from '../../shared/types';
import { BuffIcon } from '../system/BuffIcon';

const { ccclass, property } = _decorator;

@ccclass('RogueliteStatusCompact')
export class RogueliteStatusCompact extends Component {
  @property({ type: Label })
  stageLabel: Label | null = null;

  @property({ type: Label })
  goldLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Node })
  buffListNode: Node | null = null;

  @property({ type: Prefab })
  buffIconPrefab: Prefab | null = null;

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
    this.ensureMinimalUi();
    const isRoguelite = room.gameMode === 'pve_roguelite' || !!room.roguelite;
    this.node.active = isRoguelite;
    if (!isRoguelite) return;

    const run = room.roguelite;
    const player = getLocalPlayer(room, this.gameManager?.localClientId ?? '') ?? room.players.find((item) => !item.isBot) ?? room.players[0];
    if (this.stageLabel) this.stageLabel.string = run ? `Stage ${run.stage}/${run.maxStage}` : 'Stage -';
    if (this.goldLabel) this.goldLabel.string = `Gold ${run?.runGold ?? 0}`;
    if (this.hpLabel) this.hpLabel.string = player ? `HP ${player.hp}/${player.maxHp}` : 'HP -';

    this.renderBuffIcons((run?.appliedRewards ?? []).slice(-3).map((reward) => ({
      id: reward.id,
      label: titleFromId(reward.type).slice(0, 7),
      count: reward.value > 1 ? reward.value : 1,
    })));
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 62);
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 245);
    } else {
      sprite.color = new Color(42, 30, 18, 215);
    }

    this.stageLabel ??= this.makeLabel('StageLabel', -235, 10, 140, 26, 15);
    this.goldLabel ??= this.makeLabel('GoldLabel', -88, 10, 120, 26, 15);
    this.hpLabel ??= this.makeLabel('HpLabel', 58, 10, 140, 26, 15);
    this.buffListNode ??= this.makeNode('BuffList', 190, 0, 230, 42, this.node);
  }

  private renderBuffIcons(items: { id: string; label: string; count: number }[]): void {
    if (!this.buffListNode) return;
    this.clearChildren(this.buffListNode);
    items.slice(0, 3).forEach((item, index) => {
      const node = this.createBuffNode(`CompactBuff_${item.id}`, -76 + index * 76, 0);
      const icon = node.getComponent(BuffIcon) ?? node.addComponent(BuffIcon);
      icon.backgroundFrame = this.panelFrame;
      icon.render(item.id, item.label, item.count);
    });
  }

  private createBuffNode(name: string, x: number, y: number): Node {
    if (this.buffIconPrefab) {
      const node = instantiate(this.buffIconPrefab);
      node.name = name;
      this.buffListNode?.addChild(node);
      node.setPosition(new Vec3(x, y, 0));
      const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
      transform.setContentSize(72, 34);
      return node;
    }
    return this.makeNode(name, x, y, 72, 34, this.buffListNode ?? this.node);
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number, parent: Node): Node {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.makeNode(name, x, y, width, height, this.node);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return label;
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }
}
