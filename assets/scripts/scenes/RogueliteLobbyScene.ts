import { _decorator } from 'cc';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('RogueliteLobbyScene')
export class RogueliteLobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = '肉鸽模式';
    this.modeHint = '选择初始角色后进入肉鸽探索。';
    this.fixedMaxPlayers = 1;
    super.onLoad();
  }
}
