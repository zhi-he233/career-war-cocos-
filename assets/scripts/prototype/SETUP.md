# BattlePrototype 场景搭建指南

## 前置条件

已在 Cocos Creator 3.8.8 中打开本项目。

## 步骤

### 1. 打开场景

在 Assets 面板中双击 `assets/scripts/prototype/BattlePrototype.scene`。
场景目前只包含 Canvas + Camera。

### 2. 添加 UI 节点

在 Hierarchy 面板中，右键点击 Canvas 节点，创建以下子节点：

#### 2a. 标题文本
- Create → UI Component → Label
- 命名: `TitleLabel`
- 位置 (Inspector → UITransform): x=0, y=220, w=800, h=60
- 文字: "⚔️ Battle Prototype - Shared Engine Test"

#### 2b. 玩家名称
- Create → UI Component → Label
- 命名: `PlayerNameLabel`
- 位置: x=-200, y=140, w=300, h=40

#### 2c. 敌方名称
- Create → UI Component → Label
- 命名: `EnemyNameLabel`
- 位置: x=200, y=140, w=300, h=40

#### 2d. 玩家 HP
- Create → UI Component → Label
- 命名: `PlayerHpLabel`
- 位置: x=-200, y=90, w=300, h=40

#### 2e. 敌方 HP
- Create → UI Component → Label
- 命名: `EnemyHpLabel`
- 位置: x=200, y=90, w=300, h=40

#### 2f. 骰子结果
- Create → UI Component → Label
- 命名: `DiceResultLabel`
- 位置: x=0, y=20, w=300, h=60
- Font Size: 36

#### 2g. 掷骰按钮
- Create → UI Component → Button
- 命名: `RollButton`
- 位置: x=-100, y=-60, w=160, h=50
- 展开按钮节点 → 修改子节点的 Label 文字为 "掷骰 🎲"

#### 2h. 普通攻击按钮
- Create → UI Component → Button
- 命名: `AttackButton`
- 位置: x=100, y=-60, w=160, h=50
- 展开按钮节点 → 修改子节点的 Label 文字为 "普通攻击 ⚔️"

#### 2i. 重置按钮
- Create → UI Component → Button
- 命名: `ResetButton`
- 位置: x=0, y=-120, w=120, h=40
- 展开按钮节点 → 修改子节点的 Label 文字为 "重置 🔄"

#### 2j. 战斗日志
- Create → UI Component → Label
- 命名: `LogLabel`
- 位置: x=0, y=-200, w=800, h=220
- Font Size: 16
- Overflow: SHRINK
- Line Height: 20
- String: (清空，留空)

### 3. 挂载 BattlePrototype 脚本

1. 在 Hierarchy 中选中 Canvas 节点
2. 在 Inspector 底部点击 "Add Component"
3. 搜索 "BattlePrototype" 并添加
4. 依次将对应的子节点拖入脚本的 @property 槽位：

| 属性 | 对应节点 |
|---|---|
| Player Name Label | PlayerNameLabel |
| Enemy Name Label | EnemyNameLabel |
| Player Hp Label | PlayerHpLabel |
| Enemy Hp Label | EnemyHpLabel |
| Dice Result Label | DiceResultLabel |
| Log Label | LogLabel |
| Roll Button | RollButton |
| Attack Button | AttackButton |
| Reset Button | ResetButton |

### 4. 运行

- 点击工具栏的 ▶️ 运行按钮
- 点击 "掷骰" → 随机显示 1-6 点数
- 点击 "普通攻击" → 用当前骰点攻击敌方（敌方护甲自动计算）
- 敌方自动回击
- 点击 "重置" → 重新开始
