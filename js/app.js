/**
 * 主应用逻辑
 * 整合语音识别、UI交互和智能整理模块
 */
(function() {
    'use strict';

    let speechModule = null;
    let uiModule = null;
    let rewriter = null;  // 新增：智能整理模块

    /**
     * 初始化应用
     */
     function initApp() {
        // 创建模块实例
        speechModule = new SpeechRecognitionModule();
        uiModule = new UIModule();
        rewriter = new TextRewriter();  // 新增：创建智能整理模块

        // 检查浏览器支持
        if (!speechModule.recognition) {
            uiModule.updateStatus('您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器', 'error');
            uiModule.updateButtonStates(true);
            return;
        }

        // 配置语音识别回调
        speechModule.onResult = (result) => {
            handleRecognitionResult(result);
        };

        speechModule.onStatusChange = (status, type) => {
            handleStatusChange(status, type);
        };

        speechModule.onError = (error) => {
            handleError(error);
        };

        // 新增：配置录音停止回调（自动触发智能整理）
        speechModule.onStop = (finalText) => {
            handleRecordingStop(finalText);
        };

        // 绑定UI事件
        bindUIEvents();

        // 新增：绑定视图切换事件
        bindViewEvents();

        // 新增：绑定风格切换事件
        bindStyleEvents();

        // 更新初始状态
        uiModule.updateStatus('准备就绪，点击"开始录音"按钮开始语音输入', 'info');
    }

    /**
     * 处理识别结果
     */
    function handleRecognitionResult(result) {
        // 显示最终结果和中间结果
        uiModule.updateOutput(result.combined);
    }

    /**
     * 处理状态变化
     */
    function handleStatusChange(status, type) {
        if (typeof status === 'string') {
            // 状态消息
            uiModule.updateStatus(status, type);
        } else {
            // 状态标识
            switch (status) {
                case 'recording':
                    uiModule.setRecordingIndicator(true);
                    uiModule.updateButtonStates(true);
                    break;
                case 'stopped':
                    uiModule.setRecordingIndicator(false);
                    uiModule.updateButtonStates(false);
                    break;
            }
        }
    }

    /**
     * 处理错误
     */
    function handleError(error) {
        console.error('语音识别错误:', error);
        uiModule.setRecordingIndicator(false);
        uiModule.updateButtonStates(false);
    }

    /**
     * 新增：处理录音停止
     */
    function handleRecordingStop(finalText) {
        if (!finalText || !finalText.trim()) return;

        // 自动触发智能整理
        const rewritten = rewriter.rewrite(finalText, 'formal');

        // 默认显示对比视图
        uiModule.showCompareView(finalText, rewritten, 'formal');

        uiModule.updateStatus('智能整理完成，可切换视图查看', 'success');
    }

    /**
     * 绑定UI事件
     */
    function bindUIEvents() {
        // 开始录音按钮
        uiModule.onStartClick(() => {
            const language = uiModule.languageSelect.value;
            speechModule.setLanguage(language);
            
            if (speechModule.start()) {
                uiModule.updateStatus('正在启动录音...', 'info');
            }
        });

        // 停止录音按钮
        uiModule.onStopClick(() => {
            if (speechModule.stop()) {
                uiModule.updateStatus('正在停止录音...', 'info');
            }
        });

        // 复制按钮
        uiModule.onCopyClick((success) => {
            if (success) {
                uiModule.showToast('✓ 复制成功');
            }
        });

        // 清空按钮
        uiModule.onClearClick(() => {
            speechModule.clear();
        });

        // 语言选择
        uiModule.onLanguageChange((language) => {
            speechModule.setLanguage(language);
            uiModule.updateStatus(`已切换识别语言: ${uiModule.languageSelect.options[uiModule.languageSelect.selectedIndex].text}`, 'info');
        });
    }

    /**
     * 新增：绑定视图切换事件
     */
    function bindViewEvents() {
        // 原文按钮
        if (uiModule.originalBtn) {
            uiModule.originalBtn.addEventListener('click', () => {
                const original = rewriter.getOriginal();
                uiModule.showOriginal(original);
            });
        }

        // 整理稿按钮
        if (uiModule.rewriteBtn) {
            uiModule.rewriteBtn.addEventListener('click', () => {
                const rewritten = rewriter.getRewritten();
                const style = rewriter.getCurrentStyle();
                uiModule.showRewritten(rewritten, style);
            });
        }

        // 对比视图按钮
        if (uiModule.compareBtn) {
            uiModule.compareBtn.addEventListener('click', () => {
                const original = rewriter.getOriginal();
                const rewritten = rewriter.getRewritten();
                const style = rewriter.getCurrentStyle();
                uiModule.showCompareView(original, rewritten, style);
            });
        }
    }

    /**
     * 新增：绑定风格切换事件
     */
    function bindStyleEvents() {
        if (uiModule.styleSelect) {
            uiModule.styleSelect.addEventListener('change', (event) => {
                const style = event.target.value;
                const original = rewriter.getOriginal();
                const rewritten = rewriter.rewrite(original, style);

                // 更新对比视图中的整理稿
                uiModule.updateRewritten(rewritten, style);

                uiModule.updateStatus(`已切换为"${getStyleName(style)}"风格`, 'info');
            });
        }
    }

    /**
     * 新增：获取风格名称
     */
    function getStyleName(style) {
        const styleNames = {
            'formal': '正式',
            'concise': '简洁',
            'polite': '礼貌',
            'action': '行动导向'
        };
        return styleNames[style] || '正式';
    }

    /**
     * 页面加载完成后初始化
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    // 导出到全局（用于调试）
    window.app = {
        speechModule,
        uiModule
    };

})();
