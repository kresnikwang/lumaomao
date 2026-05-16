# Brush Jjaemu (撸猫猫) - 微信小游戏版

这是一个复刻自 [Brush Jjaemu](https://www.brushjjaemu.org/brushjjaemu/index.html) 的微信小游戏原型。

## 核心玩法
- **撸猫**：在屏幕上滑动手指来撸猫，撸得越快得分越高。
- **预警**：当猫咪变黄（ALERT）时，说明它准备回头看你了。
- **回头**：当猫咪变红（LOOKING）时，**必须停止滑动**。如果此时还在撸猫，会被猫咬（Game Over）。
- **重玩**：游戏结束后点击屏幕即可重试。

## 技术栈
- 微信原生 Canvas API
- 纯 JavaScript (ES6+)

## 开发与运行
1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 选择“导入项目”，选择本项目所在目录。
3. AppID 可选择“测试号”或填入您自己的小游戏 AppID。
4. 在模拟器中即可开始运行和调试。

## 素材替换
目前使用彩色方块作为占位符：
- 灰色：猫咪闲置/放松
- 绿色：正在撸猫
- 黄色：预警，准备回头
- 红色：正在盯着你（危险！）
- 黑色：咬人（Game Over）

您可以修改 `src/cat.js` 中的 `render` 方法，将 `fillRect` 替换为 `drawImage` 来接入正式的美术资源。
