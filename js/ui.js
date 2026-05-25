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
        
        // 新增：视图切换相关元素
        this.originalBtn = null;
        this.rewriteBtn = null;
        this.compareBtn = null;
        this.singleView = null;
        this.compareView = null;
        this.originalOutput = null;
        this.rewrittenOutput = null;
        this.styleSelector = null;
        this.styleSelect = null;
        
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
        
        // 新增：获取视图切换相关元素
        this.originalBtn = document.getElementById('originalBtn');
        this.rewriteBtn = document.getElementById('rewriteBtn');
        this.compareBtn = document.getElementById('compareBtn');
        this.singleView = document.getElementById('singleView');
        this.compareView = document.getElementById('compareView');
        this.originalOutput = document.getElementById('originalOutput');
        this.rewrittenOutput = document.getElementById('rewrittenOutput');
        this.styleSelector = document.getElementById('styleSelector');
        this.styleSelect = document.getElementById('styleSelect');

        // 初始化placeholder行为
        this.initPlaceholder();

        // FIX #3：录音期间锁定编辑标志
        this._editingLocked = false;
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
     * FIX #3：设置编辑锁定状态
     * 录音期间锁定输出区域，保护用户手动编辑不被实时转写覆盖
     * @param {boolean} locked - true=录音中锁定，false=解除锁定
     */
    setEditingLocked(locked) {
        this._editingLocked = locked;
    }

    /**
     * 更新输出区域内容
     * FIX #3：录音期间用户手动编辑时，跳过自动覆盖，避免实时转写与手动编辑冲突
     */
    updateOutput(text) {
        if (!this.outputElement) return;

        // 如果录音期间用户正在手动编辑，跳过自动更新
        if (this._editingLocked && document.activeElement === this.outputElement) {
            return;
        }

        this.outputElement.textContent = text;
        // 触发input事件以更新placeholder
        this.outputElement.dispatchEvent(new Event('input'));
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
            // FIX #8：降级方案，检查execCommand返回值
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            let success = false;
            try {
                success = document.execCommand('copy');
            } catch (execError) {
                console.error('execCommand 复制失败:', execError);
            }
            
            document.body.removeChild(textarea);
            
            if (success) {
                this.updateStatus('文本已复制到剪贴板', 'success');
                return true;
            } else {
                this.updateStatus('复制失败，请手动复制文本', 'error');
                return false;
            }
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
     * 显示原文（单视图模式）
     */
    showOriginal(text) {
        this.switchToSingleView();
        this.updateOutput(text);
        this.setActiveToggle('originalBtn');
    }
    
    /**
     * 显示整理稿（单视图模式）
     */
    showRewritten(text, style = 'formal') {
        this.switchToSingleView();
        this.updateOutput(text);
        this.setActiveToggle('rewriteBtn');
        this.updateStyleLabel(style);
    }
    
    /**
     * 显示对比视图
     */
    showCompareView(original, rewritten, style = 'formal') {
        if (!this.singleView || !this.compareView) return;
        
        this.singleView.classList.add('hidden');
        this.compareView.classList.remove('hidden');
        this.styleSelector.classList.remove('hidden');
        this.setActiveToggle('compareBtn');
        
        if (this.originalOutput) {
            this.originalOutput.textContent = original;
        }
        if (this.rewrittenOutput) {
            this.rewrittenOutput.textContent = rewritten;
        }
        this.updateStyleLabel(style);
    }
    
    /**
     * 切换到单视图模式
     */
    switchToSingleView() {
        if (!this.singleView || !this.compareView) return;
        
        this.singleView.classList.remove('hidden');
        this.compareView.classList.add('hidden');
        this.styleSelector.classList.add('hidden');
    }
    
    /**
     * 设置激活的切换按钮
     */
    setActiveToggle(btnId) {
        [this.originalBtn, this.rewriteBtn, this.compareBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(btnId);
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    /**
     * 更新整理稿内容
     */
    updateRewritten(text, style = 'formal') {
        if (this.rewrittenOutput) {
            this.rewrittenOutput.textContent = text;
        }
        this.updateStyleLabel(style);
    }
    
    /**
     * 更新风格标签
     */
    updateStyleLabel(style) {
        const styleLabel = document.querySelector('.style-label');
        if (!styleLabel) return;
        
        const styleNames = {
            'formal': '正式',
            'concise': '简洁',
            'polite': '礼貌',
            'action': '行动导向'
        };
        styleLabel.textContent = styleNames[style] || '正式';
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

    /**
     * 导出文本为Word文档
     * @param {string} text - 要导出的文本内容
     * @param {string} filename - 文件名（不含扩展名）
     */
    exportToWord(text, filename = '语音识别结果') {
        if (!text || !text.trim()) {
            this.updateStatus('没有可导出的文本', 'warning');
            return false;
        }

        try {
            // FIX #9：HTML转义，防止特殊字符破坏导出文档结构
            const escapedText = this._escapeHtml(text);
            const escapedFilename = this._escapeHtml(filename);

            // 创建HTML内容（Word可以打开HTML文件）
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${escapedFilename}</title>
                    <style>
                        body {
                            font-family: "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
                            line-height: 1.8;
                            margin: 40px;
                            font-size: 14px;
                            color: #333;
                        }
                        h1 {
                            color: #2c3e50;
                            border-bottom: 2px solid #3498db;
                            padding-bottom: 10px;
                        }
                        .content {
                            margin-top: 20px;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                        .info {
                            color: #7f8c8d;
                            font-size: 12px;
                            margin-top: 30px;
                            padding-top: 10px;
                            border-top: 1px solid #ecf0f1;
                        }
                    </style>
                </head>
                <body>
                    <h1>语音识别结果</h1>
                    <div class="content">${escapedText.replace(/\n/g, '<br>')}</div>
                    <div class="info">
                        生成时间：${new Date().toLocaleString('zh-CN')}<br>
                        由"语音输入法"生成
                    </div>
                </body>
                </html>
            `;

            // 创建Blob对象
            const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.doc`;
            link.style.display = 'none';
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 100);
            
            this.updateStatus('Word文档已导出', 'success');
            return true;
            
        } catch (error) {
            console.error('导出Word失败:', error);
            this.updateStatus('导出失败，请重试', 'error');
            return false;
        }
    }

    /**
     * FIX #9：HTML 转义辅助方法
     * 将用户文本中的特殊字符转义为 HTML 实体，防止破坏导出文档结构
     * @param {string} str - 需要转义的字符串
     * @returns {string} 转义后的安全字符串
     */
    _escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 显示 API Key 输入对话框
     * @returns {Promise<string|null>} 用户输入的 Key，取消返回 null
     */
    showApiKeyModal() {
        return new Promise((resolve) => {
            const modal = document.getElementById('apiKeyModal');
            const input = document.getElementById('apiKeyInput');
            const confirmBtn = document.getElementById('apiKeyConfirmBtn');
            const cancelBtn = document.getElementById('apiKeyCancelBtn');
            const errorMsg = document.getElementById('apiKeyError');

            if (!modal || !input) {
                resolve(null);
                return;
            }

            // 显示对话框
            modal.classList.remove('hidden');
            // 清空之前的值和错误
            input.value = '';
            if (errorMsg) errorMsg.classList.add('hidden');
            // 聚焦到输入框
            setTimeout(() => input.focus(), 100);

            // 确认按钮处理函数
            const handleConfirm = () => {
                const key = input.value.trim();
                if (!key) {
                    if (errorMsg) {
                        errorMsg.textContent = '请输入有效的 API Key';
                        errorMsg.classList.remove('hidden');
                    }
                    return;
                }
                cleanup();
                resolve(key);
            };

            // 取消处理函数
            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            // 键盘事件处理
            const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            // 点击遮罩层关闭
            const handleOverlayClick = (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            };

            // 清理所有事件监听
            const cleanup = () => {
                modal.classList.add('hidden');
                if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
                if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
                input.removeEventListener('keydown', handleKeyDown);
                modal.removeEventListener('click', handleOverlayClick);
            };

            // 绑定事件
            if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
            if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
            input.addEventListener('keydown', handleKeyDown);
            modal.addEventListener('click', handleOverlayClick);
        });
    }

    /**
     * 设置按钮加载状态
     * @param {HTMLElement} button - 按钮元素
     * @param {boolean} loading - 是否加载中
     * @param {string} [loadingText] - 加载中的文本
     */
    setButtonLoading(button, loading, loadingText) {
        if (!button) return;

        if (loading) {
            button._originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner"></span>' + (loadingText || '加载中...');
            button.disabled = true;
            button.classList.add('loading');
        } else {
            if (button._originalText) {
                button.innerHTML = button._originalText;
                delete button._originalText;
            }
            button.disabled = false;
            button.classList.remove('loading');
        }
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
