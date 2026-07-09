/**
 * MobileUIFactory — Centralized UI creation utility for mobile-first layouts.
 *
 * Provides:
 * - Design resolution constants (720×1280)
 * - Color palette (wood, parchment, gold, fantasy)
 * - Font size presets for mobile readability
 * - Node creation functions with automatic UITransform
 * - Layout presets (topBar, bottomBar, tabBar, panel, scrollList)
 * - Graphics drawing helpers (woodenPanel, fantasyButton, parchmentBg)
 * - Widget-based safe area and adaptive layout helpers
 *
 * All UI is built programmatically — no editor drag-drop required.
 * Uses Graphics for initial rendering (zero image dependencies).
 */

import {
  Button,
  Color,
  EditBox,
  Graphics,
  Label,
  Layout,
  Node,
  ScrollView,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec2,
  Vec3,
  Widget,
  resources,
} from 'cc';
import { applyUiFrame, applyButtonFrame, type UiFrameKey } from '../core/UiSkin';

// ── Design Resolution ──

export const DESIGN_W = 720;
export const DESIGN_H = 1280;

// ═══════════════════════════════════════════════════════════════
// Color Palette — Wood + Parchment + Fantasy
// ═══════════════════════════════════════════════════════════════

export const COLORS = {
  // Wood tones
  WOOD_DARK:       new Color(38, 22, 10, 238),
  WOOD_MEDIUM:     new Color(57, 34, 17, 255),
  WOOD_LIGHT:      new Color(132, 77, 31, 255),
  WOOD_PANEL:      new Color(48, 28, 14, 245),

  // Parchment tones
  PARCHMENT_BG:    new Color(255, 246, 220, 255),
  PARCHMENT_LIGHT: new Color(255, 240, 204, 255),
  PARCHMENT_DARK:  new Color(220, 195, 145, 255),

  // Gold / Fantasy accents
  GOLD_BORDER:     new Color(211, 157, 78, 255),
  GOLD_BRIGHT:     new Color(255, 219, 142, 255),
  GOLD_TEXT:       new Color(255, 225, 155, 255),
  FANTASY_GOLD:    new Color(255, 238, 183, 255),

  // Text colors
  TEXT_DARK:       new Color(57, 34, 17, 255),
  TEXT_LIGHT:      new Color(255, 238, 196, 255),
  TEXT_WOOD:       new Color(64, 38, 18, 255),

  // Status colors
  HP_GREEN:        new Color(68, 200, 68, 255),
  DMG_RED:         new Color(220, 50, 50, 255),
  SHIELD_BLUE:     new Color(68, 140, 255, 255),
  ENERGY_YELLOW:   new Color(255, 200, 50, 255),
  READY_GREEN:     new Color(76, 175, 80, 255),
  WARN_ORANGE:     new Color(255, 152, 0, 255),

  // Overlay / Modal
  OVERLAY_DARK:    new Color(0, 0, 0, 160),
  TOAST_BG:        new Color(36, 21, 10, 220),

  // Rarity
  RARITY_COMMON:   new Color(150, 150, 150, 255),
  RARITY_RARE:     new Color(68, 140, 255, 255),
  RARITY_EPIC:     new Color(170, 68, 255, 255),
  RARITY_LEGENDARY: new Color(255, 170, 0, 255),
} as const;

// ═══════════════════════════════════════════════════════════════
// Font Sizes — Mobile-optimized
// ═══════════════════════════════════════════════════════════════

export const FONTS = {
  TITLE:    36,   // Page titles (Home only)
  HEADER:   26,   // Section headers, top bar titles
  SUBHEADER: 22,  // Panel subtitles
  BODY:     20,   // Main body text
  SMALL:    16,   // Notes, secondary info
  BUTTON:   22,   // Button labels
  TAB:      18,   // Tab bar labels
  CARD:     17,   // Card content text
} as const;

// ═══════════════════════════════════════════════════════════════
// Layout Constants
// ═══════════════════════════════════════════════════════════════

export const LAYOUT = {
  TOP_BAR_H:        72,   // Top bar height
  BOTTOM_BAR_H:     80,   // Bottom action bar height
  TAB_BAR_H:        52,   // Tab bar height
  PANEL_RADIUS:     16,   // Panel corner radius
  CARD_RADIUS:      12,   // Card corner radius
  BUTTON_RADIUS:    10,   // Button corner radius
  SAFE_TOP:         24,   // Safe area top margin
  SAFE_BOTTOM:      24,   // Safe area bottom margin
  BUTTON_MIN_W:     140,  // Minimum button width
  BUTTON_MIN_H:     56,   // Minimum button height
  ACTION_BUTTON_H:  72,   // Battle action button height
  CONTENT_MAX_W:    660,  // Max content width (720 - 30*2 margins)
} as const;

// ═══════════════════════════════════════════════════════════════
// Node Creation Utilities
// ═══════════════════════════════════════════════════════════════

/** Create or reuse a node with position and size. */
export function makeNode(
  name: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
): Node {
  let node = parent.getChildByName(name);
  if (!node) {
    node = new Node(name);
    parent.addChild(node);
  }
  node.setPosition(new Vec3(x, y, 0));
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(w, h);
  return node;
}

/** Create or reuse a Label node. */
export function makeLabel(
  name: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  text?: string,
  color?: Color,
): Label {
  const node = makeNode(name, parent, x, y, w, h);
  const label = node.getComponent(Label) ?? node.addComponent(Label);
  label.fontSize = fontSize;
  label.lineHeight = fontSize + 8;
  label.enableWrapText = true;
  label.overflow = Label.Overflow.CLAMP;
  if (text !== undefined) label.string = text;
  if (color) label.color = color;
  return label;
}

/** Create or reuse a Button node with a child Label. */
export function makeButton(
  name: string,
  text: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  variant: 'primary' | 'normal' | 'danger' | 'disabled' = 'primary',
): { node: Node; button: Button; label: Label } {
  const node = makeNode(name, parent, x, y, w, h);
  const button = node.getComponent(Button) ?? node.addComponent(Button);
  button.interactable = variant !== 'disabled';

  // Draw button background
  const g = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  drawFantasyButton(g, -w/2, -h/2, w, h, variant);

  // Child label
  const labelNode = node.getChildByName('Label') ?? new Node('Label');
  if (!labelNode.parent) node.addChild(labelNode);
  labelNode.setPosition(Vec3.ZERO);
  const labelTransform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
  labelTransform.setContentSize(w - 16, h - 8);
  const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
  label.string = text;
  label.fontSize = fontSize;
  label.lineHeight = fontSize + 6;
  label.enableWrapText = false;
  label.color = variant === 'primary' ? COLORS.TEXT_LIGHT : COLORS.TEXT_DARK;
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;

  return { node, button, label };
}

/** Create or reuse an EditBox (text input). */
export function makeEditBox(
  name: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  placeholder: string,
  fontSize: number = FONTS.BODY,
): EditBox {
  const node = makeNode(name, parent, x, y, w, h);

  // Draw input background
  const g = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  g.clear();
  g.fillColor = COLORS.PARCHMENT_BG;
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 2;
  g.roundRect(-w/2, -h/2, w, h, LAYOUT.BUTTON_RADIUS);
  g.fill();
  g.stroke();

  const editBox = node.getComponent(EditBox) ?? node.addComponent(EditBox);
  editBox.placeholder = placeholder;
  editBox.maxLength = 16;
  editBox.inputFlag = EditBox.InputFlag.SENSITIVE;

  // Text label
  let textNode = node.getChildByName('TextLabel');
  if (!textNode) {
    textNode = new Node('TextLabel');
    node.addChild(textNode);
    textNode.setPosition(Vec3.ZERO);
    textNode.addComponent(UITransform).setContentSize(w - 20, h - 8);
  }
  const textLabel = textNode.getComponent(Label) ?? textNode.addComponent(Label);
  textLabel.fontSize = fontSize;
  textLabel.color = COLORS.TEXT_DARK;
  editBox.textLabel = textLabel;

  // Placeholder label
  let phNode = node.getChildByName('PlaceholderLabel');
  if (!phNode) {
    phNode = new Node('PlaceholderLabel');
    node.addChild(phNode);
    phNode.setPosition(Vec3.ZERO);
    phNode.addComponent(UITransform).setContentSize(w - 20, h - 8);
  }
  const phLabel = phNode.getComponent(Label) ?? phNode.addComponent(Label);
  phLabel.fontSize = fontSize;
  phLabel.color = new Color(160, 130, 90, 255);
  editBox.placeholderLabel = phLabel;

  return editBox;
}

// ═══════════════════════════════════════════════════════════════
// Layout Presets
// ═══════════════════════════════════════════════════════════════

/** Create a top bar with optional back button and title. */
export function makeTopBar(
  parent: Node,
  title?: string,
  onBack?: () => void,
): { bg: Node; backBtn: Button | null; titleLabel: Label | null; statusContainer: Node } {
  const barH = LAYOUT.TOP_BAR_H;
  const bg = makeNode('TopBar', parent, 0, DESIGN_H/2 - barH/2 - LAYOUT.SAFE_TOP, DESIGN_W, barH);

  // Draw bar background
  const g = bg.getComponent(Graphics) ?? bg.addComponent(Graphics);
  g.clear();
  g.fillColor = COLORS.WOOD_DARK;
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 2;
  g.moveTo(-DESIGN_W/2, -barH/2);
  g.lineTo(DESIGN_W/2, -barH/2);
  g.stroke();
  g.rect(-DESIGN_W/2, -barH/2, DESIGN_W, barH);
  g.fill();

  // Back button (left side)
  let backBtn: Button | null = null;
  if (onBack) {
    const result = makeButton('BackBtn', '<', bg, -DESIGN_W/2 + 50, 0, 56, 40, FONTS.HEADER, 'normal');
    backBtn = result.button;
    backBtn.node.on(Button.EventType.CLICK, onBack);
  }

  // Title (center)
  let titleLabel: Label | null = null;
  if (title) {
    titleLabel = makeLabel('Title', bg, 0, 0, DESIGN_W - 160, barH - 8, FONTS.HEADER, title, COLORS.GOLD_TEXT);
    titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
  }

  // Status container (right side) — for room info, player count, etc.
  const statusContainer = makeNode('StatusContainer', bg, DESIGN_W/2 - 80, 0, 140, barH - 8);

  return { bg, backBtn, titleLabel, statusContainer };
}

/** Create a bottom action bar with Widget anchoring. */
export function makeBottomBar(parent: Node, height: number = LAYOUT.BOTTOM_BAR_H): Node {
  const y = -DESIGN_H/2 + height/2 + LAYOUT.SAFE_BOTTOM;
  const bar = makeNode('BottomBar', parent, 0, y, DESIGN_W, height);

  // Draw bar background
  const g = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
  g.clear();
  g.fillColor = COLORS.WOOD_DARK;
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 2;
  g.moveTo(-DESIGN_W/2, height/2);
  g.lineTo(DESIGN_W/2, height/2);
  g.stroke();
  g.rect(-DESIGN_W/2, -height/2, DESIGN_W, height);
  g.fill();

  // Widget for bottom anchoring
  const widget = bar.getComponent(Widget) ?? bar.addComponent(Widget);
  widget.isAlignBottom = true;
  widget.bottom = LAYOUT.SAFE_BOTTOM;
  widget.isAlignLeft = true;
  widget.isAlignRight = true;
  widget.left = 0;
  widget.right = 0;
  widget.isAbsoluteBottom = true;

  return bar;
}

/** Create a tab bar with selectable tabs. */
export function makeTabBar(
  parent: Node,
  tabs: string[],
  x: number,
  y: number,
  activeIndex: number,
  onTab: (index: number) => void,
): { bg: Node; buttons: Button[]; labels: Label[] } {
  const tabW = Math.min(140, (DESIGN_W - 40) / tabs.length);
  const tabH = LAYOUT.TAB_BAR_H;
  const totalW = tabW * tabs.length;
  const startX = x - totalW / 2 + tabW / 2;

  const bg = makeNode('TabBar', parent, 0, y, totalW + 8, tabH + 4);

  const buttons: Button[] = [];
  const labels: Label[] = [];

  tabs.forEach((tab, i) => {
    const tabX = startX + i * tabW;
    const result = makeButton(
      `Tab_${tab}`,
      tab,
      bg,
      tabX - x,
      0,
      tabW - 4,
      tabH,
      FONTS.TAB,
      i === activeIndex ? 'primary' : 'normal',
    );
    buttons.push(result.button);
    labels.push(result.label);
    result.button.node.on(Button.EventType.CLICK, () => onTab(i));
  });

  return { bg, buttons, labels };
}

/** Create a parchment-styled panel with optional title. */
export function makePanel(
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string,
): { bg: Node; titleLabel: Label | null } {
  const bg = makeNode('Panel', parent, x, y, w, h);

  // Draw parchment panel background
  const g = bg.getComponent(Graphics) ?? bg.addComponent(Graphics);
  drawParchmentBg(g, -w/2, -h/2, w, h);

  let titleLabel: Label | null = null;
  if (title) {
    titleLabel = makeLabel('PanelTitle', bg, 0, h/2 - 28, w - 32, 36, FONTS.HEADER, title, COLORS.GOLD_TEXT);
    titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  return { bg, titleLabel };
}

/** Create a ScrollView-backed list area. */
export function makeScrollList(
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
): { scrollView: ScrollView; content: Node; bg: Node } {
  const bg = makeNode('ScrollList', parent, x, y, w, h);

  const scrollView = bg.getComponent(ScrollView) ?? bg.addComponent(ScrollView);
  scrollView.horizontal = false;
  scrollView.vertical = true;
  scrollView.inertia = true;
  scrollView.bounceDuration = 0.3;

  const content = new Node('Content');
  bg.addChild(content);
  content.setPosition(Vec3.ZERO);
  content.addComponent(UITransform).setContentSize(w, h);
  scrollView.content = content;

  return { scrollView, content, bg };
}

// ═══════════════════════════════════════════════════════════════
// Graphics Drawing Helpers
// ═══════════════════════════════════════════════════════════════

/** Draw a wooden panel background (dark brown with gold border). */
export function drawWoodenPanel(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = LAYOUT.PANEL_RADIUS,
): void {
  g.clear();
  // Outer gold border glow
  g.fillColor = COLORS.GOLD_BORDER;
  g.roundRect(x - 2, y - 2, w + 4, h + 4, radius + 1);
  g.fill();
  // Main wood background
  g.fillColor = COLORS.WOOD_DARK;
  g.roundRect(x, y, w, h, radius);
  g.fill();
  // Inner lighter border
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 2.5;
  g.roundRect(x + 3, y + 3, w - 6, h - 6, radius - 1);
  g.stroke();
}

/** Draw a fantasy-style button background. */
export function drawFantasyButton(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: 'primary' | 'normal' | 'danger' | 'disabled',
  radius: number = LAYOUT.BUTTON_RADIUS,
): void {
  g.clear();

  let bgColor: Color;
  let borderColor: Color;

  switch (variant) {
    case 'primary':
      bgColor = COLORS.WOOD_LIGHT;
      borderColor = COLORS.GOLD_BRIGHT;
      break;
    case 'danger':
      bgColor = new Color(140, 40, 30, 255);
      borderColor = COLORS.DMG_RED;
      break;
    case 'disabled':
      bgColor = new Color(80, 70, 60, 160);
      borderColor = new Color(120, 110, 100, 200);
      break;
    case 'normal':
    default:
      bgColor = COLORS.WOOD_MEDIUM;
      borderColor = COLORS.GOLD_BORDER;
      break;
  }

  // Shadow / outer border
  g.fillColor = borderColor;
  g.roundRect(x - 1, y - 1, w + 2, h + 2, radius);
  g.fill();
  // Main body
  g.fillColor = bgColor;
  g.roundRect(x, y, w, h, radius);
  g.fill();
  // Inner highlight (top edge)
  g.strokeColor = COLORS.GOLD_TEXT;
  g.lineWidth = 1;
  g.roundRect(x + 2, y + 2, w - 4, h - 4, radius - 1);
  g.stroke();
}

/** Draw a parchment-style background. */
export function drawParchmentBg(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = LAYOUT.PANEL_RADIUS,
): void {
  g.clear();
  // Outer dark frame
  g.fillColor = COLORS.WOOD_DARK;
  g.roundRect(x - 4, y - 4, w + 8, h + 8, radius + 2);
  g.fill();
  // Gold border
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 2;
  g.roundRect(x - 2, y - 2, w + 4, h + 4, radius + 1);
  g.stroke();
  // Parchment fill
  g.fillColor = COLORS.PARCHMENT_BG;
  g.roundRect(x, y, w, h, radius);
  g.fill();
  // Inner shadow edge
  g.strokeColor = COLORS.PARCHMENT_DARK;
  g.lineWidth = 1;
  g.roundRect(x + 2, y + 2, w - 4, h - 4, radius - 1);
  g.stroke();
}

/** Draw a fantasy card background (smaller panel for card use). */
export function drawCardBg(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common',
  radius: number = LAYOUT.CARD_RADIUS,
): void {
  g.clear();

  const rarityColor: Color = COLORS[`RARITY_${rarity.toUpperCase() as 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'}`];

  // Outer rarity border
  g.fillColor = rarityColor;
  g.roundRect(x - 2, y - 2, w + 4, h + 4, radius + 1);
  g.fill();
  // Parchment card body
  g.fillColor = COLORS.PARCHMENT_BG;
  g.roundRect(x, y, w, h, radius);
  g.fill();
  // Inner gold border
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 1.5;
  g.roundRect(x + 1, y + 1, w - 2, h - 2, radius - 1);
  g.stroke();
}

/** Draw an HP bar (horizontal progress bar). */
export function drawHpBar(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  percent: number,
  showShield: boolean = false,
): void {
  g.clear();
  // Background track
  g.fillColor = new Color(40, 20, 10, 200);
  g.roundRect(x, y, w, h, h / 2);
  g.fill();
  // Border
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 1;
  g.roundRect(x, y, w, h, h / 2);
  g.stroke();

  if (percent <= 0) return;

  // HP fill gradient: green > yellow > red
  let fillColor: Color;
  if (percent > 0.5) {
    fillColor = COLORS.HP_GREEN;
  } else if (percent > 0.25) {
    fillColor = COLORS.ENERGY_YELLOW;
  } else {
    fillColor = COLORS.DMG_RED;
  }

  const fillW = Math.max(0, (w - 4) * Math.min(1, percent));
  g.fillColor = fillColor;
  g.roundRect(x + 2, y + 2, fillW, h - 4, (h - 4) / 2);
  g.fill();

  if (showShield) {
    g.strokeColor = COLORS.SHIELD_BLUE;
    g.lineWidth = 2;
    g.roundRect(x + 1, y + 1, w - 2, h - 2, h / 2);
    g.stroke();
  }
}

// ═══════════════════════════════════════════════════════════════
// Widget / Anchor Helpers
// ═══════════════════════════════════════════════════════════════

/** Apply Widget anchoring to a node for adaptive layout. */
export function applyWidgetAnchor(
  node: Node,
  opts: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    horizontalCenter?: boolean;
    verticalCenter?: boolean;
  },
): Widget {
  const widget = node.getComponent(Widget) ?? node.addComponent(Widget);

  if (opts.top !== undefined) {
    widget.isAlignTop = true;
    widget.top = opts.top;
    widget.isAbsoluteTop = true;
  }
  if (opts.bottom !== undefined) {
    widget.isAlignBottom = true;
    widget.bottom = opts.bottom;
    widget.isAbsoluteBottom = true;
  }
  if (opts.left !== undefined) {
    widget.isAlignLeft = true;
    widget.left = opts.left;
    widget.isAbsoluteLeft = true;
  }
  if (opts.right !== undefined) {
    widget.isAlignRight = true;
    widget.right = opts.right;
    widget.isAbsoluteRight = true;
  }
  if (opts.horizontalCenter) {
    widget.isAlignHorizontalCenter = true;
  }
  if (opts.verticalCenter) {
    widget.isAlignVerticalCenter = true;
  }

  return widget;
}

/** Apply safe area insets to a node via Widget. */
export function makeSafeArea(node: Node): void {
  applyWidgetAnchor(node, {
    top: LAYOUT.SAFE_TOP,
    bottom: LAYOUT.SAFE_BOTTOM,
  });
}

/** Apply a Layout component for child alignment. */
export function applyLayout(
  node: Node,
  type: 'horizontal' | 'vertical' | 'grid',
  spacing: number = 8,
  padding: number = 16,
): Layout {
  const layout = node.getComponent(Layout) ?? node.addComponent(Layout);
  switch (type) {
    case 'horizontal':
      layout.type = Layout.Type.HORIZONTAL;
      break;
    case 'vertical':
      layout.type = Layout.Type.VERTICAL;
      break;
    case 'grid':
      layout.type = Layout.Type.GRID;
      break;
  }
  layout.spacingX = spacing;
  layout.spacingY = spacing;
  layout.paddingLeft = padding;
  layout.paddingRight = padding;
  layout.paddingTop = padding;
  layout.paddingBottom = padding;
  layout.resizeMode = Layout.ResizeMode.CONTAINER;
  return layout;
}

/** Add a simple press-scale feedback to a button node. */
export function addButtonFeedback(button: Button): void {
  button.transition = Button.Transition.SCALE;
  button.zoomScale = 0.92;
  button.duration = 0.08;
}

/** Quickly clear all children of a node. */
export function clearChildren(node: Node): void {
  for (const child of [...node.children]) {
    child.destroy();
  }
}

/** Create a sprite node from a SpriteFrame (lazy, async-compatible). */
export function makeSpriteNode(
  name: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
): { node: Node; sprite: Sprite } {
  const node = makeNode(name, parent, x, y, w, h);
  const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  return { node, sprite };
}

// ═══════════════════════════════════════════════════════════════
// Skin-aware creation (Graphics fallback + async UiSkin)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a button with Graphics fallback + async UiSkin loading.
 * The button appears immediately with Graphics drawing, then the
 * real sprite is applied asynchronously when loaded.
 */
export function makeSkinnedButton(
  name: string,
  text: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  frameKey: UiFrameKey,
  variant: 'primary' | 'normal' | 'danger' | 'disabled' = 'primary',
): { node: Node; button: Button; label: Label } {
  const result = makeButton(name, text, parent, x, y, w, h, fontSize, variant);
  applyButtonFrame(result.button, frameKey);
  return result;
}

/**
 * Create a panel with Graphics fallback + async UiSkin parchment loading.
 */
export function makeSkinnedPanel(
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string,
  frameKey: UiFrameKey = 'panelParchment',
): { bg: Node; titleLabel: Label | null } {
  const result = makePanel(parent, x, y, w, h, title);
  applyUiFrame(result.bg, frameKey);
  return result;
}

/**
 * Create a full-size background node with optional skin.
 */
export function makeSkinnedBackground(
  parent: Node,
  frameKey?: UiFrameKey,
): Node {
  const bg = makeNode('Background', parent, 0, 0, DESIGN_W, DESIGN_H);
  bg.setSiblingIndex(0);
  const g = bg.getComponent(Graphics) ?? bg.addComponent(Graphics);
  g.clear();
  g.fillColor = new Color(20, 12, 6, 255);
  g.rect(-DESIGN_W/2, -DESIGN_H/2, DESIGN_W, DESIGN_H);
  g.fill();
  if (frameKey) applyUiFrame(bg, frameKey);
  return bg;
}

/**
 * Create a sprite node that loads from resources with Graphics fallback.
 * A placeholder rectangle + label is drawn immediately; the real texture
 * replaces it when loaded asynchronously via UiSkin.
 */
export function makeSkinnedSprite(
  name: string,
  parent: Node,
  x: number,
  y: number,
  w: number,
  h: number,
  frameKey: UiFrameKey,
  fallbackLabel?: string,
): Node {
  const { node, sprite } = makeSpriteNode(name, parent, x, y, w, h);

  // Graphics fallback: visible immediately while texture loads
  const g = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  g.clear();
  g.fillColor = new Color(60, 35, 18, 120);
  g.roundRect(-w/2, -h/2, w, h, 6);
  g.fill();
  g.strokeColor = COLORS.GOLD_BORDER;
  g.lineWidth = 1;
  g.roundRect(-w/2, -h/2, w, h, 6);
  g.stroke();

  // Async load real texture; on success Graphics is hidden by the Sprite on top
  applyUiFrame(node, frameKey);

  // Optional label on top of fallback (e.g. emoji)
  if (fallbackLabel) {
    const labelNode = new Node(`${name}_FallbackLabel`);
    node.addChild(labelNode);
    labelNode.setPosition(new Vec3(0, 0, 0));
    labelNode.addComponent(UITransform).setContentSize(w - 4, h - 4);
    const label = labelNode.addComponent(Label);
    label.string = fallbackLabel;
    label.fontSize = Math.min(w, h) * 0.5;
    label.color = COLORS.FANTASY_GOLD;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
  }

  return node;
}

/**
 * Apply a card/list skin to an already-created node.
 * Wraps applyUiFrame so scene scripts don't need to import UiSkin directly.
 */
export function applyCardSkin(node: Node, key: UiFrameKey = 'listCard'): void {
  applyUiFrame(node, key);
}

/**
 * Apply a button skin to an already-created Button.
 */
export function applyButtonSkin(button: Button, key: UiFrameKey): void {
  applyButtonFrame(button, key);
}

// ── Named namespace export for `MobileUIFactory as F` import pattern ──
export const MobileUIFactory = {
  DESIGN_W,
  DESIGN_H,
  COLORS,
  FONTS,
  LAYOUT,
  makeNode,
  makeLabel,
  makeButton,
  makeEditBox,
  makeTopBar,
  makeBottomBar,
  makeTabBar,
  makePanel,
  makeScrollList,
  drawWoodenPanel,
  drawFantasyButton,
  drawParchmentBg,
  drawCardBg,
  drawHpBar,
  applyWidgetAnchor,
  makeSafeArea,
  applyLayout,
  addButtonFeedback,
  clearChildren,
  makeSpriteNode,
  makeSkinnedButton,
  makeSkinnedPanel,
  makeSkinnedBackground,
  makeSkinnedSprite,
  applyCardSkin,
  applyButtonSkin,
};
