import { _decorator, Button, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import type { RollActionType, RollDecisionAvailableAction, RollDecisionChoice, Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('ActionSlots')
export class ActionSlots extends Component {
  @property({ type: Button })
  attackButton: Button | null = null;

  @property({ type: Button })
  characterSkillButton: Button | null = null;

  @property({ type: Button })
  summonerSkillButton: Button | null = null;

  @property({ type: Label })
  hintLabel: Label | null = null;

  private gameManager: GameManager | null = null;
  private room: Room | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.attackButton?.node.on(Button.EventType.CLICK, () => this.confirm('normal_attack'), this);
    this.characterSkillButton?.node.on(Button.EventType.CLICK, () => this.confirm('character_skill'), this);
    this.summonerSkillButton?.node.on(Button.EventType.CLICK, () => this.confirm('summoner_skill'), this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.attackButton?.node.off(Button.EventType.CLICK);
    this.characterSkillButton?.node.off(Button.EventType.CLICK);
    this.summonerSkillButton?.node.off(Button.EventType.CLICK);
  }

  private render(room: Room): void {
    this.room = room;
    const actions = room.pendingRollDecision?.availableActions ?? [];
    const canResolveDecision = this.canResolveDecision(room);
    this.updateButton(this.attackButton, actions, 'normal_attack', canResolveDecision);
    this.updateButton(this.characterSkillButton, actions, 'character_skill', canResolveDecision);
    this.updateButton(this.summonerSkillButton, actions, 'summoner_skill', canResolveDecision);

    if (this.hintLabel) {
      this.hintLabel.string = room.pendingRollDecision ? `Roll ${room.pendingRollDecision.currentRoll}: choose action` : '';
    }
  }

  private updateButton(button: Button | null, actions: RollDecisionAvailableAction[], id: RollActionType, canResolveDecision: boolean): void {
    if (!button) return;
    const action = actions.find((item) => item.id === id);
    button.node.active = Boolean(action);
    button.interactable = action?.enabled === true && canResolveDecision;
    const label = button.node.getChildByName('Label')?.getComponent(Label);
    if (label && action) {
      label.string = action.label || action.id;
    }
  }

  private confirm(actionType: RollActionType): void {
    const decision = this.room?.pendingRollDecision;
    if (!this.room || !decision || !this.canResolveDecision(this.room)) return;

    const action = decision.availableActions?.find((item) => item.id === actionType);
    const choice: RollDecisionChoice = actionType;
    this.gameManager?.emitAck('confirmRollDecision', {
      roomId: this.room.id,
      pendingDecisionId: decision.id,
      decisionId: decision.id,
      actionType,
      choice,
      skillId: action?.skillId,
      summonerSkillId: actionType === 'summoner_skill' ? action?.skillId : undefined,
      selfDamageAmount: action?.requiresSelfDamageAmount ? 1 : undefined,
    });
  }

  private canResolveDecision(room: Room): boolean {
    const actorId = room.pendingRollDecision?.actorId;
    const actor = actorId ? room.players.find((player) => player.id === actorId) : null;
    const localClientId = this.gameManager?.localClientId;
    if (!actor || actor.isDead || actor.isBot || !localClientId) return false;
    return actor.clientId === localClientId || actor.controllerId === localClientId;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(680, 110);
    }

    this.hintLabel ??= this.ensureLabel('HintLabel', 0, 42, 660, 30, 17);
    this.attackButton ??= this.ensureButton('AttackButton', 'Attack', -225, -20, 200, 54, 18);
    this.characterSkillButton ??= this.ensureButton('CharacterSkillButton', 'Skill', 0, -20, 200, 54, 18);
    this.summonerSkillButton ??= this.ensureButton('SummonerSkillButton', 'Summoner', 225, -20, 200, 54, 18);
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

  private ensureButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.ensureNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const label = this.ensureChildLabel(node, 'Label', width, height, fontSize);
    label.string = text;
    return button;
  }

  private ensureChildLabel(parent: Node, name: string, width: number, height: number, fontSize: number): Label {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(Vec3.ZERO);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    return label;
  }
}
