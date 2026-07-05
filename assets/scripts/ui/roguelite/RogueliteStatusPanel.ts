import { _decorator, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, instantiate } from 'cc';
import { titleFromId } from '../../core/DisplayText';
import { GameManager } from '../../core/GameManager';
import { getLocalPlayer } from '../../helpers/BattlePlayerHelpers';
import type { Room } from '../../shared/types';
import { BuffIcon } from '../system/BuffIcon';
import { CurrencyBar } from '../system/CurrencyBar';

const { ccclass, property } = _decorator;

@ccclass('RogueliteStatusPanel')
export class RogueliteStatusPanel extends Component {
  @property({ type: Label })
  stageLabel: Label | null = null;

  @property({ type: Label })
  goldLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Label })
  buffLabel: Label | null = null;

  @property({ type: Label })
  phaseLabel: Label | null = null;

  @property({ type: Node })
  buffListNode: Node | null = null;

  @property({ type: CurrencyBar })
  currencyBar: CurrencyBar | null = null;

  @property({ type: Prefab })
  buffIconPrefab: Prefab | null = null;

  @property({ type: Prefab })
  currencyBarPrefab: Prefab | null = null;

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
    const run = room.roguelite;
    const player = getLocalPlayer(room, this.gameManager?.localClientId ?? '') ?? room.players.find((item) => !item.isBot) ?? room.players[0];
    const rewards = run?.appliedRewards ?? [];
    const recentRewards = rewards.slice(-3).map((reward) => titleFromId(reward.type)).join(' | ');
    const passiveCount = player?.roguelitePassiveIds?.length ?? 0;
    const perkCount = player?.roguelitePerkStacks ? Object.values(player.roguelitePerkStacks).reduce((sum, value) => sum + value, 0) : 0;

    if (this.stageLabel) this.stageLabel.string = run ? `Stage ${run.stage} / ${run.maxStage}` : 'Stage -';
    if (this.goldLabel) this.goldLabel.string = `Gold ${run?.runGold ?? 0}`;
    if (this.hpLabel) this.hpLabel.string = player ? `HP ${player.hp} / ${player.maxHp}` : 'HP -';
    if (this.phaseLabel) this.phaseLabel.string = titleFromId(room.phase);
    if (this.buffLabel) {
      this.buffLabel.string = recentRewards || passiveCount || perkCount
        ? `Buffs ${rewards.length + passiveCount + perkCount}: ${recentRewards || 'active'}`
        : 'Buffs 0';
    }
    this.currencyBar?.render({
      gold: run?.runGold ?? 0,
      hp: player?.hp,
      maxHp: player?.maxHp,
      stage: run?.stage,
      maxStage: run?.maxStage,
    });
    this.renderBuffIcons(rewards.slice(-4).map((reward) => ({
      id: reward.id,
      label: reward.name || titleFromId(reward.type).slice(0, 8),
      count: reward.value > 1 ? reward.value : 1,
    })));
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(640, 112);
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(42, 30, 18, 220);
    }

    const currencyNode = this.ensurePrefabNode('CurrencyBar', this.currencyBarPrefab, 0, 30, 520, 48);
    this.currencyBar ??= currencyNode.getComponent(CurrencyBar) ?? currencyNode.addComponent(CurrencyBar);
    this.currencyBar.panelFrame = this.panelFrame;

    this.stageLabel ??= null;
    this.goldLabel ??= null;
    this.hpLabel ??= null;
    this.phaseLabel ??= this.makeLabel('PhaseLabel', -210, -18, 190, 26, 16);
    this.buffLabel ??= this.makeLabel('BuffLabel', 120, -18, 390, 42, 15);
    this.buffListNode ??= this.makeNode('BuffList', 105, -37, 400, 42);
  }

  private renderBuffIcons(items: { id: string; label: string; count: number }[]): void {
    if (!this.buffListNode) return;
    this.clearChildren(this.buffListNode);
    items.slice(0, 4).forEach((item, index) => {
      const node = this.createBuffIconNode(`Buff_${item.id}`, -144 + index * 96, 0);
      const icon = node.getComponent(BuffIcon) ?? node.addComponent(BuffIcon);
      icon.backgroundFrame = this.panelFrame;
      icon.render(item.id, item.label, item.count);
    });
  }

  private createBuffIconNode(name: string, x: number, y: number): Node {
    if (this.buffIconPrefab) {
      const node = instantiate(this.buffIconPrefab);
      node.name = name;
      this.buffListNode?.addChild(node);
      node.setPosition(new Vec3(x, y, 0));
      const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
      transform.setContentSize(92, 42);
      return node;
    }
    return this.makeNodeInParent(name, x, y, 92, 42, this.buffListNode ?? this.node);
  }

  private ensurePrefabNode(name: string, prefab: Prefab | null, x: number, y: number, width: number, height: number): Node {
    if (!prefab) return this.makeNode(name, x, y, width, height);
    const existing = this.node.getChildByName(name);
    if (existing) return existing;
    const node = instantiate(prefab);
    node.name = name;
    this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    return this.makeNodeInParent(name, x, y, width, height, this.node);
  }

  private makeNodeInParent(name: string, x: number, y: number, width: number, height: number, parent: Node): Node {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
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

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }
}
