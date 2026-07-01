import { _decorator, Component, Node, director, sys } from 'cc';
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
  localPlayerId = '';
  localNickname = '';
  statusText = 'Idle';

  private readonly handleRoomUpdateBound = (data: Room) => this.handleRoomUpdate(data);
  private readonly handleNetworkConnectedBound = (socketId: string | undefined) => this.setStatus(`Connected ${socketId ?? ''}`.trim());
  private readonly handleNetworkDisconnectedBound = (reason: unknown) => this.setStatus(`Disconnected: ${String(reason ?? 'unknown')}`);
  private readonly handleNetworkErrorBound = (error: unknown) => this.setStatus(`Network error: ${this.errorMessage(error)}`);

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
    this.networkManager.node.on(GameEvents.NetworkConnected, this.handleNetworkConnectedBound, this);
    this.networkManager.node.on(GameEvents.NetworkDisconnected, this.handleNetworkDisconnectedBound, this);
    this.networkManager.node.on(GameEvents.NetworkError, this.handleNetworkErrorBound, this);
  }

  onDestroy(): void {
    this.networkManager?.off<Room>('roomUpdate', this.handleRoomUpdateBound);
    this.networkManager?.off<Room>('gameStateUpdated', this.handleRoomUpdateBound);
    this.networkManager?.node.off(GameEvents.NetworkConnected, this.handleNetworkConnectedBound, this);
    this.networkManager?.node.off(GameEvents.NetworkDisconnected, this.handleNetworkDisconnectedBound, this);
    this.networkManager?.node.off(GameEvents.NetworkError, this.handleNetworkErrorBound, this);
    if (GameManager.instance === this) {
      GameManager.instance = null;
    }
  }

  connect(url: string): void {
    this.networkManager = this.networkManager ?? NetworkManager.getInstance();
    this.setStatus(`Connecting ${url}`);
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
    this.networkManager.emitAck(event, data, (response: TResponse) => {
      this.handleAckResponse(event, response);
      callback?.(response);
    });
  }

  onRoomUpdated(callback: (room: Room) => void, target?: unknown): void {
    this.node.on(GameEvents.RoomUpdated, callback, target);
  }

  offRoomUpdated(callback: (room: Room) => void, target?: unknown): void {
    this.node.off(GameEvents.RoomUpdated, callback, target);
  }

  onStatusUpdated(callback: (status: string) => void, target?: unknown): void {
    this.node.on(GameEvents.StatusUpdated, callback, target);
  }

  offStatusUpdated(callback: (status: string) => void, target?: unknown): void {
    this.node.off(GameEvents.StatusUpdated, callback, target);
  }

  getRoom(): Room | null {
    return this.room;
  }

  getStatus(): string {
    return this.statusText;
  }

  setStatus(status: string): void {
    this.statusText = status;
    this.node.emit(GameEvents.StatusUpdated, status);
  }

  setLocalPlayer(clientId: string, nickname: string): void {
    this.localClientId = clientId;
    this.localNickname = nickname;
  }

  setLocalPlayerId(playerId: string): void {
    this.localPlayerId = playerId;
    if (playerId) {
      sys.localStorage.setItem('career-war-cocos-player-id', playerId);
    }
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
    this.setStatus(`Room ${this.room.id} | ${this.room.phase}`);

    if (previousPhase !== this.room.phase) {
      this.node.emit(GameEvents.RoomPhaseChanged, this.room.phase, previousPhase);
      if (this.autoRouteScenes) {
        this.routeByPhase(this.room.phase);
      }
    }
  }

  private handleAckResponse(event: string, response: unknown): void {
    if (!response || typeof response !== 'object') return;
    const ack = response as { ok?: boolean; error?: unknown; room?: Room; playerId?: string };
    if (ack.ok === false) {
      this.setStatus(`${event} failed: ${this.errorMessage(ack.error)}`);
      return;
    }
    if (ack.ok === true) {
      this.setStatus(`${event} ok`);
      if (ack.playerId) this.setLocalPlayerId(ack.playerId);
      if (ack.room) this.applyRoomUpdate(ack.room);
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message ?? 'unknown');
    }
    return String(error ?? 'unknown');
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
