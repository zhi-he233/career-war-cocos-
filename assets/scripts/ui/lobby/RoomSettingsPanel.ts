import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('RoomSettingsPanel')
export class RoomSettingsPanel extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  summaryLabel: Label | null = null;

  @property({ type: Button })
  max2Button: Button | null = null;

  @property({ type: Button })
  max4Button: Button | null = null;

  @property({ type: Button })
  max8Button: Button | null = null;

  @property({ type: Button })
  duplicateButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  private maxPlayersHandler: ((maxPlayers: number) => void) | null = null;
  private duplicateHandler: ((allowDuplicateCharacters: boolean) => void) | null = null;
  private currentAllowDuplicateCharacters = true;

  onLoad(): void {
    this.ensureMinimalUi();
    this.max2Button?.node.on(Button.EventType.CLICK, () => this.maxPlayersHandler?.(2), this);
    this.max4Button?.node.on(Button.EventType.CLICK, () => this.maxPlayersHandler?.(4), this);
    this.max8Button?.node.on(Button.EventType.CLICK, () => this.maxPlayersHandler?.(8), this);
    this.duplicateButton?.node.on(Button.EventType.CLICK, () => this.duplicateHandler?.(!this.currentAllowDuplicateCharacters), this);
  }

  onDestroy(): void {
    this.max2Button?.node.off(Button.EventType.CLICK);
    this.max4Button?.node.off(Button.EventType.CLICK);
    this.max8Button?.node.off(Button.EventType.CLICK);
    this.duplicateButton?.node.off(Button.EventType.CLICK);
  }

  setHandlers(maxPlayersHandler: (maxPlayers: number) => void, duplicateHandler: (allowDuplicateCharacters: boolean) => void): void {
    this.maxPlayersHandler = maxPlayersHandler;
    this.duplicateHandler = duplicateHandler;
  }

  render(room: Room, localClientId: string, fixedMaxPlayers: number): void {
    const mode = room.gameMode ?? room.settings.gameMode ?? 'classic';
    const isHost = room.players.some((player) => player.clientId === localClientId && player.isHost);
    const canEdit = isHost && fixedMaxPlayers <= 0 && mode === 'classic';
    this.currentAllowDuplicateCharacters = room.settings.allowDuplicateCharacters;

    if (this.titleLabel) this.titleLabel.string = 'Room Settings';
    if (this.summaryLabel) {
      this.summaryLabel.string = `${mode} | max ${room.settings.maxPlayers} | duplicate ${room.settings.allowDuplicateCharacters ? 'on' : 'off'}`;
    }

    for (const button of [this.max2Button, this.max4Button, this.max8Button, this.duplicateButton]) {
      if (button) button.interactable = canEdit;
    }
    this.setButtonLabel(this.duplicateButton, room.settings.allowDuplicateCharacters ? 'Duplicate: ON' : 'Duplicate: OFF');
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(640, 96);
    if (this.panelFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', -220, 22, 170, 24, 17);
    this.summaryLabel ??= this.makeLabel('SummaryLabel', 70, 22, 360, 24, 14);
    this.max2Button ??= this.makeButton('Max2Button', '2P', -210, -24, 80, 34, 14);
    this.max4Button ??= this.makeButton('Max4Button', '4P', -115, -24, 80, 34, 14);
    this.max8Button ??= this.makeButton('Max8Button', '8P', -20, -24, 80, 34, 14);
    this.duplicateButton ??= this.makeButton('DuplicateButton', 'Duplicate: ON', 175, -24, 190, 34, 14);
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.makeNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    if (this.buttonFrame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = this.buttonFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    const labelNode = node.getChildByName('Label') ?? new Node('Label');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const transform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = new Color(57, 34, 17, 255);
    return button;
  }

  private setButtonLabel(button: Button | null, text: string): void {
    const label = button?.node.getChildByName('Label')?.getComponent(Label);
    if (label) label.string = text;
  }
}
