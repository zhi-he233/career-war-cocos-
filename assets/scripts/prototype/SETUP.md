# BattlePrototype 场景配置指南

## 你的 Cocos 是中文版，请按下面操作

### 第一步：打开场景

1. 启动 Cocos Creator
2. 在左下角 **资源管理器** 面板中，依次展开 `assets` → `scripts` → `prototype`
3. 双击 `BattlePrototype.scene`
4. 场景打开后，左上角 **层级管理器** 会显示一堆节点

### 第二步：给 Canvas 挂上脚本

1. 在 **层级管理器** 中点击选中 `Canvas`
2. 看右边 **属性检查器** 面板，滚到底部，点击 **添加组件** 按钮
3. 在弹出菜单里选 **自定义脚本** → **BattlePrototype**
4. 这时属性检查器底部会出现 BattlePrototype 组件，里面有 9 个空槽位

### 第三步：把节点拖进槽位

在层级管理器里，把以下节点**一个一个拖**到属性检查器对应的槽位里：

| 槽位名 | 拖哪个节点 |
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

操作方式：用鼠标按住层级管理器里的节点、拖到右边槽位的框里、松开。

### 第四步：运行

1. 按 `Ctrl + S` 保存
2. 点击顶部工具栏的 ▶️ 播放按钮
3. 点 **掷骰** 出点数 → 点 **普通攻击** 打敌人 → 敌人自动回击 → 点 **重置** 重来
