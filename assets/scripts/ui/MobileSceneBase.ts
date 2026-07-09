/**
 * MobileSceneBase — Abstract base class for all mobile-first scenes.
 *
 * Eliminates boilerplate in every scene:
 * - GameManager & ServerActions initialization
 * - enableFallbackUi handling
 * - Common properties (serverUrl, nickname, clientId)
 * - Client ID persistence
 *
 * Usage:
 *   export class MyScene extends MobileSceneBase {
 *     ensureMinimalUi(): void { ... }  // Build UI with MobileUIFactory
 *   }
 */

import { _decorator, Component, director, sys } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { MobileUIFactory } from './MobileUIFactory';

const { ccclass, property } = _decorator;
const CLIENT_ID_KEY = 'career-war-cocos-client-id';

@ccclass('MobileSceneBase')
export abstract class MobileSceneBase extends Component {
  @property
  serverUrl = 'http://localhost:3001';

  @property
  nickname = 'Player';

  @property
  enableFallbackUi = true; // Default true for mobile programmatic UI

  @property
  fallbackSceneDelay = 0.8;

  protected gameManager: GameManager | null = null;
  protected serverActions!: ServerActions;
  protected clientId = '';
  protected factory = MobileUIFactory;

  abstract ensureMinimalUi(): void;

  onLoad(): void {
    this.clientId = this.getClientId();
    if (this.enableFallbackUi) {
      this.ensureMinimalUi();
    } else {
      this.warnMissingBindings();
    }

    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.setLocalPlayer(this.clientId, this.nickname);
  }

  /** Override in subclass to warn about missing @property bindings. */
  protected warnMissingBindings(): void {
    console.warn(
      `[${this.constructor.name}] enableFallbackUi=false but no editor bindings detected. ` +
      `Set enableFallbackUi=true for programmatic mobile UI.`
    );
  }

  /** Navigate to a scene by name. */
  protected loadScene(sceneName: string): void {
    if (director.getScene()?.name === sceneName) return;
    director.loadScene(sceneName);
  }

  /** Navigate back to Home. */
  protected backToHome(): void {
    director.loadScene('Home');
  }

  /** Get or create a persistent client ID. */
  protected getClientId(): string {
    const existing = sys.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;

    const next = `cocos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sys.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  }

  /** Connect to server and create a room, with fallback to scene on timeout. */
  protected launchMode(
    gameMode: string,
    fallbackScene: string,
    onStatus?: (msg: string) => void,
  ): void {
    let receivedAck = false;
    const statusFn = onStatus ?? ((msg: string) => {
      this.gameManager?.setStatus(msg);
    });

    statusFn('正在创建房间...');
    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.createRoom(
      { nickname: this.nickname, clientId: this.clientId, gameMode: gameMode as any },
      (response: unknown) => {
        receivedAck = true;
        const ack = response as { ok?: boolean; room?: { id: string } } | null;
        if (ack?.ok && ack.room) {
          sys.localStorage.setItem('career-war-cocos-last-room-id', ack.room.id);
          this.loadScene(fallbackScene);
          return;
        }
        statusFn('服务器未就绪，进入预览界面');
        this.loadScene(fallbackScene);
      }
    );

    this.scheduleOnce(() => {
      if (receivedAck || director.getScene()?.name !== this.node.scene.name) return;
      statusFn('正在连接，进入预览界面');
      this.loadScene(fallbackScene);
    }, this.fallbackSceneDelay);
  }
}
