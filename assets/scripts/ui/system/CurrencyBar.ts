import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CurrencyBar')
export class CurrencyBar extends Component {
  @property({ type: Label })
  goldLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Label })
  stageLabel: Label | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(payload: { gold?: number; hp?: number; maxHp?: number; stage?: number; maxStage?: number }): void {
    this.ensureMinimalUi();
    if (this.goldLabel) this.goldLabel.string = `Gold ${payload.gold ?? 0}`;
    if (this.hpLabel) {
      const hp = payload.hp ?? 0;
      const maxHp = payload.maxHp ?? 0;
      this.hpLabel.string = maxHp > 0 ? `HP ${hp}/${maxHp}` : 'HP -';
    }
    if (this.stageLabel) {
      const stage = payload.stage ?? 0;
      const maxStage = payload.maxStage ?? 0;
      this.stageLabel.string = maxStage > 0 ? `Stage ${stage}/${maxStage}` : 'Stage -';
    }
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(520, 48);
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(44, 30, 18, 225);
    }

    this.stageLabel ??= this.makeLabel('StageLabel', -170, 0, 150, 30, 16);
    this.goldLabel ??= this.makeLabel('GoldLabel', 0, 0, 140, 30, 16);
    this.hpLabel ??= this.makeLabel('HpLabel', 170, 0, 150, 30, 16);
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 5;
    label.enableWrapText = true;
    label.color = new Color(255, 238, 196, 255);
    return label;
  }
}
