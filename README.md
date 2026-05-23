# 语音输入法 Web应用

一个基于浏览器Web Speech API的语音输入法产品，帮助用户通过语音快速输入文字，提高文本输入效率。

## 功能特性

✅ **核心功能**

* 🎤 语音实时转文字

* 🌐 支持多语言识别（中文、英文、日语等）

* 📝 实时显示识别结果

* ✏️ 可编辑识别文本

* 📋 一键复制文本

* 🗑️ 清空文本功能

✨ **用户体验**

* 现代化UI设计

* 录音状态可视化

* 实时状态提示

* 响应式布局（支持移动端）

## 技术架构

### 技术栈

* **前端**: 原生JavaScript (ES6+)

* **语音识别**: Web Speech API (SpeechRecognition)

* **样式**: 原生CSS3

* **依赖**: 无外部依赖，开箱即用

### 项目结构

```
qiniuyunshurufa/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   ├── speech.js      # 语音识别模块
│   ├── ui.js          # UI交互模块
│   └── app.js         # 主应用逻辑
├── plan.md            # 开发计划文档
└── README.md          # 项目说明文档
```

## 使用方法

### 1. 直接打开使用

由于Web Speech API的安全限制，需要通过以下方式之一运行：

#### 方法一：使用本地服务器（推荐）

```bash
# 进入项目目录
cd c:\Users\Administrator\Desktop\qiniuyunshurufa

# 使用Python启动简单HTTP服务器
python -m http.server 8000

# 或使用Node.js的http-server
npx http-server -p 8000
```

然后在浏览器中访问：`http://localhost:8000`

#### 方法二：使用VS Code Live Server

1. 安装Live Server扩展

2. 右键`index.html`

3. 选择"Open with Live Server"

### 2. 使用步骤

1. 🎤 点击"开始录音"按钮

2. 🔊 授权浏览器使用麦克风权限

3. 🗣️ 开始说话，文字会实时显示在文本框中

4. ⏹️ 点击"停止录音"结束语音输入

5. 📋 点击"复制"按钮将文本复制到剪贴板

6. ✏️ 可以直接编辑文本框中的内容

## 浏览器兼容性

| 浏览器     | 支持情况    | 说明                |
| ------- | ------- | ----------------- |
| Chrome  | ✅ 完全支持  | 推荐使用，功能最完整        |
| Edge    | ✅ 完全支持  | 基于Chromium，支持良好   |
| Firefox | ⚠️ 部分支持 | 可能需要配置flag启用      |
| Safari  | ❌ 不支持   | 未实现Web Speech API |

**推荐使用 Chrome 或 Edge 浏览器获得最佳体验。**

## API说明

### Web Speech API 使用

本应用使用浏览器原生的 `SpeechRecognition` API：

```javascript
// 浏览器前缀兼容
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// 配置参数
recognition.lang = 'zh-CN';          // 设置语言
recognition.continuous = true;        // 持续识别
recognition.interimResults = true;     // 返回中间结果

// 事件处理
recognition.onresult = (event) => {
    // 处理识别结果
};
```

## 功能模块说明

### 1. 语音识别模块 (speech.js)

* 封装Web Speech API

* 管理录音生命周期

* 处理识别结果和错误

* 支持多语言切换

### 2. UI交互模块 (ui.js)

* 管理界面元素

* 处理用户交互

* 更新界面状态

* 剪贴板操作

### 3. 主应用模块 (app.js)

* 整合各功能模块

* 协调模块间通信

* 管理应用状态

## 注意事项

⚠️ **安全限制**

* Web Speech API需要在**HTTPS**环境或**localhost**下工作

* 首次使用需要授权麦克风权限

* 识别准确率依赖浏览器和网络连接

💡 **使用建议**

* 在安静环境下使用，提高识别准确率

* 说话清晰、语速适中

* 避免使用特殊口音或方言

* 定期清空文本，保持界面整洁

## 后续扩展方向

🔮 **可选功能**（未来可添加）

* [ ] 语音命令控制（如"删除"、"换行"等）

* [ ] 智能标点自动添加

* [ ] 识别历史记录

* [ ] 导出文本为文件

* [ ] 快捷键支持

* [ ] 离线语音识别（使用WebAssembly）

* [ ] 多语言实时切换

* [ ] 语音情感识别

## 常见问题

**Q: 为什么点击开始录音没反应？**
A: 请确认使用的是Chrome或Edge浏览器，并且已授权麦克风权限。

**Q: 识别准确率不高怎么办？**
A: 尝试在安静环境下使用，说话清晰一些，或者更换识别语言。

**Q: 能否离线使用？**
A: 当前版本需要网络连接，因为使用的是浏览器的在线语音识别服务。

**Q: 如何部署到服务器？**
A: 需要配置HTTPS，因为Web Speech API的安全要求。可以使用Let's Encrypt免费证书。

## 开发说明

### 修改样式

编辑 `css/style.css` 文件，调整颜色、布局等样式。

### 添加新功能

1. 在 `js/speech.js` 中添加语音相关功能

2. 在 `js/ui.js` 中添加界面交互功能

3. 在 `js/app.js` 中整合新功能

### 调试

打开浏览器开发者工具（F12），查看Console标签页的日志输出。

## 许可证

MIT License - 可自由使用和修改

## 作者

AI Assistant - CodeBuddy

***

**立即体验：** 用Chrome浏览器打开 `index.html`，开始您的语音输入之旅！🎤✨
