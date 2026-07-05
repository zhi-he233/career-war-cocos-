import { _decorator, Button, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, director, instantiate, sys } from 'cc';
import { GameManager } from '../core/GameManager';
import { ProfileService } from '../services/ProfileService';
import type { Room } from '../shared/types';
import { ProfilePanel } from '../ui/profile/ProfilePanel';

const { ccclass, property } = _decorator;

const CLIENT_ID_KEY = 'career-war-cocos-client-id';

@ccclass('ProfileScene')
export class ProfileScene extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: ProfilePanel })
  profilePanel: ProfilePanel | null = null;

  @property({ type: Button })
  backButton: Button | null = null;

  @property({ type: Prefab })
  profilePanelPrefab: Prefab | null = null;

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
    const profile = ProfileService.loadProfile({
      nickname: this.gameManager?.localNickname || 'Player',
      clientId: this.gameManager?.localClientId || sys.localStorage.getItem(CLIENT_ID_KEY) || 'unknown',
      playerId: this.gameManager?.localPlayerId || undefined,
      room,
    });
    if (this.titleLabel) this.titleLabel.string = 'Player Profile';
    this.profilePanel?.render(profile, room);
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('ProfileParchmentPanel', 0, 60, 660, 800, this.parchmentFrame);
    this.titleLabel ??= this.ensureLabel('TitleLabel', 0, 520, 640, 58, 30);

    const panelNode = this.ensurePrefabNode('ProfilePanel', this.profilePanelPrefab, 0, 40, 640, 760);
    this.profilePanel ??= panelNode.getComponent(ProfilePanel) ?? panelNode.addComponent(ProfilePanel);
    this.profilePanel.panelFrame = this.profileCardFrame ?? this.parchmentFrame;
    this.profilePanel.sectionFrame = this.statusFrame ?? this.profileCardFrame;

    this.backButton ??= this.createButton('BackButton', 'Back', 0, -545, 250, 58, 22, this.node);
  }

  private ensurePrefabNode(name: string, prefab: Prefab | null, x: number, y: number, width: number, height: number): Node {
    const existing = this.node.getChildByName(name);
    if (existing) existing.destroy();

    const node = prefab ? instantiate(prefab) : new Node(name);
    node.name = name;
    this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
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
