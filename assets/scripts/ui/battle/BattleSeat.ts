import { _decorator, Button, Component, Label, Node, ProgressBar } from 'cc';
import { characterName, summonerSkillName } from '../../core/DisplayText';
import type { Player, Room } from '../../shared/types';
import { GameManager } from '../../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('BattleSeat')
export class BattleSeat extends Component {
  @property
  playerIndex = 0;

  @property({ type: Label })
  nameLabel: Label | null = null;

  @property({ type: Label })
  hpLabel: Label | null = null;

  @property({ type: Label })
  shieldLabel: Label | null = null;

  @property({ type: Label })
  characterLabel: Label | null = null;

  @property({ type: ProgressBar })
  hpBar: ProgressBar | null = null;

  @property({ type: Node })
  deadMask: Node | null = null;

  private gameManager: GameManager | null = null;
  private player: Player | null = null;
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);

  onLoad(): void {
    this.gameManager = GameManager.getInstance();
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.node.on(Button.EventType.CLICK, this.selectAsTarget, this);
    const room = this.gameManager.getRoom();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.node.off(Button.EventType.CLICK, this.selectAsTarget, this);
  }

  private render(room: Room): void {
    this.player = room.players[this.playerIndex] ?? null;
    this.renderPlayer(this.player);
  }

  private renderPlayer(player: Player | null): void {
    if (this.nameLabel) this.nameLabel.string = player?.nickname ?? 'Empty';
    if (this.hpLabel) this.hpLabel.string = player ? `${player.hp} / ${player.maxHp}` : '-- / --';
    if (this.shieldLabel) this.shieldLabel.string = player && player.shield > 0 ? `Shield ${player.shield}` : '';
    if (this.characterLabel) {
      this.characterLabel.string = player ? `${characterName(player.characterId)} / ${summonerSkillName(player.summonerSkillId)}` : '';
    }
    if (this.hpBar) {
      this.hpBar.progress = player && player.maxHp > 0 ? Math.max(0, Math.min(1, player.hp / player.maxHp)) : 0;
    }
    if (this.deadMask) {
      this.deadMask.active = player?.isDead === true;
    }
  }

  private selectAsTarget(): void {
    if (!this.player || this.player.isDead) return;
    this.gameManager?.emitAck('selectTarget', { targetId: this.player.id });
  }
}
