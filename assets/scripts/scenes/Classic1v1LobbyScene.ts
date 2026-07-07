import { _decorator } from 'cc';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('Classic1v1LobbyScene')
export class Classic1v1LobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = '经典对战';
    this.modeHint = '选择一个角色和一个召唤师技能。';
    this.fixedMaxPlayers = 2;
    super.onLoad();
  }
}
