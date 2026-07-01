import { _decorator, Component, director, sys } from 'cc';
import type { GameMode, Room } from '../shared/types';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;
const CLIENT_ID_KEY = 'career-war-cocos-client-id';

type Ack<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };

@ccclass('HomeScene')
export class HomeScene extends Component {
  @property
  serverUrl = 'http://localhost:3001';

  @property
  nickname = 'Player';

  @property
  clientId = 'cocos-client';

  private gameManager: GameManager | null = null;

  onLoad(): void {
    this.clientId = this.getClientId();
    this.gameManager = GameManager.getInstance();
    this.gameManager.setLocalPlayer(this.clientId, this.nickname);
  }

  createClassicRoom(): void {
    this.createRoom('classic');
  }

  createPveRoom(): void {
    this.createRoom('pve_1v1');
  }

  createRogueliteRoom(): void {
    this.createRoom('pve_roguelite');
  }

  openLobbyScene(): void {
    director.loadScene('Lobby');
  }

  private createRoom(gameMode: GameMode): void {
    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.gameManager?.emitAck(
      'createRoom',
      {
        nickname: this.nickname,
        clientId: this.clientId,
        gameMode,
      },
      (response: Ack<{ room: Room }>) => {
        if (response?.ok && response.room) {
          this.gameManager?.applyRoomUpdate(response.room);
        }
      }
    );
  }

  private getClientId(): string {
    const existing = sys.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;

    const next = `cocos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sys.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  }
}
