# 智能整理改写功能开发计划

## 📋 需求概述

为语音输入法添加"智能整理改写"功能，在停止录音后自动触发，将口语文本整理成书面表达，支持智能标点、分段和多种风格切换，并提供原文/整理稿双视图对比。

---

## ✅ 需求确认

| 需求项 | 用户选择 | 实现方案 |
|--------|---------|---------|
| **技术方案** | 使用浏览器内置API（纯前端实现） | 预置规则 + 正则表达式 |
| **风格支持** | 正式、简洁、礼貌、行动导向（4种） | 每种风格对应不同的文本处理规则 |
| **双视图展示** | 左右分栏对比显示 | 左侧原文，右侧整理稿 |
| **智能标点** | 高级版（模拟人工校对） | 处理引号、括号、换行等 |

---

## 🎯 功能详细设计

### 功能1：停止录音后自动触发处理

**触发时机：**
- 用户点击"停止录音"按钮
- 语音识别结束后自动触发

**实现逻辑：**
```javascript
// 在 speech.js 的 onend 事件中触发
this.recognition.onend = () => {
    this.isRecording = false;
    this.updateStatus('录音已停止');
    this.notifyStatusChange('stopped');
    
    // 新增：自动触发智能整理
    if (this.onStop && this.finalTranscript) {
        this.onStop(this.finalTranscript);
    }
};
```

---

### 功能2：将口语文本整理成书面表达

**口语特征识别：**
- 语气词："嗯"、"啊"、"那个"等
- 重复词："就是就是"、"然后然后"等
- 口语化表达："啥"、"咋"、"呗"等
- 不完整句子：半截话、语序混乱

**书面化转换规则：**
```javascript
const oralToWritten = {
    // 语气词删除
    '嗯+': '',
    '啊+': '',
    '那个+': '',
    
    // 口语词替换
    '啥': '什么',
    '咋': '怎么',
    '呗': '',
    '嗯呐': '是的',
    
    // 重复词处理
    '(.{1,3})\\1+': '$1',  // 删除重复
    
    // 语序调整（简化版）
    // 更多规则...
};
```

---

### 功能3：智能补标点和分段

**高级标点处理规则：**

#### 3.1 句号、逗号
```javascript
// 根据语气词和停顿判断
const addBasicPunctuation = (text) => {
    // "然后"、"接着"等后面加逗号
    text = text.replace(/(然后|接着|首先|其次|最后)？/g, '$1，');
    
    // 句子结束加句号
    text = text.replace(/([^。！？\s])(?=\s|$)/g, '$1。');
    
    return text;
};
```

#### 3.2 问号、感叹号
```javascript
// 疑问句识别
const addQuestionMark = (text) => {
    const questionWords = ['什么', '怎么', '为什么', '哪里', '谁', '何时', '是否'];
    questionWords.forEach(word => {
        const regex = new RegExp(`(${word}[^。！？]*)(?=[^。！？]*[，,])`, 'g');
        text = text.replace(regex, '$1？');
    });
    return text;
};

// 感叹句识别
const addExclamation = (text) => {
    const exclamationWords = ['太好了', '真棒', '哈哈', '哎呀'];
    exclamationWords.forEach(word => {
        text = text.replace(new RegExp(`${word}[^。！？]*`, 'g'), '$&！');
    });
    return text;
};
```

#### 3.3 引号、括号
```javascript
// 引号配对
const addQuotes = (text) => {
    // 识别引用内容："xxx说" 后面的内容加引号
    text = text.replace(/(.+?)(说|表示|认为|提到) (.+?)(?=[，。])/g, 
                        '$1$2"$3"');
    return text;
};

// 括号补充
const addBrackets = (text) => {
    // 识别注释内容：括号前的"注"、"备注"等
    text = text.replace(/(注|备注|说明) (.+?)(?=[，。])/g, 
                        '$1（$2）');
    return text;
};
```

#### 3.4 分段逻辑
```javascript
const autoParagraph = (text) => {
    // 根据语义单元分段
    // 1. 主题转换（识别"另外"、"此外"、"还有"等）
    text = text.replace(/(另外|此外|还有|另一方面)/g, '\n\n$1');
    
    // 2. 时间顺序（识别"首先"、"然后"、"最后"等）
    text = text.replace(/(首先|第一步)/g, '\n\n$1');
    
    // 3. 字数控制（每段不超过150字）
    const sentences = text.split(/(?<=[。！？])/);
    let paragraphs = [];
    let currentPara = '';
    
    sentences.forEach(sentence => {
        if ((currentPara + sentence).length > 150) {
            paragraphs.push(currentPara.trim());
            currentPara = sentence;
        } else {
            currentPara += sentence;
        }
    });
    if (currentPara) paragraphs.push(currentPara.trim());
    
    return paragraphs.join('\n\n');
};
```

---

### 功能4：风格切换

#### 4.1 正式风格（Formal）
**特征：**
- 使用书面语词汇
- 避免口语化表达
- 句子结构完整
- 逻辑清晰

**实现：**
```javascript
const formalStyle = (text) => {
    let result = text;
    
    // 口语词替换
    result = result.replace(/咋/g, '怎么');
    result = result.replace(/啥/g, '什么');
    result = result.replace(/呗/g, '');
    
    // 添加连接词
    result = result.replace(/然后/g, '其次');
    result = result.replace(/还有/g, '此外');
    
    // 补充完整句子
    result = result.replace(/^(.+)吗/g, '我想询问$1吗');
    
    return result;
};
```

#### 4.2 简洁风格（Concise）
**特征：**
- 删除冗余词汇
- 简化句子结构
- 保留核心信息

**实现：**
```javascript
const conciseStyle = (text) => {
    let result = text;
    
    // 删除语气词
    result = result.replace(/[嗯啊哦唉]/g, '');
    result = result.replace(/那个|这个/g, '');
    
    // 删除重复
    result = result.replace(/(.)\1+/g, '$1');
    
    // 简化长句
    result = result.replace(/(因为|由于).+?(所以|因此)/g, '$1$2');
    
    return result.trim();
};
```

#### 4.3 礼貌风格（Polite）
**特征：**
- 添加敬语
- 使用委婉表达
- 考虑对方感受

**实现：**
```javascript
const politeStyle = (text) => {
    let result = text;
    
    // 添加敬语
    result = result.replace(/你/g, '您');
    result = result.replace(/^我想/g, '我想请教');
    
    // 委婉表达
    result = result.replace(/不行/g, '可能不太方便');
    result = result.replace(/不知道/g, '不太了解');
    
    // 添加礼貌用词
    result = '您好，' + result;
    result = result + '。谢谢！';
    
    return result;
};
```

#### 4.4 行动导向风格（Action-oriented）
**特征：**
- 突出行动步骤
- 使用动词开头
- 清晰的任务列表

**实现：**
```javascript
const actionStyle = (text) => {
    let result = text;
    
    // 识别行动词
    const actionWords = ['做', '完成', '提交', '发送', '准备'];
    actionWords.forEach(word => {
        result = result.replace(new RegExp(`(.*?)${word}(.*?)(?=[，。])`, 'g'), 
                            '【行动】$1$2');
    });
    
    // 添加序号
    const sentences = result.split(/(?<=[。！？])/);
    result = sentences.map((sentence, index) => {
        if (sentence.includes('【行动】')) {
            return `${index + 1}. ${sentence.replace('【行动】', '')}`;
        }
        return sentence;
    }).join('');
    
    return result;
};
```

---

### 功能5：原文/整理稿双视图切换

**界面设计：左右分栏**

```html
<!-- 修改后的输出区域 -->
<div class="output-panel">
    <div class="output-header">
        <h2>识别结果</h2>
        <div class="view-toggle">
            <button id="originalBtn" class="toggle-btn active">原文</button>
            <button id="rewriteBtn" class="toggle-btn">整理稿</button>
            <button id="compareBtn" class="toggle-btn">对比视图</button>
        </div>
        <div class="output-actions">
            <button id="copyBtn" class="btn-action">📋 复制</button>
            <button id="clearBtn" class="btn-action">🗑️ 清空</button>
        </div>
    </div>
    
    <!-- 单视图模式 -->
    <div id="singleView" class="output-area">
        <div id="output" contenteditable="true"></div>
    </div>
    
    <!-- 对比视图模式（默认隐藏） -->
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
    
    <!-- 风格选择器（对比视图中显示） -->
    <div id="styleSelector" class="style-selector hidden">
        <label>风格：</label>
        <select id="styleSelect">
            <option value="formal">正式</option>
            <option value="concise">简洁</option>
            <option value="polite">礼貌</option>
            <option value="action">行动导向</option>
        </select>
    </div>
</div>
```

**样式设计：**
```css
/* 对比视图容器 */
.compare-container {
    display: flex;
    gap: 20px;
    min-height: 400px;
}

.compare-panel {
    flex: 1;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    padding: 15px;
}

.compare-panel h3 {
    color: #333;
    margin-bottom: 10px;
    font-size: 1.1em;
}

.compare-content {
    min-height: 350px;
    max-height: 500px;
    overflow-y: auto;
    line-height: 1.8;
    padding: 10px;
    outline: none;
}

.divider {
    width: 2px;
    background: linear-gradient(to bottom, #667eea, #764ba2);
    margin: 0 10px;
}

/* 视图切换按钮 */
.view-toggle {
    display: flex;
    gap: 10px;
}

.toggle-btn {
    padding: 8px 20px;
    border: 2px solid #667eea;
    background: white;
    color: #667eea;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
}

.toggle-btn.active {
    background: #667eea;
    color: white;
}

/* 风格标签 */
.style-label {
    display: inline-block;
    padding: 3px 10px;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 12px;
    font-size: 0.8em;
    margin-left: 10px;
}
```

---

## 🏗️ 技术实现方案

### 项目结构变更

```
qiniuyunshurufa/
├── index.html              # 修改：添加对比视图
├── css/
│   └── style.css          # 修改：添加对比视图样式
├── js/
│   ├── speech.js          # 修改：添加onStop回调
│   ├── ui.js              # 修改：添加视图切换逻辑
│   ├── app.js             # 修改：整合智能整理功能
│   └── rewriter.js        # 新增：智能整理改写模块
├── README.md              # 修改：更新文档
└── plan-smart-rewrite.md  # 新增：本计划文档
```

---

### 新增文件：js/rewriter.js

**核心类：TextRewriter**

```javascript
class TextRewriter {
    constructor() {
        this.originalText = '';
        this.rewrittenText = '';
        this.currentStyle = 'formal';
    }
    
    // 主入口：整理文本
    rewrite(text, style = 'formal') {
        this.originalText = text;
        this.currentStyle = style;
        
        // Step 1: 清理口语化内容
        let result = this.cleanOralExpression(text);
        
        // Step 2: 智能标点
        result = this.addPunctuation(result);
        
        // Step 3: 自动分段
        result = this.paragraph(result);
        
        // Step 4: 风格转换
        result = this.applyStyle(result, style);
        
        this.rewrittenText = result;
        return result;
    }
    
    // 清理口语化表达
    cleanOralExpression(text) {
        // 实现上述口语特征识别规则
    }
    
    // 智能添加标点
    addPunctuation(text) {
        // 实现上述高级标点处理规则
    }
    
    // 自动分段
    paragraph(text) {
        // 实现上述分段逻辑
    }
    
    // 应用风格
    applyStyle(text, style) {
        switch(style) {
            case 'formal': return this.formalStyle(text);
            case 'concise': return this.conciseStyle(text);
            case 'polite': return this.politeStyle(text);
            case 'action': return this.actionStyle(text);
            default: return text;
        }
    }
    
    // 四种风格实现（见上述详细设计）
    formalStyle(text) { /* ... */ }
    concisestyle(text) { /* ... */ }
    politeStyle(text) { /* ... */ }
    actionStyle(text) { /* ... */ }
    
    // 获取结果
    getOriginal() { return this.originalText; }
    getRewritten() { return this.rewrittenText; }
}
```

---

### 修改文件：js/speech.js

**添加onStop回调：**

```javascript
class SpeechRecognitionModule {
    constructor() {
        // ... 现有代码 ...
        this.onStop = null;  // 新增：停止录音回调
    }
    
    bindEvents() {
        // ... 现有代码 ...
        
        // 修改：onend事件
        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateStatus('录音已停止');
            this.notifyStatusChange('stopped');
            
            // 新增：触发智能整理
            if (this.onStop && this.finalTranscript) {
                this.onStop(this.finalTranscript);
            }
        };
    }
}
```

---

### 修改文件：js/ui.js

**添加视图切换功能：**

```javascript
class UIModule {
    constructor() {
        // ... 现有代码 ...
        
        // 新增：视图元素
        this.originalBtn = null;
        this.rewriteBtn = null;
        this.compareBtn = null;
        this.singleView = null;
        this.compareView = null;
        this.originalOutput = null;
        this.rewrittenOutput = null;
        this.styleSelector = null;
        this.styleSelect = null;
    }
    
    init() {
        // ... 现有代码 ...
        
        // 新增：获取视图相关元素
        this.originalBtn = document.getElementById('originalBtn');
        this.rewriteBtn = document.getElementById('rewriteBtn');
        this.compareBtn = document.getElementById('compareBtn');
        this.singleView = document.getElementById('singleView');
        this.compareView = document.getElementById('compareView');
        this.originalOutput = document.getElementById('originalOutput');
        this.rewrittenOutput = document.getElementById('rewrittenOutput');
        this.styleSelector = document.getElementById('styleSelector');
        this.styleSelect = document.getElementById('styleSelect');
    }
    
    // 新增：显示原文
    showOriginal(text) {
        this.switchToSingleView();
        this.updateOutput(text);
        this.setActiveToggle('originalBtn');
    }
    
    // 新增：显示整理稿
    showRewritten(text) {
        this.switchToSingleView();
        this.updateOutput(text);
        this.setActiveToggle('rewriteBtn');
    }
    
    // 新增：显示对比视图
    showCompareView(original, rewritten) {
        this.singleView.classList.add('hidden');
        this.compareView.classList.remove('hidden');
        this.styleSelector.classList.remove('hidden');
        this.setActiveToggle('compareBtn');
        
        this.originalOutput.textContent = original;
        this.rewrittenOutput.textContent = rewritten;
    }
    
    // 新增：切换到单视图
    switchToSingleView() {
        this.singleView.classList.remove('hidden');
        this.compareView.classList.add('hidden');
        this.styleSelector.classList.add('hidden');
    }
    
    // 新增：设置激活的切换按钮
    setActiveToggle(btnId) {
        [this.originalBtn, this.rewriteBtn, this.compareBtn].forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(btnId).classList.add('active');
    }
    
    // 新增：更新整理稿内容
    updateRewritten(text, style) {
        if (this.rewrittenOutput) {
            this.rewrittenOutput.textContent = text;
        }
        // 更新风格标签
        const styleLabel = document.querySelector('.style-label');
        if (styleLabel) {
            const styleNames = {
                'formal': '正式',
                'concise': '简洁',
                'polite': '礼貌',
                'action': '行动导向'
            };
            styleLabel.textContent = styleNames[style] || '正式';
        }
    }
}
```

---

### 修改文件：js/app.js

**整合智能整理功能：**

```javascript
(function() {
    'use strict';
    
    let speechModule = null;
    let uiModule = null;
    let rewriter = null;  // 新增：整理改写模块
    
    function initApp() {
        // ... 现有代码 ...
        
        // 新增：创建整理改写模块
        rewriter = new TextRewriter();
        
        // 修改：配置停止录音回调
        speechModule.onStop = (finalText) => {
            handleRecordingStop(finalText);
        };
        
        // 新增：绑定视图切换事件
        bindViewEvents();
        
        // 新增：绑定风格切换事件
        bindStyleEvents();
    }
    
    // 新增：处理录音停止
    function handleRecordingStop(finalText) {
        if (!finalText.trim()) return;
        
        // 自动触发智能整理
        const rewritten = rewriter.rewrite(finalText, 'formal');
        
        // 默认显示对比视图
        uiModule.showCompareView(finalText, rewritten);
        
        uiModule.updateStatus('智能整理完成，可切换视图查看', 'success');
    }
    
    // 新增：绑定视图切换事件
    function bindViewEvents() {
        // 原文按钮
        uiModule.originalBtn.addEventListener('click', () => {
            uiModule.showOriginal(rewriter.getOriginal());
        });
        
        // 整理稿按钮
        uiModule.rewriteBtn.addEventListener('click', () => {
            uiModule.showRewritten(rewriter.getRewritten());
        });
        
        // 对比视图按钮
        uiModule.compareBtn.addEventListener('click', () => {
            uiModule.showCompareView(
                rewriter.getOriginal(),
                rewriter.getRewritten()
            );
        });
    }
    
    // 新增：绑定风格切换事件
    function bindStyleEvents() {
        uiModule.styleSelect.addEventListener('change', (event) => {
            const style = event.target.value;
            const original = rewriter.getOriginal();
            const rewritten = rewriter.rewrite(original, style);
            
            uiModule.updateRewritten(rewritten, style);
        });
    }
})();
```

---

## 🧪 测试计划

### 测试用例1：自动触发整理

**步骤：**
1. 启动应用，开始录音
2. 说一段口语化文本："嗯，那个，我想问一下，就是那个项目啥时候能完成啊？"
3. 停止录音

**预期结果：**
- ✅ 自动触发智能整理
- ✅ 显示对比视图
- ✅ 原文："嗯，那个，我想问一下，就是那个项目啥时候能完成啊？"
- ✅ 整理稿："我想询问一下，那个项目什么时候能完成？"

---

### 测试用例2：智能标点

**输入：**
```
然后我们去了超市买了苹果香蕉还有牛奶接着回家了
```

**预期输出：**
```
然后，我们去了超市，买了苹果、香蕉，还有牛奶。接着，回家了。
```

---

### 测试用例3：风格切换

**原文：**
```
这个项目啥时候能完成我想尽快知道结果
```

**正式风格输出：**
```
请问这个项目什么时候能完成？我希望尽快知道结果。
```

**简洁风格输出：**
```
项目何时完成？急需结果。
```

**礼貌风格输出：**
```
您好，我想请教一下，这个项目什么时候能完成呢？麻烦您尽快告知结果，谢谢！
```

**行动导向输出：**
```
1. 确认项目完成时间
2. 获取结果报告
```

---

### 测试用例4：对比视图

**步骤：**
1. 停止录音后，默认显示对比视图
2. 点击"原文"按钮
3. 点击"整理稿"按钮
4. 点击"对比视图"按钮

**预期结果：**
- ✅ 视图切换流畅
- ✅ 内容正确显示
- ✅ 样式正确应用

---

### 测试用例5：分段功能

**输入（长文本）：**
```
首先我们需要准备材料然后联系供应商确认价格接着我们要做预算另外还要考虑时间安排最后提交报告给领导审批
```

**预期输出（分段）：**
```

首先，我们需要准备材料。

然后，联系供应商确认价格。

接着，我们要做预算。

另外，还要考虑时间安排。

最后，提交报告给领导审批。
```

---

## 📝 开发步骤

### Step 1: 创建智能整理模块
- [ ] 创建 `js/rewriter.js`
- [ ] 实现 `TextRewriter` 类
- [ ] 实现口语清理规则
- [ ] 实现智能标点功能
- [ ] 实现自动分段功能
- [ ] 实现四种风格转换

### Step 2: 修改HTML结构
- [ ] 添加视图切换按钮
- [ ] 添加对比视图容器
- [ ] 添加风格选择器

### Step 3: 添加CSS样式
- [ ] 对比视图布局样式
- [ ] 视图切换按钮样式
- [ ] 风格标签样式
- [ ] 响应式适配

### Step 4: 修改JavaScript模块
- [ ] 修改 `speech.js` 添加onStop回调
- [ ] 修改 `ui.js` 添加视图切换方法
- [ ] 修改 `app.js` 整合整理功能

### Step 5: 测试与优化
- [ ] 功能测试（上述5个测试用例）
- [ ] 浏览器兼容性测试
- [ ] 性能优化（大文本处理）
- [ ] 用户体验优化

### Step 6: 更新文档
- [ ] 更新 `README.md`
- [ ] 添加使用说明
- [ ] 添加功能演示截图

---

## 🎨 UI/UX 设计细节

### 视图切换交互

```
┌─────────────────────────────────────────┐
│  识别结果                    [原文] [整理稿] [对比视图]  📋 🗑️  │
├─────────────────────────────────────────┤
│                                         │
│  【单视图模式】                          │
│  ┌─────────────────────────────────┐  │
│  │ (显示原文或整理稿)                │  │
│  └─────────────────────────────────┘  │
│                                         │
│  【对比视图模式】                        │
│  ┌───────────┬───────────┐            │
│  │  原文      │  整理稿    │            │
│  │  (可编辑)  │  (可编辑)  │  风格：▼  │
│  │           │           │            │
│  └───────────┴───────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

### 风格切换交互

- 仅在"对比视图"模式下显示风格选择器
- 切换风格后，右侧"整理稿"实时更新
- 风格标签显示在"整理稿"标题旁边

---

## ⚠️ 注意事项

### 1. 性能考虑
- 大文本处理可能导致界面卡顿
- **解决方案**：使用 `requestAnimationFrame` 或 Web Worker 分步处理

### 2. 准确性问题
- 纯前端规则无法达到100%准确
- **解决方案**：提供"编辑"功能，允许用户手动调整

### 3. 浏览器兼容性
- 某些正则表达式特性可能不兼容旧浏览器
- **解决方案**：使用 polyfill 或简化规则

---

## 📊 成功指标

- ✅ 停止录音后 1秒内 自动触发整理
- ✅ 标点准确率 > 85%
- ✅ 分段合理率 > 80%
- ✅ 风格切换响应时间 < 500ms
- ✅ 用户界面操作流畅，无卡顿

---

## 🚀 后续扩展方向

1. **AI增强**：集成在线AI API（如GPT）提高整理质量
2. **自定义规则**：允许用户添加自定义改写规则
3. **批量处理**：支持上传文档批量整理
4. **历史记录**：保存整理历史，支持回溯
5. **导出功能**：导出整理稿为Word、PDF等格式

---

## 📅 开发时间估算

| 任务 | 预估时间 |
|------|---------|
| 创建 rewriter.js 模块 | 2小时 |
| 修改 HTML/CSS | 1.5小时 |
| 修改 JavaScript 模块 | 1.5小时 |
| 功能测试 | 1小时 |
| 文档更新 | 0.5小时 |
| **总计** | **6.5小时** |

---

**计划创建时间：** 2026-05-24  
**开发者：** ls-jpg  
**审查者：** （待指定）
