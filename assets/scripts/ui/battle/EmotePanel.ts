import { _decorator, Button, Color, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { ServerActions } from '../../core/ServerActions';
import { EMOTE_DEFS, EmoteHelper } from '../../helpers/EmoteHelper';
import type { EmoteId, PlayerEmoteEvent } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('EmotePanel')
export class EmotePanel extends Component {
  @property({ type: Label })
  hintLabel: Label | null = null;

  @property({ type: Node })
  bubbleLayer: Node | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private helper = new EmoteHelper();
  private readonly handlePlayerEmoteBound = (event: PlayerEmoteEvent) => this.handlePlayerEmote(event);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.networkManager?.on<PlayerEmoteEvent>('playerEmote', this.handlePlayerEmoteBound);
  }

  onDestroy(): void {
    this.gameManager?.networkManager?.off<PlayerEmoteEvent>('playerEmote', this.handlePlayerEmoteBound);
  }

  update(): void {
    this.helper.tick();
    this.renderBubbles();
    if (this.hintLabel) {
      this.hintLabel.string = this.helper.canSend ? '' : 'Emote cooldown';
    }
  }

  private sendEmote(emoteId: EmoteId): void {
    if (!this.helper.trySend()) return;
    this.serverActions.sendEmote(emoteId);
  }

  private handlePlayerEmote(event: PlayerEmoteEvent): void {
    this.helper.addIncoming(event.playerId, event.emoteId);
    this.renderBubbles();
  }

  private renderBubbles(): void {
    if (!this.bubbleLayer) return;
    for (const child of [...this.bubbleLayer.children]) child.destroy();

    const room = this.gameManager?.getRoom();
    for (const active of this.helper.active) {
      const index = room?.players.findIndex((player) => player.id === active.playerId || player.controllerId === active.playerId) ?? -1;
      const node = this.ensureBubbleNode(`Bubble_${active.key}`, index >= 0 ? -260 + index * 175 : 0, 0);
      const label = node.getComponent(Label) ?? node.addComponent(Label);
      label.string = active.emoji;
      label.fontSize = 24;
      label.lineHeight = 30;
      label.color = new Color(255, 238, 196, 255);
    }
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(680, 96);
    }

    EMOTE_DEFS.forEach((def, index) => {
      const button = this.ensureButton(`Emote_${def.id}`, `${def.emoji}\n${def.label}`, -275 + index * 110, -10, 96, 58, 15);
      button.node.on(Button.EventType.CLICK, () => this.sendEmote(def.id), this);
    });
    this.hintLabel ??= this.ensureLabel('HintLabel', 0, -48, 640, 22, 13);
    this.bubbleLayer ??= this.ensureNode('BubbleLayer', 0, 40, 680, 36);
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureBubbleNode(name: string, x: number, y: number): Node {
    const parent = this.bubbleLayer ?? this.node;
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.addComponent(UITransform);
    transform.setContentSize(90, 32);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.ensureNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return label;
  }

  private ensureButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.ensureNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const labelNode = node.getChildByName('Label') ?? new Node('Label');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const transform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return button;
  }
}
