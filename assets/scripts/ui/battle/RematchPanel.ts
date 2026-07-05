import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('RematchPanel')
export class RematchPanel extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  summaryLabel: Label | null = null;

  @property({ type: Label })
  readyLabel: Label | null = null;

  @property({ type: Button })
  readyButton: Button | null = null;

  @property({ type: Button })
  closeButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  private onReady: (() => void) | null = null;
  private onClose: (() => void) | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.readyButton?.node.on(Button.EventType.CLICK, this.handleReady, this);
    this.closeButton?.node.on(Button.EventType.CLICK, this.handleClose, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.readyButton?.node.off(Button.EventType.CLICK, this.handleReady, this);
    this.closeButton?.node.off(Button.EventType.CLICK, this.handleClose, this);
  }

  setHandlers(onReady: () => void, onClose?: () => void): void {
    this.onReady = onReady;
    this.onClose = onClose ?? null;
  }

  render(room: Room, localPlayerId: string | undefined): void {
    const show = room.phase === 'gameOver';
    this.node.active = show;
    if (!show) return;
    this.node.setSiblingIndex(998);
    this.applyPanelFrame();
    this.applyButtonFrame(this.readyButton);
    this.applyButtonFrame(this.closeButton);

    const winner = room.winnerId
      ? room.players.find((player) => player.id === room.winnerId)?.nickname ?? room.winnerId
      : room.winnerTeamId
        ? `Team ${room.winnerTeamId}`
        : 'Unknown';
    const readyIds = room.rematchReadyPlayerIds ?? [];
    const readyPlayers = room.players.filter((player) => readyIds.includes(player.id));
    const requiredPlayers = room.players.filter((player) => !player.isBot);
    const isLocalReady = !!localPlayerId && readyIds.includes(localPlayerId);

    if (this.titleLabel) this.titleLabel.string = 'Battle Finished';
    if (this.summaryLabel) this.summaryLabel.string = `Winner: ${winner}`;
    if (this.readyLabel) {
      this.readyLabel.string = [
        `Ready ${readyPlayers.length} / ${Math.max(1, requiredPlayers.length)}`,
        readyPlayers.map((player) => player.nickname).join('  |  ') || 'Waiting for players',
      ].join('\n');
    }
    if (this.readyButton) {
      this.readyButton.interactable = !isLocalReady && !!localPlayerId;
      const label = this.readyButton.node.getChildByName('Label')?.getComponent(Label);
      if (label) label.string = isLocalReady ? 'Ready' : 'Rematch';
    }
  }

  private handleReady(): void {
    this.onReady?.();
  }

  private handleClose(): void {
    this.node.active = false;
    this.onClose?.();
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(580, 350);
    }

    this.applyPanelFrame();

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 118, 510, 40, 25, new Color(57, 34, 17, 255));
    this.summaryLabel ??= this.makeLabel('SummaryLabel', 0, 62, 510, 42, 21, new Color(57, 34, 17, 255));
    this.readyLabel ??= this.makeLabel('ReadyLabel', 0, -18, 510, 82, 18, new Color(89, 58, 28, 255));
    this.readyButton ??= this.makeButton('ReadyButton', 'Rematch', -95, -118, 170, 52, 20);
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 105, -118, 150, 52, 20);
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number, color: Color): Label {
    const node = this.makeNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    label.color = color;
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    if (this.buttonFrame) {
      sprite.spriteFrame = this.buttonFrame;
      button.normalSprite = this.buttonFrame;
      button.hoverSprite = this.buttonFrame;
      button.pressedSprite = this.buttonFrame;
      button.disabledSprite = this.buttonFrame;
      button.target = node;
    } else {
      sprite.color = new Color(201, 157, 84, 255);
    }

    const label = this.makeLabel('Label', 0, 0, width, height, fontSize, new Color(57, 34, 17, 255));
    label.node.parent = node;
    label.node.setPosition(Vec3.ZERO);
    label.string = text;
    return button;
  }

  private applyButtonFrame(button: Button | null): void {
    if (!button || !this.buttonFrame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = this.buttonFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = this.buttonFrame;
    button.hoverSprite = this.buttonFrame;
    button.pressedSprite = this.buttonFrame;
    button.disabledSprite = this.buttonFrame;
    button.target = button.node;
  }

  private applyPanelFrame(): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
      return;
    }
    sprite.color = new Color(38, 28, 18, 235);
  }
}
