import type { CharacterId, GameMode, RoomSettings, SummonerSkillId } from '../shared/types';
import { GameManager } from './GameManager';

export class ServerActions {
  constructor(private readonly gameManager: GameManager) {}

  createRoom(payload: { nickname: string; clientId: string; gameMode: GameMode }, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('createRoom', payload, callback);
  }

  joinRoom(payload: { nickname: string; roomId: string; clientId: string; playerId?: string; gameMode?: GameMode }, callback?: (response: unknown) => void): void {
    this.gameManager.emitAck('joinRoom', payload, callback);
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

  selectTarget(targetId: string): void {
    this.gameManager.emitAck('selectTarget', { targetId });
  }

  selectActor(actorId: string): void {
    this.gameManager.emitAck('selectActor', { actorId });
  }

  rollDice(): void {
    this.gameManager.emitAck('rollDice', {});
  }

  chooseRogueliteReward(rewardId: string): void {
    this.gameManager.emitAck('chooseRogueliteReward', { rewardId });
  }

  chooseRogueliteEventOption(choiceId: string): void {
    this.gameManager.emitAck('chooseRogueliteEventOption', { choiceId });
  }

  chooseRogueliteContinue(choice: 'finish' | 'continue', mapNode?: unknown): void {
    this.gameManager.emitAck('chooseRogueliteContinue', { choice, mapNode });
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
}
