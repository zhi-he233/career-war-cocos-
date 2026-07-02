import { _decorator, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { DiceAnimator, type RollMode } from '../../helpers/DiceAnimator';
import { latestEvents } from '../../helpers/BattlePlayerHelpers';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

/**
 * DicePanel — pure display component for dice roll animation.
 * BattleScene owns the roll flow; it calls startRoll() when the player rolls,
 * and render() automatically reveals when the server result arrives.
 */
@ccclass('DicePanel')
export class DicePanel extends Component {
  @property({ type: Label })
  diceLabel: Label | null = null;

  @property({ type: Label })
  statusLabel: Label | null = null;

  private animator = new DiceAnimator();
  private room: Room | null = null;

  // ── Public API (called by BattleScene) ──

  /** Start the roll animation. Called by BattleScene when the player clicks roll. */
  startRoll(mode: RollMode = 'normal'): void {
    this.animator.start(mode);
  }

  // ── Cocos Lifecycle ──

  onLoad(): void {
    this.ensureMinimalUi();
  }

  update(dt: number): void {
    this.animator.update(dt);
    if (this.diceLabel && this.animator.isRolling) {
      this.diceLabel.string = String(this.animator.currentFace);
    }
  }

  // ── Render (called by parent scene) ──

  render(room: Room): void {
    const prevPhase = this.room?.pendingRollDecision;
    const nextPhase = room.pendingRollDecision;
    this.room = room;

    // Server result arrived during animation → reveal it
    if (this.animator.isRolling && nextPhase && !prevPhase) {
      this.animator.reveal(nextPhase.currentRoll);
      this.animator.finishReveal();
    }

    if (this.diceLabel && !this.animator.isRolling) {
      if (room.pendingRollDecision) {
        this.diceLabel.string = String(room.pendingRollDecision.currentRoll);
      } else {
        const last = latestEvents(room, 1).find(e => e.type === 'roll' && e.dice?.length);
        this.diceLabel.string = last?.dice?.join(' / ') ?? '-';
      }
    }

    if (this.statusLabel) {
      this.statusLabel.string = room.pendingRollDecision ? 'Choose an action' : 'Ready to roll';
    }
  }

  // ── Boilerplate UI setup (called once) ──

  ensureMinimalUi(): void {
    const t = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (t.contentSize.width <= 0) t.setContentSize(320, 190);

    this.statusLabel ??= this.makeLabel('StatusLabel', 0, 58, 300, 34, 18);
    this.diceLabel   ??= this.makeLabel('DiceLabel',   0, 10, 300, 54, 34);
  }

  private makeNode(name: string, x: number, y: number, w: number, h: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const t = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    t.setContentSize(w, h);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, w: number, h: number, fs: number): Label {
    const node = this.makeNode(name, x, y, w, h);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fs;
    label.lineHeight = fs + 6;
    label.enableWrapText = true;
    return label;
  }
}
