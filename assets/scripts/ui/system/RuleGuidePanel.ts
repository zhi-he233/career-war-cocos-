import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { RULE_GUIDE_PAGES } from '../../core/DisplayText';

const { ccclass, property } = _decorator;

@ccclass('RuleGuidePanel')
export class RuleGuidePanel extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  bodyLabel: Label | null = null;

  @property({ type: Label })
  pageLabel: Label | null = null;

  @property({ type: Button })
  prevButton: Button | null = null;

  @property({ type: Button })
  nextButton: Button | null = null;

  @property({ type: Button })
  closeButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  buttonFrame: SpriteFrame | null = null;

  private pageIndex = 0;

  onLoad(): void {
    this.ensureMinimalUi();
    this.prevButton?.node.on(Button.EventType.CLICK, this.prevPage, this);
    this.nextButton?.node.on(Button.EventType.CLICK, this.nextPage, this);
    this.closeButton?.node.on(Button.EventType.CLICK, this.close, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.prevButton?.node.off(Button.EventType.CLICK, this.prevPage, this);
    this.nextButton?.node.off(Button.EventType.CLICK, this.nextPage, this);
    this.closeButton?.node.off(Button.EventType.CLICK, this.close, this);
  }

  open(pageIndex = 0): void {
    this.pageIndex = Math.max(0, Math.min(RULE_GUIDE_PAGES.length - 1, pageIndex));
    this.node.active = true;
    this.node.setSiblingIndex(999);
    this.render();
  }

  close(): void {
    this.node.active = false;
  }

  private prevPage(): void {
    this.pageIndex = Math.max(0, this.pageIndex - 1);
    this.render();
  }

  private nextPage(): void {
    this.pageIndex = Math.min(RULE_GUIDE_PAGES.length - 1, this.pageIndex + 1);
    this.render();
  }

  private render(): void {
    this.ensureMinimalUi();
    const page = RULE_GUIDE_PAGES[this.pageIndex];
    if (this.titleLabel) this.titleLabel.string = page.title;
    if (this.bodyLabel) this.bodyLabel.string = page.body;
    if (this.pageLabel) this.pageLabel.string = `${this.pageIndex + 1} / ${RULE_GUIDE_PAGES.length}`;
    if (this.prevButton) this.prevButton.interactable = this.pageIndex > 0;
    if (this.nextButton) this.nextButton.interactable = this.pageIndex < RULE_GUIDE_PAGES.length - 1;
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(620, 520);
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(38, 28, 18, 235);
    }

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 185, 540, 46, 27);
    this.bodyLabel ??= this.makeLabel('BodyLabel', 0, 30, 530, 260, 21);
    this.pageLabel ??= this.makeLabel('PageLabel', 0, -130, 180, 28, 18);
    this.prevButton ??= this.makeButton('PrevButton', 'Prev', -190, -190, 140, 52, 19);
    this.nextButton ??= this.makeButton('NextButton', 'Next', 0, -190, 140, 52, 19);
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 190, -190, 140, 52, 19);
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
    label.lineHeight = fontSize + 7;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, width: number, height: number, fontSize: number): Button {
    const node = this.makeNode(name, x, y, width, height);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    if (this.buttonFrame) {
      sprite.spriteFrame = this.buttonFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      button.normalSprite = this.buttonFrame;
      button.hoverSprite = this.buttonFrame;
      button.pressedSprite = this.buttonFrame;
      button.disabledSprite = this.buttonFrame;
      button.target = node;
    } else {
      sprite.color = new Color(201, 157, 84, 255);
    }

    // Create label as child of button node, not on this.node (avoids Prev/Next/Close sharing one 'Label')
    const labelNode = node.getChildByName('Label') ?? new Node('Label');
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const lt = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    lt.setContentSize(width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 7;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return button;
  }
}
