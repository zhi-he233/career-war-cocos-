import { _decorator } from 'cc';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('PveLobbyScene')
export class PveLobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = 'AI Practice Lobby';
    this.modeHint = 'Pick your character, then start against the AI.';
    this.fixedMaxPlayers = 1;
    super.onLoad();
  }
}
