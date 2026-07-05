import { _decorator, Button, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, instantiate } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { titleFromId } from '../core/DisplayText';
import { EventChoiceCard } from '../ui/roguelite/EventChoiceCard';
import { RewardCard } from '../ui/roguelite/RewardCard';
import type { RewardCardState } from '../ui/roguelite/RewardCard';
import { RogueliteEventHeader } from '../ui/roguelite/RogueliteEventHeader';
import { RogueliteMapNode } from '../ui/roguelite/RogueliteMapNode';
import type { RogueliteMapNodeStatus } from '../ui/roguelite/RogueliteMapNode';
import { RogueliteStatusPanel } from '../ui/roguelite/RogueliteStatusPanel';
import { ShopItemCard } from '../ui/roguelite/ShopItemCard';
import { ShopControlBar } from '../ui/roguelite/ShopControlBar';
import { ToastLayer } from '../ui/system/ToastLayer';
import { getRogueliteConnectedNodeIds, getRogueliteMapNodeId, createRogueliteMapLayer } from '../shared/data/rogueliteMapRules';
import { getRogueliteShopItemsForStage, ROGUELITE_SHOP_RULES } from '../shared/data/rogueliteShop';
import type { RogueliteShopItemDraft } from '../shared/data/rogueliteShop';
import { ROGUELITE_REST_SITE_ACTIONS } from '../shared/data/rogueliteRestSites';
import type { RogueliteMapNodeSelection } from '../shared/data/rogueliteRoomTypes';
import type { RogueliteEventChoice, Room } from '../shared/types';

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

  @property({ type: SpriteFrame })
  parchmentFrame: SpriteFrame | null = null;

  @property({ type: [SpriteFrame] })
  rewardCardFrames: SpriteFrame[] = [];

  @property({ type: SpriteFrame })
  actionCardFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  statusFrame: SpriteFrame | null = null;

  @property({ type: Prefab })
  rewardCardPrefab: Prefab | null = null;

  @property({ type: Prefab })
  mapNodePrefab: Prefab | null = null;

  @property({ type: Prefab })
  rogueliteStatusPanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  toastLayerPrefab: Prefab | null = null;

  @property({ type: Prefab })
  eventChoiceCardPrefab: Prefab | null = null;

  @property({ type: Prefab })
  shopItemCardPrefab: Prefab | null = null;

  @property({ type: Prefab })
  rogueliteEventHeaderPrefab: Prefab | null = null;

  @property({ type: Prefab })
  shopControlBarPrefab: Prefab | null = null;

  @property({ type: Prefab })
  buffIconPrefab: Prefab | null = null;

  @property({ type: Prefab })
  currencyBarPrefab: Prefab | null = null;

  @property({ type: RogueliteStatusPanel })
  rogueliteStatusPanel: RogueliteStatusPanel | null = null;

  @property({ type: ToastLayer })
  toastLayer: ToastLayer | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private room: Room | null = null;
  private statusText = '';
  private pendingRewardId = '';
  private pendingRouteNodeId = '';
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
    this.syncPendingReward(room);
    this.syncPendingRoute(room);
    const run = room.roguelite;
    this.rogueliteStatusPanel?.render(room);

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
        const selected = this.pendingRewardId === reward.id;
        const state: RewardCardState = selected ? 'selected' : this.pendingRewardId ? 'disabled' : 'available';
        if (this.rewardCardPrefab) {
          const node = this.createRewardCard(
            this.rewardCardPrefab,
            reward.id,
            `Reward_${reward.id}`,
            0,
            125 - index * 96,
            titleFromId(reward.type),
            titleFromId(reward.id),
            reward.description ?? '',
            index,
            state
          );
          const button = node.getComponent(Button);
          if (button) button.interactable = !this.pendingRewardId;
          button?.node.on(Button.EventType.CLICK, () => this.chooseReward(reward.id), this);
          return;
        }
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
        button.interactable = !this.pendingRewardId;
        this.applyRewardButtonState(button, state);
        button.node.on(Button.EventType.CLICK, () => this.chooseReward(reward.id), this);
      });
      return;
    }

    if (room.phase === 'roguelite_event') {
      const event = run.pendingEvent;
      if (!event) {
        this.createText('Waiting for event data...', 0, 0);
        return;
      }

      if (this.rogueliteEventHeaderPrefab) {
        this.createEventHeader(this.rogueliteEventHeaderPrefab, event);
      } else {
        this.createText(`Event: ${titleFromId(event.id)}\n${event.description}`, 0, 138);
      }
      event.choices.forEach((choice, index) => {
        if (this.eventChoiceCardPrefab) {
          const node = this.createEventChoiceCard(this.eventChoiceCardPrefab, `EventChoice_${choice.id}`, 0, 30 - index * 118, choice, index);
          node.getComponent(Button)?.node.on(Button.EventType.CLICK, () => this.serverActions.chooseRogueliteEventOption(choice.id), this);
          return;
        }
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
      if (this.shopControlBarPrefab) {
        this.createShopControlBar(this.shopControlBarPrefab, run.runGold ?? 0);
      }
      items.forEach((item, index) => {
        if (this.shopItemCardPrefab) {
          const canBuy = (run.runGold ?? 0) >= item.price && !(run.shopPurchasedIds ?? []).includes(item.id);
          const node = this.createShopItemCard(this.shopItemCardPrefab, `Shop_${item.id}`, 0, 70 - index * 104, item, canBuy);
          node.getComponent(Button)?.node.on(Button.EventType.CLICK, () => {
            if (!canBuy) {
              this.gameManager?.showToast('Not enough gold or already bought.', 1.4);
              return;
            }
            this.serverActions.buyRogueliteShopItem(item.id);
          }, this);
          return;
        }
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
      leave.node.active = !this.shopControlBarPrefab;
      leave.node.on(Button.EventType.CLICK, () => this.serverActions.leaveRogueliteRoom(), this);
      return;
    }

    if (room.phase === 'roguelite_rest') {
      ROGUELITE_REST_SITE_ACTIONS.slice(0, 5).forEach((action, index) => {
        if (this.rewardCardPrefab) {
          const node = this.createRewardCard(
            this.rewardCardPrefab,
            action.id,
            `Rest_${action.id}`,
            0,
            130 - index * 88,
            titleFromId(action.id),
            '',
            action.effect ?? '',
            0
          );
          node.getComponent(Button)?.node.on(Button.EventType.CLICK, () => this.serverActions.useRogueliteRestAction(action.id), this);
          return;
        }
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
      if (this.mapNodePrefab) {
        this.createRouteMap(this.mapNodePrefab, room, nodes);
      } else {
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
          button.interactable = !this.pendingRouteNodeId;
          button.node.on(Button.EventType.CLICK, () => this.continueRoguelite(mapNode), this);
        });
      }
      const finish = this.createButton('FinishRun', 'Finish Run', 0, -170, 260, 54, 20, this.actionListNode);
      finish.interactable = !this.pendingRouteNodeId;
      finish.node.on(Button.EventType.CLICK, () => this.serverActions.chooseRogueliteContinue('finish'), this);
      return;
    }

    this.createText(`No actions for phase: ${room.phase}`, 0, 0);
  }

  private continueRoguelite(mapNode: RogueliteMapNodeSelection): void {
    if (this.pendingRouteNodeId) return;
    this.pendingRouteNodeId = mapNode.id;
    this.gameManager?.showToast('Route selected. Waiting for server...', 1.4);
    if (this.room) this.render(this.room);

    this.serverActions.chooseRogueliteContinue('continue', mapNode, (response) => {
      if (this.isAckFailure(response)) {
        this.pendingRouteNodeId = '';
        if (this.room) this.render(this.room);
      }
    });

    this.scheduleOnce(() => {
      if (this.pendingRouteNodeId === mapNode.id && this.room?.phase === 'roguelite_continue') {
        this.pendingRouteNodeId = '';
        this.gameManager?.showToast('No server response. You can try again.', 1.6);
        this.render(this.room);
      }
    }, 6);
  }

  private renderStatus(status: string): void {
    this.statusText = status;
    if (this.room) this.render(this.room);
  }

  private chooseReward(rewardId: string): void {
    if (this.pendingRewardId) return;
    this.pendingRewardId = rewardId;
    this.gameManager?.showToast('Reward selected. Waiting for server...', 1.4);
    if (this.room) this.render(this.room);

    this.serverActions.chooseRogueliteReward(rewardId, (response) => {
      if (this.isAckFailure(response)) {
        this.pendingRewardId = '';
        if (this.room) this.render(this.room);
      }
    });

    this.scheduleOnce(() => {
      if (this.pendingRewardId === rewardId && this.room?.phase === 'reward') {
        this.pendingRewardId = '';
        this.gameManager?.showToast('No server response. You can try again.', 1.6);
        this.render(this.room);
      }
    }, 6);
  }

  private syncPendingReward(room: Room): void {
    if (!this.pendingRewardId) return;
    const rewardChoices = room.roguelite?.rewardChoices ?? [];
    const stillChoosingReward = room.phase === 'reward' && rewardChoices.some((reward) => reward.id === this.pendingRewardId);
    if (!stillChoosingReward) this.pendingRewardId = '';
  }

  private syncPendingRoute(room: Room): void {
    if (!this.pendingRouteNodeId) return;
    const stillChoosingRoute = room.phase === 'roguelite_continue' && this.getNextRouteNodes(room).some((node) => node.id === this.pendingRouteNodeId);
    if (!stillChoosingRoute) this.pendingRouteNodeId = '';
  }

  private isAckFailure(response: unknown): boolean {
    return !!response && typeof response === 'object' && (response as { ok?: unknown }).ok === false;
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

  private createRouteMap(prefab: Prefab, room: Room, availableNodes: RogueliteMapNodeSelection[]): void {
    const run = room.roguelite;
    const nextStage = Math.max(1, run?.stage ?? 1);
    this.createText('Route', 0, 198);

    const previousStage = nextStage - 1;
    const previousId = previousStage > 0 ? run?.mapRoute?.[previousStage] ?? run?.currentMapNode?.id : '';
    if (previousId) {
      const previousNode = this.findMapNodeSelection(previousStage, previousId, run?.currentMapNode);
      if (previousNode) {
        const node = this.createMapNode(
          prefab,
          `Cleared_${previousNode.id}`,
          this.mapNodeX(previousNode, 0, 1),
          126,
          previousNode.id,
          `Stage ${previousNode.stage}`,
          previousNode.type,
          'cleared'
        );
        const button = node.getComponent(Button);
        if (button) button.interactable = false;
      }
    }

    availableNodes.forEach((mapNode, index) => {
      const selected = this.pendingRouteNodeId === mapNode.id;
      const status: RogueliteMapNodeStatus = selected ? 'current' : this.pendingRouteNodeId ? 'locked' : 'available';
      const node = this.createMapNode(
        prefab,
        `Route_${mapNode.id}`,
        this.mapNodeX(mapNode, index, availableNodes.length),
        18,
        mapNode.id,
        `Stage ${mapNode.stage}`,
        mapNode.type,
        status
      );
      const button = node.getComponent(Button);
      if (button) button.interactable = !this.pendingRouteNodeId;
      button?.node.on(Button.EventType.CLICK, () => this.continueRoguelite(mapNode), this);
    });

    const previewLayer = createRogueliteMapLayer(nextStage + 1).slice(0, 4);
    previewLayer.forEach((mapNode, index) => {
      const node = this.createMapNode(
        prefab,
        `Preview_${mapNode.id}`,
        this.mapNodeX(mapNode, index, previewLayer.length),
        -92,
        mapNode.id,
        `Stage ${mapNode.stage}`,
        mapNode.type,
        'preview'
      );
      const button = node.getComponent(Button);
      if (button) button.interactable = false;
    });
  }

  private findMapNodeSelection(stage: number, id: string, fallback?: RogueliteMapNodeSelection): RogueliteMapNodeSelection | null {
    if (fallback?.id === id) return fallback;
    const draft = createRogueliteMapLayer(stage).find((node) => node.id === id);
    return draft ? this.toSelection(draft) : null;
  }

  private mapNodeX(node: { id: string; stage: number }, index: number, total: number): number {
    const draft = createRogueliteMapLayer(node.stage).find((item) => item.id === node.id);
    if (draft) return Math.round((draft.x - 50) * 5.1);
    if (total <= 1) return 0;
    return Math.round(-220 + index * (440 / Math.max(1, total - 1)));
  }

  private createText(text: string, x: number, y: number): Label {
    const label = this.ensureLabel(`Text_${this.actionListNode?.children.length ?? 0}`, x, y, 620, 52, 18, this.actionListNode ?? this.node);
    label.string = text;
    return label;
  }

  private createRewardCard(
    prefab: Prefab,
    id: string,
    name: string,
    x: number,
    y: number,
    title: string,
    subtitle: string,
    description: string,
    rarityIndex: number,
    state: RewardCardState = 'available'
  ): Node {
    const node = this.instantiatePrefab(prefab, name, x, y, 620, 86, this.actionListNode ?? this.node);
    const card = node.getComponent(RewardCard) ?? node.addComponent(RewardCard);
    card.render(id, title, subtitle, description, rarityIndex, state === 'selected', state);
    return node;
  }

  private createEventHeader(prefab: Prefab, event: NonNullable<Room['roguelite']>['pendingEvent']): Node {
    if (!event) return this.ensureNode('EmptyEventHeader', 0, 130, 620, 52, this.actionListNode ?? this.node);
    const node = this.instantiatePrefab(prefab, 'RogueliteEventHeader', 0, 146, 620, 118, this.actionListNode ?? this.node);
    const header = node.getComponent(RogueliteEventHeader) ?? node.addComponent(RogueliteEventHeader);
    header.panelFrame = this.statusFrame ?? this.actionCardFrame;
    header.render(event);
    return node;
  }

  private createShopControlBar(prefab: Prefab, gold: number): Node {
    const node = this.instantiatePrefab(prefab, 'ShopControlBar', 0, 174, 620, 74, this.actionListNode ?? this.node);
    const bar = node.getComponent(ShopControlBar) ?? node.addComponent(ShopControlBar);
    bar.panelFrame = this.statusFrame ?? this.actionCardFrame;
    bar.buttonFrame = this.actionCardFrame ?? this.statusFrame;
    bar.setHandlers(
      () => this.gameManager?.showToast('Shop refresh is not connected to the server yet.', 1.8),
      () => this.serverActions.leaveRogueliteRoom()
    );
    bar.render({
      gold,
      refreshPrice: ROGUELITE_SHOP_RULES.refreshPrice,
      canRefresh: ROGUELITE_SHOP_RULES.canRefresh && gold >= ROGUELITE_SHOP_RULES.refreshPrice,
      serverRefreshAvailable: false,
    });
    return node;
  }

  private createEventChoiceCard(prefab: Prefab, name: string, x: number, y: number, choice: RogueliteEventChoice, index: number): Node {
    const node = this.instantiatePrefab(prefab, name, x, y, 620, 104, this.actionListNode ?? this.node);
    const card = node.getComponent(EventChoiceCard) ?? node.addComponent(EventChoiceCard);
    card.cardFrame = this.rewardCardFrames[index + 1] ?? this.actionCardFrame;
    card.render(choice, index);
    return node;
  }

  private createShopItemCard(prefab: Prefab, name: string, x: number, y: number, item: RogueliteShopItemDraft, canBuy: boolean): Node {
    const node = this.instantiatePrefab(prefab, name, x, y, 620, 96, this.actionListNode ?? this.node);
    const card = node.getComponent(ShopItemCard) ?? node.addComponent(ShopItemCard);
    card.cardFrame = this.rewardCardFrames[2] ?? this.actionCardFrame;
    card.render(item, canBuy);
    return node;
  }

  private createMapNode(prefab: Prefab, name: string, x: number, y: number, id: string, title: string, type: string, status: RogueliteMapNodeStatus): Node {
    const node = this.instantiatePrefab(prefab, name, x, y, 170, 92, this.actionListNode ?? this.node);
    const mapNode = node.getComponent(RogueliteMapNode) ?? node.addComponent(RogueliteMapNode);
    mapNode.render(id, title, type, status);
    return node;
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('RogueliteParchmentPanel', 0, 70, 675, 770, this.parchmentFrame);
    const statusNode = this.ensurePrefabNode('RogueliteStatusPanel', this.rogueliteStatusPanelPrefab, 0, 500, 640, 112, this.node);
    this.rogueliteStatusPanel ??= statusNode.getComponent(RogueliteStatusPanel) ?? statusNode.addComponent(RogueliteStatusPanel);
    this.rogueliteStatusPanel.panelFrame = this.statusFrame;
    this.rogueliteStatusPanel.buffIconPrefab = this.buffIconPrefab;
    this.rogueliteStatusPanel.currencyBarPrefab = this.currencyBarPrefab;

    this.phaseLabel ??= this.ensureLabel('PhaseLabel', 0, 545, 680, 66, 20, this.node);
    this.summaryLabel ??= this.ensureLabel('SummaryLabel', 0, 480, 620, 78, 16, this.node);
    this.actionListNode ??= this.ensureNode('ActionList', 0, 110, 640, 460, this.node);
    this.logLabel ??= this.ensureLabel('RogueliteLogLabel', 0, -455, 650, 160, 15, this.node);

    const toastNode = this.ensurePrefabNode('ToastLayer', this.toastLayerPrefab, 0, -555, 560, 56, this.node);
    this.toastLayer ??= toastNode.getComponent(ToastLayer) ?? toastNode.addComponent(ToastLayer);
    this.toastLayer.panelFrame = this.statusFrame ?? this.actionCardFrame;
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
    label.color = new Color(255, 238, 196, 255);
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
    this.applyButtonFrame(button, this.frameForButton(name));

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
    label.color = new Color(57, 34, 17, 255);
    return button;
  }

  private ensureSpriteNode(name: string, x: number, y: number, width: number, height: number, frame: SpriteFrame | null): Node {
    const node = this.ensureNode(name, x, y, width, height, this.node);
    if (frame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = frame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    node.setSiblingIndex(1);
    return node;
  }

  private ensurePrefabNode(name: string, prefab: Prefab | null, x: number, y: number, width: number, height: number, parent: Node): Node {
    if (!prefab) return this.ensureNode(name, x, y, width, height, parent);

    const existing = parent.getChildByName(name);
    if (existing) existing.destroy();

    const node = instantiate(prefab);
    node.name = name;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private instantiatePrefab(prefab: Prefab, name: string, x: number, y: number, width: number, height: number, parent: Node): Node {
    const node = instantiate(prefab);
    node.name = name;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private frameForButton(name: string): SpriteFrame | null {
    if (name.startsWith('Reward_')) return this.rewardCardFrames[0] ?? this.actionCardFrame;
    if (name.startsWith('EventChoice_')) return this.rewardCardFrames[1] ?? this.actionCardFrame;
    if (name.startsWith('Shop_')) return this.rewardCardFrames[2] ?? this.actionCardFrame;
    if (name.startsWith('Rest_')) return this.rewardCardFrames[0] ?? this.actionCardFrame;
    if (name === 'FinishRun' || name === 'LeaveShop') return this.statusFrame ?? this.actionCardFrame;
    return this.actionCardFrame ?? this.statusFrame;
  }

  private applyButtonFrame(button: Button, frame: SpriteFrame | null): void {
    if (!frame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = frame;
    button.hoverSprite = frame;
    button.pressedSprite = frame;
    button.disabledSprite = frame;
    button.target = button.node;
  }

  private applyRewardButtonState(button: Button, state: RewardCardState): void {
    const sprite = button.node.getComponent(Sprite);
    if (!sprite) return;
    if (state === 'selected') sprite.color = new Color(255, 226, 140, 255);
    else if (state === 'disabled') sprite.color = new Color(142, 135, 122, 255);
    else if (state === 'taken') sprite.color = new Color(186, 232, 168, 255);
    else sprite.color = new Color(255, 255, 255, 255);
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }
}
