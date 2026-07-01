import { _decorator, Button, Component, Label } from 'cc';
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
    this.updateButton(this.attackButton, actions, 'normal_attack');
    this.updateButton(this.characterSkillButton, actions, 'character_skill');
    this.updateButton(this.summonerSkillButton, actions, 'summoner_skill');

    if (this.hintLabel) {
      this.hintLabel.string = room.pendingRollDecision ? `Roll ${room.pendingRollDecision.currentRoll}: choose action` : '';
    }
  }

  private updateButton(button: Button | null, actions: RollDecisionAvailableAction[], id: RollActionType): void {
    if (!button) return;
    const action = actions.find((item) => item.id === id);
    button.node.active = Boolean(action);
    button.interactable = action?.enabled === true;
  }

  private confirm(actionType: RollActionType): void {
    const decision = this.room?.pendingRollDecision;
    if (!this.room || !decision) return;

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
}
