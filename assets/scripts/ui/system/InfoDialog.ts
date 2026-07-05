import { _decorator, Button, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

export interface InfoSection {
  heading: string;
  content: string;
}

/**
 * InfoDialog — reusable information popup.
 * Displays a title, body text, and optional sections.
 * Designed for character/skill/mode/buff explanations.
 * Call show(title, body, sections) from any scene.
 */
@ccclass('InfoDialog')
export class InfoDialog extends Component {
  @property({ type: Label })
  titleLabel: Label | null = null;

  @property({ type: Label })
  bodyLabel: Label | null = null;

  @property({ type: Node })
  sectionListNode: Node | null = null;

  @property({ type: Button })
  closeButton: Button | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
    this.closeButton?.node.on(Button.EventType.CLICK, this.close, this);
    this.node.active = false;
  }

  onDestroy(): void {
    this.closeButton?.node.off(Button.EventType.CLICK, this.close, this);
  }

  /** Show the dialog. Any missing values get fallbacks. */
  show(title: string, body: string, sections?: InfoSection[]): void {
    this.node.active = true;
    this.node.setSiblingIndex(998);
    this.applyPanelFrame();

    if (this.titleLabel) this.titleLabel.string = title || 'Info';
    if (this.bodyLabel) this.bodyLabel.string = body || 'No details.';

    if (this.sectionListNode) {
      this.clearChildren(this.sectionListNode);
      if (sections && sections.length > 0) {
        let y = 0;
        for (let i = 0; i < Math.min(sections.length, 6); i++) {
          const section = sections[i];
          const sectionNode = this.createSection(section, y);
          this.sectionListNode.addChild(sectionNode);
          y -= this.estimateSectionHeight(section);
        }
      }
    }
  }

  close(): void {
    this.node.active = false;
  }

  private createSection(section: InfoSection, y: number): Node {
    const node = new Node(`Section_${section.heading}`);
    node.setPosition(new Vec3(0, y, 0));

    const heading = new Node('Heading');
    heading.setPosition(new Vec3(-200, 0, 0));
    const ht = heading.addComponent(UITransform);
    ht.setContentSize(400, 22);

    const hl = heading.addComponent(Label);
    hl.string = section.heading;
    hl.fontSize = 16;
    hl.lineHeight = 20;
    hl.color = new Color(211, 157, 78, 255);
    node.addChild(heading);

    const content = new Node('Content');
    content.setPosition(new Vec3(-200, -26, 0));
    const ct = content.addComponent(UITransform);
    ct.setContentSize(400, 20);

    const cl = content.addComponent(Label);
    cl.string = section.content;
    cl.fontSize = 14;
    cl.lineHeight = 18;
    cl.enableWrapText = true;
    cl.color = new Color(200, 185, 160, 255);
    node.addChild(content);

    return node;
  }

  private estimateSectionHeight(section: InfoSection): number {
    const lines = Math.ceil(section.content.length / 50);
    return Math.max(48, 22 + lines * 20 + 8);
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) child.destroy();
  }

  private ensureMinimalUi(): void {
    const t = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (t.contentSize.width <= 0 || t.contentSize.height <= 0) t.setContentSize(520, 440);

    this.applyPanelFrame();

    this.titleLabel ??= this.makeLabel('TitleLabel', 0, 175, 460, 38, 23, new Color(57, 34, 17, 255));
    this.bodyLabel ??= this.makeLabel('BodyLabel', 0, 120, 460, 120, 16, new Color(89, 58, 28, 255));
    this.sectionListNode ??= this.makeNode('SectionList', 0, -20, 480, 280);
    this.closeButton ??= this.makeButton('CloseButton', 'Close', 0, -190, 170, 48, 20);
  }

  private makeNode(name: string, x: number, y: number, w: number, h: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const t = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    t.setContentSize(w, h);
    return node;
  }

  private makeLabel(name: string, x: number, y: number, w: number, h: number, fs: number, color: Color): Label {
    const node = this.makeNode(name, x, y, w, h);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fs;
    label.lineHeight = fs + 5;
    label.enableWrapText = true;
    label.color = color;
    return label;
  }

  private makeButton(name: string, text: string, x: number, y: number, w: number, h: number, fs: number): Button {
    const node = this.makeNode(name, x, y, w, h);
    const button = node.getComponent(Button) ?? node.addComponent(Button);
    button.interactable = true;

    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.color = new Color(201, 157, 84, 255);

    const lbl = new Node('Label');
    node.addChild(lbl);
    lbl.setPosition(Vec3.ZERO);
    lbl.addComponent(UITransform).setContentSize(w, h);
    const label = lbl.addComponent(Label);
    label.string = text;
    label.fontSize = fs;
    label.lineHeight = fs + 5;
    label.color = new Color(57, 34, 17, 255);
    return button;
  }

  private applyPanelFrame(): void {
    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(38, 28, 18, 235);
    }
  }
}
