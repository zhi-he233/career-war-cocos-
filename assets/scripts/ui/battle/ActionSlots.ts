import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3 } from 'cc';
import { canResolveDecision } from '../../helpers/BattlePlayerHelpers';
import type { RollActionType, RollDecisionAvailableAction, Room } from '../../shared/types';

const { ccclass, property } = _decorator;

/**
 * ActionSlots — displays action buttons after a dice roll.
 *
 * Does NOT send protocol directly. Calls onConfirm(actionType, selfDamageAmount)
 * so the owning scene (BattleScene) can apply locks, emit, and handle errors.
 */
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

  @property({ type: Label })
  selfDamageLabel: Label | null = null;

  @property
  selfDestructAmount = 1;

  @property({ type: Button })
  selfDamageUpButton: Button | null = null;

  @property({ type: Button })
  selfDamageDownButton: Button | null = null;

  @property({ type: Label })
  selfDamageAmountLabel: Label | null = null;

  @property({ type: SpriteFrame })
  attackFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  skillFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  summonerFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  disabledFrame: SpriteFrame | null = null;

  /** Called when the user confirms an action. BattleScene MUST set this. */
  onConfirm: ((actionType: RollActionType, selfDamageAmount: number) => void) | null = null;

  private room: Room | null = null;
  private resolveClientId = '';

  onLoad(): void {
    this.ensureMinimalUi();
    this.attackButton?.node.on(Button.EventType.CLICK, () => this.confirm('normal_attack'), this);
    this.characterSkillButton?.node.on(Button.EventType.CLICK, () => this.confirm('character_skill'), this);
    this.summonerSkillButton?.node.on(Button.EventType.CLICK, () => this.confirm('summoner_skill'), this);
    this.selfDamageUpButton?.node.on(Button.EventType.CLICK, () => this.adjustSelfDamage(1), this);
    this.selfDamageDownButton?.node.on(Button.EventType.CLICK, () => this.adjustSelfDamage(-1), this);
  }

  onDestroy(): void {
    this.attackButton?.node.off(Button.EventType.CLICK);
    this.characterSkillButton?.node.off(Button.EventType.CLICK);
    this.summonerSkillButton?.node.off(Button.EventType.CLICK);
    this.selfDamageUpButton?.node.off(Button.EventType.CLICK);
    this.selfDamageDownButton?.node.off(Button.EventType.CLICK);
    this.onConfirm = null;
  }

  /** Called by BattleScene to push room state and client ID. */
  render(room: Room, clientId: string): void {
    this.room = room;
    this.resolveClientId = clientId;

    const actions = this.getActions(room);
    const canAct = canResolveDecision(room, clientId);
    this.updateButton(this.attackButton, actions, 'normal_attack', canAct);
    this.updateButton(this.characterSkillButton, actions, 'character_skill', canAct);
    this.updateButton(this.summonerSkillButton, actions, 'summoner_skill', canAct);

    if (this.hintLabel) {
      this.hintLabel.string = room.pendingRollDecision ? `Roll ${room.pendingRollDecision.currentRoll}: choose action` : 'Roll first';
    }

    // Self-destruct amount selector
    const risky = actions.find(a => a.requiresSelfDamageAmount);
    const showSelfDamage = !!risky;
    if (showSelfDamage) {
      const actorId = room.pendingRollDecision?.actorId;
      const actor = actorId ? room.players.find(p => p.id === actorId) : null;
      const maxAmount = Math.min(9, actor?.hp ?? 9);
      this.selfDestructAmount = Math.max(1, Math.min(this.selfDestructAmount, maxAmount));
    }
    if (this.selfDamageLabel) {
      this.selfDamageLabel.string = showSelfDamage
        ? `Self destruct: lose ${this.selfDestructAmount} HP, deal ${this.selfDestructAmount * 2} damage`
        : '';
    }
    if (this.selfDamageUpButton) this.selfDamageUpButton.node.active = showSelfDamage;
    if (this.selfDamageDownButton) this.selfDamageDownButton.node.active = showSelfDamage;
    if (this.selfDamageAmountLabel) {
      this.selfDamageAmountLabel.string = showSelfDamage ? String(this.selfDestructAmount) : '';
      this.selfDamageAmountLabel.node.active = showSelfDamage;
    }
  }

  private getActions(room: Room): RollDecisionAvailableAction[] {
    const decision = room.pendingRollDecision;
    if (!decision) return [];
    if (decision.availableActions?.length) return decision.availableActions;
    return [{ id: 'normal_attack', label: 'Attack', enabled: true } as RollDecisionAvailableAction];
  }

  private updateButton(button: Button | null, actions: RollDecisionAvailableAction[], id: RollActionType, canAct: boolean): void {
    if (!button) return;
    const action = actions.find(item => item.id === id);
    button.node.active = Boolean(action);
    const enabled = action?.enabled === true && canAct;
    button.interactable = enabled;
    this.applyButtonFrame(button, this.frameForAction(id, enabled));

    const opacity = button.node.getComponent(UIOpacity) ?? button.node.addComponent(UIOpacity);
    opacity.opacity = enabled ? 255 : 145;

    const label = button.node.getChildByName('Label')?.getComponent(Label);
    if (label && action) {
      const reason = action.enabled ? '' : action.reason ? `\n${action.reason}` : '\nUnavailable';
      label.string = `${action.label || action.id}${reason}`;
      label.color = enabled ? new Color(57, 34, 17, 255) : new Color(100, 88, 72, 255);
    }
  }

  private confirm(actionType: RollActionType): void {
    if (!this.room || !this.onConfirm) return;
    const decision = this.room.pendingRollDecision;
    if (!decision || !canResolveDecision(this.room, this.resolveClientId)) return;

    const action = this.getActions(this.room).find(item => item.id === actionType);
    if (action?.enabled === false) return;

    this.onConfirm(actionType, this.selfDestructAmount);
  }

  private adjustSelfDamage(delta: number): void {
    const actorId = this.room?.pendingRollDecision?.actorId;
    const actor = actorId ? this.room?.players.find(p => p.id === actorId) : null;
    const maxAmount = Math.min(9, actor?.hp ?? 9);
    this.selfDestructAmount = Math.max(1, Math.min(maxAmount, this.selfDestructAmount + delta));
    if (this.selfDamageAmountLabel) this.selfDamageAmountLabel.string = String(this.selfDestructAmount);
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(680, 130);
    }

    this.hintLabel ??= this.ensureLabel('HintLabel', 0, 52, 660, 30, 17);
    this.attackButton ??= this.ensureButton('AttackButton', 'Attack', -225, -15, 200, 58, 18);
    this.characterSkillButton ??= this.ensureButton('CharacterSkillButton', 'Skill', 0, -15, 200, 58, 18);
    this.summonerSkillButton ??= this.ensureButton('SummonerSkillButton', 'Summoner', 225, -15, 200, 58, 18);
    this.selfDamageLabel ??= this.ensureLabel('SelfDamageLabel', 0, -52, 560, 24, 14);
    this.selfDamageDownButton ??= this.ensureButton('SelfDamageDown', '-', 110, -78, 42, 32, 16);
    this.selfDamageDownButton.node.active = false;
    this.selfDamageAmountLabel ??= this.ensureLabel('SelfDamageAmount', 160, -78, 38, 32, 18);
    this.selfDamageAmountLabel.node.active = false;
    this.selfDamageUpButton ??= this.ensureButton('SelfDamageUp', '+', 210, -78, 42, 32, 16);
    this.selfDamageUpButton.node.active = false;
  }

  private frameForAction(id: RollActionType, enabled: boolean): SpriteFrame | null {
    if (!enabled && this.disabledFrame) return this.disabledFrame;
    if (id === 'normal_attack') return this.attackFrame ?? this.skillFrame ?? this.summonerFrame;
    if (id === 'character_skill') return this.skillFrame ?? this.attackFrame ?? this.summonerFrame;
    if (id === 'summoner_skill') return this.summonerFrame ?? this.skillFrame ?? this.attackFrame;
    return this.skillFrame ?? this.attackFrame ?? this.summonerFrame;
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
    label.color = new Color(255, 238, 196, 255);
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
