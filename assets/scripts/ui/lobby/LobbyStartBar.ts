import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('LobbyStartBar')
export class LobbyStartBar extends Component {
  @property({ type: Label })
  hintLabel: Label | null = null;

  @property({ type: Button })
  startButton: Button | null = null;

  @property({ type: Label })
  startLabel: Label | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(room: Room | null, localClientId: string, buttonText: string): void {
    const me = room?.players.find((player) => player.clientId === localClientId || player.controllerId === localClientId) ?? null;
    const missing: string[] = [];
    if (!me?.characterId) missing.push('角色');
    if (!me?.summonerSkillId) missing.push('召唤师技能');

    if (this.hintLabel) {
      if (!room) {
        this.hintLabel.string = '房间加载中';
      } else if (missing.length > 0) {
        this.hintLabel.string = `请选择 ${missing.join(' 和 ')}。当前：${characterName(me?.characterId)} / ${summonerSkillName(me?.summonerSkillId)}`;
      } else {
        this.hintLabel.string = `已就绪：${characterName(me.characterId)} / ${summonerSkillName(me.summonerSkillId)}`;
      }
    }
    if (this.startLabel) this.startLabel.string = buttonText;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) transform.setContentSize(640, 82);
    if (this.panelFrame) {
      const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    this.hintLabel ??= this.makeLabel('HintLabel', -120, 0, 360, 54, 15);
    this.startButton ??= this.makeButton('StartButton', 215, 0, 190, 56);
    this.startLabel ??= this.makeButtonLabel(this.startButton.node, 'Label', 190, 56, 22);
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

  private makeButton(name: string, x: number, y: number, width: number, height: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    if (this.buttonFrame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = this.buttonFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    return node.getComponent(Button) ?? node.addComponent(Button);
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
