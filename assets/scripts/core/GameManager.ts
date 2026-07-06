import { _decorator, Component, Node, director, sys } from 'cc';
import type { GameEvent, PlayerEmoteEvent, Room, RoomPhase } from '../shared/types';
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
  classic1v1LobbySceneName = 'Classic1v1Lobby';

  @property
  duoLobbySceneName = 'DuoLobby';

  @property
  pveLobbySceneName = 'PveLobby';

  @property
  rogueliteLobbySceneName = 'RogueliteLobby';

  @property
  battleSceneName = 'Battle';

  @property
  rogueliteBattleSceneName = 'RogueliteBattle';

  @property
  rogueliteSceneName = 'Roguelite';

  room: Room | null = null;
  localClientId = '';
  localPlayerId = '';
  localNickname = '';
  statusText = 'Idle';

  private readonly handleRoomUpdateBound = (data: Room) => this.handleRoomUpdate(data);
  private readonly handleBattleLogAddedBound = (event: GameEvent) => this.node.emit(GameEvents.BattleLogAdded, event);
  private readonly handlePlayerEmoteBound = (event: PlayerEmoteEvent) => this.node.emit(GameEvents.PlayerEmote, event);
  private readonly handleGameOverBound = (payload: { winnerId?: string; winnerName?: string }) => {
    this.node.emit(GameEvents.GameOver, payload);
    this.showToast(`${payload.winnerName ?? 'Unknown'} wins!`, 3);
  };
  private readonly handleErrorMessageBound = (message: string) => {
    this.node.emit(GameEvents.ErrorMessage, message);
    this.showToast(message, 3);
  };
  private readonly handleKickedFromRoomBound = (_payload: unknown) => {
    this.node.emit(GameEvents.KickedFromRoom);
    this.clearRoom();
    this.showToast('You have been kicked from the room', 3);
    director.loadScene('Home');
  };
  private readonly handleCharactersBound = (items: unknown) => {
    this.node.emit(GameEvents.CharactersUpdated, items);
  };
  private readonly handleRoomListUpdatedBound = (items: unknown) => {
    this.node.emit(GameEvents.RoomListUpdated, items);
  };
  private readonly handleClientPongBound = (payload: { clientSentAt?: unknown }) => {
    if (typeof (payload as { clientSentAt?: number }).clientSentAt === 'number') {
      this._lastRttMs = Math.max(0, Date.now() - (payload as { clientSentAt: number }).clientSentAt);
    }
  };
  private readonly handleNetworkConnectedBound = (socketId: string | undefined) => {
    this.setStatus(`Connected ${socketId ?? ''}`.trim());
    this.startClientPing();
    this.tryResumeOnReconnect();
  };
  private readonly handleNetworkDisconnectedBound = (reason: unknown) => {
    this.setStatus(`Disconnected: ${String(reason ?? 'unknown')}`);
    this.stopClientPing();
    this.pendingResumeOnReconnect = !!this.room;
  };
  private readonly handleNetworkErrorBound = (error: unknown) => this.setStatus(`Network error: ${this.errorMessage(error)}`);
  private pendingResumeOnReconnect = false;
  private _lastRttMs = -1;
  private _pingTimer: ReturnType<typeof setInterval> | null = null;

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
    this.networkManager.on<GameEvent>('battleLogAdded', this.handleBattleLogAddedBound);
    this.networkManager.on<PlayerEmoteEvent>('playerEmote', this.handlePlayerEmoteBound);
    this.networkManager.on<{ winnerId?: string; winnerName?: string }>('gameOver', this.handleGameOverBound);
    this.networkManager.on<string>('errorMessage', this.handleErrorMessageBound);
    this.networkManager.on<unknown>('kickedFromRoom', this.handleKickedFromRoomBound);
    this.networkManager.on<unknown>('characters', this.handleCharactersBound);
    this.networkManager.on<unknown>('roomListUpdated', this.handleRoomListUpdatedBound);
    this.networkManager.on<unknown>('clientPong', this.handleClientPongBound);
    this.networkManager.node.on(GameEvents.NetworkConnected, this.handleNetworkConnectedBound, this);
    this.networkManager.node.on(GameEvents.NetworkDisconnected, this.handleNetworkDisconnectedBound, this);
    this.networkManager.node.on(GameEvents.NetworkError, this.handleNetworkErrorBound, this);
  }

  onDestroy(): void {
    this.stopClientPing();
    this.networkManager?.off<Room>('roomUpdate', this.handleRoomUpdateBound);
    this.networkManager?.off<Room>('gameStateUpdated', this.handleRoomUpdateBound);
    this.networkManager?.off<GameEvent>('battleLogAdded', this.handleBattleLogAddedBound);
    this.networkManager?.off<PlayerEmoteEvent>('playerEmote', this.handlePlayerEmoteBound);
    this.networkManager?.off<{ winnerId?: string; winnerName?: string }>('gameOver', this.handleGameOverBound);
    this.networkManager?.off<string>('errorMessage', this.handleErrorMessageBound);
    this.networkManager?.off<unknown>('kickedFromRoom', this.handleKickedFromRoomBound);
    this.networkManager?.off<unknown>('characters', this.handleCharactersBound);
    this.networkManager?.off<unknown>('roomListUpdated', this.handleRoomListUpdatedBound);
    this.networkManager?.off<unknown>('clientPong', this.handleClientPongBound);
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

  showToast(message: string, duration = 1.6): void {
    this.node.emit(GameEvents.ToastRequested, message, duration);
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

  /** Mark that we should try to resume the current room on next reconnect. */
  enableReconnectResume(): void {
    this.pendingResumeOnReconnect = !!this.room;
  }

  /** Clear local room state. Does NOT send leaveRoom to server. */
  clearRoom(): void {
    this.room = null;
    this.localPlayerId = '';
    this.pendingResumeOnReconnect = false;
    sys.localStorage.removeItem('career-war-cocos-player-id');
    sys.localStorage.removeItem('career-war-cocos-last-room-id');
  }

  /**
   * Leave current room. Sends leaveRoom to server, then clears local state.
   * emitAck's built-in timeout guarantees the callback always fires (ack or timeout).
   * Safe to call even if not in a room.
   */
  leaveRoom(): void {
    if (!this.room) return;
    const leavingRoomId = this.room.id;

    this.emitAck('leaveRoom', {}, () => {
      // Guard: if we already joined a different room, don't clear it
      if (this.room?.id !== leavingRoomId) return;
      this.clearRoom();
      director.loadScene('Home');
    });
  }

  // ── Server event subscription (for scenes) ──

  onBattleLogAdded(callback: (event: GameEvent) => void, target?: unknown): void {
    this.node.on(GameEvents.BattleLogAdded, callback, target);
  }
  offBattleLogAdded(callback: (event: GameEvent) => void, target?: unknown): void {
    this.node.off(GameEvents.BattleLogAdded, callback, target);
  }

  onPlayerEmote(callback: (event: PlayerEmoteEvent) => void, target?: unknown): void {
    this.node.on(GameEvents.PlayerEmote, callback, target);
  }
  offPlayerEmote(callback: (event: PlayerEmoteEvent) => void, target?: unknown): void {
    this.node.off(GameEvents.PlayerEmote, callback, target);
  }

  onGameOver(callback: (payload: { winnerId?: string; winnerName?: string }) => void, target?: unknown): void {
    this.node.on(GameEvents.GameOver, callback, target);
  }
  offGameOver(callback: (payload: { winnerId?: string; winnerName?: string }) => void, target?: unknown): void {
    this.node.off(GameEvents.GameOver, callback, target);
  }

  onErrorMessage(callback: (message: string) => void, target?: unknown): void {
    this.node.on(GameEvents.ErrorMessage, callback, target);
  }
  offErrorMessage(callback: (message: string) => void, target?: unknown): void {
    this.node.off(GameEvents.ErrorMessage, callback, target);
  }

  onKickedFromRoom(callback: () => void, target?: unknown): void {
    this.node.on(GameEvents.KickedFromRoom, callback, target);
  }
  offKickedFromRoom(callback: () => void, target?: unknown): void {
    this.node.off(GameEvents.KickedFromRoom, callback, target);
  }

  onCharactersUpdated(callback: (items: unknown) => void, target?: unknown): void {
    this.node.on(GameEvents.CharactersUpdated, callback, target);
  }
  offCharactersUpdated(callback: (items: unknown) => void, target?: unknown): void {
    this.node.off(GameEvents.CharactersUpdated, callback, target);
  }

  onRoomListUpdated(callback: (items: unknown) => void, target?: unknown): void {
    this.node.on(GameEvents.RoomListUpdated, callback, target);
  }
  offRoomListUpdated(callback: (items: unknown) => void, target?: unknown): void {
    this.node.off(GameEvents.RoomListUpdated, callback, target);
  }

  /** Latest round-trip time in ms, or -1 if never measured. */
  get lastRttMs(): number { return this._lastRttMs; }

  // ── Heartbeat ──

  private startClientPing(): void {
    this.stopClientPing();
    this.sendClientPing();
    this._pingTimer = setInterval(() => this.sendClientPing(), 5000);
  }

  private stopClientPing(): void {
    if (this._pingTimer !== null) {
      clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
  }

  private sendClientPing(): void {
    if (!this.networkManager?.isConnected()) return;
    this.networkManager.emit('clientPing', { clientSentAt: Date.now() });
  }

  // ── Reconnection ──

  private tryResumeOnReconnect(): void {
    if (!this.pendingResumeOnReconnect || !this.room) return;
    this.pendingResumeOnReconnect = false;
    const roomId = this.room.id;
    const playerId = this.localPlayerId;
    this.networkManager?.emitAck('resumeRoom', {
      roomId,
      clientId: this.localClientId,
      playerId: playerId || undefined,
    }, (response: unknown) => {
      const ack = response as { ok?: boolean; error?: unknown; room?: Room; playerId?: string };
      if (ack.ok && ack.room) {
        this.applyRoomUpdate(ack.room);
        if (ack.playerId) this.setLocalPlayerId(ack.playerId);
      } else {
        this.showToast('Reconnection failed — returning to home', 3);
        this.clearRoom();
        director.loadScene('Home');
      }
    });
  }

  private handleRoomUpdate(data: Room): void {
    const previousPhase = this.room?.phase;
    const previousRoomId = this.room?.id;
    const previousMode = this.room?.gameMode ?? this.room?.settings?.gameMode;

    if (this.room) {
      Object.assign(this.room, data);
    } else {
      this.room = { ...data };
    }

    this.node.emit(GameEvents.RoomUpdated, this.room);
    this.setStatus(`Room ${this.room.id} | ${this.room.phase}`);

    const currentMode = this.room.gameMode ?? this.room.settings?.gameMode;
    const shouldRoute =
      previousPhase !== this.room.phase || previousRoomId !== this.room.id || previousMode !== currentMode;

    if (previousPhase !== this.room.phase) {
      this.node.emit(GameEvents.RoomPhaseChanged, this.room.phase, previousPhase);
    }

    if (this.autoRouteScenes && shouldRoute) {
      this.routeByPhase(this.room.phase);
    }

    // Enable reconnection resume as long as we have a room
    if (this.room.phase !== 'gameOver') {
      this.pendingResumeOnReconnect = true;
    }
  }

  private handleAckResponse(event: string, response: unknown): void {
    if (!response || typeof response !== 'object') return;
    const ack = response as { ok?: boolean; error?: unknown; room?: Room; playerId?: string };
    if (ack.ok === false) {
      const message = `${event} failed: ${this.errorMessage(ack.error)}`;
      this.setStatus(message);
      this.showToast(message, 2.2);
      return;
    }
    if (ack.ok === true) {
      const message = `${event} ok`;
      this.setStatus(message);
      this.showToast(message, 1.2);
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
    if (phase === 'lobby') return this.getLobbySceneName();
    if (phase === 'battle' || phase === 'gameOver') {
      const mode = this.room?.gameMode ?? this.room?.settings?.gameMode;
      return mode === 'pve_roguelite' ? this.rogueliteBattleSceneName : this.battleSceneName;
    }
    if (ROGUELITE_PHASES.includes(phase)) return this.rogueliteSceneName;
    return null;
  }

  private getLobbySceneName(): string {
    const mode = this.room?.gameMode ?? this.room?.settings?.gameMode ?? 'classic';
    if (mode === 'duo_2v2') return this.duoLobbySceneName || this.lobbySceneName;
    if (mode === 'pve_1v1') return this.pveLobbySceneName || this.lobbySceneName;
    if (mode === 'pve_roguelite') return this.rogueliteLobbySceneName || this.lobbySceneName;
    return this.classic1v1LobbySceneName || this.lobbySceneName;
  }
}
