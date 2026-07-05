import { _decorator, Color, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { characterName } from '../../core/DisplayText';
import type { PlayerProfile } from '../../services/ProfileService';
import type { Room } from '../../shared/types';

const { ccclass, property } = _decorator;

@ccclass('ProfilePanel')
export class ProfilePanel extends Component {
  @property({ type: Label })
  identityLabel: Label | null = null;

  @property({ type: Label })
  progressLabel: Label | null = null;

  @property({ type: Label })
  pvpLabel: Label | null = null;

  @property({ type: Label })
  rogueliteLabel: Label | null = null;

  @property({ type: Label })
  careerLabel: Label | null = null;

  @property({ type: Label })
  achievementsLabel: Label | null = null;

  @property({ type: Label })
  roomLabel: Label | null = null;

  @property({ type: SpriteFrame })
  panelFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  sectionFrame: SpriteFrame | null = null;

  onLoad(): void {
    this.ensureMinimalUi();
  }

  render(profile: PlayerProfile, room: Room | null): void {
    this.ensureMinimalUi();
    const winRate = `${Math.round(profile.pvp.winRate * 100)}%`;
    const recent = profile.pvp.recentResults.map((result) => result === 'win' ? 'W' : 'L').join(' ');
    const achievements = profile.achievements
      .slice(0, 5)
      .map((item) => {
        const progress = item.maxProgress ? ` ${item.progress ?? 0}/${item.maxProgress}` : '';
        return `${item.unlocked ? '[Done]' : '[ ]'} ${item.name}${progress}`;
      })
      .join('\n');

    if (this.identityLabel) {
      this.identityLabel.string = [
        profile.user.nickname,
        profile.user.title,
        `Client ${shortId(profile.user.clientId)}`,
        `Player ${profile.user.playerId ? shortId(profile.user.playerId) : 'not joined'}`,
      ].join('\n');
    }
    if (this.progressLabel) {
      this.progressLabel.string = [
        `Lv.${profile.progress.level}  ${profile.progress.rankTitle}`,
        `EXP ${profile.progress.exp} / ${profile.progress.expToNext}`,
        `Coins ${profile.progress.coins}`,
      ].join('\n');
    }
    if (this.pvpLabel) {
      this.pvpLabel.string = [
        `Wins ${profile.pvp.wins} / ${profile.pvp.totalGames}`,
        `Win rate ${winRate}`,
        `Streak ${profile.pvp.streak}`,
        `Recent ${recent || '-'}`,
      ].join('\n');
    }
    if (this.rogueliteLabel) {
      this.rogueliteLabel.string = [
        `Highest stage ${profile.roguelite.highestStage}`,
        `Bosses ${profile.roguelite.bossesDefeated}`,
        `Max damage ${profile.roguelite.maxSingleDamage}`,
        `Max taken ${profile.roguelite.maxDamageTaken}`,
        `Max healing ${profile.roguelite.maxHealing}`,
      ].join('\n');
    }
    if (this.careerLabel) {
      this.careerLabel.string = [
        `Favorite ${characterName(profile.careers.favoriteCareer as never)}`,
        `Best rate ${characterName(profile.careers.bestWinRateCareer as never)}`,
        `Recent ${profile.careers.recentCareers.map((id) => characterName(id as never)).join(' / ')}`,
      ].join('\n');
    }
    if (this.achievementsLabel) this.achievementsLabel.string = achievements || 'No achievements yet.';
    if (this.roomLabel) {
      this.roomLabel.string = room
        ? `Current room ${room.id}\nMode ${room.gameMode ?? room.settings.gameMode}\nPhase ${room.phase}\nPlayers ${room.players.length}/${room.settings.maxPlayers}`
        : 'Current room: none';
    }
  }

  private ensureMinimalUi(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.contentSize.width <= 0 || transform.contentSize.height <= 0) {
      transform.setContentSize(640, 760);
    }

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    if (this.panelFrame) {
      sprite.spriteFrame = this.panelFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(38, 28, 18, 225);
    }

    this.identityLabel ??= this.makeLabel('IdentityLabel', 0, 270, 560, 120, 21);
    this.progressLabel ??= this.makeSectionLabel('ProgressLabel', -160, 130, 270, 112, 16);
    this.pvpLabel ??= this.makeSectionLabel('PvpLabel', 160, 130, 270, 112, 16);
    this.rogueliteLabel ??= this.makeSectionLabel('RogueliteLabel', -160, -25, 270, 140, 15);
    this.careerLabel ??= this.makeSectionLabel('CareerLabel', 160, -25, 270, 140, 15);
    this.achievementsLabel ??= this.makeSectionLabel('AchievementsLabel', -160, -210, 270, 170, 14);
    this.roomLabel ??= this.makeSectionLabel('RoomLabel', 160, -210, 270, 170, 14);
  }

  private makeSectionLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.makeNode(`${name}Frame`, x, y, width, height);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    if (this.sectionFrame) {
      sprite.spriteFrame = this.sectionFrame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.color = new Color(255, 255, 255, 255);
    } else {
      sprite.color = new Color(244, 213, 150, 235);
    }

    const labelNode = node.getChildByName(name) ?? new Node(name);
    if (!labelNode.parent) node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);
    const transform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
    transform.setContentSize(width - 24, height - 20);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.makeNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
    label.enableWrapText = true;
    label.color = new Color(57, 34, 17, 255);
    return label;
  }

  private makeNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }
}

function shortId(value: string): string {
  if (!value || value.length <= 10) return value || '-';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
