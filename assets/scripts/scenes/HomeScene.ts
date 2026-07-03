import {
  _decorator,
  Button,
  Color,
  Component,
  EditBox,
  Graphics,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  tween,
  UITransform,
  Vec3,
  director,
  sys,
} from 'cc';
import type { GameMode, Room, RoomListItem } from '../shared/types';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';

const { ccclass, property } = _decorator;
const CLIENT_ID_KEY = 'career-war-cocos-client-id';
const LAST_ROOM_ID_KEY = 'career-war-cocos-last-room-id';
const LAST_PLAYER_ID_KEY = 'career-war-cocos-player-id';

type Ack<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };
type SceneName = 'Lobby' | 'Battle' | 'RogueliteBattle' | 'Roguelite' | 'Profile';

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

  @property
  createDebugUi = false;

  @property({ type: [SpriteFrame] })
  diceRollFrames: SpriteFrame[] = [];

  @property
  diceRollDuration = 0.72;

  @property
  fallbackSceneDelay = 0.8;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private roomList: RoomListItem[] = [];
  private infoPanelNode: Node | null = null;
  private toastNode: Node | null = null;
  private isLaunchingRoguelite = false;
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  onLoad(): void {
    if (this.createDebugUi) {
      this.ensureMinimalUi();
    }

    this.clientId = this.getClientId();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);
    this.joinRoomButton?.node.on(Button.EventType.CLICK, this.joinRoom, this);
    this.refreshRoomsButton?.node.on(Button.EventType.CLICK, this.requestRoomList, this);
    this.renderStatus(this.gameManager.getStatus());
    this.renderRoomList();
    this.tryAutoResume();
  }

  onDestroy(): void {
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
    this.joinRoomButton?.node.off(Button.EventType.CLICK, this.joinRoom, this);
    this.refreshRoomsButton?.node.off(Button.EventType.CLICK, this.requestRoomList, this);
  }

  createClassicRoom(): void {
    this.launchMode('classic', 'Lobby');
  }

  createPveRoom(): void {
    this.launchMode('pve_1v1', 'Lobby');
  }

  createRogueliteRoom(): void {
    if (this.isLaunchingRoguelite) return;
    this.isLaunchingRoguelite = true;
    this.playDiceRoll(() => {
      this.isLaunchingRoguelite = false;
      this.launchMode('pve_roguelite', 'Roguelite');
    });
  }

  openRuleGuide(): void {
    this.showInfoPanel(
      '规则书',
      [
        '基础流程：选择模式，进入房间，选择角色，然后开始战斗。',
        '战斗规则：轮到你时投骰，根据骰点选择普通攻击、角色技能或召唤师技能。',
        '结算原则：服务器负责真实结算，客户端只负责显示和发送操作。',
        '肉鸽模式：打完一场后选择奖励，再进入下一层。',
      ].join('\n')
    );
  }

  openProfile(): void {
    director.loadScene('Profile');
  }

  tapCandle(): void {
    this.tapProp('CandleProp', '烛火晃了一下。');
  }

  tapMug(): void {
    this.tapProp('MugProp', '杯子被轻轻碰了一下。');
  }

  tapCoinPouch(): void {
    this.tapProp('CoinPouchProp', '钱袋发出一声轻响。');
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
    this.serverActions.joinRoom(
      { nickname: this.nickname, clientId: this.clientId, roomId },
      (response: Ack<{ roomId: string; playerId: string; room: Room }>) => {
        if (response?.ok && response.room) {
          sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id);
        }
      }
    );
  }

  requestRoomList(): void {
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.requestRoomList((response: Ack<{ roomList: RoomListItem[] }>) => {
      if (!response?.ok) return;
      this.roomList = response.roomList ?? [];
      this.renderRoomList();
    });
  }

  private tryAutoResume(): void {
    const savedRoomId = sys.localStorage.getItem(LAST_ROOM_ID_KEY);
    if (!savedRoomId) return;

    const savedPlayerId = sys.localStorage.getItem(LAST_PLAYER_ID_KEY) ?? '';
    this.gameManager?.setLocalPlayerId(savedPlayerId);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.resumeRoom(
      { roomId: savedRoomId, clientId: this.clientId, playerId: savedPlayerId || undefined },
      (response: Ack<{ roomId: string; playerId: string; room: Room }>) => {
        if (!response?.ok || !response.room) {
          sys.localStorage.removeItem(LAST_ROOM_ID_KEY);
          sys.localStorage.removeItem(LAST_PLAYER_ID_KEY);
          this.gameManager?.setLocalPlayerId('');
          return;
        }
        sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.roomId);
        if (response.playerId) {
          this.gameManager?.setLocalPlayerId(response.playerId);
        }
      }
    );
  }

  private joinRoomById(roomId: string): void {
    if (this.roomIdEditBox) {
      this.roomIdEditBox.string = roomId;
    }
    this.joinRoom();
  }

  private createRoom(gameMode: GameMode, callback?: (ok: boolean, room?: Room) => void): void {
    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.createRoom(
      { nickname: this.nickname, clientId: this.clientId, gameMode },
      (response: Ack<{ room: Room }>) => {
        if (response?.ok && response.room) {
          sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id);
          callback?.(true, response.room);
          return;
        }
        callback?.(false);
      }
    );
  }

  private launchMode(gameMode: GameMode, fallbackScene: SceneName): void {
    let receivedAck = false;
    this.showToast(gameMode === 'pve_roguelite' ? '进入肉鸽模式...' : '创建房间...');

    this.createRoom(gameMode, (ok, room) => {
      receivedAck = true;
      if (!ok) {
        this.showToast('服务器暂时没有响应，先进入界面预览。');
        this.loadScene(fallbackScene);
        return;
      }
      this.loadScene(this.sceneForRoom(room, fallbackScene));
    });

    this.scheduleOnce(() => {
      if (receivedAck || director.getScene()?.name !== 'Home') return;
      this.showToast('服务器连接中，先进入界面预览。');
      this.loadScene(fallbackScene);
    }, this.fallbackSceneDelay);
  }

  private sceneForRoom(room: Room | undefined, fallbackScene: SceneName): SceneName {
    if (!room) return fallbackScene;
    if (room.phase === 'battle' || room.phase === 'gameOver') {
      return room.gameMode === 'pve_roguelite' ? 'RogueliteBattle' : 'Battle';
    }
    if (
      room.phase === 'reward' ||
      room.phase === 'roguelite_event' ||
      room.phase === 'roguelite_shop' ||
      room.phase === 'roguelite_rest' ||
      room.phase === 'roguelite_continue'
    ) {
      return 'Roguelite';
    }
    return 'Lobby';
  }

  private loadScene(sceneName: SceneName): void {
    if (director.getScene()?.name === sceneName) return;
    director.loadScene(sceneName);
  }

  private playDiceRoll(done: () => void): void {
    const diceNode = this.node.getChildByName('RogueliteButton');
    const sprite = diceNode?.getComponent(Sprite) ?? null;
    const frames = this.diceRollFrames.filter(Boolean);

    if (!sprite || frames.length === 0) {
      this.scheduleOnce(done, 0.2);
      return;
    }

    const originalFrame = sprite.spriteFrame;
    const interval = 0.06;
    const repeat = Math.max(1, Math.floor(this.diceRollDuration / interval));
    let index = 0;

    const tick = () => {
      sprite.spriteFrame = frames[index % frames.length];
      index += 1;
    };

    this.schedule(tick, interval, repeat, 0);
    this.scheduleOnce(() => {
      this.unschedule(tick);
      sprite.spriteFrame = frames[Math.floor(Math.random() * frames.length)] ?? originalFrame;
      done();
    }, this.diceRollDuration);
  }

  private tapProp(nodeName: string, message: string): void {
    const node = this.node.getChildByName(nodeName);
    if (!node) return;

    const originalPosition = node.position.clone();
    tween(node)
      .to(0.08, { position: new Vec3(originalPosition.x, originalPosition.y + 8, originalPosition.z) })
      .to(0.12, { position: originalPosition })
      .start();
    this.showToast(message);
  }

  private renderStatus(status: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = `Server: ${this.serverUrl}\nPlayer: ${this.nickname}\n${status}`;
    }
  }

  private showInfoPanel(title: string, body: string): void {
    this.infoPanelNode?.destroy();

    const panel = this.ensureNode('HomeInfoPanel', 0, 0, 620, 520);
    this.infoPanelNode = panel;
    panel.setSiblingIndex(this.node.children.length - 1);

    const graphics = panel.getComponent(Graphics) ?? panel.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(38, 22, 10, 238);
    graphics.strokeColor = new Color(211, 157, 78, 255);
    graphics.lineWidth = 4;
    graphics.roundRect(-310, -260, 620, 520, 18);
    graphics.fill();
    graphics.stroke();

    const titleLabel = this.ensureLabelInParent('TitleLabel', 0, 185, 560, 58, 30, panel);
    titleLabel.string = title;
    titleLabel.color = new Color(255, 225, 155, 255);

    const bodyLabel = this.ensureLabelInParent('BodyLabel', 0, 25, 540, 260, 22, panel);
    bodyLabel.string = body;
    bodyLabel.color = new Color(255, 240, 204, 255);

    const closeButton = this.createButtonInParent('CloseInfoButton', '关闭', 0, -185, 220, 56, 24, panel);
    closeButton.node.on(Button.EventType.CLICK, this.closeInfoPanel, this);

    const buttonGraphics = closeButton.node.getComponent(Graphics) ?? closeButton.node.addComponent(Graphics);
    buttonGraphics.clear();
    buttonGraphics.fillColor = new Color(132, 77, 31, 255);
    buttonGraphics.strokeColor = new Color(255, 219, 142, 255);
    buttonGraphics.lineWidth = 3;
    buttonGraphics.roundRect(-110, -28, 220, 56, 12);
    buttonGraphics.fill();
    buttonGraphics.stroke();
  }

  private closeInfoPanel(): void {
    this.infoPanelNode?.destroy();
    this.infoPanelNode = null;
  }

  private showToast(message: string): void {
    this.toastNode?.destroy();

    const toast = this.ensureNode('HomeToast', 0, -560, 520, 48);
    this.toastNode = toast;
    toast.setSiblingIndex(this.node.children.length - 1);

    const graphics = toast.getComponent(Graphics) ?? toast.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(36, 21, 10, 220);
    graphics.strokeColor = new Color(221, 166, 82, 230);
    graphics.lineWidth = 2;
    graphics.roundRect(-260, -24, 520, 48, 12);
    graphics.fill();
    graphics.stroke();

    const label = this.ensureLabelInParent('ToastLabel', 0, 0, 500, 38, 18, toast);
    label.string = message;
    label.color = new Color(255, 232, 183, 255);

    this.scheduleOnce(() => {
      if (this.toastNode === toast) {
        toast.destroy();
        this.toastNode = null;
      }
    }, 1.2);
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
    label.color = new Color(255, 238, 196, 255);
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
