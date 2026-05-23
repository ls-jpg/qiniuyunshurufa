/**
 * UI交互模块
 * 处理用户界面交互逻辑
 */
class UIModule {
    constructor() {
        this.outputElement = null;
        this.statusElement = null;
        this.recordingIndicator = null;
        this.startBtn = null;
        this.stopBtn = null;
        this.copyBtn = null;
        this.clearBtn = null;
        this.languageSelect = null;
        
        this.init();
    }

    /**
     * 初始化UI模块
     */
    init() {
        // 获取DOM元素
        this.outputElement = document.getElementById('output');
        this.statusElement = document.getElementById('status');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.languageSelect = document.getElementById('language');

        // 初始化placeholder行为
        this.initPlaceholder();
    }

    /**
     * 初始化placeholder行为
     */
    initPlaceholder() {
        const output = this.outputElement;
        
        // 模拟placeholder行为
        if (!output.textContent.trim()) {
            output.setAttribute('data-placeholder', output.getAttribute('placeholder'));
        }

        output.addEventListener('focus', () => {
            output.removeAttribute('data-placeholder');
        });

        output.addEventListener('blur', () => {
            if (!output.textContent.trim()) {
                output.setAttribute('data-placeholder', output.getAttribute('placeholder'));
            }
        });

        output.addEventListener('input', () => {
            if (output.textContent.trim()) {
                output.removeAttribute('data-placeholder');
            }
        });
    }

    /**
     * 更新状态显示
     */
    updateStatus(message, type = 'info') {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            this.statusElement.className = 'status ' + type;
        }
    }

    /**
     * 显示/隐藏录音指示器
     */
    setRecordingIndicator(show) {
        if (this.recordingIndicator) {
            if (show) {
                this.recordingIndicator.classList.remove('hidden');
            } else {
                this.recordingIndicator.classList.add('hidden');
            }
        }
    }

    /**
     * 更新按钮状态
     */
    updateButtonStates(isRecording) {
        if (this.startBtn) {
            this.startBtn.disabled = isRecording;
        }
        if (this.stopBtn) {
            this.stopBtn.disabled = !isRecording;
        }
    }

    /**
     * 更新输出区域内容
     */
    updateOutput(text) {
        if (this.outputElement) {
            this.outputElement.textContent = text;
            // 触发input事件以更新placeholder
            this.outputElement.dispatchEvent(new Event('input'));
        }
    }

    /**
     * 追加文本到输出区域
     */
    appendToOutput(text) {
        if (this.outputElement) {
            this.outputElement.textContent += text;
            // 触发input事件
            this.outputElement.dispatchEvent(new Event('input'));
        }
    }

    /**
     * 获取输出区域内容
     */
    getOutputText() {
        return this.outputElement ? this.outputElement.textContent : '';
    }

    /**
     * 清空输出区域
     */
    clearOutput() {
        if (this.outputElement) {
            this.outputElement.textContent = '';
            this.outputElement.dispatchEvent(new Event('blur'));
        }
    }

    /**
     * 复制文本到剪贴板
     */
    async copyToClipboard() {
        const text = this.getOutputText();
        
        if (!text.trim()) {
            this.updateStatus('没有可复制的文本', 'warning');
            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.updateStatus('文本已复制到剪贴板', 'success');
            return true;
        } catch (error) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            this.updateStatus('文本已复制到剪贴板', 'success');
            return true;
        }
    }

    /**
     * 绑定开始按钮事件
     */
    onStartClick(callback) {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', callback);
        }
    }

    /**
     * 绑定停止按钮事件
     */
    onStopClick(callback) {
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', callback);
        }
    }

    /**
     * 绑定复制按钮事件
     */
    onCopyClick(callback) {
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => {
                this.copyToClipboard().then(callback);
            });
        }
    }

    /**
     * 绑定清空按钮事件
     */
    onClearClick(callback) {
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                if (confirm('确定要清空所有文本吗？')) {
                    this.clearOutput();
                    this.updateStatus('文本已清空', 'info');
                    if (callback) callback();
                }
            });
        }
    }

    /**
     * 绑定语言选择事件
     */
    onLanguageChange(callback) {
        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (event) => {
                if (callback) callback(event.target.value);
            });
        }
    }

    /**
     * 显示提示消息
     */
    showToast(message, duration = 3000) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
}

// 添加toast动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 导出模块
window.UIModule = UIModule;
