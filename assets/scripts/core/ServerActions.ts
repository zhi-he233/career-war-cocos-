import type { CharacterId, GameMode, RollActionType, RollDecisionChoice, RoomSettings, SummonerSkillId } from '../shared/types';
import { GameManager } from './GameManager';

export class ServerActions {
  constructor(private readonly gameManager: GameManager) {}

  createRoom(payload: { nickname: string; clientId: string; gameMode: GameMode }, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('createRoom', payload, callback);
  }

  joinRoom(payload: { nickname: string; roomId: string; clientId: string; playerId?: string; gameMode?: GameMode }, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('joinRoom', payload, callback);
  }

  resumeRoom(payload: { roomId: string; clientId: string; playerId?: string }, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('resumeRoom', payload, callback);
  }

  leaveRoom(callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('leaveRoom', {}, callback);
  }

  requestRoomList(callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('requestRoomList', {}, callback);
  }

  chooseCharacter(characterId: CharacterId): void {
    this.gameManager.emitAck('chooseCharacter', { characterId });
  }

  chooseSummonerSkill(summonerSkillId: SummonerSkillId): void {
    this.gameManager.emitAck('chooseSummonerSkill', { summonerSkillId });
  }

  updateRoomSettings(settings: Partial<RoomSettings>): void {
    this.gameManager.emitAck('updateRoomSettings', settings);
  }

  startGame(): void {
    this.gameManager.emitAck('startGame', {});
  }

  selectTarget(targetId: string, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('selectTarget', { targetId }, callback);
  }

  selectActor(actorId: string): void {
    this.gameManager.emitAck('selectActor', { actorId });
  }

  rollDice(): void {
    this.gameManager.emitAck('rollDice', {});
  }

  confirmRollDecision(payload: {
    roomId: string;
    pendingDecisionId: string;
    decisionId: string;
    actionType: RollActionType;
    choice: RollDecisionChoice;
    skillId?: string;
    summonerSkillId?: SummonerSkillId;
    selfDamageAmount?: number;
  }, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('confirmRollDecision', payload, callback);
  }

  chooseRogueliteReward(rewardId: string, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('chooseRogueliteReward', { rewardId }, callback);
  }

  chooseRogueliteEventOption(choiceId: string): void {
    this.gameManager.emitAck('chooseRogueliteEventOption', { choiceId });
  }

  chooseRogueliteContinue(choice: 'finish' | 'continue', mapNode?: unknown, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('chooseRogueliteContinue', { choice, mapNode }, callback);
  }

  buyRogueliteShopItem(itemId: string): void {
    this.gameManager.emitAck('buyRogueliteShopItem', { itemId });
  }

  useRogueliteRestAction(actionId: string): void {
    this.gameManager.emitAck('useRogueliteRestAction', { actionId });
  }

  leaveRogueliteRoom(): void {
    this.gameManager.emitAck('leaveRogueliteRoom', {});
  }

  kickPlayer(playerId: string): void {
    this.gameManager.emitAck('kickPlayer', { playerId });
  }

  rollGuardCheck(): void {
    this.gameManager.emitAck('rollGuardCheck', {});
  }

  readyForRematch(): void {
    this.gameManager.emitAck('readyForRematch', {});
  }

  sendEmote(emoteId: string): void {
    this.gameManager.emitAck('sendEmote', { emoteId });
  }

  chooseDuoSlotCharacter(slotIndex: 0 | 1, characterId: CharacterId): void {
    this.gameManager.emitAck('chooseDuoSlotCharacter', { slotIndex, characterId });
  }

  chooseDuoSlotSummonerSkill(slotIndex: 0 | 1, summonerSkillId: SummonerSkillId): void {
    this.gameManager.emitAck('chooseDuoSlotSummonerSkill', { slotIndex, summonerSkillId });
  }
}
