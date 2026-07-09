import { Button, Sprite, SpriteFrame, Node, resources } from 'cc';

export type UiFrameKey =
  | 'panelParchment'
  | 'panelStatus'
  | 'tabSelected'
  | 'tabNormal'
  | 'buttonPrimary'
  | 'buttonNormal'
  | 'buttonDisabled'
  | 'buttonDanger'
  | 'buttonClose'
  | 'inputRoom'
  | 'listCard'
  | 'listCardDisabled'
  | 'pill'
  | 'iconHelp'
  | 'iconInfo'
  | 'seat'
  | 'seatSmall'
  | 'seatAlt'
  | 'actionAttack'
  | 'actionDefend'
  | 'actionSkill'
  | 'actionEnd'
  | 'cardBack'
  | 'cardLocked'
  | 'cardAvailable'
  | 'cardSelected'
  | 'cardBattle'
  | 'cardElite'
  | 'cardBoss'
  | 'cardEvent'
  | 'cardShop'
  | 'cardRest'
  | 'bgDesk'        // 空白桌面
  | 'bgCard'         // 卡片底图
  | 'decCandle'      // 蜡烛
  | 'decDice';       // 骰子

// Runtime-loaded skins must stay under assets/resources because resources.load()
// cannot load files from assets/art/ui directly. assets/art/ui is only a source
// mirror for browsing/copying art; these paths intentionally point to
// assets/resources/art/...
const FRAME_PATHS: Record<UiFrameKey, string> = {
  panelParchment: 'art/UI/panel/羊皮卷大模板/spriteFrame',
  panelStatus: 'art/UI/panel/状态1/spriteFrame',
  tabSelected: 'art/UI/common/tab选中/spriteFrame',
  tabNormal: 'art/UI/common/tab未选中/spriteFrame',
  buttonPrimary: 'art/UI/common/主按钮/spriteFrame',
  buttonNormal: 'art/UI/common/普通按钮/spriteFrame',
  buttonDisabled: 'art/UI/common/禁用按钮/spriteFrame',
  buttonDanger: 'art/UI/common/危险按钮/spriteFrame',
  buttonClose: 'art/UI/common/关闭按钮/spriteFrame',
  inputRoom: 'art/UI/lobby/房间号输入框/spriteFrame',
  listCard: 'art/UI/lobby/普通状态小列表卡片/spriteFrame',
  listCardDisabled: 'art/UI/lobby/禁用状态小列表卡片/spriteFrame',
  pill: 'art/UI/common/小胶囊/spriteFrame',
  iconHelp: 'art/UI/common/帮助问号/spriteFrame',
  iconInfo: 'art/UI/common/详细信息/spriteFrame',
  seat: 'art/UI/battle/席位/spriteFrame',
  seatSmall: 'art/UI/battle/席位1/spriteFrame',
  seatAlt: 'art/UI/battle/席位2/spriteFrame',
  actionAttack: 'art/UI/battle/攻击行动/spriteFrame',
  actionDefend: 'art/UI/battle/防御行动/spriteFrame',
  actionSkill: 'art/UI/battle/技能行动/spriteFrame',
  actionEnd: 'art/UI/battle/结束行动/spriteFrame',
  cardBack: 'art/UI/roguelite/卡背/spriteFrame',
  cardLocked: 'art/UI/roguelite/锁定卡背/spriteFrame',
  cardAvailable: 'art/UI/roguelite/未选择/spriteFrame',
  cardSelected: 'art/UI/roguelite/高亮选择/spriteFrame',
  cardBattle: 'art/UI/roguelite/小怪卡片/spriteFrame',
  cardElite: 'art/UI/roguelite/精英战卡片/spriteFrame',
  cardBoss: 'art/UI/roguelite/BOSS战卡片/spriteFrame',
  cardEvent: 'art/UI/roguelite/问号事件卡片/spriteFrame',
  cardShop: 'art/UI/roguelite/商店卡片/spriteFrame',
  cardRest: 'art/UI/roguelite/篝火卡片/spriteFrame',
  bgDesk: 'art/主页/空白桌面/spriteFrame',
  bgCard: 'art/主页/卡片/spriteFrame',
  decCandle: 'art/主页/蜡烛/spriteFrame',
  decDice: 'art/主页/骰子/spriteFrame',
};

const cache = new Map<UiFrameKey, SpriteFrame | null>();
const pending = new Map<UiFrameKey, Array<(frame: SpriteFrame | null) => void>>();

export function loadUiFrame(key: UiFrameKey, callback: (frame: SpriteFrame | null) => void): void {
  if (cache.has(key)) {
    callback(cache.get(key) ?? null);
    return;
  }

  const waiting = pending.get(key);
  if (waiting) {
    waiting.push(callback);
    return;
  }

  pending.set(key, [callback]);
  resources.load(FRAME_PATHS[key], SpriteFrame, (error, frame) => {
    const resolved = error ? null : frame;
    if (error) console.warn(`[UiSkin] Failed to load frame ${key}: ${FRAME_PATHS[key]}`, error);
    cache.set(key, resolved);
    const callbacks = pending.get(key) ?? [];
    pending.delete(key);
    callbacks.forEach((item) => item(resolved));
  });
}

export function applyUiFrame(node: Node | null, key: UiFrameKey): void {
  if (!node?.isValid) return;
  loadUiFrame(key, (frame) => {
    if (!frame || !node.isValid) return;
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  });
}

export function applyButtonFrame(button: Button | null, key: UiFrameKey): void {
  if (!button?.node?.isValid) return;
  applyUiFrame(button.node, key);
  loadUiFrame(key, (frame) => {
    if (!frame || !button.isValid) return;
    button.normalSprite = frame;
    button.hoverSprite = frame;
    button.pressedSprite = frame;
    button.disabledSprite = frame;
    button.target = button.node;
  });
}
