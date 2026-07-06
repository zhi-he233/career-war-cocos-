import { _decorator, Button, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, instantiate } from 'cc';
import { EMOTE_DEFS, EmoteHelper, getEmoteDef } from '../../helpers/EmoteHelper';
import type { EmoteId } from '../../shared/types';

const { ccclass, property } = _decorator;

const COOLDOWN_TICK = 0.25;

@ccclass('EmoteBar')
export class EmoteBar extends Component {
  @property({ type: Prefab })
  emoteButtonPrefab: Prefab | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  private emoteHelper = new EmoteHelper();
  private buttons: Button[] = [];
  private cooldownLabels: Label[] = [];
  private scheduleId: ReturnType<typeof setInterval> | null = null;

  /** (emoteId) => void. Set by parent scene. */
  onSendEmote: ((emoteId: EmoteId) => void) | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.startCooldownRefresh();
  }

  onDestroy(): void {
    this.stopCooldownRefresh();
  }

  /** Reset cooldown state (e.g. on room change). */
  reset(): void {
    this.emoteHelper.reset();
    this.refreshButtonStates();
  }

  /** Reset only the send cooldown, allowing immediate retry. Used on ack failure. */
  resetCooldown(): void {
    this.emoteHelper.resetCooldown();
    this.refreshButtonStates();
  }

  // ── UI ──

  private ensureMinimalUi(): void {
    this.buttons = [];
    this.cooldownLabels = [];

    EMOTE_DEFS.forEach((def, index) => {
      if (this.emoteButtonPrefab) {
        const node = instantiate(this.emoteButtonPrefab);
        node.name = `Emote_${def.id}`;
        this.node.addChild(node);
        node.setPosition(new Vec3(-250 + index * 100, 0, 0));
        const button = node.getComponent(Button) ?? node.addComponent(Button);
        const label = this.ensureButtonLabel(node, def.emoji);
        this.buttons.push(button);
        this.cooldownLabels.push(label);
        button.node.on(Button.EventType.CLICK, () => this.trySend(def.id), this);
      } else {
        const node = this.makeButton(def.id, def.emoji, -250 + index * 100, 0, 92, 48, 17);
        this.buttons.push(node.getComponent(Button)!);
        const label = node.getChildByName('EmoteLabel')?.getComponent(Label)
          ?? node.addComponent(Label);
        this.cooldownLabels.push(label);
        node.on(Button.EventType.CLICK, () => this.trySend(def.id), this);
      }
    });

    const t = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    t.setContentSize(620, 56);
  }

  private makeButton(id: string, text: string, x: number, y: number, w: number, h: number, fs: number): Node {
    const node = this.node.getChildByName(`Emote_${id}`) ?? new Node(`Emote_${id}`);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const t = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    t.setContentSize(w, h);

    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    if (this.buttonFrame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = this.buttonFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    const labelNode = node.getChildByName('EmoteLabel') ?? new Node('EmoteLabel');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const lt = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    lt.setContentSize(w, h);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fs;
    label.lineHeight = fs + 4;
    label.color = new Color(57, 34, 17, 255);
    return node;
  }

  private ensureButtonLabel(parentNode: Node, fallback: string): Label {
    const labelNode = parentNode.getChildByName('Label') ?? parentNode.getChildByName('EmoteLabel') ?? new Node('EmoteLabel');
    if (!labelNode.parent) parentNode.addChild(labelNode);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    if (!label.string) label.string = fallback;
    return label;
  }

  // ── Send ──

  private trySend(emoteId: EmoteId): void {
    if (!this.emoteHelper.canSend) return;
    if (!this.emoteHelper.trySend()) return;
    this.onSendEmote?.(emoteId);
    this.refreshButtonStates();
  }

  // ── Cooldown refresh ──

  private startCooldownRefresh(): void {
    this.stopCooldownRefresh();
    this.scheduleId = setInterval(() => {
      this.emoteHelper.tick();
      this.refreshButtonStates();
    }, COOLDOWN_TICK * 1000);
  }

  private stopCooldownRefresh(): void {
    if (this.scheduleId !== null) {
      clearInterval(this.scheduleId);
      this.scheduleId = null;
    }
  }

  private refreshButtonStates(): void {
    const canSend = this.emoteHelper.canSend;
    const remainingMs = this.emoteHelper.remainingCooldownMs;
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 100) / 10);

    this.buttons.forEach((btn, i) => {
      if (!btn?.isValid) return;
      btn.interactable = canSend;
      const lbl = this.cooldownLabels[i];
      if (lbl?.isValid) {
        const def = EMOTE_DEFS[i];
        lbl.string = canSend ? (def?.emoji ?? '?') : `${remainingSec}s`;
        lbl.color = canSend ? new Color(57, 34, 17, 255) : new Color(155, 140, 120, 255);
      }
    });
  }

  // ── Incoming ──

  /** Register an incoming emote for a player. Used by BattleScene to push received emotes. */
  addIncoming(playerId: string, emoteId: string): string | null {
    this.emoteHelper.addIncoming(playerId, emoteId);
    const def = getEmoteDef(emoteId);
    return def?.emoji ?? null;
  }

  /** Get active emote for a player (returns most recent). */
  getActiveForPlayer(playerId: string): string | null {
    const active = this.emoteHelper.getForPlayer(playerId);
    return active?.emoji ?? null;
  }
}
