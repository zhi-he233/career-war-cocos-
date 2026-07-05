import { _decorator, Component, Node, director } from 'cc';
import { GameEvents } from '../core/GameEvents';

const { ccclass, property } = _decorator;

type NetworkCallback<T = unknown> = (data: T) => void;
type IoFactory = (url: string, options?: Record<string, unknown>) => Socket;

interface Socket {
  id?: string;
  connected: boolean;
  on(event: string, callback: (...args: never[]) => void): void;
  off(event: string, callback: (...args: never[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  disconnect(): void;
  removeAllListeners(): void;
}

declare global {
  interface Window {
    io?: IoFactory;
  }
}

@ccclass('NetworkManager')
export class NetworkManager extends Component {
  static instance: NetworkManager | null = null;

  @property
  autoConnect = false;

  @property
  defaultUrl = 'http://localhost:3000';

  @property
  ackTimeoutMs = 8000;

  private socket: Socket | null = null;
  private registeredCallbacks = new Map<string, Set<NetworkCallback>>();
  private pendingEmits: Array<{ event: string; data?: unknown; callback?: (response: unknown) => void; cancelled?: boolean }> = [];
  private connectStarted = false;
  private ackTimers: ReturnType<typeof setTimeout>[] = [];

  static getInstance(): NetworkManager {
    if (NetworkManager.instance) return NetworkManager.instance;

    const node = new Node('NetworkManager');
    const manager = node.addComponent(NetworkManager);
    director.getScene()?.addChild(node);
    director.addPersistRootNode(node);
    NetworkManager.instance = manager;
    return manager;
  }

  onLoad(): void {
    if (NetworkManager.instance && NetworkManager.instance !== this) {
      this.node.destroy();
      return;
    }

    NetworkManager.instance = this;
    director.addPersistRootNode(this.node);

    if (this.autoConnect) {
      this.connect(this.defaultUrl);
    }
  }

  onDestroy(): void {
    if (NetworkManager.instance === this) {
      NetworkManager.instance = null;
    }
    this.disconnect();
  }

  connect(url = this.defaultUrl): void {
    if (this.socket?.connected || this.connectStarted) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    this.connectStarted = true;
    void this.createSocket(url);
  }

  private async createSocket(url: string): Promise<void> {
    const io = await this.resolveIoFactory(url);
    if (!io) {
      this.connectStarted = false;
      this.node.emit(GameEvents.NetworkError, new Error('Socket.IO client is not available'));
      return;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    }) as Socket;

    this.socket.on('connect', () => {
      this.node.emit(GameEvents.NetworkConnected, this.socket?.id);
      this.flushPendingEmits();
    });
    this.socket.on('disconnect', (reason) => {
      this.connectStarted = false;
      this.node.emit(GameEvents.NetworkDisconnected, reason);
    });
    this.socket.on('connect_error', (error) => {
      this.connectStarted = false;
      this.node.emit(GameEvents.NetworkError, error);
    });

    for (const [event, callbacks] of this.registeredCallbacks) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
  }

  disconnect(): void {
    this.clearPending();
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.connectStarted = false;
  }

  /** Clear all pending emits and ack timers. Called on disconnect. */
  clearPending(): void {
    this.pendingEmits.length = 0;
    for (const id of this.ackTimers) clearTimeout(id);
    this.ackTimers.length = 0;
  }

  emitAck<TPayload = unknown, TResponse = unknown>(
    event: string,
    data?: TPayload,
    callback?: (response: TResponse) => void,
    timeoutMs?: number,
  ): void {
    const ms = timeoutMs ?? this.ackTimeoutMs;
    let settled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    // Wrap callback: clear timeout on real ack, prevent double-fire
    const wrappedCallback = callback
      ? (response: TResponse) => {
          if (settled) return;
          settled = true;
          if (timerId !== undefined) {
            clearTimeout(timerId);
            this.ackTimers = this.ackTimers.filter(t => t !== timerId);
          }
          callback(response);
        }
      : undefined;

    // Timeout: fire error + clean up timer reference + cancel pending item
    if (callback && ms > 0) {
      timerId = setTimeout(() => {
        if (settled) return;
        settled = true;
        // Remove self from ackTimers to prevent leak
        this.ackTimers = this.ackTimers.filter(t => t !== timerId);
        // Cancel any pending item for this emit
        for (const item of this.pendingEmits) {
          if (item.callback === wrappedCallback) item.cancelled = true;
        }
        callback({
          ok: false,
          error: `Request timed out after ${ms}ms`,
        } as unknown as TResponse);
      }, ms);
      this.ackTimers.push(timerId);
    }

    if (!this.socket) {
      this.connect(this.defaultUrl);
    }
    // Only emit if socket is actually connected; otherwise queue as pending.
    // This prevents stale emits from being buffered and sent after reconnect.
    if (this.socket?.connected) {
      this.socket.emit(event, data, wrappedCallback);
    } else {
      this.pendingEmits.push({
        event,
        data,
        callback: wrappedCallback as ((response: unknown) => void) | undefined,
        cancelled: false,
      });
    }
  }

  /** Same check for fire-and-forget emits. */
  emit<T = unknown>(event: string, data?: T): void {
    if (!this.socket) {
      this.connect(this.defaultUrl);
    }
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.pendingEmits.push({ event, data, cancelled: false });
    }
  }

  on<T = unknown>(event: string, callback: NetworkCallback<T>): void {
    const callbacks = this.registeredCallbacks.get(event) ?? new Set<NetworkCallback>();
    callbacks.add(callback as NetworkCallback);
    this.registeredCallbacks.set(event, callbacks);
    this.socket?.on(event, callback as NetworkCallback);
  }

  off<T = unknown>(event: string, callback: NetworkCallback<T>): void {
    this.registeredCallbacks.get(event)?.delete(callback as NetworkCallback);
    this.socket?.off(event, callback as NetworkCallback);
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  private flushPendingEmits(): void {
    if (!this.socket?.connected) return;

    const remaining: typeof this.pendingEmits = [];
    for (const item of this.pendingEmits) {
      if (item.cancelled) continue; // timeout already fired, skip
      remaining.push(item);
    }
    this.pendingEmits.length = 0;

    for (const item of remaining) {
      this.socket.emit(item.event, item.data, item.callback);
    }
  }

  private async resolveIoFactory(serverUrl: string): Promise<IoFactory | null> {
    if (typeof window !== 'undefined' && window.io) {
      return window.io;
    }

    try {
      await this.loadSocketIoScript(serverUrl);
      return typeof window !== 'undefined' ? window.io ?? null : null;
    } catch (error) {
      this.node.emit(GameEvents.NetworkError, error);
      return null;
    }
  }

  private loadSocketIoScript(serverUrl: string): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Socket.IO browser script can only be loaded in a browser preview'));
    }

    const scriptUrl = `${serverUrl.replace(/\/$/, '')}/socket.io/socket.io.js`;
    const existing = document.querySelector(`script[src="${scriptUrl}"]`) as HTMLScriptElement | null;
    if (existing) {
      return existing.dataset.loaded === 'true'
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${scriptUrl}`)), { once: true });
          });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${scriptUrl}`));
      document.head.appendChild(script);
    });
  }
}
