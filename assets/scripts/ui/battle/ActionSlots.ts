import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3 } from 'cc';
import { GameManager } from '../../core/GameManager';
import { ServerActions } from '../../core/ServerActions';
import { canResolveDecision } from '../../helpers/BattlePlayerHelpers';
import type { RollActionType, RollDecisionAvailableAction, RollDecisionChoice, Room, SummonerSkillId } from '../../shared/types';

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

  @property({ type: Label })
  selfDamageLabel: Label | null = null;

  @property({ type: SpriteFrame })
  attackFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  skillFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  summonerFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  disabledFrame: SpriteFrame | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private room: Room | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
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

  render(room: Room): void {
    this.room = room;
    const actions = this.getActions(room);
    const canAct = canResolveDecision(room, this.gameManager?.localClientId ?? '');
    this.updateButton(this.attackButton, actions, 'normal_attack', canAct);
    this.updateButton(this.characterSkillButton, actions, 'character_skill', canAct);
    this.updateButton(this.summonerSkillButton, actions, 'summoner_skill', canAct);

    if (this.hintLabel) {
      this.hintLabel.string = room.pendingRollDecision ? `Roll ${room.pendingRollDecision.currentRoll}: choose action` : 'Roll first';
    }
    if (this.selfDamageLabel) {
      const risky = actions.find((action) => action.requiresSelfDamageAmount);
      this.selfDamageLabel.string = risky ? 'Self damage required: choose amount later' : '';
    }
  }

  private getActions(room: Room): RollDecisionAvailableAction[] {
    const decision = room.pendingRollDecision;
    if (!decision) return [];
    if (decision.availableActions?.length) return decision.availableActions;
    return [{
      id: 'normal_attack',
      label: 'Attack',
      enabled: true,
    } as RollDecisionAvailableAction];
  }

  private updateButton(button: Button | null, actions: RollDecisionAvailableAction[], id: RollActionType, canAct: boolean): void {
    if (!button) return;
    const action = actions.find((item) => item.id === id);
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
    const decision = this.room?.pendingRollDecision;
    if (!this.room || !decision || !canResolveDecision(this.room, this.gameManager?.localClientId ?? '')) return;

    const action = this.getActions(this.room).find((item) => item.id === actionType);
    if (action?.enabled === false) return;

    this.serverActions.confirmRollDecision({
      roomId: this.room.id,
      pendingDecisionId: decision.id,
      decisionId: decision.id,
      actionType,
      choice: actionType as RollDecisionChoice,
      skillId: action?.skillId,
      summonerSkillId: actionType === 'summoner_skill' ? action?.skillId as SummonerSkillId : undefined,
      selfDamageAmount: action?.requiresSelfDamageAmount ? 1 : undefined,
    });
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
    this.selfDamageLabel ??= this.ensureLabel('SelfDamageLabel', 0, -62, 640, 24, 14);
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
