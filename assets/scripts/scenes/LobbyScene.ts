import {
  _decorator, Button, Color, Graphics, Label, Node, Prefab, Sprite,
  SpriteFrame, UITransform, Vec3, instantiate, ScrollView, Layout,
} from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import {
  SUMMONER_SKILL_IDS, characterName, summonerSkillName,
  summonerSkillDescription, characterDescription, gameModeDescription,
} from '../core/DisplayText';
import { characterList } from '../shared/characters';
import type { Character, CharacterId, Player, Room, SummonerSkillId } from '../shared/types';
import { MobileSceneBase } from '../ui/MobileSceneBase';
import {
  MobileUIFactory as F, COLORS, FONTS, LAYOUT, DESIGN_W, DESIGN_H,
  drawCardBg, drawHpBar,
} from '../ui/MobileUIFactory';

const { ccclass, property } = _decorator;

type LobbyTab = 'players' | 'settings' | 'characters' | 'skills' | 'lineup';

const TAB_LABELS: Record<LobbyTab, string> = {
  players: '玩家', settings: '设置', characters: '职业',
  skills: '技能', lineup: '阵容',
};

@ccclass('LobbyScene')
export class LobbyScene extends MobileSceneBase {
  // ── Subclass-configurable ──
  @property lobbyTitle = '准备房间';
  @property modeHint = '';
  @property fixedMaxPlayers = 0;
  @property startButtonText = '开始游戏';

  // ── Editor bindings (optional) ──
  @property({ type: Label })       statusLabel: Label | null = null;
  @property({ type: Node })        playerListNode: Node | null = null;
  @property({ type: Node })        characterListNode: Node | null = null;
  @property({ type: Node })        skillListNode: Node | null = null;
  @property({ type: Button })      startGameButton: Button | null = null;
  @property({ type: SpriteFrame }) parchmentFrame: SpriteFrame | null = null;
  @property({ type: SpriteFrame }) actionCardFrame: SpriteFrame | null = null;
  @property({ type: SpriteFrame }) statusFrame: SpriteFrame | null = null;
  @property({ type: Prefab })      characterCardPrefab: Prefab | null = null;
  @property({ type: Prefab })      playerListItemPrefab: Prefab | null = null;
  @property({ type: Prefab })      summonerSkillCardPrefab: Prefab | null = null;
  @property({ type: Prefab })      lobbyStartBarPrefab: Prefab | null = null;
  @property({ type: Prefab })      roomSettingsPanelPrefab: Prefab | null = null;
  @property({ type: Prefab })      duoSlotPickerPrefab: Prefab | null = null;
  @property({ type: Prefab })      characterDetailDialogPrefab: Prefab | null = null;
  @property({ type: Prefab })      summonerSkillDetailDialogPrefab: Prefab | null = null;
  @property({ type: Prefab })      infoDialogPrefab: Prefab | null = null;

  // ── Protected / internal state ──
  protected room: Room | null = null;
  protected selectedCharacterId: CharacterId = 'boxer';
  protected selectedSummonerSkillId: SummonerSkillId = 'lucky_plus_one';

  private activeTab: LobbyTab = 'players';
  private tabBarNode: Node | null = null;
  private contentPanelNode: Node | null = null;
  private tabContentMap = new Map<LobbyTab, Node>();
  private topBarTitle: Label | null = null;
  private topBarSubtitle: Label | null = null;
  private startBtnLabel: Label | null = null;
  private settingsAppliedRoomId = '';

  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  // ═══════════════════════════════════════════════════════════
  // Layout constants
  // ═══════════════════════════════════════════════════════════
  private readonly L = {
    TOP_BAR_Y:     DESIGN_H/2 - LAYOUT.TOP_BAR_H/2 - LAYOUT.SAFE_TOP,
    TAB_BAR_Y:     DESIGN_H/2 - LAYOUT.TOP_BAR_H - LAYOUT.SAFE_TOP - LAYOUT.TAB_BAR_H/2 - 4,
    CONTENT_Y:     30,
    CONTENT_H:     620,
    BOTTOM_BAR_H:  80,
    BOTTOM_BAR_Y:  -DESIGN_H/2 + LAYOUT.BOTTOM_BAR_H/2 + LAYOUT.SAFE_BOTTOM,
    CARD_COLS:     2,
    CARD_W:        280,
    CARD_H:        100,
  } as const;

  // ═══════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════

  override onLoad(): void {
    super.onLoad();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);

    const room = this.gameManager.getRoom();
    if (room) {
      this.render(room);
    }
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
  }

  // ═══════════════════════════════════════════════════════════
  // Mobile-First UI
  // ═══════════════════════════════════════════════════════════

  ensureMinimalUi(): void {
    this.createBackground();
    this.createTopBar();
    this.createTabBar(['players', 'settings', 'characters', 'skills']);
    this.createContentPanel();
    this.createBottomBar();
    this.createTabContents();
  }

  private createBackground(): void {
    F.makeSkinnedBackground(this.node, 'bgDesk');
  }

  private createTopBar(): void {
    const { TOP_BAR_Y } = this.L;
    const bar = F.makeNode('TopBar', this.node, 0, TOP_BAR_Y, DESIGN_W, LAYOUT.TOP_BAR_H);

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
    const backBtn = F.makeSkinnedButton('BackBtn', '←', bar,
      -DESIGN_W/2 + 44, 0, 60, 42, FONTS.HEADER, 'buttonNormal', 'normal');
    F.addButtonFeedback(backBtn.button);
    backBtn.button.node.on(Button.EventType.CLICK, () => this.onBackClick());

    // Room info (center)
    this.topBarTitle = F.makeLabel('RoomInfo', bar, 0, 8, DESIGN_W - 200, 30,
      FONTS.BODY, '房间: ----', COLORS.GOLD_TEXT);
    this.topBarTitle.horizontalAlign = Label.HorizontalAlign.CENTER;

    this.topBarSubtitle = F.makeLabel('RoomSubtitle', bar, 0, -18, DESIGN_W - 200, 22,
      FONTS.SMALL, '玩家 0/2', COLORS.FANTASY_GOLD);
    this.topBarSubtitle.horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  private createTabBar(tabs: string[]): void {
    const { TAB_BAR_Y } = this.L;
    const bar = F.makeNode('TabBar', this.node, 0, TAB_BAR_Y, DESIGN_W - 16, LAYOUT.TAB_BAR_H);
    this.tabBarNode = bar;

    // Draw tab bar background
    const g = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    g.clear();
    g.fillColor = COLORS.WOOD_MEDIUM;
    g.rect(-(DESIGN_W - 16)/2, -LAYOUT.TAB_BAR_H/2, DESIGN_W - 16, LAYOUT.TAB_BAR_H);
    g.fill();

    // Create tabs
    const tabW = (DESIGN_W - 32) / tabs.length;
    tabs.forEach((tab, i) => {
      const tabX = -(tabW * tabs.length)/2 + tabW * i + tabW/2;
      const isActive = tab === 'players';
      const btn = F.makeButton(`Tab_${tab}`, TAB_LABELS[tab as LobbyTab] || tab,
        bar, tabX, 0, tabW - 4, LAYOUT.TAB_BAR_H - 4, FONTS.TAB,
        isActive ? 'primary' : 'normal');
      btn.button.node.on(Button.EventType.CLICK, () => this.selectTab(tab as LobbyTab));
    });
  }

  private createContentPanel(): void {
    const { CONTENT_Y, CONTENT_H } = this.L;
    const result = F.makeSkinnedPanel(this.node, 0, CONTENT_Y,
      DESIGN_W - 28, CONTENT_H, undefined, 'panelParchment');
    this.contentPanelNode = result.bg;
  }

  private createTabContents(): void {
    const parent = this.contentPanelNode!;
    const w = DESIGN_W - 56;
    const h = this.L.CONTENT_H - 24;

    // Create a node for each tab
    const tabs: LobbyTab[] = ['players', 'settings', 'characters', 'skills', 'lineup'];
    tabs.forEach((tab) => {
      const node = F.makeNode(`TabContent_${tab}`, parent, 0, 0, w, h);
      node.active = tab === 'players';
      this.tabContentMap.set(tab, node);
    });
  }

  private createBottomBar(): void {
    const { BOTTOM_BAR_Y, BOTTOM_BAR_H } = this.L;
    const bar = F.makeNode('BottomBar', this.node, 0, BOTTOM_BAR_Y, DESIGN_W, BOTTOM_BAR_H);

    const g = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
    g.clear();
    g.fillColor = COLORS.WOOD_DARK;
    g.rect(-DESIGN_W/2, -BOTTOM_BAR_H/2, DESIGN_W, BOTTOM_BAR_H);
    g.fill();
    g.strokeColor = COLORS.GOLD_BORDER;
    g.lineWidth = 2;
    g.moveTo(-DESIGN_W/2, BOTTOM_BAR_H/2);
    g.lineTo(DESIGN_W/2, BOTTOM_BAR_H/2);
    g.stroke();

    // Start game button with real skin
    const btn = F.makeSkinnedButton('StartGameBtn', this.startButtonText, bar,
      0, 0, 340, 56, FONTS.BUTTON, 'buttonPrimary', 'primary');
    F.addButtonFeedback(btn.button);
    this.startGameButton = btn.button;
    this.startBtnLabel = btn.label;
    btn.button.node.on(Button.EventType.CLICK, () => this.startGame());

    // Hint label
    F.makeLabel('StartHint', bar, 0, -30, 600, 20,
      FONTS.SMALL, '选择职业和技能后方可开始', COLORS.FANTASY_GOLD)
      .horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  // ═══════════════════════════════════════════════════════════
  // Render (called on RoomUpdated)
  // ═══════════════════════════════════════════════════════════

  private render(room: Room): void {
    this.room = room;
    this.applyFixedSettings(room);
    const me = this.getMe();
    if (me?.characterId) this.selectedCharacterId = me.characterId;
    if (me?.summonerSkillId) this.selectedSummonerSkillId = me.summonerSkillId;

    // Update top bar
    if (this.topBarTitle) {
      this.topBarTitle.string = `房间 ${room.id} — ${this.lobbyTitle}`;
    }
    if (this.topBarSubtitle) {
      this.topBarSubtitle.string = `玩家 ${room.players.length}/${room.settings.maxPlayers}`;
    }

    this.renderTabs(room);
    this.renderActiveTab(room);
    this.updateBottomBar(room);
  }

  private renderStatus(status: string): void {
    if (this.room) this.render(this.room);
  }

  // ── Tab management ──

  private tabsForRoom(room: Room): LobbyTab[] {
    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    if (mode === 'duo_2v2') return ['players', 'settings', 'lineup'];
    if (mode === 'pve_1v1' || mode === 'pve_roguelite') return ['characters', 'skills'];
    return ['players', 'settings', 'characters', 'skills'];
  }

  private renderTabs(room: Room): void {
    if (!this.tabBarNode) return;
    const tabs = this.tabsForRoom(room);
    if (!tabs.includes(this.activeTab)) this.activeTab = tabs[0] ?? 'players';

    // Rebuild tab bar
    F.clearChildren(this.tabBarNode);

    const tabW = Math.min(140, ((DESIGN_W - 32) / tabs.length));
    const totalW = tabW * tabs.length;
    const startX = -totalW/2 + tabW/2;

    tabs.forEach((tab, i) => {
      const isActive = tab === this.activeTab;
      const btn = F.makeButton(`Tab_${tab}`, TAB_LABELS[tab],
        this.tabBarNode!, startX + i * tabW, 0, tabW - 4, LAYOUT.TAB_BAR_H - 6,
        FONTS.TAB, isActive ? 'primary' : 'normal');
      btn.button.node.on(Button.EventType.CLICK, () => this.selectTab(tab));
    });
  }

  private selectTab(tab: LobbyTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;

    // Show/hide tab content nodes
    this.tabContentMap.forEach((node, t) => {
      node.active = t === tab;
    });

    if (this.room) {
      this.renderTabs(this.room);
      this.renderActiveTab(this.room);
    }
  }

  private renderActiveTab(room: Room): void {
    switch (this.activeTab) {
      case 'players':   this.renderPlayerTab(room); break;
      case 'settings':  this.renderSettingsTab(room); break;
      case 'characters': this.renderCharacterTab(room); break;
      case 'skills':    this.renderSkillTab(); break;
      case 'lineup':    this.renderLineupTab(room); break;
    }
  }

  private updateBottomBar(room: Room): void {
    const me = this.getMe();
    const canStart = !!me?.characterId && !!me?.summonerSkillId;
    if (this.startBtnLabel) {
      this.startBtnLabel.string = canStart ? this.startButtonText : '请选择职业和技能';
    }
    if (this.startGameButton) {
      this.startGameButton.interactable = true;
    }
  }

  // ── Players Tab ──

  private renderPlayerTab(room: Room): void {
    const content = this.tabContentMap.get('players');
    if (!content?.active) return;
    F.clearChildren(content);

    const count = Math.max(room.settings.maxPlayers, room.players.length, 2);
    const cardW = 290;
    const cardH = 80;
    const cols = 2;
    const gapX = 16;
    const gapY = 12;

    for (let i = 0; i < count; i++) {
      const player = room.players[i] ?? null;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const totalW = cols * cardW + (cols - 1) * gapX;
      const x = -totalW/2 + cardW/2 + col * (cardW + gapX);
      const y = 280 - row * (cardH + gapY);

      const card = F.makeNode(`PlayerSlot_${i}`, content, x, y, cardW, cardH);
      const g = card.getComponent(Graphics) ?? card.addComponent(Graphics);

      if (player) {
        F.drawParchmentBg(g, -cardW/2, -cardH/2, cardW, cardH, 10);
        F.applyCardSkin(card);

        const isSelf = player.clientId === this.gameManager?.localClientId;
        const nameColor = isSelf ? COLORS.GOLD_TEXT : COLORS.TEXT_DARK;
        const hostMark = player.isHost ? ' 👑' : '';
        const botMark = player.isBot ? ' 🤖' : '';
        const readyMark = player.characterSelected ? ' ✓' : '';

        F.makeLabel(`PlayerName_${i}`, card, -cardW/2 + 60, 16, cardW - 80, 26,
          FONTS.BODY, `${player.nickname}${hostMark}${botMark}${readyMark}`, nameColor);

        const charName = characterName(player.characterId) || '未选择';
        const skillName = summonerSkillName(player.summonerSkillId) || '未选择';
        F.makeLabel(`PlayerInfo_${i}`, card, -cardW/2 + 60, -14, cardW - 80, 22,
          FONTS.SMALL, `${charName} / ${skillName}`, COLORS.TEXT_WOOD);

        // Status indicator
        const statusColor = player.isOnline ? COLORS.READY_GREEN : new Color(150, 150, 150, 255);
        F.makeLabel(`PlayerStatus_${i}`, card, cardW/2 - 50, 16, 40, 18,
          14, player.isOnline ? '在线' : '离线', statusColor);
      } else {
        // Empty slot
        g.clear();
        g.strokeColor = new Color(160, 140, 110, 150);
        g.lineWidth = 1.5;
        g.roundRect(-cardW/2, -cardH/2, cardW, cardH, 10);
        g.stroke();

        F.makeLabel(`Empty_${i}`, card, 0, 0, cardW - 20, 30,
          FONTS.BODY, '等待加入...', new Color(150, 140, 120, 180))
          .horizontalAlign = Label.HorizontalAlign.CENTER;
      }
    }
  }

  // ── Settings Tab ──

  private renderSettingsTab(room: Room): void {
    const content = this.tabContentMap.get('settings');
    if (!content?.active) return;
    F.clearChildren(content);

    const yStart = 250;
    const rowH = 60;

    // Max Players
    this.createSettingRow(content, 0, yStart, '最大人数',
      ['2', '4', '8'], String(room.settings.maxPlayers),
      (val) => this.serverActions.updateRoomSettings({ maxPlayers: Number(val) }));

    // Allow duplicate characters
    this.createSettingRow(content, 0, yStart - rowH, '重复角色',
      ['允许', '禁止'], room.settings.allowDuplicateCharacters ? '允许' : '禁止',
      (val) => this.serverActions.updateRoomSettings({ allowDuplicateCharacters: val === '允许' }));

    // Game mode info
    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    F.makeLabel('ModeInfo', content, 0, yStart - rowH * 2.2, 500, 60,
      FONTS.BODY, `当前模式: ${mode}\n${gameModeDescription(mode)}`, COLORS.TEXT_DARK)
      .horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  private createSettingRow(
    parent: Node, x: number, y: number, label: string,
    options: string[], selected: string, onSelect: (val: string) => void,
  ): void {
    const row = F.makeNode(`Setting_${label}`, parent, x, y, 560, 56);

    F.makeLabel(`Label_${label}`, row, -250, 0, 160, 40, FONTS.BODY, label, COLORS.TEXT_DARK);

    const optW = 100;
    const totalW = optW * options.length + (options.length - 1) * 8;
    const startX = 100;

    options.forEach((opt, i) => {
      const isSel = opt === selected;
      const btn = F.makeButton(`Opt_${opt}`, opt, row,
        startX + i * (optW + 8), 0, optW, 40, FONTS.SMALL,
        isSel ? 'primary' : 'normal');
      btn.button.node.on(Button.EventType.CLICK, () => onSelect(opt));
    });
  }

  // ── Characters Tab ──

  private renderCharacterTab(room: Room): void {
    const content = this.tabContentMap.get('characters');
    if (!content?.active) return;
    F.clearChildren(content);

    const allowDup = room.settings.allowDuplicateCharacters !== false;
    const me = this.getMe();
    const takenBy = new Map<CharacterId, string>();
    if (!allowDup) {
      for (const p of room.players) {
        if (p.characterId && p.id !== me?.id) {
          takenBy.set(p.characterId, p.nickname);
        }
      }
    }

    const visible = this.getVisibleCharacters(room).slice(0, 8);
    const { CARD_COLS, CARD_W, CARD_H } = this.L;
    const gapX = 12;
    const gapY = 12;
    const totalW = CARD_COLS * CARD_W + (CARD_COLS - 1) * gapX;

    visible.forEach((character, index) => {
      const col = index % CARD_COLS;
      const row = Math.floor(index / CARD_COLS);
      const x = -totalW/2 + CARD_W/2 + col * (CARD_W + gapX);
      const y = 270 - row * (CARD_H + gapY);

      const selected = character.id === this.selectedCharacterId;
      const taker = (!allowDup && !selected) ? (takenBy.get(character.id) ?? null) : null;

      const card = F.makeNode(`Char_${character.id}`, content, x, y, CARD_W, CARD_H);
      const g = card.getComponent(Graphics) ?? card.addComponent(Graphics);
      drawCardBg(g, -CARD_W/2, -CARD_H/2, CARD_W, CARD_H, selected ? 'epic' : 'common');
      F.applyCardSkin(card);

      F.makeLabel(`CharName_${character.id}`, card, 0, 18, CARD_W - 16, 28,
        FONTS.BODY, characterName(character.id) + (selected ? ' ★' : ''), COLORS.TEXT_DARK)
        .horizontalAlign = Label.HorizontalAlign.CENTER;

      F.makeLabel(`CharDesc_${character.id}`, card, 0, -18, CARD_W - 20, 40,
        FONTS.SMALL, character.description?.[0] ?? '', COLORS.TEXT_WOOD)
        .horizontalAlign = Label.HorizontalAlign.CENTER;

      if (taker) {
        const g2 = card.getComponent(Graphics)!;
        g2.fillColor = new Color(0, 0, 0, 120);
        g2.roundRect(-CARD_W/2, -CARD_H/2, CARD_W, CARD_H, LAYOUT.CARD_RADIUS);
        g2.fill();
        F.makeLabel(`Taker_${character.id}`, card, 0, 0, CARD_W - 20, 24,
          FONTS.SMALL, `被 ${taker} 选择`, COLORS.DMG_RED)
          .horizontalAlign = Label.HorizontalAlign.CENTER;
      } else {
        card.on(Node.EventType.TOUCH_END, () => this.chooseCharacter(character.id));
      }
    });

    // Selected info
    if (this.selectedCharacterId) {
      F.makeLabel('SelectedChar', content, 0, -320, 560, 40,
        FONTS.SMALL, `已选择: ${characterName(this.selectedCharacterId)}`, COLORS.GOLD_TEXT)
        .horizontalAlign = Label.HorizontalAlign.CENTER;
    }
  }

  // ── Skills Tab ──

  private renderSkillTab(): void {
    const content = this.tabContentMap.get('skills');
    if (!content?.active) return;
    F.clearChildren(content);

    SUMMONER_SKILL_IDS.forEach((skillId, index) => {
      const selected = skillId === this.selectedSummonerSkillId;
      const y = 270 - index * 90;
      const cardW = 560;
      const cardH = 76;

      const card = F.makeNode(`Skill_${skillId}`, content, 0, y, cardW, cardH);
      const g = card.getComponent(Graphics) ?? card.addComponent(Graphics);
      drawCardBg(g, -cardW/2, -cardH/2, cardW, cardH, selected ? 'epic' : 'common');
      F.applyCardSkin(card);

      F.makeLabel(`SkillName_${skillId}`, card, -cardW/2 + 20, 12, cardW - 80, 26,
        FONTS.BODY, (selected ? '★ ' : '') + summonerSkillName(skillId), COLORS.TEXT_DARK);

      F.makeLabel(`SkillDesc_${skillId}`, card, -cardW/2 + 20, -20, cardW - 80, 36,
        FONTS.SMALL, summonerSkillDescription(skillId), COLORS.TEXT_WOOD);

      card.on(Node.EventType.TOUCH_END, () => this.chooseSummonerSkill(skillId));
    });
  }

  // ── Lineup Tab (2V2) ──

  private renderLineupTab(room: Room): void {
    const content = this.tabContentMap.get('lineup');
    if (!content?.active) return;
    F.clearChildren(content);

    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    if (mode !== 'duo_2v2') {
      F.makeLabel('LineupNA', content, 0, 0, 500, 60,
        FONTS.BODY, '阵容配置仅适用于 2V2 模式', COLORS.TEXT_DARK)
        .horizontalAlign = Label.HorizontalAlign.CENTER;
      return;
    }

    F.makeLabel('LineupTitle', content, 0, 260, 500, 36,
      FONTS.HEADER, '队伍阵容配置', COLORS.GOLD_TEXT)
      .horizontalAlign = Label.HorizontalAlign.CENTER;

    // Two team columns
    ['A', 'B'].forEach((team, ti) => {
      const x = ti === 0 ? -150 : 150;
      const panel = F.makeNode(`Team_${team}`, content, x, 120, 260, 200);
      const g = panel.getComponent(Graphics) ?? panel.addComponent(Graphics);
      F.drawParchmentBg(g, -130, -100, 260, 200, 12);

      F.makeLabel(`TeamLabel_${team}`, panel, 0, 70, 240, 30,
        FONTS.HEADER, `队伍 ${team}`, COLORS.GOLD_TEXT)
        .horizontalAlign = Label.HorizontalAlign.CENTER;

      F.makeLabel(`TeamChar_${team}`, panel, 0, 20, 240, 26,
        FONTS.BODY, characterName(this.selectedCharacterId), COLORS.TEXT_DARK)
        .horizontalAlign = Label.HorizontalAlign.CENTER;

      F.makeLabel(`TeamSkill_${team}`, panel, 0, -20, 240, 26,
        FONTS.BODY, summonerSkillName(this.selectedSummonerSkillId), COLORS.TEXT_DARK)
        .horizontalAlign = Label.HorizontalAlign.CENTER;

      const btn = F.makeButton(`SelectTeam_${team}`, '选择槽位', panel, 0, -70, 200, 44, FONTS.BODY, 'primary');
      btn.button.node.on(Button.EventType.CLICK, () => {
        this.chooseDuoSlot(ti as 0 | 1);
      });
    });
  }

  // ── Duo slot logic ──

  private chooseDuoSlot(slotIndex: 0 | 1): void {
    const room = this.room;
    if ((room?.gameMode ?? room?.settings?.gameMode) !== 'duo_2v2') return;

    const localPlayer = room.players.find(p =>
      p.clientId === this.gameManager?.localClientId) ?? room.players[0];
    const controllerId = localPlayer?.id ?? this.gameManager?.localClientId ?? '';

    this.serverActions.chooseDuoSlotCharacter(slotIndex, this.selectedCharacterId);
    this.serverActions.chooseDuoSlotSummonerSkill(slotIndex, this.selectedSummonerSkillId);
    this.gameManager?.showToast(`槽位 ${slotIndex + 1} 已配置`, 1.5);
  }

  // ═══════════════════════════════════════════════════════════
  // Actions (unchanged business logic)
  // ═══════════════════════════════════════════════════════════

  chooseCharacter(characterId: CharacterId): void {
    const room = this.room;
    if (room) {
      const allowDup = room.settings.allowDuplicateCharacters !== false;
      const me = this.getMe();
      if (!allowDup) {
        const takenByOther = room.players.some(p =>
          p.characterId === characterId && p.id !== me?.id);
        if (takenByOther) {
          this.gameManager?.showToast('该职业已被选择', 2);
          return;
        }
      }
    }
    this.selectedCharacterId = characterId;
    this.serverActions.chooseCharacter(characterId);
    if (this.room) this.renderCharacterTab(this.room);
  }

  chooseSummonerSkill(skillId: SummonerSkillId): void {
    this.selectedSummonerSkillId = skillId;
    this.serverActions.chooseSummonerSkill(skillId);
    if (this.room) this.renderSkillTab();
  }

  startGame(): void {
    if (!this.room) {
      this.gameManager?.showToast('房间尚未就绪', 1.5);
      return;
    }
    const me = this.getMe();
    if (!me?.characterId) {
      this.chooseCharacter(this.selectedCharacterId);
      this.scheduleOnce(() => this.serverActions.startGame(), 0.25);
      return;
    }
    if (!me.summonerSkillId) {
      this.chooseSummonerSkill(this.selectedSummonerSkillId);
      this.scheduleOnce(() => this.serverActions.startGame(), 0.15);
      return;
    }
    this.serverActions.startGame();
  }

  private onBackClick(): void {
    this.gameManager?.leaveRoom();
  }

  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════

  protected getMe(): Room['players'][number] | null {
    return this.gameManager?.getLocalPlayer()
      ?? this.room?.players.find(p => !p.isBot)
      ?? this.room?.players[0]
      ?? null;
  }

  private getVisibleCharacters(room: Room): Character[] {
    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    return characterList.filter((character) => {
      if (character.isHidden || character.availability?.hidden) return false;
      if (mode === 'classic') return character.availability?.classic !== false;
      if (mode === 'duo_2v2') return character.availability?.duo !== false;
      if (mode === 'pve_roguelite') return character.availability?.roguelite !== false;
      return character.availability?.pve !== false;
    });
  }

  private applyFixedSettings(room: Room): void {
    if (this.fixedMaxPlayers <= 0) return;
    if (room.settings.maxPlayers === this.fixedMaxPlayers) return;
    if (this.settingsAppliedRoomId === room.id) return;
    const isHost = room.players.some(p =>
      p.clientId === this.gameManager?.localClientId && p.isHost);
    if (!isHost) return;
    this.settingsAppliedRoomId = room.id;
    this.serverActions.updateRoomSettings({ maxPlayers: this.fixedMaxPlayers });
  }
}
