/**
 * 语音识别模块
 * 封装Web Speech API，提供语音识别功能
 */
class SpeechRecognitionModule {
    constructor() {
        this.recognition = null;
        this._isRecording = false;           // 重命名：避免与 isRecording() 方法同名（FIX #5）
        this._userRequestedStop = false;     // 新增：区分用户主动停止与异常结束（FIX #4）
        this.onResult = null;
        this.onStatusChange = null;
        this.onRecordingStateChange = null;  // 新增：独立的录音状态枚举回调（FIX #1）
        this.onError = null;
        this.onStop = null;                  // 录音停止回调（仅用户主动停止时触发）
        this.finalTranscript = '';
        this.interimTranscript = '';
        
        this.init();
    }

    /**
     * 初始化语音识别
     */
    init() {
        // 检查浏览器支持
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.handleError('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // 配置语音识别参数
        this.recognition.continuous = true;  // 持续识别
        this.recognition.interimResults = true;  // 返回中间结果
        this.recognition.lang = 'zh-CN';  // 默认中文

        // 绑定事件处理
        this.bindEvents();
    }

    /**
     * 绑定事件处理程序
     */
    bindEvents() {
        if (!this.recognition) return;

        // 识别结果事件
        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        // 识别开始事件
        this.recognition.onstart = () => {
            this._isRecording = true;
            this.updateStatus('录音已开始，请开始说话...');
            this.notifyRecordingStateChange('recording');  // FIX #1：状态枚举走独立回调
        };

        // 识别结束事件
        this.recognition.onend = () => {
            this._isRecording = false;
            this.updateStatus('录音已停止');
            this.notifyRecordingStateChange('stopped');   // FIX #1：状态枚举走独立回调
            
            // FIX #4：仅在用户主动停止时才触发智能整理回调
            if (this._userRequestedStop && this.onStop && this.finalTranscript) {
                this.onStop(this.finalTranscript);
            }
            
            // 重置标志位
            this._userRequestedStop = false;
        };

        // 识别错误事件
        this.recognition.onerror = (event) => {
            this.handleError(event.error);
        };
    }

    /**
     * 处理识别结果
     */
    handleResult(event) {
        this.interimTranscript = '';
        
        // 遍历所有识别结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                this.finalTranscript += transcript;
            } else {
                this.interimTranscript += transcript;
            }
        }

        // 回调结果
        if (this.onResult) {
            this.onResult({
                final: this.finalTranscript,
                interim: this.interimTranscript,
                combined: this.finalTranscript + this.interimTranscript
            });
        }
    }

    /**
     * 处理错误
     */
    handleError(error) {
        let errorMessage = '语音识别出错：';
        
        switch (error) {
            case 'not-allowed':
                errorMessage += '请允许麦克风权限';
                break;
            case 'no-speech':
                errorMessage += '未检测到语音';
                break;
            case 'network':
                errorMessage += '网络错误';
                break;
            case 'audio-capture':
                errorMessage += '无法捕获音频';
                break;
            default:
                errorMessage += error;
        }

        this.updateStatus(errorMessage, 'error');
        
        if (this.onError) {
            this.onError(errorMessage);
        }
    }

    /**
     * 通知状态变化（提示文案，如"录音已开始"）
     */
    updateStatus(message, type = 'info') {
        if (this.onStatusChange) {
            this.onStatusChange(message, type);
        }
    }

    /**
     * 通知录音状态枚举变化（如 'recording' / 'stopped'）
     * FIX #1：与 updateStatus（提示文案）走独立回调，避免字符串判断歧义
     */
    notifyRecordingStateChange(state) {
        if (this.onRecordingStateChange) {
            this.onRecordingStateChange(state);
        }
    }

    /**
     * 开始录音
     */
    start() {
        if (!this.recognition) {
            this.handleError('语音识别未初始化');
            return false;
        }

        if (this._isRecording) {
            return false;
        }

        // FIX #2：新一轮录音前清空上轮缓冲，避免多轮拼接
        this.finalTranscript = '';
        this.interimTranscript = '';
        // FIX #4：重置用户停止标志
        this._userRequestedStop = false;

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            this.handleError('启动录音失败：' + error.message);
            return false;
        }
    }

    /**
     * 停止录音
     */
    stop() {
        if (!this.recognition || !this._isRecording) {
            return false;
        }

        // FIX #4：标记为用户主动停止，区别于异常/超时导致的结束
        this._userRequestedStop = true;

        try {
            this.recognition.stop();
            return true;
        } catch (error) {
            this._userRequestedStop = false;
            this.handleError('停止录音失败：' + error.message);
            return false;
        }
    }

    /**
     * 设置识别语言
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * 清空识别结果
     */
    clear() {
        this.finalTranscript = '';
        this.interimTranscript = '';
    }

    /**
     * 获取最终识别结果
     */
    getFinalTranscript() {
        return this.finalTranscript;
    }

    /**
     * 检查是否正在录音
     * FIX #5：方法名与属性名已解耦（属性改为 _isRecording）
     */
    isRecording() {
        return this._isRecording;
    }
}

// 导出模块
window.SpeechRecognitionModule = SpeechRecognitionModule;
