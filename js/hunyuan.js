/**
 * 混元 API 调用模块
 * 封装腾讯混元大模型 API 的调用逻辑，提供文本润色能力
 */
class HunyuanAPI {
    constructor() {
        this.apiKey = null;
        this.endpoint = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
        this.model = 'hunyuan-turbos-latest';
        this.timeoutMs = 30000; // 30 秒超时
    }

    /**
     * 设置 API Key
     * @param {string} apiKey - 混元 API 密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 获取当前 API Key
     * @returns {string|null}
     */
    getApiKey() {
        return this.apiKey;
    }

    /**
     * 检查是否已配置 API Key
     * @returns {boolean}
     */
    isConfigured() {
        return !!this.apiKey && this.apiKey.trim().length > 0;
    }

    /**
     * 根据风格获取系统提示词
     * @param {string} style - 风格：formal/concise/polite/action
     * @returns {string} 系统提示词
     */
    getSystemPrompt(style) {
        const prompts = {
            formal: `你是一个专业的文本润色助手。请将用户提供的口语化文本改写为正式、规范的书面表达。

要求：
1. 使用规范书面语，避免口语化表达
2. 添加逻辑连接词（首先、其次、此外、最后等）
3. 将口语词汇升级为书面词汇（但→然而，所以→因此，还有→此外）
4. 保持原意不变，只做语言润色
5. 如果原文较长（超过150字），在末尾添加总结句
6. 保持专业、严谨的语气
7. 直接输出润色后的文本，不要添加任何解释或说明`,

            concise: `你是一个文本精简助手。请将用户提供的文本压缩为最简洁的表达，保留所有关键信息。

要求：
1. 删除所有冗余的修饰词（非常、特别、真的、比较、相当等）
2. 删除不必要的连接词（首先、其次、此外等）
3. 合并短句，让表达更紧凑
4. 保留所有核心信息和关键数据
5. 如果原文包含多个行动项，保持列表结构
6. 直接输出精简后的文本，不要添加任何解释或说明`,

            polite: `你是一个礼貌沟通助手。请将用户提供的文本改写为礼貌、得体的表达方式。

要求：
1. 将"你"替换为"您"，将"你们"替换为"各位"
2. 将命令/要求语气改为商量/请求语气（要→希望，必须→最好）
3. 在请求类语句前添加"请/烦请"
4. 如果文本是沟通类（含"你/我"等人称），在开头添加"您好"，末尾添加"辛苦您了！"
5. 将强硬表达改为柔和表达（不行→可能不太方便）
6. 保持原意不变
7. 直接输出润色后的文本，不要添加任何解释或说明`,

            action: `你是一个行动导向助手。请将用户提供的文本整理为清晰的行动待办清单。

要求：
1. 识别文本中所有包含动作动词的句子，提取为待办事项
2. 使用编号列表（1. 2. 3.）列出每个待办事项
3. 非行动内容简要概述为"【背景】"段落
4. 每条待办事项以行动动词开头（完成、提交、发送、准备、联系、确认等）
5. 去除"我/我们"等主语，让行动更直接
6. 如果原文包含时间信息，请保留
7. 末尾添加执行呼吁（如"请尽快落实"）
8. 直接输出整理后的文本，不要添加任何解释或说明`
        };

        return prompts[style] || prompts['formal'];
    }

    /**
     * 调用混元 API 进行文本润色
     * @param {string} text - 需要润色的原始文本
     * @param {string} style - 风格：formal/concise/polite/action
     * @returns {Promise<string>} 润色后的文本
     * @throws {Error} 各类错误：网络错误、认证错误、超时错误等
     */
    async polish(text, style = 'formal') {
        if (!text || !text.trim()) {
            throw new Error('文本为空，无法润色');
        }

        if (!this.isConfigured()) {
            throw new Error('请先配置 API Key');
        }

        const systemPrompt = this.getSystemPrompt(style);

        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.apiKey
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: text }
                    ],
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // 处理 HTTP 错误
            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        throw new Error('API Key 无效，请检查后重试');
                    case 403:
                        throw new Error('API Key 权限不足，请检查 API 密钥权限');
                    case 429:
                        throw new Error('API 调用频率超限，请稍后重试');
                    case 500:
                    case 502:
                    case 503:
                        throw new Error('混元 API 服务暂时不可用，请稍后重试');
                    default:
                        throw new Error('API 请求失败（HTTP ' + response.status + '）');
                }
            }

            const data = await response.json();

            // 提取响应文本
            if (data.choices && data.choices.length > 0) {
                const content = data.choices[0].message.content;
                return content.trim();
            }

            throw new Error('API 返回数据格式异常');

        } catch (error) {
            clearTimeout(timeoutId);

            // 分类处理不同类型的错误
            if (error.name === 'AbortError') {
                throw new Error('AI 润色超时（30秒），请检查网络后重试');
            }
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络设置');
            }

            // 重新抛出我们已经处理的错误
            throw error;
        }
    }
}

// 导出模块
window.HunyuanAPI = HunyuanAPI;
