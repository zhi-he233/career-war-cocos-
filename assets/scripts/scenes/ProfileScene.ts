import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3, director, sys } from 'cc';
import { GameManager } from '../core/GameManager';
import type { Room } from '../shared/types';

const { ccclass, property } = _decorator;

const CLIENT_ID_KEY = 'career-war-cocos-client-id';
const LAST_ROOM_ID_KEY = 'career-war-cocos-last-room-id';

@ccclass('ProfileScene')
export class ProfileScene extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  summaryLabel: Label | null = null;

  @property({ type: Label })
  roomLabel: Label | null = null;

  @property({ type: Button })
  backButton: Button | null = null;

  @property({ type: SpriteFrame })
  parchmentFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  profileCardFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  statusFrame: SpriteFrame | null = null;

  private gameManager: GameManager | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.backButton?.node.on(Button.EventType.CLICK, this.backHome, this);
    this.render(this.gameManager.getRoom());
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.backButton?.node.off(Button.EventType.CLICK, this.backHome, this);
  }

  backHome(): void {
    director.loadScene('Home');
  }

  private render(room: Room | null): void {
    const clientId = this.gameManager?.localClientId || sys.localStorage.getItem(CLIENT_ID_KEY) || 'unknown';
    const nickname = this.gameManager?.localNickname || 'Player';
    const me = this.gameManager?.getLocalPlayer();

    if (this.titleLabel) {
      this.titleLabel.string = '玩家档案';
    }

    if (this.summaryLabel) {
      this.summaryLabel.string = [
        `昵称：${me?.nickname ?? nickname}`,
        `客户端 ID：${clientId}`,
        `玩家 ID：${this.gameManager?.localPlayerId || me?.id || '未进入房间'}`,
        '常用入口：经典 / 人机 / 肉鸽',
        '',
        '后续可在这里接入：胜场、常用职业、肉鸽进度、收藏徽章。',
      ].join('\n');
    }

    if (this.roomLabel) {
      const savedRoomId = sys.localStorage.getItem(LAST_ROOM_ID_KEY) || '无';
      this.roomLabel.string = room
        ? `当前房间：${room.id}\n模式：${room.gameMode ?? room.settings.gameMode}\n阶段：${room.phase}\n人数：${room.players.length}/${room.settings.maxPlayers}`
        : `当前房间：无\n上次房间：${savedRoomId}`;
    }
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('ProfileParchmentPanel', 0, 60, 650, 760, this.parchmentFrame);
    this.ensureSpriteNode('ProfileCardPanel', 0, 240, 360, 245, this.profileCardFrame ?? this.statusFrame);
    this.ensureSpriteNode('ProfileRoomPanel', 0, -175, 600, 160, this.statusFrame);

    this.titleLabel ??= this.ensureLabel('TitleLabel', 0, 500, 640, 72, 34);
    this.summaryLabel ??= this.ensureLabel('SummaryLabel', 0, 205, 560, 260, 20);
    this.roomLabel ??= this.ensureLabel('RoomLabel', 0, -175, 560, 145, 18);
    this.backButton ??= this.createButton('BackButton', '返回首页', 0, -455, 250, 60, 22, this.node);
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
    label.color = new Color(255, 238, 196, 255);
    return label;
  }

  private createButton(
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
    this.applyButtonFrame(button, this.statusFrame);

    const labelNode = new Node('Label');
    node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);

    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(width, height);

    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = false;
    label.color = new Color(57, 34, 17, 255);
    return button;
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
}
