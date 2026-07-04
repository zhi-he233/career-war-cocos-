import { _decorator } from 'cc';
import { LobbyScene } from './LobbyScene';

const { ccclass } = _decorator;

@ccclass('RogueliteLobbyScene')
export class RogueliteLobbyScene extends LobbyScene {
  onLoad(): void {
    this.lobbyTitle = 'Roguelite Lobby';
    this.modeHint = 'Pick a starter character before entering the run.';
    this.fixedMaxPlayers = 1;
    super.onLoad();
  }
}
