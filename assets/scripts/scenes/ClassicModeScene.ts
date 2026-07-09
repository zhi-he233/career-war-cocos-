import {
  _decorator,
  Button,
  Color,
  Graphics,
  Label,
  Node,
  SpriteFrame,
  director,
  sys,
} from 'cc';
import type { GameMode, Room, RoomSettings } from '../shared/types';
import { MobileSceneBase } from '../ui/MobileSceneBase';
import * as F from '../ui/MobileUIFactory';
import { COLORS, FONTS, LAYOUT, DESIGN_W, DESIGN_H } from '../ui/MobileUIFactory';

const { ccclass, property } = _decorator;
const LAST_ROOM_ID_KEY = 'career-war-cocos-last-room-id';

type Ack<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };
type ClassicLobbySceneName = 'Classic1v1Lobby' | 'DuoLobby';

@ccclass('ClassicModeScene')
export class ClassicModeScene extends MobileSceneBase {
  // ── Editor bindings (optional) ──
  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: SpriteFrame })
  parchmentFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  actionCardFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  statusFrame: SpriteFrame | null = null;

  // ── Private state ──
  private selectedMode: GameMode = 'classic';

  // ═══════════════════════════════════════════════════════════
  // Layout Constants
  // ═══════════════════════════════════════════════════════════
  private readonly L = {
    CARD_W:        580,
    CARD_H:        180,
    CARD_1V1_Y:    320,
    CARD_2V2_Y:    120,
    CARD_ROGUE_Y:  -80,
    CONFIRM_BTN_Y: -420,
    CONFIRM_BTN_W: 340,
    CONFIRM_BTN_H: 64,
  } as const;

  // ═══════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════

  override onLoad(): void {
    super.onLoad();
    this.setStatus('选择对战模式');
  }

  // ═══════════════════════════════════════════════════════════
  // Mobile-First UI
  // ═══════════════════════════════════════════════════════════

  ensureMinimalUi(): void {
    this.createBackground();
    this.createTopBar();
    this.createModeCards();
    this.createConfirmButton();
  }

  private createBackground(): void {
    F.makeSkinnedBackground(this.node, 'bgDesk');
  }

  private createTopBar(): void {
    const barY = DESIGN_H/2 - LAYOUT.TOP_BAR_H/2 - LAYOUT.SAFE_TOP;
    const bar = F.makeNode('TopBar', this.node, 0, barY, DESIGN_W, LAYOUT.TOP_BAR_H);

    const g = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    g.clear();
    g.fillColor = COLORS.WOOD_DARK;
    g.rect(-DESIGN_W/2, -LAYOUT.TOP_BAR_H/2, DESIGN_W, LAYOUT.TOP_BAR_H);
    g.fill();
    g.strokeColor = COLORS.GOLD_BORDER;
    g.lineWidth = 2;
    g.moveTo(-DESIGN_W/2, -LAYOUT.TOP_BAR_H/2);
    g.lineTo(DESIGN_W/2, -LAYOUT.TOP_BAR_H/2);
    g.stroke();

    // Back button with real skin
    const backBtn = F.makeSkinnedButton('BackBtn', '返回', bar,
      -DESIGN_W/2 + 70, 0, 110, 44, FONTS.BODY, 'buttonNormal', 'normal');
    F.addButtonFeedback(backBtn.button);
    backBtn.button.node.on(Button.EventType.CLICK, () => this.backToHome());

    // Status label (right/center)
    this.statusLabel = F.makeLabel('StatusLabel', bar, 40, 0, DESIGN_W - 240, 40,
      FONTS.HEADER, '选择对战模式', COLORS.GOLD_TEXT);
    this.statusLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  private createModeCards(): void {
    const { CARD_W, CARD_H, CARD_1V1_Y, CARD_2V2_Y, CARD_ROGUE_Y } = this.L;

    // 1V1 Card
    this.createModeCard('Card_1V1', CARD_1V1_Y,
      '⚔️  1V1 经典对战',
      '经典单挑模式\n选择你的职业，投骰决胜\n一局定胜负',
      () => { this.selectedMode = 'classic'; this.highlightCard('Card_1V1'); });

    // 2V2 Card
    this.createModeCard('Card_2V2', CARD_2V2_Y,
      '👥  2V2 双角色对战',
      '双人组队模式\n每人控制两个职业\n配合策略取胜',
      () => { this.selectedMode = 'duo_2v2'; this.highlightCard('Card_2V2'); });

    // Roguelite Card
    this.createModeCard('Card_Roguelite', CARD_ROGUE_Y,
      '🎲  肉鸽冒险',
      '单人闯关模式\n每层选择路线和奖励\n击败最终Boss',
      () => { this.selectedMode = 'pve_roguelite'; this.highlightCard('Card_Roguelite'); });

    // Default selection
    this.highlightCard('Card_1V1');
  }

  private createModeCard(
    name: string,
    y: number,
    title: string,
    desc: string,
    onClick: () => void,
  ): void {
    const { CARD_W, CARD_H } = this.L;

    const card = F.makeNode(name, this.node, 0, y, CARD_W, CARD_H);

    // Draw card background + apply parchment texture
    const g = card.getComponent(Graphics) ?? card.addComponent(Graphics);
    F.drawParchmentBg(g, -CARD_W/2, -CARD_H/2, CARD_W, CARD_H, 14);
    F.applyCardSkin(card);

    // Title
    F.makeLabel(`${name}_Title`, card, 0, CARD_H/2 - 40, CARD_W - 60, 44,
      FONTS.HEADER, title, COLORS.TEXT_DARK)
      .horizontalAlign = Label.HorizontalAlign.CENTER;

    // Description
    F.makeLabel(`${name}_Desc`, card, 0, -10, CARD_W - 80, 90,
      FONTS.SMALL, desc, COLORS.TEXT_WOOD)
      .horizontalAlign = Label.HorizontalAlign.CENTER;

    // Click handler
    card.on(Node.EventType.TOUCH_END, onClick);
  }

  private highlightCard(activeName: string): void {
    const cardNames = ['Card_1V1', 'Card_2V2', 'Card_Roguelite'];
    cardNames.forEach((name) => {
      const card = this.node.getChildByName(name);
      if (!card) return;
      const g = card.getComponent(Graphics);
      if (!g) return;
      const isActive = name === activeName;
      const { CARD_W, CARD_H } = this.L;

      // Redraw with active state
      g.clear();
      if (isActive) {
        // Highlighted: brighter parchment + thicker gold border
        g.fillColor = COLORS.GOLD_BORDER;
        g.roundRect(-CARD_W/2 - 3, -CARD_H/2 - 3, CARD_W + 6, CARD_H + 6, 16);
        g.fill();
        g.fillColor = COLORS.PARCHMENT_LIGHT;
        g.roundRect(-CARD_W/2, -CARD_H/2, CARD_W, CARD_H, 14);
        g.fill();
        g.strokeColor = COLORS.GOLD_BRIGHT;
        g.lineWidth = 3;
        g.roundRect(-CARD_W/2 + 2, -CARD_H/2 + 2, CARD_W - 4, CARD_H - 4, 12);
        g.stroke();
      } else {
        F.drawParchmentBg(g, -CARD_W/2, -CARD_H/2, CARD_W, CARD_H, 14);
      }
    });
  }

  private createConfirmButton(): void {
    const { CONFIRM_BTN_Y, CONFIRM_BTN_W, CONFIRM_BTN_H } = this.L;

    const btn = F.makeSkinnedButton('ConfirmBtn', '确认选择', this.node,
      0, CONFIRM_BTN_Y, CONFIRM_BTN_W, CONFIRM_BTN_H, FONTS.BUTTON, 'buttonPrimary', 'primary');
    F.addButtonFeedback(btn.button);
    btn.button.node.on(Button.EventType.CLICK, () => this.confirmSelection());
  }

  // ═══════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════

  private confirmSelection(): void {
    switch (this.selectedMode) {
      case 'classic':
        this.createRoom('classic', 'Classic1v1Lobby', { maxPlayers: 2 });
        break;
      case 'duo_2v2':
        this.createRoom('duo_2v2', 'DuoLobby');
        break;
      case 'pve_roguelite':
        this.createRoom('pve_roguelite', 'RogueliteLobby');
        break;
    }
  }

  private createRoom(gameMode: GameMode, fallbackScene: ClassicLobbySceneName | 'RogueliteLobby', settings?: Partial<RoomSettings>): void {
    let receivedAck = false;
    this.setStatus('正在创建房间...');
    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.createRoom(
      { nickname: this.nickname, clientId: this.clientId, gameMode },
      (response: Ack<{ room: Room }>) => {
        receivedAck = true;
        if (response?.ok && response.room) {
          sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id);
          if (settings) this.serverActions.updateRoomSettings(settings);
          this.loadScene(fallbackScene);
          return;
        }
        this.setStatus('服务器未就绪，进入预览界面');
        this.loadScene(fallbackScene);
      }
    );

    this.scheduleOnce(() => {
      if (receivedAck || director.getScene()?.name !== 'ClassicMode') return;
      this.setStatus('正在连接，进入预览界面');
      this.loadScene(fallbackScene);
    }, this.fallbackSceneDelay);
  }

  private setStatus(msg: string): void {
    if (this.statusLabel?.isValid) {
      this.statusLabel.string = msg;
    }
    this.gameManager?.setStatus(msg);
  }
}
