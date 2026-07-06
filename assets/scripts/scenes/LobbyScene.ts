import { _decorator, Button, Color, Component, Label, Node, Prefab, Sprite, SpriteFrame, UITransform, Vec3, instantiate } from 'cc';
import { GameManager } from '../core/GameManager';
import { ServerActions } from '../core/ServerActions';
import { SUMMONER_SKILL_IDS, characterName, summonerSkillName, summonerSkillDescription, characterDescription, gameModeDescription } from '../core/DisplayText';
import { CharacterCard } from '../ui/lobby/CharacterCard';
import { CharacterDetailDialog } from '../ui/lobby/CharacterDetailDialog';
import { DuoSlotPicker } from '../ui/lobby/DuoSlotPicker';
import { LobbyStartBar } from '../ui/lobby/LobbyStartBar';
import { PlayerListItem } from '../ui/lobby/PlayerListItem';
import { RoomSettingsPanel } from '../ui/lobby/RoomSettingsPanel';
import { SummonerSkillCard } from '../ui/lobby/SummonerSkillCard';
import { SummonerSkillDetailDialog } from '../ui/lobby/SummonerSkillDetailDialog';
import { InfoDialog } from '../ui/system/InfoDialog';
import { characterList } from '../shared/characters';
import type { Character, CharacterId, Player, Room, SummonerSkillId } from '../shared/types';

const { ccclass, property } = _decorator;

@ccclass('LobbyScene')
export class LobbyScene extends Component {
  @property
  lobbyTitle = 'Preparation Room';

  @property
  modeHint = '';

  @property
  fixedMaxPlayers = 0;

  @property
  startButtonText = 'Start Game';

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  playerListLabel: Label | null = null;

  @property({ type: Node })
  playerListNode: Node | null = null;

  @property({ type: Label })
  selectionLabel: Label | null = null;

  @property({ type: Node })
  characterListNode: Node | null = null;

  @property({ type: Node })
  skillListNode: Node | null = null;

  @property({ type: Button })
  startGameButton: Button | null = null;

  @property({ type: SpriteFrame })
  parchmentFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  seatFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  characterCardFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  actionCardFrame: SpriteFrame | null = null;

  @property({ type: SpriteFrame })
  statusFrame: SpriteFrame | null = null;

  @property({ type: Prefab })
  characterCardPrefab: Prefab | null = null;

  @property({ type: Prefab })
  playerListItemPrefab: Prefab | null = null;

  @property({ type: Prefab })
  summonerSkillCardPrefab: Prefab | null = null;

  @property({ type: Prefab })
  lobbyStartBarPrefab: Prefab | null = null;

  @property({ type: Prefab })
  roomSettingsPanelPrefab: Prefab | null = null;

  @property({ type: Prefab })
  duoSlotPickerPrefab: Prefab | null = null;

  @property({ type: Prefab })
  characterDetailDialogPrefab: Prefab | null = null;

  @property({ type: Prefab })
  summonerSkillDetailDialogPrefab: Prefab | null = null;

  @property({ type: Prefab })
  infoDialogPrefab: Prefab | null = null;

  protected gameManager: GameManager | null = null;
  protected serverActions!: ServerActions;
  protected room: Room | null = null;
  protected selectedCharacterId: CharacterId = 'boxer';
  protected selectedSummonerSkillId: SummonerSkillId = 'lucky_plus_one';
  private duoSlotPicker: DuoSlotPicker | null = null;
  private lobbyStartBar: LobbyStartBar | null = null;
  private roomSettingsPanel: RoomSettingsPanel | null = null;
  private characterDetailDialog: CharacterDetailDialog | null = null;
  private summonerSkillDetailDialog: SummonerSkillDetailDialog | null = null;
  private infoDialog: InfoDialog | null = null;
  private statusText = '';
  private settingsAppliedRoomId = '';
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
    // Guard: don't pick a character already taken by another player
    const room = this.room;
    if (room) {
      const allowDup = room.settings.allowDuplicateCharacters !== false;
      const me = this.getMe();
      if (!allowDup) {
        const takenByOther = room.players.some(p => p.characterId === characterId && p.id !== me?.id);
        if (takenByOther) {
          this.gameManager?.showToast('Character already taken', 2);
          return;
        }
      }
    }
    this.selectedCharacterId = characterId;
    this.serverActions.chooseCharacter(characterId);
    this.showCharacterDetail(characterId);
  }

  chooseSummonerSkill(summonerSkillId: SummonerSkillId): void {
    this.selectedSummonerSkillId = summonerSkillId;
    this.serverActions.chooseSummonerSkill(summonerSkillId);
    this.showSummonerSkillDetail(summonerSkillId);
  }

  /** Open reusable InfoDialog. Falls back to toast if prefab not bound. */
  showInfo(title: string, body: string): void {
    if (this.infoDialogPrefab && !this.infoDialog?.node?.isValid) {
      const node = this.instantiatePrefab(this.infoDialogPrefab, 'InfoDialog', 0, 20, 520, 440, this.node);
      node.setSiblingIndex(this.node.children.length - 1);
      this.infoDialog = node.getComponent(InfoDialog) ?? node.addComponent(InfoDialog);
    }
    if (this.infoDialog) {
      this.infoDialog.show(title, body);
    } else {
      this.gameManager?.showToast(body.slice(0, 120), 3);
    }
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
    this.applyFixedSettings(room);
    const me = this.getMe();
    if (me?.characterId) this.selectedCharacterId = me.characterId;
    if (me?.summonerSkillId) this.selectedSummonerSkillId = me.summonerSkillId;

    if (this.statusLabel) {
      const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
      const effectiveHint = this.modeHint || (mode === 'pve_roguelite' ? 'Roguelite: starting character locked, gain rewards through stages.' : '');
      const hint = effectiveHint ? `\n${effectiveHint}` : '';
      this.statusLabel.string = `${this.lobbyTitle}\nRoom ${room.id} | ${mode} | ${room.players.length}/${room.settings.maxPlayers}\n${this.statusText}${hint}`;
    }
    if (this.playerListNode && this.playerListItemPrefab) {
      this.renderPlayerListPrefab(room);
    } else if (this.playerListLabel) {
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
    this.renderRoomSettingsPanel(room);
    this.renderLobbyStartBar(room);
    this.renderDuoSlotPicker(room);
  }

  private renderStatus(status: string): void {
    this.statusText = status;
    if (this.room) this.render(this.room);
  }

  private renderCharacterButtons(room: Room): void {
    if (!this.characterListNode) return;
    this.clearChildren(this.characterListNode);

    const allowDup = room.settings.allowDuplicateCharacters !== false;
    const me = this.getMe();
    const takenBy = new Map<CharacterId, string>();
    if (!allowDup) {
      for (const p of room.players) {
        if (p.characterId && p.id !== me?.id) {
          takenBy.set(p.characterId, p.nickname);
        }
      }
    }

    const visible = this.getVisibleCharacters(room).slice(0, 12);
    visible.forEach((character, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const selected = character.id === this.selectedCharacterId;
      const taker = (!allowDup && !selected) ? (takenBy.get(character.id) ?? null) : null;

      if (this.characterCardPrefab) {
        const node = this.instantiatePrefab(this.characterCardPrefab, `Character_${character.id}`, -215 + col * 215, 110 - row * 86, 200, 92, this.characterListNode!);
        const card = node.getComponent(CharacterCard) ?? node.addComponent(CharacterCard);
        card.render(character, selected, taker);
        const button = node.getComponent(Button) ?? node.addComponent(Button);
        button.node.on(Button.EventType.CLICK, () => this.chooseCharacter(character.id), this);
      } else {
        const takenLabel = taker ? ` [${taker}]` : '';
        const button = this.createButton(
          `Character_${character.id}`,
          `${selected ? '> ' : ''}${characterName(character.id)}${takenLabel}`,
          -215 + col * 215,
          -row * 58,
          200,
          46,
          18,
          this.characterListNode!
        );
        button.interactable = !taker;
        button.node.on(Button.EventType.CLICK, () => this.chooseCharacter(character.id), this);
      }
    });
  }

  private renderPlayerListPrefab(room: Room): void {
    if (!this.playerListNode || !this.playerListItemPrefab) return;
    this.clearChildren(this.playerListNode);
    const localId = this.gameManager?.localClientId ?? '';
    const isHost = room.players.some(p => p.clientId === localId && p.isHost);
    const count = Math.max(room.settings.maxPlayers, room.players.length, 1);
    for (let index = 0; index < count; index += 1) {
      const player = room.players[index] ?? null;
      const node = this.instantiatePrefab(this.playerListItemPrefab, `Player_${index}`, 0, 28 - index * 56, 620, 52, this.playerListNode);
      const item = node.getComponent(PlayerListItem) ?? node.addComponent(PlayerListItem);
      item.render(player, index, localId, isHost, (p) => this.onKickPlayer(p));
    }
  }

  private onKickPlayer(player: Player): void {
    this.serverActions.kickPlayer(player.id);
  }

  private renderDuoSlotPicker(room: Room): void {
    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    if (mode !== 'duo_2v2') {
      this.duoSlotPicker?.node.destroy();
      this.duoSlotPicker = null;
      return;
    }

    if (!this.duoSlotPickerPrefab) {
      // Fallback: create two plain buttons for duo slot selection
      if (!this.duoSlotPicker?.node?.isValid) {
        const pickerNode = new Node('DuoSlotPickerFallback');
        this.node.addChild(pickerNode);
        pickerNode.setPosition(new Vec3(0, -525, 0));
        const t = pickerNode.addComponent(UITransform);
        t.setContentSize(640, 150);
        this.duoSlotPicker = pickerNode.addComponent(DuoSlotPicker);
      }
      this.duoSlotPicker!.setSlotHandler((slotIndex) => this.chooseDuoSlot(slotIndex));
      this.duoSlotPicker!.render(room, this.gameManager?.localClientId ?? '', this.selectedCharacterId, this.selectedSummonerSkillId);
      return;
    }
    if (!this.duoSlotPicker?.node?.isValid) {
      const node = this.instantiatePrefab(this.duoSlotPickerPrefab, 'DuoSlotPicker', 0, -525, 640, 150, this.node);
      this.duoSlotPicker = node.getComponent(DuoSlotPicker) ?? node.addComponent(DuoSlotPicker);
      this.duoSlotPicker.setSlotHandler((slotIndex) => this.chooseDuoSlot(slotIndex));
    }
    this.duoSlotPicker.render(room, this.gameManager?.localClientId ?? '', this.selectedCharacterId, this.selectedSummonerSkillId);
  }

  private chooseDuoSlot(slotIndex: 0 | 1): void {
    const room = this.room;
    if ((room?.gameMode ?? room?.settings?.gameMode) !== 'duo_2v2') return;

    // Local conflict guard — prevent sending if the character is already used
    const localPlayer = room.players.find(p => p.clientId === this.gameManager?.localClientId || p.controllerId === this.gameManager?.localClientId) ?? room.players[0];
    const controllerId = localPlayer?.id ?? this.gameManager?.localClientId ?? '';
    const otherSlot = room.duoSlots?.find(s => s.controllerId === controllerId && s.slotIndex === (slotIndex === 0 ? 1 : 0));
    const otherTeamIds = new Set<string>();
    for (const slot of room.duoSlots ?? []) {
      if (slot.characterId && slot.controllerId !== controllerId) {
        otherTeamIds.add(slot.characterId);
      }
    }

    const crossesOwnSlot = otherSlot?.characterId && otherSlot.characterId === this.selectedCharacterId;
    const takenByOtherTeam = otherTeamIds.has(this.selectedCharacterId);

    if (crossesOwnSlot || takenByOtherTeam) {
      const reason = crossesOwnSlot ? 'Same character in both slots' : 'Character already taken by other team';
      this.gameManager?.showToast(reason, 2.5);
      return;
    }

    this.serverActions.chooseDuoSlotCharacter(slotIndex, this.selectedCharacterId);
    this.serverActions.chooseDuoSlotSummonerSkill(slotIndex, this.selectedSummonerSkillId);
  }

  private renderSkillButtons(): void {
    if (!this.skillListNode) return;
    this.clearChildren(this.skillListNode);

    SUMMONER_SKILL_IDS.forEach((skillId, index) => {
      const selected = skillId === this.selectedSummonerSkillId;
      if (this.summonerSkillCardPrefab) {
        const node = this.instantiatePrefab(this.summonerSkillCardPrefab, `Skill_${skillId}`, -260 + index * 130, 0, 120, 60, this.skillListNode!);
        const card = node.getComponent(SummonerSkillCard) ?? node.addComponent(SummonerSkillCard);
        card.render(skillId, selected);
        const button = node.getComponent(Button) ?? node.addComponent(Button);
        button.node.on(Button.EventType.CLICK, () => this.chooseSummonerSkill(skillId), this);
      } else {
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
      }
    });
  }

  private renderLobbyStartBar(room: Room): void {
    if (!this.lobbyStartBarPrefab || !this.lobbyStartBar) return;
    this.lobbyStartBar.render(room, this.gameManager?.localClientId ?? '', this.startButtonText);
  }

  private renderRoomSettingsPanel(room: Room): void {
    if (this.fixedMaxPlayers > 0) {
      this.roomSettingsPanel?.node.destroy();
      this.roomSettingsPanel = null;
      return;
    }
    if (!this.roomSettingsPanel?.node?.isValid) {
      let node: Node;
      if (this.roomSettingsPanelPrefab) {
        node = this.instantiatePrefab(this.roomSettingsPanelPrefab, 'RoomSettingsPanel', 0, -320, 640, 96, this.node);
      } else {
        node = new Node('RoomSettingsPanel');
        this.node.addChild(node);
        node.setPosition(new Vec3(0, -320, 0));
        const t = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        t.setContentSize(640, 96);
      }
      this.roomSettingsPanel = node.getComponent(RoomSettingsPanel) ?? node.addComponent(RoomSettingsPanel);
      this.roomSettingsPanel.setHandlers(
        (maxPlayers) => this.serverActions.updateRoomSettings({ maxPlayers }),
        (allowDuplicateCharacters) => this.serverActions.updateRoomSettings({ allowDuplicateCharacters }),
        (gameMode) => this.serverActions.updateRoomSettings({ gameMode } as Partial<Room['settings']>),
        () => this.showModeInfo(),
      );
    }
    this.roomSettingsPanel.render(room, this.gameManager?.localClientId ?? '', this.fixedMaxPlayers);
  }

  private showCharacterDetail(characterId: CharacterId): void {
    const character = characterList.find((item) => item.id === characterId);
    if (!character) return;

    // Use CharacterDetailDialog prefab if bound, otherwise fallback to InfoDialog
    if (this.characterDetailDialogPrefab) {
      if (!this.characterDetailDialog?.node?.isValid) {
        const node = this.instantiatePrefab(this.characterDetailDialogPrefab, 'CharacterDetailDialog', 0, 20, 620, 420, this.node);
        node.setSiblingIndex(this.node.children.length - 1);
        this.characterDetailDialog = node.getComponent(CharacterDetailDialog) ?? node.addComponent(CharacterDetailDialog);
      }
      this.characterDetailDialog.render(character);
      this.characterDetailDialog.node.setSiblingIndex(this.node.children.length - 1);
    } else {
      this.showInfo(characterName(characterId), characterDescription(characterId));
    }
  }

  private showModeInfo(): void {
    const mode = this.room?.gameMode ?? this.room?.settings?.gameMode ?? 'classic';
    this.showInfo(`Mode: ${mode}`, gameModeDescription(mode));
  }

  private showSummonerSkillDetail(skillId: SummonerSkillId): void {
    if (this.summonerSkillDetailDialogPrefab) {
      if (!this.summonerSkillDetailDialog?.node?.isValid) {
        const node = this.instantiatePrefab(this.summonerSkillDetailDialogPrefab, 'SummonerSkillDetailDialog', 0, 20, 540, 320, this.node);
        node.setSiblingIndex(this.node.children.length - 1);
        this.summonerSkillDetailDialog = node.getComponent(SummonerSkillDetailDialog) ?? node.addComponent(SummonerSkillDetailDialog);
      }
      this.summonerSkillDetailDialog.render(skillId);
      this.summonerSkillDetailDialog.node.setSiblingIndex(this.node.children.length - 1);
    } else {
      this.showInfo(summonerSkillName(skillId), summonerSkillDescription(skillId));
    }
  }

  private getVisibleCharacters(room: Room): Character[] {
    const mode = room.gameMode ?? room.settings?.gameMode ?? 'classic';
    return characterList.filter((character) => {
      if (character.isHidden || character.availability?.hidden) return false;
      if (mode === 'classic') return character.availability?.classic !== false;
      if (mode === 'duo_2v2') return character.availability?.duo !== false;
      if (mode === 'pve_roguelite') return character.availability?.roguelite !== false;
      return character.availability?.pve !== false;
    });
  }

  protected getMe(): Room['players'][number] | null {
    return this.gameManager?.getLocalPlayer() ?? this.room?.players.find((player) => !player.isBot) ?? this.room?.players[0] ?? null;
  }

  private applyFixedSettings(room: Room): void {
    if (this.fixedMaxPlayers <= 0) return;
    if (room.settings.maxPlayers === this.fixedMaxPlayers) return;
    if (this.settingsAppliedRoomId === room.id) return;

    const isHost = room.players.some((player) => player.clientId === this.gameManager?.localClientId && player.isHost);
    if (!isHost) return;

    this.settingsAppliedRoomId = room.id;
    this.serverActions.updateRoomSettings({ maxPlayers: this.fixedMaxPlayers });
  }

  private ensureMinimalUi(): void {
    this.ensureSpriteNode('LobbyParchmentPanel', 0, 145, 670, 600, this.parchmentFrame);
    this.ensureSpriteNode('PlayerSeatPanel', 0, 430, 640, 120, this.seatFrame ?? this.statusFrame);
    this.ensureSpriteNode('SkillPanel', 0, -245, 640, 92, this.statusFrame);

    this.statusLabel ??= this.ensureLabel('StatusLabel', 0, 545, 680, 64, 20);
    this.playerListNode ??= this.ensureNode('PlayerList', 0, 430, 620, 112);
    this.playerListLabel ??= this.playerListItemPrefab ? null : this.ensureLabel('PlayerListLabel', 0, 430, 620, 112, 17);
    this.selectionLabel ??= this.ensureLabel('SelectionLabel', 0, 320, 680, 42, 20);
    this.characterListNode ??= this.ensureNode('CharacterList', 0, 220, 660, 340);
    this.skillListNode ??= this.ensureNode('SkillList', 0, -245, 640, 60);
    if (this.lobbyStartBarPrefab) {
      const startBarNode = this.instantiatePrefab(this.lobbyStartBarPrefab, 'LobbyStartBar', 0, -405, 640, 82, this.node);
      this.lobbyStartBar = startBarNode.getComponent(LobbyStartBar) ?? startBarNode.addComponent(LobbyStartBar);
      this.startGameButton ??= this.lobbyStartBar.startButton;
    }
    this.startGameButton ??= this.createButton('StartGameButton', this.startButtonText, 0, -390, 260, 64, 26, this.node);
    this.setButtonLabel(this.startGameButton, this.startButtonText);
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
    this.applyButtonFrame(button, this.frameForButton(name));

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
    label.color = new Color(57, 34, 17, 255);
    return button;
  }

  private ensureSpriteNode(name: string, x: number, y: number, width: number, height: number, frame: SpriteFrame | null): Node {
    const node = this.ensureNode(name, x, y, width, height);
    if (frame) {
      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.spriteFrame = frame;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }
    node.setSiblingIndex(1);
    return node;
  }

  private instantiatePrefab(prefab: Prefab, name: string, x: number, y: number, width: number, height: number, parent: Node): Node {
    const node = instantiate(prefab);
    node.name = name;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return node;
  }

  private frameForButton(name: string): SpriteFrame | null {
    if (name.startsWith('Character_')) return this.characterCardFrame ?? this.actionCardFrame;
    if (name.startsWith('Skill_')) return this.actionCardFrame ?? this.statusFrame;
    if (name === 'StartGameButton') return this.statusFrame ?? this.actionCardFrame;
    return this.actionCardFrame;
  }

  private applyButtonFrame(button: Button, frame: SpriteFrame | null): void {
    if (!frame) return;
    const sprite = button.node.getComponent(Sprite) ?? button.node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    button.normalSprite = frame;
    button.hoverSprite = frame;
    button.pressedSprite = frame;
    button.disabledSprite = frame;
    button.target = button.node;
  }

  private setButtonLabel(button: Button | null, text: string): void {
    const label = button?.node.getChildByName('Label')?.getComponent(Label);
    if (label) label.string = text;
  }

  private clearChildren(node: Node): void {
    for (const child of [...node.children]) {
      child.destroy();
    }
  }
}
