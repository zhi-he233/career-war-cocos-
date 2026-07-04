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

@ccclass('ClassicModeScene')
export class ClassicModeScene extends Component {
  @property
  serverUrl = 'http://localhost:3001';

  @property
  nickname = 'Player';

  @property
  fallbackSceneDelay = 0.8;

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
    this.ensureMinimalUi();
    this.clientId = this.getClientId();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);

    this.classic1v1Button?.node.on(Button.EventType.CLICK, this.createClassic1v1Room, this);
    this.duo2v2Button?.node.on(Button.EventType.CLICK, this.createDuo2v2Room, this);
    this.backButton?.node.on(Button.EventType.CLICK, this.backHome, this);
    this.setStatus('Choose classic battle size');
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
    this.setStatus('Creating room...');
    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.createRoom(
      { nickname: this.nickname, clientId: this.clientId, gameMode },
      (response: Ack<{ room: Room }>) => {
        receivedAck = true;
        if (!response?.ok || !response.room) {
          this.setStatus('Server not ready, opening preview scene');
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
      this.setStatus('Connecting, opening preview scene');
      director.loadScene(fallbackScene);
    }, this.fallbackSceneDelay);
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('ClassicModeParchmentPanel', 0, 120, 660, 620, this.parchmentFrame);
    this.statusLabel ??= this.ensureLabel('StatusLabel', 0, 460, 620, 88, 24);
    this.classic1v1Button ??= this.createButton('Classic1v1Button', '1V1 Battle', -155, 160, 260, 300, 28);
    this.duo2v2Button ??= this.createButton('Duo2v2Button', '2V2 Battle', 155, 160, 260, 300, 28);
    this.backButton ??= this.createButton('BackButton', 'Back', 0, -340, 220, 58, 24);
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
      this.statusLabel.string = `Classic Battle\n${status}`;
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
