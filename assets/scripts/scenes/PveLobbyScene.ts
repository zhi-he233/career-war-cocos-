import { _decorator } from 'cc';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('PveLobbyScene')
export class PveLobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = '人机练习';
    this.modeHint = '选择角色后即可开始与 AI 对战。';
    this.fixedMaxPlayers = 1;
    super.onLoad();
  }
}
