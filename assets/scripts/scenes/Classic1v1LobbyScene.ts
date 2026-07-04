import { _decorator } from 'cc';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('Classic1v1LobbyScene')
export class Classic1v1LobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = 'Classic 1V1 Lobby';
    this.modeHint = 'Pick one character and one summoner skill.';
    this.fixedMaxPlayers = 2;
    super.onLoad();
  }
}
