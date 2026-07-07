import { _decorator } from 'cc';
import { SUMMONER_SKILL_IDS } from '../core/DisplayText';
import { characterList } from '../shared/characters';
import type { CharacterId, SummonerSkillId } from '../shared/types';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('DuoLobbyScene')
export class DuoLobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = '2V2 双角色';
    this.modeHint = '双角色模式：自动填充两个角色槽位。';
    this.fixedMaxPlayers = 2;
    super.onLoad();
  }

  startGame(): void {
    const secondCharacterId = this.getSecondCharacterId();
    const secondSkillId = this.getSecondSkillId();

    this.serverActions.chooseDuoSlotCharacter(0, this.selectedCharacterId);
    this.serverActions.chooseDuoSlotSummonerSkill(0, this.selectedSummonerSkillId);
    this.serverActions.chooseDuoSlotCharacter(1, secondCharacterId);
    this.serverActions.chooseDuoSlotSummonerSkill(1, secondSkillId);
    this.scheduleOnce(() => this.serverActions.startGame(), 0.35);
  }

  private getSecondCharacterId(): CharacterId {
    return (
      characterList.find(
        (character) =>
          character.id !== this.selectedCharacterId &&
          !character.isHidden &&
          !character.availability?.hidden &&
          character.availability?.duo !== false
      )?.id ?? 'gunner'
    );
  }

  private getSecondSkillId(): SummonerSkillId {
    return SUMMONER_SKILL_IDS.find((skillId) => skillId !== this.selectedSummonerSkillId) ?? 'lucky_plus_one';
  }
}
