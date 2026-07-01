# 搭建 03 — Home 场景的三个模式按钮

HomeScene 的 `onLoad` 会自动生成 Room ID 输入框、Join Room 按钮、Refresh Rooms 按钮、房间列表、状态栏。

但是 **三个模式按钮** 需要手动创建，因为每个按钮要绑定不同的方法。

### 1. 创建按钮

双击 `Home.scene`。右键 `Canvas` → **创建** → **UI 组件** → **Button**，重复三次。

依次选中每个按钮，在属性检查器顶部重命名，然后展开按钮（点左边三角），选中子节点 `Label`，改 `String`：

| 按钮原名 | 重命名为 | 子节点 Label String |
|---|---|---|
| Button | ClassicButton | 经典混战 |
| Button-001 | PveButton | PVE 单人 |
| Button-002 | RogueliteButton | 肉鸽爬塔 |

### 2. 调整按钮位置

三个按钮需要手动摆一下。依次选中每个按钮节点，在属性检查器的 UITransform 里设位置：

| 按钮 | x | y | w | h |
|---|---|---|---|---|
| ClassicButton | 0 | 180 | 220 | 54 |
| PveButton | 0 | 110 | 220 | 54 |
| RogueliteButton | 0 | 40 | 220 | 54 |

### 3. 绑定点击事件

逐个选中按钮节点 → 属性检查器找 `Button` 组件 → `ClickEvents` 数组大小改成 `1` → 把层级管理器里的 `Canvas` 拖到 `cc.Node` 槽位 → 下拉选方法：

| 按钮 | 选的方法 |
|---|---|
| ClassicButton | HomeScene.createClassicRoom |
| PveButton | HomeScene.createPveRoom |
| RogueliteButton | HomeScene.createRogueliteRoom |

### 4. 设为启动场景

顶部菜单 → **场景** → **设为当前项目启动场景**

### 5. 保存

`Ctrl + S`
