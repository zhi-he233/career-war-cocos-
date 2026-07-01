import { _decorator, Button, Component, EditBox, Label, Node, UITransform, Vec3, director, sys } from 'cc';
import type { GameMode, Room, RoomListItem } from '../shared/types';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;
const CLIENT_ID_KEY = 'career-war-cocos-client-id';
const LAST_ROOM_ID_KEY = 'career-war-cocos-last-room-id';

type Ack<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };

@ccclass('HomeScene')
export class HomeScene extends Component {
  @property
  serverUrl = 'http://localhost:3001';

  @property
  nickname = 'Player';

  @property
  clientId = 'cocos-client';

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: EditBox })
  roomIdEditBox: EditBox | null = null;

  @property({ type: Button })
  joinRoomButton: Button | null = null;

  @property({ type: Button })
  refreshRoomsButton: Button | null = null;

  @property({ type: Node })
  roomListNode: Node | null = null;

  private gameManager: GameManager | null = null;
  private roomList: RoomListItem[] = [];
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  onLoad(): void {
    this.ensureMinimalUi();
    this.clientId = this.getClientId();
    this.gameManager = GameManager.getInstance();
    this.gameManager.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);
    this.joinRoomButton?.node.on(Button.EventType.CLICK, this.joinRoom, this);
    this.refreshRoomsButton?.node.on(Button.EventType.CLICK, this.requestRoomList, this);
    this.renderStatus(this.gameManager.getStatus());
    this.renderRoomList();
  }

  onDestroy(): void {
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
    this.joinRoomButton?.node.off(Button.EventType.CLICK, this.joinRoom, this);
    this.refreshRoomsButton?.node.off(Button.EventType.CLICK, this.requestRoomList, this);
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

  joinRoom(): void {
    const roomId = this.roomIdEditBox?.string.trim();
    if (!roomId) {
      this.gameManager?.setStatus('Type a room id first');
      return;
    }

    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.gameManager?.emitAck(
      'joinRoom',
      {
        nickname: this.nickname,
        clientId: this.clientId,
        roomId,
      },
      (response: Ack<{ roomId: string; playerId: string; room: Room }>) => {
        if (response?.ok && response.room) {
          sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id);
          this.gameManager?.applyRoomUpdate(response.room);
        }
      }
    );
  }

  requestRoomList(): void {
    this.gameManager?.connect(this.serverUrl);
    this.gameManager?.emitAck('requestRoomList', {}, (response: Ack<{ roomList: RoomListItem[] }>) => {
      if (!response?.ok) return;
      this.roomList = response.roomList ?? [];
      this.renderRoomList();
    });
  }

  private joinRoomById(roomId: string): void {
    if (this.roomIdEditBox) {
      this.roomIdEditBox.string = roomId;
    }
    this.joinRoom();
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
          sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id);
          this.gameManager?.applyRoomUpdate(response.room);
        }
      }
    );
  }

  private renderStatus(status: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = `Server: ${this.serverUrl}\nPlayer: ${this.nickname}\n${status}`;
    }
  }

  private ensureMinimalUi(): void {
    this.roomIdEditBox ??= this.ensureEditBox('RoomIdEditBox', -120, -315, 260, 48);
    this.joinRoomButton ??= this.ensureButton('JoinRoomButton', 'Join Room', 180, -315, 180, 48, 20);
    this.refreshRoomsButton ??= this.ensureButton('RefreshRoomsButton', 'Refresh Rooms', 0, -375, 260, 44, 18);
    this.roomListNode ??= this.ensureNode('RoomList', 0, -490, 640, 150);
    this.statusLabel ??= this.ensureLabel('StatusLabel', 0, -585, 640, 80, 18);
  }

  private renderRoomList(): void {
    if (!this.roomListNode) return;
    this.clearChildren(this.roomListNode);

    if (this.roomList.length === 0) {
      const label = this.ensureLabelInParent('RoomListEmpty', 0, 30, 620, 44, 16, this.roomListNode);
      label.string = 'No rooms loaded. Tap Refresh Rooms.';
      return;
    }

    this.roomList.slice(0, 3).forEach((room, index) => {
      const button = this.createButtonInParent(
        `Room_${room.roomId}`,
        `${room.roomId} | ${room.hostName} | ${room.playerCount}/${room.maxPlayers} | ${room.gameMode ?? 'classic'}`,
        0,
        50 - index * 50,
        620,
        42,
        15,
        this.roomListNode!
      );
      button.interactable = room.canJoin === true;
      button.node.on(Button.EventType.CLICK, () => this.joinRoomById(room.roomId), this);
    });
  }

  private ensureEditBox(name: string, x: number, y: number, width: number, height: number): EditBox {
    const node = this.ensureNode(name, x, y, width, height);

    const editBox = node.getComponent(EditBox) ?? node.addComponent(EditBox);
    editBox.string = sys.localStorage.getItem(LAST_ROOM_ID_KEY) ?? '';
    editBox.placeholder = 'Room ID';
    editBox.maxLength = 16;

    const textLabel = this.ensureChildLabel(node, 'TextLabel', width, height, 20);
    const placeholderLabel = this.ensureChildLabel(node, 'PlaceholderLabel', width, height, 20);
    placeholderLabel.string = 'Room ID';
    editBox.textLabel = textLabel;
    editBox.placeholderLabel = placeholderLabel;
    return editBox;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    return this.ensureLabelInParent(name, x, y, width, height, fontSize, this.node);
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number, parent = this.node): Node {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));

    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabelInParent(name: string, x: number, y: number, width: number, height: number, fontSize: number, parent: Node): Label {
    const node = this.ensureNode(name, x, y, width, height, parent);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    return label;
  }

  private ensureButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.ensureNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const label = this.ensureChildLabel(node, 'Label', width, height, fontSize);
    label.string = text;
    return button;
  }

  private createButtonInParent(
    name: string,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    parent: Node
  ): Button {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));

    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);

    const button = node.addComponent(Button);
    button.interactable = true;

    const label = this.ensureChildLabel(node, 'Label', width, height, fontSize);
    label.string = text;
    return button;
  }

  private ensureChildLabel(parent: Node, name: string, width: number, height: number, fontSize: number): Label {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(Vec3.ZERO);

    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);

    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = false;
    return label;
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }

  private getClientId(): string {
    const existing = sys.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;

    const next = `cocos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sys.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  }
}
