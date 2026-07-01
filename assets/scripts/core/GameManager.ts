import { _decorator, Component, Node, director } from 'cc';
import type { Room, RoomPhase } from '../shared/types';
import { NetworkManager } from '../network/NetworkManager';
import { GameEvents } from './GameEvents';

const { ccclass, property } = _decorator;

const ROGUELITE_PHASES: RoomPhase[] = [
  'reward',
  'roguelite_event',
  'roguelite_shop',
  'roguelite_rest',
  'roguelite_continue',
];

@ccclass('GameManager')
export class GameManager extends Component {
  static instance: GameManager | null = null;

  @property({ type: NetworkManager })
  networkManager: NetworkManager | null = null;

  @property
  autoRouteScenes = true;

  @property
  lobbySceneName = 'Lobby';

  @property
  battleSceneName = 'Battle';

  @property
  rogueliteSceneName = 'Roguelite';

  room: Room | null = null;
  localClientId = '';
  localNickname = '';

  private readonly handleRoomUpdateBound = (data: Room) => this.handleRoomUpdate(data);

  static getInstance(): GameManager {
    if (GameManager.instance) return GameManager.instance;

    const node = new Node('GameManager');
    const manager = node.addComponent(GameManager);
    director.getScene()?.addChild(node);
    director.addPersistRootNode(node);
    GameManager.instance = manager;
    return manager;
  }

  onLoad(): void {
    if (GameManager.instance && GameManager.instance !== this) {
      this.node.destroy();
      return;
    }

    GameManager.instance = this;
    director.addPersistRootNode(this.node);
    this.networkManager = this.networkManager ?? NetworkManager.getInstance();
    this.networkManager.on<Room>('roomUpdate', this.handleRoomUpdateBound);
    this.networkManager.on<Room>('gameStateUpdated', this.handleRoomUpdateBound);
  }

  onDestroy(): void {
    this.networkManager?.off<Room>('roomUpdate', this.handleRoomUpdateBound);
    this.networkManager?.off<Room>('gameStateUpdated', this.handleRoomUpdateBound);
    if (GameManager.instance === this) {
      GameManager.instance = null;
    }
  }

  connect(url: string): void {
    this.networkManager = this.networkManager ?? NetworkManager.getInstance();
    this.networkManager.connect(url);
  }

  emit<T = unknown>(event: string, data?: T): void {
    this.networkManager = this.networkManager ?? NetworkManager.getInstance();
    this.networkManager.emit(event, data);
  }

  emitAck<TPayload = unknown, TResponse = unknown>(
    event: string,
    data?: TPayload,
    callback?: (response: TResponse) => void
  ): void {
    this.networkManager = this.networkManager ?? NetworkManager.getInstance();
    this.networkManager.emitAck(event, data, callback);
  }

  onRoomUpdated(callback: (room: Room) => void, target?: unknown): void {
    this.node.on(GameEvents.RoomUpdated, callback, target);
  }

  offRoomUpdated(callback: (room: Room) => void, target?: unknown): void {
    this.node.off(GameEvents.RoomUpdated, callback, target);
  }

  getRoom(): Room | null {
    return this.room;
  }

  setLocalPlayer(clientId: string, nickname: string): void {
    this.localClientId = clientId;
    this.localNickname = nickname;
  }

  getLocalPlayer(): Room['players'][number] | null {
    if (!this.room || !this.localClientId) return null;
    return this.room.players.find((player) => player.clientId === this.localClientId) ?? null;
  }

  applyRoomUpdate(data: Room): void {
    this.handleRoomUpdate(data);
  }

  getMe(clientId?: string): Room['players'][number] | null {
    if (!this.room || !clientId) return null;
    return this.room.players.find((player) => player.clientId === clientId || player.id === clientId) ?? null;
  }

  private handleRoomUpdate(data: Room): void {
    const previousPhase = this.room?.phase;

    if (this.room) {
      Object.assign(this.room, data);
    } else {
      this.room = { ...data };
    }

    this.node.emit(GameEvents.RoomUpdated, this.room);

    if (previousPhase !== this.room.phase) {
      this.node.emit(GameEvents.RoomPhaseChanged, this.room.phase, previousPhase);
      if (this.autoRouteScenes) {
        this.routeByPhase(this.room.phase);
      }
    }
  }

  private routeByPhase(phase: RoomPhase): void {
    const sceneName = this.getSceneNameForPhase(phase);
    if (!sceneName || director.getScene()?.name === sceneName) return;
    director.loadScene(sceneName);
  }

  private getSceneNameForPhase(phase: RoomPhase): string | null {
    if (phase === 'lobby') return this.lobbySceneName;
    if (phase === 'battle' || phase === 'gameOver') return this.battleSceneName;
    if (ROGUELITE_PHASES.includes(phase)) return this.rogueliteSceneName;
    return null;
  }
}
