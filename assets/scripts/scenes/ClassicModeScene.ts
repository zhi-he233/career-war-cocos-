import {
  _decorator,
  Button,
  Color,
  Component,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3,
  director,
  sys,
} from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import type { GameMode, Room, RoomSettings } from '../shared/types';

const { ccclass, property } = _decorator;
const CLIENT_ID_KEY = 'career-war-cocos-client-id';
const LAST_ROOM_ID_KEY = 'career-war-cocos-last-room-id';

type Ack<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };
type ClassicLobbySceneName = 'Classic1v1Lobby' | 'DuoLobby';

/** Fallback layout constants — only used when enableFallbackUi=true. */
const LAYOUT = {
  PARCHMENT:   { x: 0, y: 40, w: 660, h: 760 },
  STATUS:      { x: 0, y: 480, w: 620, h: 64, fs: 22 },
  CARD_1V1:    { x: 0, y: 160, w: 560, h: 190 },
  CARD_2V2:    { x: 0, y: -60, w: 560, h: 190 },
  BACK:        { x: 0, y: -300, w: 280, h: 64, fs: 22 },
} as const;

@ccclass('ClassicModeScene')
export class ClassicModeScene extends Component {
  @property
  serverUrl = 'http://localhost:3001';

  @property
  nickname = 'Player';

  @property
  fallbackSceneDelay = 0.8;

  @property
  enableFallbackUi = false;

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Button })
  classic1v1Button: Button | null = null;

  @property({ type: Button })
  duo2v2Button: Button | null = null;

  @property({ type: Button })
  backButton: Button | null = null;

  @property({ type: SpriteFrame })
  parchmentFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  actionCardFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  statusFrame: SpriteFrame | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private clientId = '';

  onLoad(): void {
    if (this.enableFallbackUi) this.ensureMinimalUi();
    this.clientId = this.getClientId();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);

    this.classic1v1Button?.node.on(Button.EventType.CLICK, this.createClassic1v1Room, this);
    this.duo2v2Button?.node.on(Button.EventType.CLICK, this.createDuo2v2Room, this);
    this.backButton?.node.on(Button.EventType.CLICK, this.backHome, this);
    this.setStatus('选择对战模式');

    if (!this.enableFallbackUi) this.warnMissingBindings();
  }

  onDestroy(): void {
    this.classic1v1Button?.node.off(Button.EventType.CLICK, this.createClassic1v1Room, this);
    this.duo2v2Button?.node.off(Button.EventType.CLICK, this.createDuo2v2Room, this);
    this.backButton?.node.off(Button.EventType.CLICK, this.backHome, this);
  }

  createClassic1v1Room(): void {
    this.createRoom('classic', 'Classic1v1Lobby', { maxPlayers: 2 });
  }

  createDuo2v2Room(): void {
    this.createRoom('duo_2v2', 'DuoLobby');
  }

  backHome(): void {
    director.loadScene('Home');
  }

  private createRoom(gameMode: GameMode, fallbackScene: ClassicLobbySceneName, settings?: Partial<RoomSettings>): void {
    let receivedAck = false;
    this.setStatus('正在创建房间...');
    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.createRoom(
      { nickname: this.nickname, clientId: this.clientId, gameMode },
      (response: Ack<{ room: Room }>) => {
        receivedAck = true;
        if (!response?.ok || !response.room) {
          this.setStatus('服务器未就绪，进入预览界面');
          director.loadScene(fallbackScene);
          return;
        }

        sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id);
        if (settings) {
          this.serverActions.updateRoomSettings(settings);
        }
        director.loadScene(fallbackScene);
      }
    );

    this.scheduleOnce(() => {
      if (receivedAck || director.getScene()?.name !== 'ClassicMode') return;
      this.setStatus('正在连接，进入预览界面');
      director.loadScene(fallbackScene);
    }, this.fallbackSceneDelay);
  }

  private warnMissingBindings(): void {
    const missing: string[] = [];
    if (!this.classic1v1Button) missing.push('classic1v1Button');
    if (!this.duo2v2Button) missing.push('duo2v2Button');
    if (!this.backButton) missing.push('backButton');
    if (missing.length > 0) {
      console.warn(`[ClassicModeScene] Missing @property bindings (no fallback UI): ${missing.join(', ')}. Bind them in the editor or set enableFallbackUi=true.`);
    }
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('ClassicModeParchmentPanel', LAYOUT.PARCHMENT.x, LAYOUT.PARCHMENT.y, LAYOUT.PARCHMENT.w, LAYOUT.PARCHMENT.h, this.parchmentFrame);
    this.statusLabel ??= this.ensureLabel('StatusLabel', LAYOUT.STATUS.x, LAYOUT.STATUS.y, LAYOUT.STATUS.w, LAYOUT.STATUS.h, LAYOUT.STATUS.fs);
    this.classic1v1Button ??= this.createButton('Classic1v1Button', '1V1 经典对战', LAYOUT.CARD_1V1.x, LAYOUT.CARD_1V1.y, LAYOUT.CARD_1V1.w, LAYOUT.CARD_1V1.h, 24);
    this.duo2v2Button ??= this.createButton('Duo2v2Button', '2V2 双角色对战', LAYOUT.CARD_2V2.x, LAYOUT.CARD_2V2.y, LAYOUT.CARD_2V2.w, LAYOUT.CARD_2V2.h, 24);
    this.backButton ??= this.createButton('BackButton', '返回主页', LAYOUT.BACK.x, LAYOUT.BACK.y, LAYOUT.BACK.w, LAYOUT.BACK.h, LAYOUT.BACK.fs);
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));

    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.ensureNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
    label.enableWrapText = true;
    label.color = new Color(64, 38, 18, 255);
    return label;
  }

  private createButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.ensureNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;
    this.applyButtonFrame(button, name === 'BackButton' ? this.statusFrame : this.actionCardFrame);

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
    label.lineHeight = fontSize + 8;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private ensureSpriteNode(name: string, x: number, y: number, width: number, height: number, frame: SpriteFrame | null): Node {
    const node = this.ensureNode(name, x, y, width, height);
    if (frame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = frame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    node.setSiblingIndex(1);
    return node;
  }

  private applyButtonFrame(button: Button, frame: SpriteFrame | null): void {
    if (!frame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = frame;
    button.hoverSprite = frame;
    button.pressedSprite = frame;
    button.disabledSprite = frame;
    button.target = button.node;
  }

  private setStatus(status: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = `对战模式选择\n${status}`;
    }
    this.gameManager?.setStatus(status);
  }

  private getClientId(): string {
    const existing = sys.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;

    const next = `cocos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sys.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  }
}
