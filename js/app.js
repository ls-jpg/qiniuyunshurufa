/**
 * 主应用逻辑
 * 整合语音识别、UI交互和智能整理模块
 */
(function() {
    'use strict';

    let speechModule = null;
    let uiModule = null;
    let rewriter = null;  // 智能整理模块
    let hunyuanAPI = null; // AI 润色模块

    /**
     * 初始化应用
     */
     function initApp() {
        // 创建模块实例
        speechModule = new SpeechRecognitionModule();
        uiModule = new UIModule();
        rewriter = new TextRewriter();  // 创建智能整理模块
        hunyuanAPI = new HunyuanAPI();  // 创建 AI 润色模块

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

        // FIX #1：录音状态枚举（recording/stopped）走独立回调，与提示文案分离
        speechModule.onRecordingStateChange = (state) => {
            handleRecordingStateChange(state);
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

        // 新增：绑定 AI 润色事件
        bindAIPolishEvent();

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
     * 处理状态变化（提示文案，如"录音已开始"、"网络错误"等）
     * FIX #1：状态枚举（recording/stopped）已分离到 handleRecordingStateChange
     */
    function handleStatusChange(status, type) {
        uiModule.updateStatus(status, type);
    }

    /**
     * FIX #1：独立的录音状态枚举处理（recording / stopped）
     * 负责按钮启用/禁用、录音指示器显隐
     */
    function handleRecordingStateChange(state) {
        switch (state) {
            case 'recording':
                uiModule.setRecordingIndicator(true);
                uiModule.updateButtonStates(true);
                uiModule.setEditingLocked(true);  // FIX #3：录音期间锁定编辑保护
                break;
            case 'stopped':
                uiModule.setRecordingIndicator(false);
                uiModule.updateButtonStates(false);
                uiModule.setEditingLocked(false); // FIX #3：录音结束后解除锁定
                break;
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
     * FIX #6：停止后不再默认自动改写；保留原文，改写作为显式增强让用户手动触发
     */
    function handleRecordingStop(finalText) {
        if (!finalText || !finalText.trim()) return;

        // 保存原文到 rewriter，让用户可手动切换风格
        rewriter.setOriginal(finalText);

        // 默认仅展示原文，不做自动改写
        uiModule.showOriginal(finalText);

        uiModule.updateStatus('录音已停止，可在下方选择风格进行智能整理', 'success');
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

        // 导出Word按钮
        bindExportWordEvent();

        // 语言选择
        uiModule.onLanguageChange((language) => {
            speechModule.setLanguage(language);
            uiModule.updateStatus(`已切换识别语言: ${uiModule.languageSelect.options[uiModule.languageSelect.selectedIndex].text}`, 'info');
        });
    }

    /**
     * 绑定导出Word按钮事件
     */
    function bindExportWordEvent() {
        const exportBtn = document.getElementById('exportWordBtn');
        if (!exportBtn) return;

        exportBtn.addEventListener('click', () => {
            let exportText = '';

            // 判断当前是单视图还是对比视图
            const compareView = document.getElementById('compareView');
            if (compareView && !compareView.classList.contains('hidden')) {
                // 对比视图模式：导出原文 + 整理稿
                const originalText = (document.getElementById('originalOutput') || {}).textContent || '';
                const rewrittenText = (document.getElementById('rewrittenOutput') || {}).textContent || '';
                exportText = '【原文】\n' + originalText + '\n\n【整理稿】\n' + rewrittenText;
            } else {
                // 单视图模式：导出当前显示的文字
                const outputEl = document.getElementById('output');
                exportText = outputEl ? outputEl.textContent : '';
            }

            // 生成带时间戳的文件名
            const now = new Date();
            const timestamp = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');
            const filename = '语音识别结果_' + timestamp;

            uiModule.exportToWord(exportText, filename);
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
     * FIX #7：添加防抖节流、加载状态管理和错误回退
     */
    function bindStyleEvents() {
        if (!uiModule.styleSelect) return;

        let styleDebounceTimer = null;
        let isRewriting = false;

        uiModule.styleSelect.addEventListener('change', (event) => {
            const style = event.target.value;
            const original = rewriter.getOriginal();

            if (!original || !original.trim()) {
                uiModule.updateStatus('请先进行语音输入或输入文本', 'warning');
                // 恢复之前的选择
                uiModule.styleSelect.value = rewriter.getCurrentStyle();
                return;
            }

            // FIX #7：防抖处理，避免连续快速切换造成多次计算
            if (styleDebounceTimer) {
                clearTimeout(styleDebounceTimer);
            }

            // 如果正在处理中，阻止新的请求
            if (isRewriting) {
                uiModule.updateStatus('整理中，请稍候...', 'info');
                return;
            }

            uiModule.updateStatus('正在整理...', 'info');

            styleDebounceTimer = setTimeout(() => {
                try {
                    isRewriting = true;
                    const rewritten = rewriter.rewrite(original, style);

                    // 更新对比视图中的整理稿
                    uiModule.updateRewritten(rewritten, style);
                    uiModule.updateStatus('已切换为"' + getStyleName(style) + '"风格', 'success');
                } catch (error) {
                    console.error('智能整理失败:', error);
                    uiModule.updateStatus('整理失败，请重试', 'error');
                } finally {
                    isRewriting = false;
                }
            }, 300); // 300ms 防抖延迟
        });
    }

    /**
     * 新增：绑定 AI 润色按钮事件
     */
    function bindAIPolishEvent() {
        const aiPolishBtn = document.getElementById('aiPolishBtn');
        if (!aiPolishBtn) return;

        aiPolishBtn.addEventListener('click', async () => {
            const original = rewriter.getOriginal();
            const style = rewriter.getCurrentStyle();

            // 检查是否有文本
            if (!original || !original.trim()) {
                uiModule.updateStatus('请先进行语音输入或输入文本', 'warning');
                return;
            }

            // 检查是否已配置 API Key
            if (!hunyuanAPI.isConfigured()) {
                uiModule.updateStatus('请先配置混元 API Key', 'info');
                const apiKey = await uiModule.showApiKeyModal();
                
                if (!apiKey) {
                    uiModule.updateStatus('已取消 AI 润色', 'info');
                    return;
                }
                
                hunyuanAPI.setApiKey(apiKey);
                uiModule.updateStatus('API Key 已配置，正在调用 AI 润色...', 'info');
            }

            // 设置按钮加载状态
            uiModule.setButtonLoading(aiPolishBtn, true, '✨ AI润色中...');

            try {
                // 调用混元 API 进行润色
                const polished = await hunyuanAPI.polish(original, style);

                // 更新 rewriter 状态
                rewriter.setRewritten(polished);
                rewriter.setCurrentStyle(style);

                // 更新 UI 中的整理稿
                uiModule.updateRewritten(polished, style);

                // 自动切换到整理稿视图展示结果
                uiModule.showRewritten(polished, style);

                uiModule.updateStatus('AI 润色完成（' + getStyleName(style) + '风格）', 'success');
                uiModule.showToast('✨ AI 润色完成');

            } catch (error) {
                console.error('AI 润色失败:', error);

                // 降级：使用本地规则引擎
                uiModule.updateStatus('AI 润色失败：' + error.message + '，已切换为本地润色', 'warning');

                try {
                    const rewritten = rewriter.rewrite(original, style);
                    uiModule.updateRewritten(rewritten, style);
                    uiModule.showRewritten(rewritten, style);
                } catch (fallbackError) {
                    console.error('本地润色也失败了:', fallbackError);
                    uiModule.updateStatus('润色失败，请重试', 'error');
                }
            } finally {
                // 恢复按钮状态
                uiModule.setButtonLoading(aiPolishBtn, false);
            }
        });
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
        uiModule,
        hunyuanAPI
    };

})();
