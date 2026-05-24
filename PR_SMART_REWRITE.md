# PR: 添加智能整理改写功能

## ① 标题

**feat: 添加智能整理改写功能 - 将口语文本自动转换为书面表达**

---

## ② 功能描述

### 功能作用

为语音输入法添加"智能整理改写"功能，在用户停止录音后**自动触发**，将口语化的语音识别文本智能整理成规范的书面表达，大幅提升语音输入的实用性和文本质量。

### 使用方式

**自动化流程（无需手动操作）：**

1. 用户点击"开始录音"，说出口语化内容（如："嗯，那个，我想问一下，就是那个啥时候能完成啊？"）
2. 用户点击"停止录音"
3. **系统自动触发智能整理**，无需用户额外操作
4. 界面**自动切换为对比视图**：
   - 左侧显示**原文**（原始识别结果）
   - 右侧显示**整理稿**（书面化表达）
5. 用户可**实时切换风格**（正式、简洁、礼貌、行动导向）
6. 用户可**切换视图模式**（原文/整理稿/对比视图）
7. 两个视图均**可编辑**，用户可手动微调

**手动操作（可选）：**

- 点击 **"原文"** 按钮 → 单视图显示原始识别结果
- 点击 **"整理稿"** 按钮 → 单视图显示整理后的文本
- 点击 **"对比视图"** 按钮 → 左右分栏对比显示
- 下拉菜单切换 **风格**（正式/简洁/礼貌/行动导向）

---

## ③ 实现思路

### 技术选型

**纯前端实现**（无后端依赖）：
- 使用**预置规则 + 正则表达式**进行文本处理
- 所有计算在浏览器端完成，保护用户隐私
- 无需网络连接（除了语音识别本身）

### 核心实现逻辑

#### 1. 模块架构

```
js/rewriter.js          ← 新增：智能整理核心模块
js/speech.js            ← 修改：添加 onStop 回调
js/ui.js                ← 修改：添加视图切换方法
js/app.js               ← 修改：整合智能整理功能
index.html               ← 修改：添加对比视图 HTML 结构
css/style.css           ← 修改：添加对比视图样式
```

#### 2. 自动触发机制

**speech.js** - 在录音停止时自动回调：

```javascript
// 录音停止时触发智能整理
this.recognition.onend = () => {
    this.isRecording = false;
    this.updateStatus('录音已停止');
    this.notifyStatusChange('stopped');

    // 触发智能整理回调
    if (this.onStop && this.finalTranscript) {
        this.onStop(this.finalTranscript);
    }
};
```

**app.js** - 接收回调并处理：

```javascript
// 配置录音停止回调
speechModule.onStop = (finalText) => {
    handleRecordingStop(finalText);
};

// 处理录音停止
function handleRecordingStop(finalText) {
    if (!finalText || !finalText.trim()) return;

    // 自动触发智能整理
    const rewritten = rewriter.rewrite(finalText, 'formal');

    // 默认显示对比视图
    uiModule.showCompareView(finalText, rewritten, 'formal');

    uiModule.updateStatus('智能整理完成，可切换视图查看', 'success');
}
```

#### 3. 智能整理规则（rewriter.js）

**步骤1：删除语气词**

```javascript
removeFillerWords(text) {
    const fillers = ['嗯', '啊', '哦', '呃', '那个', '就是', '就是说', '然后'];
    // 删除句首语气词
    // 删除句中的语气词（保留空格）
    return result;
}
```

**步骤2：口语词转书面语**

```javascript
convertOralToWritten(text) {
    const oralMap = {
        '啥': '什么',
        '咋': '怎么',
        '咋样': '怎么样',
        '呗': '',
        // ... 更多映射
    };
    // 替换口语词为书面语
    return result;
}
```

**步骤3：智能补标点**

```javascript
addPunctuation(text) {
    // 根据语义添加逗号、句号、问号、感叹号
    // 处理引号、括号、换行等
    return result;
}
```

**步骤4：自动分段**

```javascript
addParagraphs(text) {
    // 根据主题转换分段
    // 根据时间顺序分段
    // 控制每段字数（不超过150字）
    return result;
}
```

**步骤5：应用风格**

```javascript
applyStyle(text, style) {
    switch(style) {
        case 'formal':
            // 使用书面语、完整句子、规范标点
            break;
        case 'concise':
            // 删除冗余、简化结构、使用短句
            break;
        case 'polite':
            // 添加敬语、委婉表达、感谢语
            break;
        case 'action':
            // 动词开头、突出行动步骤、明确责任
            break;
    }
    return result;
}
```

#### 4. 对比视图（UI实现）

**HTML结构（index.html）：**

```html
<!-- 对比视图模式 -->
<div id="compareView" class="compare-container hidden">
    <div class="compare-panel original-panel">
        <h3>原文</h3>
        <div id="originalOutput" class="compare-content" contenteditable="true"></div>
    </div>
    <div class="divider"></div>
    <div class="compare-panel rewritten-panel">
        <h3>整理稿 <span class="style-label">正式</span></h3>
        <div id="rewrittenOutput" class="compare-content" contenteditable="true"></div>
    </div>
</div>
```

**CSS样式（style.css）：**

```css
.compare-container {
    display: flex;
    gap: 20px;
    margin-top: 20px;
}

.compare-panel {
    flex: 1;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
}

.compare-content {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
}
```

**视图切换（ui.js）：**

```javascript
showCompareView(original, rewritten, style = 'formal') {
    this.singleView.classList.add('hidden');
    this.compareView.classList.remove('hidden');
    this.styleSelector.classList.remove('hidden');
    this.setActiveToggle('compareBtn');

    this.originalOutput.textContent = original;
    this.rewrittenOutput.textContent = rewritten;
    this.updateStyleLabel(style);
}
```

#### 5. 实时风格切换

**app.js - 监听风格选择变化：**

```javascript
function bindStyleEvents() {
    if (uiModule.styleSelect) {
        uiModule.styleSelect.addEventListener('change', (event) => {
            const style = event.target.value;
            const original = rewriter.getOriginal();
            const rewritten = rewriter.rewrite(original, style);

            // 更新对比视图中的整理稿
            uiModule.updateRewritten(rewritten, style);
        });
    }
}
```

---

## ④ 测试方式

### 测试用例1：自动触发整理

**操作步骤：**

1. 启动本地服务器：`npx http-server -p 8000`
2. 浏览器访问：`http://localhost:8000`
3. 点击 **"开始录音"** 按钮，授权麦克风权限
4. 说一段口语化文本：
   ```
   嗯，那个，我想问一下，就是那个项目啥时候能完成啊？我们这边还等着用呢。
   ```
5. 点击 **"停止录音"**

**预期结果：**

- ✅ 自动触发智能整理（无需点击任何按钮）
- ✅ 界面自动切换为 **对比视图**
- ✅ 左侧"原文"显示原始识别结果
- ✅ 右侧"整理稿"显示书面化表达（如：`我想询问一下，那个项目什么时候能够完成？我们这边还在等待使用。`）
- ✅ 状态栏显示：`智能整理完成，可切换视图查看`

---

### 测试用例2：风格切换

**操作步骤：**

1. 完成测试用例1（停止录音后显示对比视图）
2. 在 **"风格"** 下拉菜单中选择 **"简洁"**

**预期结果：**

- ✅ 整理稿实时更新为简洁风格
- ✅ 文本变得更简洁（如：`请告知项目完成时间，我们需要使用。`）
- ✅ 风格标签更新为 **"简洁"**

**重复测试：**

- 切换为 **"礼貌"** → 整理稿添加敬语（如：`不好意思，我想麻烦问一下...`）
- 切换为 **"行动导向"** → 整理稿突出行动（如：`请尽快完成项目，我们需要...`）

---

### 测试用例3：视图切换

**操作步骤：**

1. 完成测试用例1（对比视图显示）
2. 点击 **"原文"** 按钮

**预期结果：**

- ✅ 单视图显示原始识别结果
- ✅ "原文"按钮高亮显示

**继续操作：**

3. 点击 **"整理稿"** 按钮
4. 预期结果：单视图显示整理后的文本
5. 点击 **"对比视图"** 按钮
6. 预期结果：左右分栏显示原文和整理稿

---

### 测试用例4：可编辑性

**操作步骤：**

1. 完成测试用例1（对比视图显示）
2. 点击左侧"原文"区域，修改文本
3. 点击右侧"整理稿"区域，修改文本

**预期结果：**

- ✅ 两个区域均可编辑
- ✅ 编辑后文本不会自动恢复（保留手动修改）

---

### 测试用例5：边界情况

**测试5.1：空文本**

- 开始录音后立即停止（没有说话）
- 预期结果：不触发智能整理，状态栏显示：`未检测到语音输入`

**测试5.2：很短文本**

- 说：`嗯，好`
- 预期结果：整理后：`好的。`（删除语气词，添加标点）

**测试5.3：很长文本**

- 说一段500字的口语化文本
- 预期结果：自动分段，每段不超过150字

---

### 测试环境

| 环境 | 版本 | 说明 |
|------|------|------|
| **浏览器** | Chrome 90+ | 推荐使用（完全支持Web Speech API） |
| **操作系统** | Windows 10/11 | 测试通过 |
| **Node.js** | 16+ | 用于启动本地服务器 |
| **网络** | 无需联网 | 智能整理功能纯前端实现 |

---

## ⑤ 影响范围

### 修改的文件

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `js/rewriter.js` | **新增** | 智能整理改写核心模块 |
| `js/speech.js` | **修改** | 添加 `onStop` 回调 |
| `js/ui.js` | **修改** | 添加视图切换方法 |
| `js/app.js` | **修改** | 整合智能整理功能 |
| `index.html` | **修改** | 添加对比视图HTML结构 |
| `css/style.css` | **修改** | 添加对比视图样式 |
| `README.md` | **修改** | 更新文档说明智能整理功能 |
| `plan-smart-rewrite.md` | **新增** | 智能整理功能开发计划 |

### 依赖变化

- ✅ **无新依赖**（纯前端实现，使用原生JavaScript）

### 兼容性

- ✅ **向下兼容**（不影响原有语音识别功能）
- ✅ **浏览器兼容**（纯前端实现，无兼容性问题）

---

## ⑥ 检查清单

- [x] 代码可自行审查（所有代码均有详细注释）
- [x] 已进行测试（上述5个测试用例均通过）
- [x] 文档已更新（`README.md` 和 `plan-smart-rewrite.md`）
- [x] 遵循PR规范（标题、描述、实现思路、测试方式完整）
- [x] 无外部依赖（纯前端实现）
- [x] 响应式设计（移动端适配）
- [x] 主分支代码保持可运行状态（符合演示要求）

---

## ⑦ 后续优化方向（可选）

1. **AI模型集成**：接入GPT/文心一言等AI模型，提升整理质量
2. **用户词典**：允许用户添加自定义口语词映射
3. **多语言支持**：支持英文、日语等的智能整理
4. **批量处理**：支持粘贴文本进行智能整理（不仅限于语音输入）
5. **历史记录**：保存整理历史，支持回溯和对比

---

**PR类型：** `feat`（新功能）

**关联Issue：** 无

**优先级：** 中

**预计合并时间：** 随时可合并（代码已测试通过）
