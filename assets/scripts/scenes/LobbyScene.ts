import { _decorator, Button, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { SUMMONER_SKILL_IDS, characterName, summonerSkillName } from '../core/DisplayText';
import { characterList } from '../shared/characters';
import type { Character, CharacterId, Room, SummonerSkillId } from '../shared/types';

const { ccclass, property } = _decorator;

@ccclass('LobbyScene')
export class LobbyScene extends Component {
  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  playerListLabel: Label | null = null;

  @property({ type: Label })
  selectionLabel: Label | null = null;

  @property({ type: Node })
  characterListNode: Node | null = null;

  @property({ type: Node })
  skillListNode: Node | null = null;

  @property({ type: Button })
  startGameButton: Button | null = null;

  private gameManager: GameManager | null = null;
  private serverActions!: ServerActions;
  private room: Room | null = null;
  private selectedCharacterId: CharacterId = 'boxer';
  private selectedSummonerSkillId: SummonerSkillId = 'lucky_plus_one';
  private statusText = '';
  private readonly handleRoomUpdatedBound = (room: Room) => this.render(room);
  private readonly handleStatusUpdatedBound = (status: string) => this.renderStatus(status);

  onLoad(): void {
    this.ensureMinimalUi();
    this.gameManager = GameManager.getInstance();
    this.serverActions = new ServerActions(this.gameManager);
    this.gameManager.onRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager.onStatusUpdated(this.handleStatusUpdatedBound, this);
    this.startGameButton?.node.on(Button.EventType.CLICK, this.startGame, this);

    const room = this.gameManager.getRoom();
    this.statusText = this.gameManager.getStatus();
    if (room) this.render(room);
  }

  onDestroy(): void {
    this.gameManager?.offRoomUpdated(this.handleRoomUpdatedBound, this);
    this.gameManager?.offStatusUpdated(this.handleStatusUpdatedBound, this);
    this.startGameButton?.node.off(Button.EventType.CLICK, this.startGame, this);
  }

  chooseCharacter(characterId: CharacterId): void {
    this.selectedCharacterId = characterId;
    this.serverActions.chooseCharacter(characterId);
  }

  chooseSummonerSkill(summonerSkillId: SummonerSkillId): void {
    this.selectedSummonerSkillId = summonerSkillId;
    this.serverActions.chooseSummonerSkill(summonerSkillId);
  }

  startGame(): void {
    const me = this.getMe();
    if (!me?.characterId) {
      this.chooseCharacter(this.selectedCharacterId);
      this.scheduleOnce(() => this.serverActions.startGame(), 0.25);
      return;
    }

    if (!me.summonerSkillId) {
      this.chooseSummonerSkill(this.selectedSummonerSkillId);
      this.scheduleOnce(() => this.serverActions.startGame(), 0.15);
      return;
    }

    this.serverActions.startGame();
  }

  private render(room: Room): void {
    this.room = room;
    const me = this.getMe();
    if (me?.characterId) this.selectedCharacterId = me.characterId;
    if (me?.summonerSkillId) this.selectedSummonerSkillId = me.summonerSkillId;

    if (this.statusLabel) {
      this.statusLabel.string = `Room ${room.id} | ${room.gameMode ?? 'classic'} | ${room.players.length}/${room.settings.maxPlayers}\n${this.statusText}`;
    }
    if (this.playerListLabel) {
      this.playerListLabel.string = room.players
        .map((player) => {
          const meMark = player.clientId === this.gameManager?.localClientId ? '* ' : '  ';
          const hostMark = player.isHost ? ' host' : '';
          const botMark = player.isBot ? ' bot' : '';
          return `${meMark}${player.nickname}${hostMark}${botMark}\n${characterName(player.characterId)} / ${summonerSkillName(player.summonerSkillId)}`;
        })
        .join('\n');
    }
    if (this.selectionLabel) {
      this.selectionLabel.string = `Selected: ${characterName(this.selectedCharacterId)} / ${summonerSkillName(this.selectedSummonerSkillId)}`;
    }

    this.renderCharacterButtons(room);
    this.renderSkillButtons();
  }

  private renderStatus(status: string): void {
    this.statusText = status;
    if (this.room) this.render(this.room);
  }

  private renderCharacterButtons(room: Room): void {
    if (!this.characterListNode) return;
    this.clearChildren(this.characterListNode);

    const visible = this.getVisibleCharacters(room).slice(0, 12);
    visible.forEach((character, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const selected = character.id === this.selectedCharacterId;
      const button = this.createButton(
        `Character_${character.id}`,
        `${selected ? '> ' : ''}${characterName(character.id)}`,
        -215 + col * 215,
        -row * 58,
        200,
        46,
        18,
        this.characterListNode!
      );
      button.node.on(Button.EventType.CLICK, () => this.chooseCharacter(character.id), this);
    });
  }

  private renderSkillButtons(): void {
    if (!this.skillListNode) return;
    this.clearChildren(this.skillListNode);

    SUMMONER_SKILL_IDS.forEach((skillId, index) => {
      const selected = skillId === this.selectedSummonerSkillId;
      const button = this.createButton(
        `Skill_${skillId}`,
        `${selected ? '> ' : ''}${summonerSkillName(skillId)}`,
        -260 + index * 130,
        0,
        120,
        44,
        16,
        this.skillListNode!
      );
      button.node.on(Button.EventType.CLICK, () => this.chooseSummonerSkill(skillId), this);
    });
  }

  private getVisibleCharacters(room: Room): Character[] {
    const mode = room.gameMode ?? room.settings.gameMode ?? 'classic';
    return characterList.filter((character) => {
      if (character.isHidden || character.availability?.hidden) return false;
      if (mode === 'classic') return character.availability?.classic !== false;
      if (mode === 'duo_2v2') return character.availability?.duo !== false;
      if (mode === 'pve_roguelite') return character.availability?.roguelite !== false;
      return character.availability?.pve !== false;
    });
  }

  private getMe(): Room['players'][number] | null {
    return this.gameManager?.getLocalPlayer() ?? this.room?.players.find((player) => !player.isBot) ?? this.room?.players[0] ?? null;
  }

  private ensureMinimalUi(): void {
    this.statusLabel ??= this.ensureLabel('StatusLabel', 0, 545, 680, 64, 20);
    this.playerListLabel ??= this.ensureLabel('PlayerListLabel', 0, 430, 680, 155, 18);
    this.selectionLabel ??= this.ensureLabel('SelectionLabel', 0, 320, 680, 42, 20);
    this.characterListNode ??= this.ensureNode('CharacterList', 0, 235, 680, 260);
    this.skillListNode ??= this.ensureNode('SkillList', 0, -55, 680, 52);
    this.startGameButton ??= this.createButton('StartGameButton', 'Start Game', 0, -175, 260, 64, 26, this.node);
  }

  private ensureNode(name: string, x: number, y: number, width: number, height: number): Node {
    const node = this.node.getChildByName(name) ?? new Node(name);
    if (!node.parent) this.node.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private ensureLabel(name: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
    const node = this.ensureNode(name, x, y, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    return label;
  }

  private createButton(
    name: string,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    parent: Node
  ): Button {
    const node = new Node(name);
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));

    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);

    const button = node.addComponent(Button);
    button.interactable = true;

    const labelNode = new Node('Label');
    node.addChild(labelNode);
    labelNode.setPosition(Vec3.ZERO);

    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(width, height);

    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.enableWrapText = true;
    return button;
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }
}
