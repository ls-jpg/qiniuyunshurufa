/**
 * 主应用逻辑
 * 整合语音识别和UI交互模块
 */
(function() {
    'use strict';

    let speechModule = null;
    let uiModule = null;

    /**
     * 初始化应用
     */
    function initApp() {
        // 创建模块实例
        speechModule = new SpeechRecognitionModule();
        uiModule = new UIModule();

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

        // 绑定UI事件
        bindUIEvents();

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
