import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { DiceAnimator, type RollMode } from '../../helpers/DiceAnimator';
import { latestEvents } from '../../helpers/BattlePlayerHelpers';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('DicePanel')
export class DicePanel extends Component {
  @property({ type: Label })
  diceLabel: Label | null = null;

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  skillHintLabel: Label | null = null;

  @property({ type: Sprite })
  diceFaceSprite: Sprite | null = null;

  @property({ type: [SpriteFrame] })
  diceFaces: SpriteFrame[] = [];

  private animator = new DiceAnimator();
  private room: Room | null = null;
  private revealFinishTimer = 0;

  startRoll(mode: RollMode = 'normal'): void {
    this.revealFinishTimer = 0;
    this.animator.start(mode);
  }

  onLoad(): void {
    this.ensureMinimalUi();
    this.setFace(1);
  }

  update(dt: number): void {
    this.animator.update(dt);

    if (this.animator.phase === 'reveal') {
      this.revealFinishTimer += dt;
      if (this.revealFinishTimer >= 0.22) {
        this.animator.finishReveal();
        this.revealFinishTimer = 0;
      }
    }

    if (this.animator.phase !== 'idle') {
      this.setFace(this.animator.currentFace);
      this.setPhaseText(this.animator.phase);
    }
  }

  render(room: Room): void {
    const hadDecision = Boolean(this.room?.pendingRollDecision);
    const hasDecision = Boolean(room.pendingRollDecision);
    this.room = room;

    if (this.animator.isRolling && hasDecision && !hadDecision) {
      this.animator.reveal(room.pendingRollDecision!.currentRoll);
      this.revealFinishTimer = 0;
    }

    if (this.animator.phase === 'idle') {
      const face = room.pendingRollDecision?.currentRoll ?? this.latestRoll(room);
      this.setFace(face || 1);
      this.setPhaseText(room.pendingRollDecision ? 'reveal' : 'idle');
    }

    if (this.diceLabel) {
      const face = room.pendingRollDecision?.currentRoll ?? this.latestRoll(room);
      this.diceLabel.string = face ? String(face) : '-';
    }

    if (this.skillHintLabel) {
      const decision = room.pendingRollDecision;
      const hints = [
        decision?.availableCharacterSkillName,
        decision?.availableSummonerSkillName,
      ].filter(Boolean);
      this.skillHintLabel.string = hints.join(' / ');
    }
  }

  private latestRoll(room: Room): number {
    const event = latestEvents(room).find((item) => item.type === 'roll' && item.dice?.length);
    return event?.dice?.[event.dice.length - 1] ?? 0;
  }

  private setFace(face: number): void {
    const normalized = Math.max(1, Math.min(6, Math.floor(face || 1)));
    const frame = this.diceFaces[normalized - 1] ?? null;
    if (frame && this.diceFaceSprite) {
      this.diceFaceSprite.spriteFrame = frame;
      this.diceFaceSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      this.diceFaceSprite.color = normalized === 6 ? new Color(255, 226, 128, 255) : new Color(255, 255, 255, 255);
    }
    if (this.diceLabel) this.diceLabel.string = String(normalized);
  }

  private setPhaseText(phase: string): void {
    if (!this.statusLabel) return;
    if (phase === 'fast') this.statusLabel.string = 'Rolling...';
    else if (phase === 'slow') this.statusLabel.string = 'Slowing...';
    else if (phase === 'pause') this.statusLabel.string = 'Waiting result...';
    else if (phase === 'reveal') this.statusLabel.string = 'Result';
    else this.statusLabel.string = this.room?.pendingRollDecision ? 'Choose action' : 'Ready';
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(320, 210);
    }

    this.statusLabel ??= this.makeLabel('StatusLabel', 0, 78, 300, 30, 18);
    this.diceFaceSprite ??= this.makeDiceSprite();
    this.diceLabel ??= this.makeLabel('DiceLabel', 0, 0, 110, 54, 28);
    this.skillHintLabel ??= this.makeLabel('SkillHintLabel', 0, -76, 300, 32, 15);
  }

  private makeDiceSprite(): Sprite {
    const node = this.makeNode('DiceFace', 0, 0, 116, 116);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    return sprite;
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
    label.color = new Color(255, 238, 196, 255);
    return label;
  }
}
