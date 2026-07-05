import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import type { CharacterId, Room, SummonerSkillId } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('DuoSlotPicker')
export class DuoSlotPicker extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Button })
  slot0Button: Button | null = null;

  @property({ type: Button })
  slot1Button: Button | null = null;

  @property({ type: Label })
  slot0Label: Label | null = null;

  @property({ type: Label })
  slot1Label: Label | null = null;

  @property({ type: Label })
  hintLabel: Label | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  slotFrame: SpriteFrame | null = null;

  private slotHandler: ((slotIndex: 0 | 1) => void) | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.slot0Button?.node.on(Button.EventType.CLICK, () => this.slotHandler?.(0), this);
    this.slot1Button?.node.on(Button.EventType.CLICK, () => this.slotHandler?.(1), this);
  }

  onDestroy(): void {
    this.slot0Button?.node.off(Button.EventType.CLICK);
    this.slot1Button?.node.off(Button.EventType.CLICK);
  }

  setSlotHandler(handler: (slotIndex: 0 | 1) => void): void {
    this.slotHandler = handler;
  }

  render(room: Room, localClientId: string, selectedCharacterId: CharacterId, selectedSummonerSkillId: SummonerSkillId): void {
    const localPlayer = room.players.find((player) => player.clientId === localClientId || player.controllerId === localClientId) ?? room.players[0];
    const controllerId = localPlayer?.id ?? localClientId;
    const slot0 = room.duoSlots?.find((slot) => slot.controllerId === controllerId && slot.slotIndex === 0);
    const slot1 = room.duoSlots?.find((slot) => slot.controllerId === controllerId && slot.slotIndex === 1);

    // Detect conflicts: characters already used by other teams, or by the other slot
    const occupiedIds = new Set<CharacterId>();
    for (const slot of room.duoSlots ?? []) {
      if (slot.characterId && slot.controllerId !== controllerId) {
        occupiedIds.add(slot.characterId);
      }
    }
    // Cross-slot conflict: the OTHER slot's character
    const slotConflict0 = slot1?.characterId && slot1.characterId === selectedCharacterId;
    const slotConflict1 = slot0?.characterId && slot0.characterId === selectedCharacterId;
    const globalConflict = occupiedIds.has(selectedCharacterId);

    if (this.titleLabel) this.titleLabel.string = '2V2 Slots';
    if (this.slot0Label) {
      const warn0 = slotConflict0 || globalConflict ? ' ⚠' : '';
      this.slot0Label.string = this.slotText(1, slot0?.characterId, slot0?.summonerSkillId) + warn0;
    }
    if (this.slot1Label) {
      const warn1 = slotConflict1 || globalConflict ? ' ⚠' : '';
      this.slot1Label.string = this.slotText(2, slot1?.characterId, slot1?.summonerSkillId) + warn1;
    }
    if (this.hintLabel) {
      const conflictMsg = slotConflict0 || slotConflict1
        ? '⚠ Same character in both slots!'
        : globalConflict
          ? '⚠ Character already taken by another team'
          : '';
      this.hintLabel.string = conflictMsg || `Tap a slot to set: ${characterName(selectedCharacterId)} / ${summonerSkillName(selectedSummonerSkillId)}`;
    }
  }

  private slotText(index: number, characterId?: CharacterId, skillId?: SummonerSkillId): string {
    return `Slot ${index}\n${characterName(characterId)}\n${summonerSkillName(skillId)}`;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(640, 150);
    if (this.panelFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 56, 600, 26, 18);
    this.slot0Button ??= this.makeSlotButton('Slot0Button', -155, 0);
    this.slot1Button ??= this.makeSlotButton('Slot1Button', 155, 0);
    this.slot0Label ??= this.makeButtonLabel(this.slot0Button.node, 'Label', 260, 82, 15);
    this.slot1Label ??= this.makeButtonLabel(this.slot1Button.node, 'Label', 260, 82, 15);
    this.hintLabel ??= this.makeLabel('HintLabel', 0, -58, 600, 24, 13);
  }

  private makeSlotButton(name: string, x: number, y: number): Button {
    const node = this.makeNode(name, x, y, 280, 86);
    if (this.slotFrame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = this.slotFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    return node.getComponent(Button) ?? node.addComponent(Button);
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

  private makeButtonLabel(parent: Node, name: string, width: number, height: number, fontSize: number): Label {
    const node = parent.getChildByName(name) ?? new Node(name);
    if (!node.parent) parent.addChild(node);
    node.setPosition(Vec3.ZERO);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }
}
