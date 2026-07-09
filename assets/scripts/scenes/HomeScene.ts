import {
  _decorator,
  Button,
  Color,
  EditBox,
  Graphics,
  Label,
  Node,
  Prefab,
  Sprite,
  SpriteFrame,
  instantiate,
  tween,
  UITransform,
  Vec3,
  director,
  sys,
} from 'cc';
import type { Room, RoomListItem } from '../shared/types';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { RuleGuidePanel } from '../ui/system/RuleGuidePanel';
import { ToastLayer } from '../ui/system/ToastLayer';
import { MobileSceneBase } from '../ui/MobileSceneBase';
import { MobileUIFactory as F, COLORS, FONTS, LAYOUT, DESIGN_W, DESIGN_H } from '../ui/MobileUIFactory';
import { createMockRoomList, type MockRoomListItem } from '../mock/MockData';
import type { UiFrameKey } from '../core/UiSkin';

const { ccclass, property } = _decorator;
const LAST_ROOM_ID_KEY = 'career-war-cocos-last-room-id';
const LAST_PLAYER_ID_KEY = 'career-war-cocos-player-id';

type Ack<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };

@ccclass('HomeScene')
export class HomeScene extends MobileSceneBase {
  // ── Editor bindings (optional, fallback UI fills in) ──
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

  @property({ type: [SpriteFrame] })
  diceRollFrames: SpriteFrame[] = [];

  @property({ type: Prefab })
  ruleGuidePanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  toastLayerPrefab: Prefab | null = null;

  @property({ type: SpriteFrame })
  overlayPanelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  overlayButtonFrame: SpriteFrame | null = null;

  @property
  diceRollDuration = 0.72;

  // ── Private state ──
  private roomList: MockRoomListItem[] = [];
  private infoPanelNode: Node | null = null;
  private toastNode: Node | null = null;
  private joinPanelNode: Node | null = null;
  private ruleGuidePanel: RuleGuidePanel | null = null;
  private toastLayer: ToastLayer | null = null;
  private isLaunchingRoguelite = false;
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  // ═══════════════════════════════════════════════════════════
  // Layout Constants (720×1280 design space)
  // ═══════════════════════════════════════════════════════════
  private readonly L = {
    TITLE_Y:          480,
    TITLE_PANEL_W:    560,
    TITLE_PANEL_H:    140,
    SUBTITLE_Y:       430,
    BUTTON_START_Y:   280,
    BUTTON_JOIN_Y:    160,
    BUTTON_SETTINGS_Y: 40,
    BUTTON_W:         400,
    BUTTON_H:         72,
    DECO_LEFT_X:      -180,
    DECO_RIGHT_X:     180,
    DECO_CANDLE_Y:    300,
    DECO_DICE_Y:      200,
    DECO_MUG_Y:       100,
    STATUS_Y:         -520,
    STATUS_W:         620,
    STATUS_H:         60,
    JOIN_PANEL_W:     520,
    JOIN_PANEL_H:     360,
    JOIN_PANEL_Y:     -20,
  } as const;

  // ═══════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════

  override onLoad(): void {
    super.onLoad();

    // Set up after base class init
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager!);

    this.gameManager!.onStatusUpdated(this.handleStatusUpdatedBound, this);
    this.ensureOverlayPrefabs();
    this.renderStatus(this.gameManager!.getStatus());
    this.tryAutoResume();
  }

  onDestroy(): void {
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
  }

  // ═══════════════════════════════════════════════════════════
  // Mobile-First UI (enableFallbackUi=true)
  // ═══════════════════════════════════════════════════════════

  ensureMinimalUi(): void {
    this.createBackground();
    this.createTitlePanel();
    this.createDecorations();
    this.createMainButtons();
    this.createStatusArea();
  }

  private createBackground(): void {
    F.makeSkinnedBackground(this.node, 'bgDesk');
  }

  private createTitlePanel(): void {
    const { TITLE_Y, TITLE_PANEL_W, TITLE_PANEL_H } = this.L;
    const result = F.makeSkinnedPanel(this.node, 0, TITLE_Y,
      TITLE_PANEL_W, TITLE_PANEL_H, undefined, 'panelParchment');

    F.makeLabel('MainTitle', result.bg, 0, 20, TITLE_PANEL_W - 40, 52,
      FONTS.TITLE + 8, '职业互怼', COLORS.GOLD_TEXT)
      .horizontalAlign = Label.HorizontalAlign.CENTER;

    F.makeLabel('Subtitle', result.bg, 0, -30, TITLE_PANEL_W - 60, 32,
      FONTS.SMALL, '— 选择你的职业，投出命运之骰 —', COLORS.FANTASY_GOLD)
      .horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  private createDecorations(): void {
    // Use real candle & dice images where available, fallback to emoji labels
    const decorConfig: Array<{name: string; y: number; x: number; key: UiFrameKey | null; emoji: string; msg: string; w: number; h: number}> = [
      { name: 'CandleProp', y: this.L.DECO_CANDLE_Y, x: this.L.DECO_LEFT_X,  key: 'decCandle', emoji: '🕯️', msg: '烛火晃了一下。', w: 64, h: 64 },
      { name: 'DiceProp',   y: this.L.DECO_DICE_Y,   x: this.L.DECO_RIGHT_X, key: 'decDice',   emoji: '🎲', msg: '骰子滚了一下。', w: 64, h: 64 },
      { name: 'MugProp',    y: this.L.DECO_MUG_Y,    x: this.L.DECO_LEFT_X,  key: null,        emoji: '🍺', msg: '杯子被轻轻碰了一下。', w: 48, h: 48 },
    ];

    decorConfig.forEach((d) => {
      let node: Node;
      if (d.key) {
        node = F.makeSkinnedSprite(d.name, this.node, d.x, d.y, d.w, d.h, d.key, d.emoji);
      } else {
        node = F.makeNode(d.name, this.node, d.x, d.y, d.w, d.h);
        const label = node.addComponent(Label);
        label.string = d.emoji;
        label.fontSize = 28;
        label.color = COLORS.FANTASY_GOLD;
      }
      node.on(Node.EventType.TOUCH_END, () => this.playPropTap(node, d.msg));
    });
  }

  private createMainButtons(): void {
    const { BUTTON_START_Y, BUTTON_JOIN_Y, BUTTON_SETTINGS_Y, BUTTON_W, BUTTON_H } = this.L;

    const startBtn = F.makeSkinnedButton('StartGameBtn', '开始游戏', this.node,
      0, BUTTON_START_Y, BUTTON_W, BUTTON_H, FONTS.BUTTON + 2, 'buttonPrimary', 'primary');
    F.addButtonFeedback(startBtn.button);
    startBtn.button.node.on(Button.EventType.CLICK, () => this.loadScene('ClassicMode'));

    const joinBtn = F.makeSkinnedButton('JoinRoomBtn', '加入房间', this.node,
      0, BUTTON_JOIN_Y, BUTTON_W, BUTTON_H, FONTS.BUTTON, 'buttonNormal', 'normal');
    F.addButtonFeedback(joinBtn.button);
    joinBtn.button.node.on(Button.EventType.CLICK, () => this.toggleJoinPanel());

    const settingsBtn = F.makeSkinnedButton('SettingsBtn', '玩家档案', this.node,
      0, BUTTON_SETTINGS_Y, BUTTON_W, BUTTON_H, FONTS.BUTTON, 'buttonNormal', 'normal');
    F.addButtonFeedback(settingsBtn.button);
    settingsBtn.button.node.on(Button.EventType.CLICK, () => director.loadScene('Profile'));
  }

  private createStatusArea(): void {
    const { STATUS_Y, STATUS_W, STATUS_H } = this.L;
    const panel = F.makeNode('StatusArea', this.node, 0, STATUS_Y, STATUS_W, STATUS_H);
    const g = panel.getComponent(Graphics) ?? panel.addComponent(Graphics);
    F.drawWoodenPanel(g, -STATUS_W/2, -STATUS_H/2, STATUS_W, STATUS_H, 8);

    this.statusLabel = F.makeLabel('StatusLabel', panel, 0, 0, STATUS_W - 20, STATUS_H - 8,
      FONTS.SMALL, '服务器未连接 — 展示模式', COLORS.FANTASY_GOLD);
    this.statusLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  // ── Join Room Panel (slide-in overlay) ──

  private toggleJoinPanel(): void {
    if (this.joinPanelNode?.isValid) {
      this.joinPanelNode.destroy();
      this.joinPanelNode = null;
      return;
    }
    this.showJoinPanel();
  }

  private showJoinPanel(): void {
    const { JOIN_PANEL_W, JOIN_PANEL_H, JOIN_PANEL_Y } = this.L;

    // Overlay
    const overlay = F.makeNode('JoinOverlay', this.node, 0, 0, DESIGN_W, DESIGN_H);
    overlay.setSiblingIndex(999);
    const og = overlay.getComponent(Graphics) ?? overlay.addComponent(Graphics);
    og.clear();
    og.fillColor = COLORS.OVERLAY_DARK;
    og.rect(-DESIGN_W/2, -DESIGN_H/2, DESIGN_W, DESIGN_H);
    og.fill();
    overlay.on(Node.EventType.TOUCH_END, () => this.toggleJoinPanel());

    // Panel — use parchment texture or Graphics fallback
    const panelResult = F.makeSkinnedPanel(this.node, 0, JOIN_PANEL_Y,
      JOIN_PANEL_W, JOIN_PANEL_H, undefined, 'panelParchment');
    const panel = panelResult.bg;
    panel.setSiblingIndex(1000);

    F.makeLabel('JoinTitle', panel, 0, JOIN_PANEL_H/2 - 32, JOIN_PANEL_W - 40, 36,
      FONTS.HEADER, '加入房间', COLORS.TEXT_DARK)
      .horizontalAlign = Label.HorizontalAlign.CENTER;

    // Room ID input
    const editBox = F.makeEditBox('RoomIdInput', panel, 0, 70, JOIN_PANEL_W - 100, 52, '输入房间号', FONTS.BODY);
    const savedRoomId = sys.localStorage.getItem(LAST_ROOM_ID_KEY) ?? '';
    if (savedRoomId) editBox.string = savedRoomId;
    this.roomIdEditBox = editBox;

    // Join button
    const joinBtn = F.makeButton('JoinConfirmBtn', '加入', panel, 0, -10, 280, 56, FONTS.BUTTON, 'primary');
    F.addButtonFeedback(joinBtn.button);
    joinBtn.button.node.on(Button.EventType.CLICK, () => this.joinRoom());

    // Room list
    const roomListLabel = F.makeLabel('RoomListTitle', panel, 0, -80, JOIN_PANEL_W - 40, 28,
      FONTS.SMALL, '可用房间 (点击加入)', COLORS.TEXT_DARK);
    roomListLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

    const listContainer = F.makeNode('RoomListContainer', panel, 0, -155, JOIN_PANEL_W - 40, 140);
    this.roomListNode = listContainer;
    this.renderRoomList();

    // Close button
    const closeBtn = F.makeButton('CloseJoinBtn', '✕', panel, JOIN_PANEL_W/2 - 40, JOIN_PANEL_H/2 - 36, 48, 40, 20, 'normal');
    closeBtn.button.node.on(Button.EventType.CLICK, () => {
      panel.destroy();
      overlay.destroy();
      this.joinPanelNode = null;
    });

    this.joinPanelNode = panel;
    this.joinPanelNode['_overlay'] = overlay;
  }

  private renderRoomList(): void {
    if (!this.roomListNode?.isValid) return;
    F.clearChildren(this.roomListNode);

    this.roomList = createMockRoomList();

    this.roomList.forEach((room, index) => {
      const y = 50 - index * 46;
      const itemW = 420;
      const itemH = 40;
      const item = F.makeNode(`Room_${room.roomId}`, this.roomListNode!, 0, y, itemW, itemH);

      const g = item.getComponent(Graphics) ?? item.addComponent(Graphics);
      g.clear();
      g.fillColor = room.canJoin ? COLORS.WOOD_LIGHT : new Color(100, 80, 60, 180);
      g.strokeColor = COLORS.GOLD_BORDER;
      g.lineWidth = 1;
      g.roundRect(-itemW/2, -itemH/2, itemW, itemH, 6);
      g.fill();
      g.stroke();

      const text = `${room.roomId} | ${room.hostName} | ${room.playerCount}/${room.maxPlayers} | ${room.gameMode}`;
      const label = F.makeLabel(`RoomLabel_${room.roomId}`, item, 0, 0, itemW - 16, itemH - 4, 14, text, COLORS.TEXT_LIGHT);
      label.horizontalAlign = Label.HorizontalAlign.CENTER;

      if (room.canJoin) {
        item.on(Node.EventType.TOUCH_END, () => {
          if (this.roomIdEditBox) {
            this.roomIdEditBox.string = room.roomId;
          }
          this.joinRoom();
        });
      }
    });

    if (this.roomList.length === 0) {
      F.makeLabel('RoomListEmpty', this.roomListNode, 0, 20, 400, 30, FONTS.SMALL,
        '暂无房间 (Mock 数据)', COLORS.TEXT_DARK)
        .horizontalAlign = Label.HorizontalAlign.CENTER;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════

  private joinRoom(): void {
    const roomId = this.roomIdEditBox?.string.trim();
    if (!roomId) {
      this.showToast('请输入房间号');
      return;
    }

    this.gameManager?.setLocalPlayer(this.clientId, this.nickname);
    this.gameManager?.connect(this.serverUrl);
    this.serverActions.joinRoom(
      { nickname: this.nickname, clientId: this.clientId, roomId },
      (response: Ack<{ roomId: string; playerId: string; room: Room }>) => {
        if (response?.ok && response.room) {
          sys.localStorage.setItem(LAST_ROOM_ID_KEY, response.room.id!);
        }
      }
    );
  }

  private playDiceRoll(done: () => void): void {
    const diceNode = this.node.getChildByName('DiceProp');
    if (!diceNode) {
      this.scheduleOnce(done, 0.2);
      return;
    }

    const frames = this.diceRollFrames.filter(Boolean);
    if (frames.length === 0) {
      this.scheduleOnce(done, 0.2);
      return;
    }

    const originalPos = diceNode.position.clone();
    const interval = 0.06;
    const repeat = Math.max(1, Math.floor(this.diceRollDuration / interval));
    let index = 0;

    const tick = () => {
      const sprite = diceNode.getComponent(Sprite);
      if (sprite) sprite.spriteFrame = frames[index % frames.length];
      index += 1;
    };

    this.schedule(tick, interval, repeat, 0);
    this.scheduleOnce(() => {
      this.unschedule(tick);
      done();
    }, this.diceRollDuration);
  }

  private playPropTap(node: Node, message: string): void {
    const originalPos = node.position.clone();
    tween(node)
      .to(0.08, { position: new Vec3(originalPos.x, originalPos.y + 8, originalPos.z) })
      .to(0.12, { position: originalPos })
      .start();
    this.showToast(message);
  }

  private renderStatus(status: string): void {
    if (this.statusLabel?.isValid) {
      this.statusLabel.string = status || '服务器未连接 — 展示模式';
    }
  }

  private showToast(message: string): void {
    if (this.toastLayer) {
      this.toastLayer.show(message, 1.2);
      return;
    }
    // Fallback toast
    this.toastNode?.destroy();

    const toast = F.makeNode('HomeToast', this.node, 0, -DESIGN_H/2 + 100, 520, 48);
    this.toastNode = toast;
    toast.setSiblingIndex(9999);

    const g = toast.getComponent(Graphics) ?? toast.addComponent(Graphics);
    F.drawWoodenPanel(g, -260, -24, 520, 48, 10);

    const label = F.makeLabel('ToastLabel', toast, 0, 0, 500, 36, FONTS.SMALL, message, COLORS.TEXT_LIGHT);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;

    this.scheduleOnce(() => {
      if (this.toastNode === toast) {
        toast.destroy();
        this.toastNode = null;
      }
    }, 1.2);
  }

  // ═══════════════════════════════════════════════════════════
  // Prefab Overlays
  // ═══════════════════════════════════════════════════════════

  private ensureOverlayPrefabs(): void {
    if (this.toastLayerPrefab) {
      const node = instantiate(this.toastLayerPrefab);
      node.name = 'ToastLayer';
      this.node.addChild(node);
      node.setPosition(new Vec3(0, -555, 0));
      node.getComponent(UITransform)?.setContentSize(560, 56);
      this.toastLayer = node.getComponent(ToastLayer) ?? node.addComponent(ToastLayer);
    }
    if (this.ruleGuidePanelPrefab) {
      const node = instantiate(this.ruleGuidePanelPrefab);
      node.name = 'RuleGuidePanel';
      this.node.addChild(node);
      node.setPosition(Vec3.ZERO);
      node.getComponent(UITransform)?.setContentSize(620, 520);
      this.ruleGuidePanel = node.getComponent(RuleGuidePanel) ?? node.addComponent(RuleGuidePanel);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Auto-resume & Classic methods (preserved from original)
  // ═══════════════════════════════════════════════════════════

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
        sys.localStorage.setItem(LAST_ROOM_ID_KEY, (response as any).roomId);
        if ((response as any).playerId) {
          this.gameManager?.setLocalPlayerId((response as any).playerId);
        }
      }
    );
  }

  // Public API (called from external buttons or editor bindings)
  createClassicRoom(): void { this.loadScene('ClassicMode'); }
  openProfile(): void { director.loadScene('Profile'); }
  openRuleGuide(): void { this.ruleGuidePanel?.open(); }
  openLobbyScene(): void { director.loadScene('Lobby'); }

  createRogueliteRoom(): void {
    if (this.isLaunchingRoguelite) return;
    this.isLaunchingRoguelite = true;
    this.playDiceRoll(() => {
      this.isLaunchingRoguelite = false;
      this.launchMode('pve_roguelite', 'RogueliteLobby');
    });
  }

  createPveRoom(): void {
    this.launchMode('pve_1v1', 'PveLobby');
  }

  requestRoomList(): void {
    this.roomList = createMockRoomList();
    this.renderRoomList();
  }
}
