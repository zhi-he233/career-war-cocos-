import { _decorator, Button, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { titleFromId } from '../core/DisplayText';
import { getRogueliteConnectedNodeIds, getRogueliteMapNodeId, createRogueliteMapLayer } from '../shared/data/rogueliteMapRules';
import { getRogueliteShopItemsForStage, ROGUELITE_SHOP_RULES } from '../shared/data/rogueliteShop';
import { ROGUELITE_REST_SITE_ACTIONS } from '../shared/data/rogueliteRestSites';
import type { RogueliteMapNodeSelection } from '../shared/data/rogueliteRoomTypes';
import type { Room } from '../shared/types';

const { ccclass, property } = _decorator;

@ccclass('RogueliteScene')
export class RogueliteScene extends Component {
  @property({ type: Label })
  phaseLabel: Label | null = null;

  @property({ type: Label })
  summaryLabel: Label | null = null;

  @property({ type: Node })
  actionListNode: Node | null = null;

  @property({ type: Label })
  logLabel: Label | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private room: Room | null = null;
  private statusText = '';
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);
    const room = this.gameManager.getRoom();
    this.statusText = this.gameManager.getStatus();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
  }

  private render(room: Room): void {
    this.room = room;
    const run = room.roguelite;

    if (this.phaseLabel) {
      this.phaseLabel.string = run
        ? `Roguelite | ${room.phase} | Stage ${run.stage}/${run.maxStage}\n${this.statusText}`
        : `Roguelite | ${room.phase}\n${this.statusText}`;
    }

    if (this.summaryLabel) {
      const rewards = run?.appliedRewards?.slice(-4).map((reward) => titleFromId(reward.type)).join(', ') || 'none';
      this.summaryLabel.string = `Gold ${run?.runGold ?? 0}\nRecent rewards: ${rewards}`;
    }

    if (this.logLabel) {
      this.logLabel.string = [...room.battleLog]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map((event) => event.message)
        .join('\n');
    }

    this.renderActions(room);
  }

  private renderActions(room: Room): void {
    if (!this.actionListNode) return;
    this.clearChildren(this.actionListNode);

    const run = room.roguelite;
    if (!run) {
      this.createText('No roguelite state yet.', 0, 0);
      return;
    }

    if (room.phase === 'reward') {
      const rewards = run.rewardChoices ?? [];
      if (rewards.length === 0) {
        this.createText('Waiting for reward choices...', 0, 0);
        return;
      }

      rewards.forEach((reward, index) => {
        const button = this.createButton(
          `Reward_${reward.id}`,
          `${titleFromId(reward.type)}\n${titleFromId(reward.id)}`,
          0,
          90 - index * 76,
          620,
          64,
          17,
          this.actionListNode!
        );
        button.node.on(Button.EventType.CLICK, () => this.serverActions.chooseRogueliteReward(reward.id), this);
      });
      return;
    }

    if (room.phase === 'roguelite_event') {
      const event = run.pendingEvent;
      if (!event) {
        this.createText('Waiting for event data...', 0, 0);
        return;
      }

      this.createText(`Event: ${titleFromId(event.id)}`, 0, 130);
      event.choices.forEach((choice, index) => {
        const button = this.createButton(
          `EventChoice_${choice.id}`,
          `Choice ${choice.id.toUpperCase()}\n${choice.cost || choice.effect || choice.label}`,
          0,
          45 - index * 84,
          620,
          70,
          17,
          this.actionListNode!
        );
        button.node.on(Button.EventType.CLICK, () => this.serverActions.chooseRogueliteEventOption(choice.id), this);
      });
      return;
    }

    if (room.phase === 'roguelite_shop') {
      const items = getRogueliteShopItemsForStage(run.stage).slice(0, ROGUELITE_SHOP_RULES.itemsPerVisit);
      items.forEach((item, index) => {
        const button = this.createButton(
          `Shop_${item.id}`,
          `${titleFromId(item.id)} | ${item.price}g`,
          0,
          120 - index * 64,
          620,
          52,
          16,
          this.actionListNode!
        );
        button.node.on(Button.EventType.CLICK, () => this.serverActions.buyRogueliteShopItem(item.id), this);
      });
      const leave = this.createButton('LeaveShop', 'Leave Shop', 0, -180, 260, 54, 20, this.actionListNode);
      leave.node.on(Button.EventType.CLICK, () => this.serverActions.leaveRogueliteRoom(), this);
      return;
    }

    if (room.phase === 'roguelite_rest') {
      ROGUELITE_REST_SITE_ACTIONS.slice(0, 5).forEach((action, index) => {
        const button = this.createButton(
          `Rest_${action.id}`,
          titleFromId(action.id),
          0,
          130 - index * 64,
          620,
          52,
          17,
          this.actionListNode!
        );
        button.node.on(Button.EventType.CLICK, () => this.serverActions.useRogueliteRestAction(action.id), this);
      });
      return;
    }

    if (room.phase === 'roguelite_continue') {
      const nodes = this.getNextRouteNodes(room);
      nodes.forEach((mapNode, index) => {
        const button = this.createButton(
          `Route_${mapNode.id}`,
          `Stage ${mapNode.stage} | ${titleFromId(mapNode.type)} | ${mapNode.id}`,
          0,
          105 - index * 68,
          620,
          56,
          17,
          this.actionListNode!
        );
        button.node.on(Button.EventType.CLICK, () => this.continueRoguelite(mapNode), this);
      });
      const finish = this.createButton('FinishRun', 'Finish Run', 0, -170, 260, 54, 20, this.actionListNode);
      finish.node.on(Button.EventType.CLICK, () => this.serverActions.chooseRogueliteContinue('finish'), this);
      return;
    }

    this.createText(`No actions for phase: ${room.phase}`, 0, 0);
  }

  private continueRoguelite(mapNode: RogueliteMapNodeSelection): void {
    this.serverActions.chooseRogueliteContinue('continue', mapNode);
  }

  private renderStatus(status: string): void {
    this.statusText = status;
    if (this.room) this.render(this.room);
  }

  private getNextRouteNodes(room: Room): RogueliteMapNodeSelection[] {
    const stage = Math.max(1, room.roguelite?.stage ?? 1);
    const layer = createRogueliteMapLayer(stage);
    if (stage <= 1) return [this.toSelection(layer[0] ?? { id: getRogueliteMapNodeId(1, 0), stage: 1, type: 'normal' })];

    const previousStage = stage - 1;
    const previousNodeId = room.roguelite?.mapRoute?.[previousStage] ?? getRogueliteMapNodeId(previousStage, 0);
    const previousNode = createRogueliteMapLayer(previousStage).find((node) => node.id === previousNodeId) ?? createRogueliteMapLayer(previousStage)[0];
    if (!previousNode) return layer.slice(0, 2).map((node) => this.toSelection(node));

    const connectedIds = getRogueliteConnectedNodeIds(previousNode, layer);
    return layer.filter((node) => connectedIds.has(node.id)).map((node) => this.toSelection(node));
  }

  private toSelection(node: { id: string; stage: number; type: RogueliteMapNodeSelection['type']; enemyTemplateId?: string; bossTemplateId?: string }): RogueliteMapNodeSelection {
    return {
      id: node.id,
      stage: node.stage,
      type: node.type,
      enemyTemplateId: node.enemyTemplateId,
      bossTemplateId: node.bossTemplateId,
    };
  }

  private createText(text: string, x: number, y: number): Label {
    const label = this.ensureLabel(`Text_${this.actionListNode?.children.length ?? 0}`, x, y, 620, 52, 18, this.actionListNode ?? this.node);
    label.string = text;
    return label;
  }

  private ensureMinimalUi(): void {
    this.phaseLabel ??= this.ensureLabel('PhaseLabel', 0, 545, 680, 66, 20, this.node);
    this.summaryLabel ??= this.ensureLabel('SummaryLabel', 0, 450, 680, 100, 18, this.node);
    this.actionListNode ??= this.ensureNode('ActionList', 0, 125, 680, 430, this.node);
    this.logLabel ??= this.ensureLabel('RogueliteLogLabel', 0, -350, 690, 350, 16, this.node);
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number, parent: Node): Node {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, parent: Node): Label {
    const node = this.ensureNode(name, x, y, width, height, parent);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    return label;
  }

  private createButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number, parent: Node): Button {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));

    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);

    const button = node.addComponent(Button);
    button.interactable = true;

    const labelNode = new Node('Label');
    node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(width, height);

    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    return button;
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }
}
