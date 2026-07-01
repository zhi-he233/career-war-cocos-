import { _decorator, Component, Label, Button } from 'cc';
import { characters as characterMap } from '../shared/characters';
import { applyDamageToPlayer, getCombatArmor } from '../shared/combatMath';
import type { Player, Character } from '../shared/types';

const { ccclass, property } = _decorator;

/**
 * 创建一个最小化的模拟 Player 对象，用于本地战斗测试。
 * 不需要的字段全部填默认值，保证类型符合 shared 的 Player 接口。
 */
function createMockPlayer(
  id: string,
  nickname: string,
  char: Character
): Player {
  return {
    id,
    clientId: `mock_client_${id}`,
    userId: undefined,
    nickname,
    isHost: id === 'player_1',
    isOnline: true,
    isBot: false,
    characterId: char.id,
    summonerSkillId: undefined,
    characterSelected: true,
    summonerSkillSelected: false,
    summonerSkillCooldown: 0,
    hp: char.maxHp,
    maxHp: char.maxHp,
    shield: 0,
    rogueliteSummonerCooldownReduction: undefined,
    rogueliteSkillStacks: undefined,
    rogueliteBossAbilities: undefined,
    roguelitePerkStacks: undefined,
    rogueliteBossId: undefined,
    rogueliteBossState: undefined,
    rogueliteEnemyInfo: undefined,
    rogueliteStageStartHeal: undefined,
    rogueliteDamageBonus: undefined,
    rogueliteArmorBonus: undefined,
    rogueliteStartShield: undefined,
    roguelitePostBattleHealBonus: undefined,
    roguelitePassiveIds: undefined,
    rogueliteFirstStrikeUsed: undefined,
    rogueliteLowHpArmor: undefined,
    rogueliteKillHeal: undefined,
    rogueliteComebackDamage: undefined,
    rogueliteFateTokens: undefined,
    rogueliteLowRollCharge: undefined,
    rogueliteConsecutiveLowRolls: undefined,
    rogueliteShieldOverloadUsed: undefined,
    rogueliteShieldStrikeBonus: undefined,
    rogueliteLowRollDefenseShield: undefined,
    zhaoZilongHitCount: undefined,
    flameMarks: undefined,
    guarding: false,
    isDead: false,
    selectedTargetId: undefined,
    controllerId: undefined,
    teamId: undefined,
    slotIndex: undefined,
  };
}

@ccclass('BattlePrototype')
export class BattlePrototype extends Component {
  // --- UI 绑定（在 Cocos Editor 中拖入对应节点）---
  @property({ type: Label })
  playerNameLabel: Label | null = null;

  @property({ type: Label })
  enemyNameLabel: Label | null = null;

  @property({ type: Label })
  playerHpLabel: Label | null = null;

  @property({ type: Label })
  enemyHpLabel: Label | null = null;

  @property({ type: Label })
  diceResultLabel: Label | null = null;

  @property({ type: Label })
  logLabel: Label | null = null;

  @property({ type: Button })
  rollButton: Button | null = null;

  @property({ type: Button })
  attackButton: Button | null = null;

  @property({ type: Button })
  resetButton: Button | null = null;

  // --- 内部状态 ---
  private player: Player = null!;
  private enemy: Player = null!;
  private currentRoll: number = 0;
  private hasRolled: boolean = false;
  private isPlayerTurn: boolean = true;
  private battleLog: string[] = [];

  onLoad(): void {
    // 按钮事件绑定
    if (this.rollButton) {
      this.rollButton.node.on(Button.EventType.CLICK, this.onRollClick, this);
    }
    if (this.attackButton) {
      this.attackButton.node.on(Button.EventType.CLICK, this.onAttackClick, this);
    }
    if (this.resetButton) {
      this.resetButton.node.on(Button.EventType.CLICK, this.onResetClick, this);
    }

    this.initBattle();
  }

  onDestroy(): void {
    if (this.rollButton) {
      this.rollButton.node.off(Button.EventType.CLICK, this.onRollClick, this);
    }
    if (this.attackButton) {
      this.attackButton.node.off(Button.EventType.CLICK, this.onAttackClick, this);
    }
    if (this.resetButton) {
      this.resetButton.node.off(Button.EventType.CLICK, this.onResetClick, this);
    }
  }

  /** 初始化战斗：从 shared 角色数据创建两个玩家 */
  private initBattle(): void {
    // 从 shared 数据获取角色
    const boxerChar = characterMap['boxer']; // 拳手, HP=20
    const warKnightChar = characterMap['war_knight']; // 战争骑士, HP=18

    if (!boxerChar || !warKnightChar) {
      this.log('❌ 错误: 无法从 shared 数据加载角色！');
      return;
    }

    this.player = createMockPlayer('player_1', '玩家 (拳手)', boxerChar);
    this.enemy = createMockPlayer('player_2', '敌方 (战争骑士)', warKnightChar);

    this.currentRoll = 0;
    this.hasRolled = false;
    this.isPlayerTurn = true;
    this.battleLog = [];

    this.log(`⚔️ 战斗开始！`);
    this.log(`  ${this.player.nickname} HP=${this.player.hp} | 护甲=${getCombatArmor(this.player)}`);
    this.log(`  ${this.enemy.nickname} HP=${this.enemy.hp} | 护甲=${getCombatArmor(this.enemy)}`);

    this.refreshUI();
  }

  /** 掷骰按钮 */
  private onRollClick(): void {
    if (!this.isPlayerTurn) {
      this.log('⏳ 请等待你的回合');
      return;
    }
    if (this.player.isDead || this.enemy.isDead) {
      this.log('⚰️ 战斗已结束，请点击"重置"重新开始');
      return;
    }

    // 模拟 d6 掷骰
    this.currentRoll = Math.floor(Math.random() * 6) + 1;
    this.hasRolled = true;

    this.log(`🎲 ${this.player.nickname} 掷出了 [${this.currentRoll}] 点`);
    this.refreshUI();
  }

  /** 普通攻击按钮：用当前骰点攻击敌人 */
  private onAttackClick(): void {
    if (!this.hasRolled) {
      this.log('⚠️ 请先掷骰再攻击！');
      return;
    }
    if (this.player.isDead || this.enemy.isDead) {
      this.log('⚰️ 战斗已结束');
      return;
    }
    if (!this.isPlayerTurn) {
      this.log('⏳ 现在是敌方回合');
      return;
    }

    // === 使用 shared 的战斗数学函数 ===
    // 1. 获取目标护甲
    const enemyArmor = getCombatArmor(this.enemy, {
      activeAttacker: this.player,
    });

    // 2. 应用伤害
    const result = applyDamageToPlayer(this.enemy, this.currentRoll, {
      armor: enemyArmor,
    });

    // 3. 更新敌人状态
    Object.assign(this.enemy, result);

    this.log(`⚔️ ${this.player.nickname} 普通攻击 → ${this.enemy.nickname}`);
    this.log(`   骰点=${this.currentRoll}, 护甲=${enemyArmor}, 实际伤害=${result.damage}`);
    if (result.shieldBlocked > 0) {
      this.log(`   🛡️ 护盾抵挡了 ${result.shieldBlocked} 点`);
    }
    this.log(`   ❤️ 敌人剩余 HP=${this.enemy.hp}`);

    if (this.enemy.isDead) {
      this.log(`🏆 ${this.player.nickname} 获胜！`);
      this.hasRolled = false;
      this.refreshUI();
      return;
    }

    // 回合结束 → 切换
    this.hasRolled = false;
    this.isPlayerTurn = false;
    this.refreshUI();

    // 敌人自动回合（延迟一下让玩家看清楚）
    this.scheduleOnce(() => {
      this.enemyTurn();
    }, 0.8);
  }

  /** 敌方自动回合：掷骰 + 普通攻击 */
  private enemyTurn(): void {
    if (this.enemy.isDead) {
      this.isPlayerTurn = true;
      this.refreshUI();
      return;
    }

    // 敌方掷骰
    const enemyRoll = Math.floor(Math.random() * 6) + 1;
    this.log(`🎲 ${this.enemy.nickname} 掷出了 [${enemyRoll}] 点`);

    // 计算玩家护甲（战争骑士有基础1护甲）
    const playerArmor = getCombatArmor(this.player, {
      activeAttacker: this.enemy,
    });

    // 应用伤害
    const result = applyDamageToPlayer(this.player, enemyRoll, {
      armor: playerArmor,
    });

    Object.assign(this.player, result);

    this.log(`⚔️ ${this.enemy.nickname} 普通攻击 → ${this.player.nickname}`);
    this.log(`   骰点=${enemyRoll}, 护甲=${playerArmor}, 实际伤害=${result.damage}`);
    if (result.shieldBlocked > 0) {
      this.log(`   🛡️ 护盾抵挡了 ${result.shieldBlocked} 点`);
    }
    this.log(`   ❤️ 玩家剩余 HP=${this.player.hp}`);

    if (this.player.isDead) {
      this.log(`💀 ${this.enemy.nickname} 获胜！`);
    }

    // 回合切换回玩家
    this.currentRoll = 0;
    this.hasRolled = false;
    this.isPlayerTurn = true;
    this.refreshUI();
  }

  /** 重置战斗 */
  private onResetClick(): void {
    this.initBattle();
  }

  /** 刷新所有 UI 文本 */
  private refreshUI(): void {
    if (this.playerNameLabel) {
      this.playerNameLabel.string = this.player?.nickname ?? '---';
    }
    if (this.enemyNameLabel) {
      this.enemyNameLabel.string = this.enemy?.nickname ?? '---';
    }
    if (this.playerHpLabel) {
      this.playerHpLabel.string = this.player
        ? `HP: ${this.player.hp} / ${this.player.maxHp}`
        : 'HP: ---';
    }
    if (this.enemyHpLabel) {
      this.enemyHpLabel.string = this.enemy
        ? `HP: ${this.enemy.hp} / ${this.enemy.maxHp}`
        : 'HP: ---';
    }
    if (this.diceResultLabel) {
      if (this.hasRolled) {
        this.diceResultLabel.string = `🎲 ${this.currentRoll}`;
      } else {
        this.diceResultLabel.string = this.isPlayerTurn ? '点击掷骰' : '敌方回合...';
      }
    }
  }

  /** 添加日志（最多保留 20 条） */
  private log(msg: string): void {
    this.battleLog.push(msg);
    if (this.battleLog.length > 20) {
      this.battleLog = this.battleLog.slice(-20);
    }
    if (this.logLabel) {
      this.logLabel.string = this.battleLog.join('\n');
    }
  }
}
