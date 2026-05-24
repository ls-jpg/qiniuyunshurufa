/**
 * 智能整理改写模块
 * 将口语文本整理成书面表达，支持智能标点和多种风格
 */
class TextRewriter {
    constructor() {
        this.originalText = '';
        this.rewrittenText = '';
        this.currentStyle = 'formal';
        
        // 口语化表达映射表
        this.oralToWritten = {
            // 语气词（删除）
            '嗯+': '',
            '啊+': '',
            '那个+': '',
            '这个+': '',
            '就是说': '',
            '那个啥': '',
            
            // 口语词替换
            '啥': '什么',
            '咋': '怎么',
            '咋地': '怎么样',
            '咋整': '怎么办',
            '呗': '',
            '呗儿': '',
            '嗯呐': '是的',
            '没准儿': '可能',
            '甭': '不用',
            '别价': '不要',
            
            // 网络用语
            '666': '很棒',
            '2333': '',
            '哈哈哈': '哈哈',
            '呵呵': '',
            
            // 重复词处理（在processText中用正则）
        };
        
        // 连接词替换
        // FIX #6：移除"然后→其次"（改变时序语义）
        this.connectorMap = {
            '还有': '此外',
            '还有呢': '另外',
            '那个': '那个',
            '的话': '',
        };
    }
    
    /**
     * 主入口：整理文本
     * @param {string} text - 原始文本
     * @param {string} style - 风格（formal/concise/polite/action）
     * @returns {string} 整理后的文本
     */
    rewrite(text, style = 'formal') {
        if (!text || !text.trim()) {
            return '';
        }
        
        this.originalText = text;
        this.currentStyle = style;
        
        // Step 1: 清理口语化内容
        let result = this.cleanOralExpression(text);
        
        // Step 2: 智能标点
        result = this.addPunctuation(result);
        
        // Step 3: 自动分段
        result = this.autoParagraph(result);
        
        // Step 4: 风格转换
        result = this.applyStyle(result, style);
        
        this.rewrittenText = result;
        return result;
    }
    
    /**
     * 清理口语化表达
     */
    cleanOralExpression(text) {
        let result = text;
        
        // 1. 删除语气词
        const fillerWords = ['嗯', '啊', '哦', '唉', '呃', '诶', '哦哟', '哎呀'];
        fillerWords.forEach(word => {
            const regex = new RegExp(`${word}+`, 'g');
            result = result.replace(regex, '');
        });
        
        // 2. 替换口语词
        Object.keys(this.oralToWritten).forEach(key => {
            if (key.includes('+')) {
                // 正则表达式（重复字符）
                const regex = new RegExp(key, 'g');
                result = result.replace(regex, this.oralToWritten[key]);
            } else {
                // 直接替换
                const regex = new RegExp(key, 'g');
                result = result.replace(regex, this.oralToWritten[key]);
            }
        });
        
        // 3. 删除重复词（如"然后然后" -> "然后"）
        result = result.replace(/(.{1,5})\1+/g, '$1');
        
        // 4. 删除冗余的"那个"、"这个"（在非重要位置）
        result = result.replace(/^(那个|这个)[，,]?/g, '');
        result = result.replace(/[，,](那个|这个)[，,]?/g, '，');
        
        // 5. 清理多余空格和标点
        result = result.replace(/\s+/g, '');
        result = result.replace(/[，,]{2,}/g, '，');
        result = result.replace(/[。]{2,}/g, '。');
        
        // 6. 规范化标点
        result = result.replace(/[,，]/g, '，');
        result = result.replace(/[。] ?/g, '。');
        
        return result.trim();
    }
    
    /**
     * 智能添加标点
     */
    addPunctuation(text) {
        let result = text;
        
        // 1. 基础标点：句末加句号
        // 如果不是以标点结尾，加句号
        if (!/[。！？；;!?]/.test(result.slice(-1))) {
            result += '。';
        }
        
        // 2. 逗号：在连接词后加逗号
        const commaWords = ['然后', '接着', '首先', '其次', '最后', '此外', '另外', '因此', '所以', '但是', '然而'];
        commaWords.forEach(word => {
            const regex = new RegExp(`(${word})(?!，|。|！|？)`, 'g');
            result = result.replace(regex, `$1，`);
        });
        
        // 3. 问号：识别疑问句
        const questionWords = ['什么', '怎么', '为什么', '哪里', '谁', '何时', '是否', '吗', '呢', '吧'];
        questionWords.forEach(word => {
            // 找到疑问词，如果后面没有问号，且句子未结束，添加问号
            const regex = new RegExp(`(${word}[^。！？]*?)(?=[，。])`, 'g');
            result = result.replace(regex, (match, p1) => {
                if (!match.includes('？')) {
                    return p1 + '？';
                }
                return match;
            });
        });
        
        // 4. 感叹号：识别感叹句
        const exclamationPatterns = [
            { pattern: /太好了/g, replacement: '太好了！' },
            { pattern: /真棒/g, replacement: '真棒！' },
            { pattern: /太棒了/g, replacement: '太棒了！' },
            { pattern: /哈哈+/g, replacement: '哈哈！' },
            { pattern: /哎呀+/g, replacement: '哎呀！' },
        ];
        exclamationPatterns.forEach(({ pattern, replacement }) => {
            result = result.replace(pattern, replacement);
        });
        
        // 5. 分号：识别并列成分
        // 简单规则：连续的逗号分隔的长句中，第二个逗号可能改为分号
        // （这里简化实现）
        
        // 6. 引号：识别引用内容
        // "xxx说/表示/认为/提到" 后面的内容加引号
        result = result.replace(/(.+?)(说|表示|认为|提到|指出) (.+?)(?=[，。])/g, 
                          (match, p1, p2, p3) => {
                              if (!p3.includes('"')) {
                                  return `${p1}${p2}"${p3}"`;
                              }
                              return match;
                          });
        
        // 7. 括号：识别注释内容
        result = result.replace(/(注|备注|说明|补充) (.+?)(?=[，。])/g, 
                          (match, p1, p2) => {
                              if (!p2.includes('（')) {
                                  return `${p1}（${p2}）`;
                              }
                              return match;
                          });
        
        // 8. 换行：在合适的位置添加换行（为分段做准备）
        // 识别"另外"、"此外"、"还有"等转折词，前面加换行
        result = result.replace(/(另外|此外|还有|另一方面)/g, '\n$1');
        
        // 识别"首先"、"其次"、"最后"等序列词，前面加换行
        result = result.replace(/(首先|其次|然后|最后)/g, '\n$1');
        
        return result;
    }
    
    /**
     * 自动分段
     */
    autoParagraph(text) {
        let result = text;
        
        // 1. 按换行符分割
        const parts = result.split('\n').filter(p => p.trim());
        
        if (parts.length <= 1) {
            // 没有自然分段，根据规则分段
            return this.smartParagraph(result);
        }
        
        // 2. 清理并重组段落
        const paragraphs = parts.map(p => p.trim()).filter(p => p);
        
        // 3. 每段不超过150字
        const finalParagraphs = [];
        paragraphs.forEach(para => {
            if (para.length > 150) {
                // 拆分长段落
                const subParas = this.splitLongParagraph(para);
                finalParagraphs.push(...subParas);
            } else {
                finalParagraphs.push(para);
            }
        });
        
        return finalParagraphs.join('\n\n');
    }
    
    /**
     * 智能分段（当没有自然分段时）
     */
    smartParagraph(text) {
        // 如果文本较短，不分段
        if (text.length < 100) {
            return text;
        }
        
        // 在合适的标点后分段
        const sentences = text.split(/(?<=[。！？；])/);
        const paragraphs = [];
        let currentPara = '';
        
        sentences.forEach(sentence => {
            if (!sentence.trim()) return;
            
            if ((currentPara + sentence).length > 150) {
                // 当前段落超过150字，分段
                if (currentPara.trim()) {
                    paragraphs.push(currentPara.trim());
                }
                currentPara = sentence;
            } else {
                currentPara += sentence;
            }
        });
        
        if (currentPara.trim()) {
            paragraphs.push(currentPara.trim());
        }
        
        return paragraphs.join('\n\n');
    }
    
    /**
     * 拆分长段落
     */
    splitLongParagraph(paragraph) {
        const sentences = paragraph.split(/(?<=[，；])/);
        const result = [];
        let current = '';
        
        sentences.forEach(sentence => {
            if ((current + sentence).length > 150) {
                if (current.trim()) {
                    result.push(current.trim());
                }
                current = sentence;
            } else {
                current += sentence;
            }
        });
        
        if (current.trim()) {
            result.push(current.trim());
        }
        
        return result;
    }
    
    /**
     * 应用风格转换
     */
    applyStyle(text, style) {
        switch(style) {
            case 'formal':
                return this.formalStyle(text);
            case 'concise':
                return this.conciseStyle(text);
            case 'polite':
                return this.politeStyle(text);
            case 'action':
                return this.actionStyle(text);
            default:
                return text;
        }
    }
    
    /**
     * 正式风格
     *
     * 设计思路：
     *   1. 段落间添加"首先/其次/此外/最后"等过渡词，营造逻辑层次
     *   2. 升级连接词为书面表达（但是→然而，所以→因此，而且→并且）
     *   3. 较长文本末尾补上"综上所述"收束全文
     *   4. 不使用单字替换，避免破坏词内语义
     */
    formalStyle(text) {
        let result = text;
        
        // 1. 段落间添加过渡词（仅对分段的文本生效）
        const paragraphs = result.split('\n\n');
        if (paragraphs.length >= 2) {
            const transitions = ['首先，', '其次，', '此外，', '最后，'];
            result = paragraphs.map((p, i) => {
                let trimmed = p.trim();
                if (!trimmed) return trimmed;
                if (i < transitions.length && trimmed.length > 8 &&
                    !/^(首先|其次|此外|最后|另外|同时|综上)/.test(trimmed)) {
                    trimmed = transitions[i] + trimmed;
                }
                return trimmed;
            }).join('\n\n');
        }
        
        // 2. 升级连接词为书面表达（全部是多字匹配，安全）
        result = result.replace(/但是/g, '然而');
        result = result.replace(/可是/g, '不过');
        result = result.replace(/所以/g, '因此');
        result = result.replace(/而且/g, '并且');
        result = result.replace(/还有/g, '此外');
        
        // 3. 长文本末尾补收束句
        if (result.length > 150) {
            const last30 = result.slice(-30);
            if (!/综上|总之|总体|概括/.test(last30)) {
                result = result.replace(/[。！？]$/, '。综上所述，以上为相关情况汇总。');
            }
        }
        
        return result;
    }
    
    /**
     * 简洁风格
     *
     * 设计思路：
     *   1. 按句号切分，逐句压缩：去掉修饰词，保留核心主干
     *   2. 如果内容包含明显行动项，尝试转为编号列表
     *   3. 删除因果/转折连接词，让句子更直接
     */
    conciseStyle(text) {
        let result = text;
        
        // 1. 删除过度修饰
        const modifiers = ['非常', '特别', '真的', '比较', '相当', '十分', '极其', '很'];
        modifiers.forEach(w => {
            result = result.replace(new RegExp(w, 'g'), '');
        });
        
        // 2. 精简连接词
        result = result.replace(/首先，/g, '');
        result = result.replace(/其次，/g, '');
        result = result.replace(/此外，/g, '');
        result = result.replace(/最后，/g, '');
        result = result.replace(/另外，/g, '');
        result = result.replace(/总而言之，?/g, '');
        result = result.replace(/综上所述，?/g, '');
        result = result.replace(/也就是说，?/g, '');
        result = result.replace(/换句话说，?/g, '');
        
        // 3. 压缩重复表达
        result = result.replace(/(.{2,8})\1+/g, '$1');
        
        // 4. 合并连续短句
        result = result.replace(/。\s*([^。]{1,15})。/g, (match, short) => {
            return '，' + short.trim() + '。';
        });
        
        // 5. 清理多余标点和空白
        result = result.replace(/[，,]{2,}/g, '，');
        result = result.replace(/[。]{2,}/g, '。');
        result = result.replace(/\s+/g, '');
        
        return result.trim();
    }
    
    /**
     * 礼貌风格
     *
     * 设计思路：
     *   1. 人称敬语：你→您，你们→各位
     *   2. 命令/要求→请示/商量语气：要→想/希望，必须→最好
     *   3. 请求前加"请/烦请/劳驾"
     *   4. 仅当文本是沟通类（含"你/我"等人称）时，才加开头问候和结尾感谢
     *   5. 不机械地给所有文本加"您好"/"谢谢"
     */
    politeStyle(text) {
        let result = text;
        
        // 判断是否为沟通类文本（含人称代词或请求语气）
        const isCommunication = /[你您我我们]|请|麻烦|帮|问|通知|告诉/.test(result);
        
        // 1. 人称敬语
        if (!result.includes('您')) {
            result = result.replace(/你/g, '您');
        }
        result = result.replace(/你们/g, '各位');
        
        // 2. 柔和化命令/要求 → 商量语气
        //    仅替换独立出现的"要/必须/一定"，不处理"重要/需要/必要"等词组
        result = result.replace(/要(?=[做去拿买发安排处理改])/g, '想');
        result = result.replace(/必须/g, '最好');
        result = result.replace(/一定要/g, '希望能');
        result = result.replace(/不行/g, '可能不太方便');
        result = result.replace(/不知道/g, '还不太确定');
        
        // 3. 请求句前补"请"（已有则不重复）
        const verbsNeedPlease = /(帮|协助|处理|安排|确认|审核|审批|批准|回复|告知|通知|提供|提交)/;
        if (!result.includes('请') && verbsNeedPlease.test(result)) {
            result = result.replace(verbsNeedPlease, '请$&');
        }
        
        // 4. 沟通类文本：补问候头和感谢尾（逐段检查避免重复）
        if (isCommunication) {
            const firstPara = result.split('\n\n')[0] || result.split('\n')[0] || result;
            const hasGreeting = /您好|你好|各位好|早上好|下午好|晚上好|打扰|冒昧/.test(firstPara);
            if (!hasGreeting) {
                result = '您好，' + result;
            }
            
            const lastChar = result.slice(-1);
            if (/[。！？]/.test(lastChar) && !/谢谢|感谢|辛苦|麻烦/.test(result.slice(-15))) {
                result = result.replace(/[。！？]$/, '。辛苦您了！');
            }
        }
        
        // 5. 疑问句补齐"？"并加商量后缀（避免重复加）
        const endsWith商量 = /可以?吗[？?]?$/.test(result);
        if (/[吗呢吧][。]$/.test(result) && !endsWith商量) {
            result = result.replace(/([吗呢吧])。/g, '$1？');
        }
        
        return result;
    }
    
    /**
     * 行动导向风格
     *
     * 设计思路：
     *   1. 识别包含动作动词的句子，提取为待办事项
     *   2. 动作项编号列出，每条一行；非动作内容简述为上下文
     *   3. 不再做"动词前移"（会生成乱序病句）
     *   4. 有行动项时末尾补时间锚点
     */
    actionStyle(text) {
        const actionVerbs = ['完成', '提交', '发送', '准备', '联系', '确认', '执行', '实施', '安排',
                             '处理', '跟进', '协调', '采购', '招聘', '审批', '修改', '发布', '测试'];
        
        // 按句号切分，分类为"行动句"和"上下文句"
        const rawSentences = text.split(/(?<=[。！？])/);
        const actionItems = [];
        const contextSentences = [];
        
        rawSentences.forEach(s => {
            const trimmed = s.trim();
            if (!trimmed) return;
            
            const hasActionVerb = actionVerbs.some(v => trimmed.includes(v));
            if (hasActionVerb) {
                actionItems.push(trimmed);
            } else {
                contextSentences.push(trimmed);
            }
        });
        
        // 构建输出
        const parts = [];
        
        // 上下文简述（压缩为一两句）
        if (contextSentences.length > 0) {
            let context = contextSentences.join('').replace(/[，,]{2,}/g, '，');
            // 删掉过长的上下文，只保留前80字
            if (context.length > 80) {
                context = context.substring(0, 80) + '…。';
            }
            parts.push('【背景】' + context);
        }
        
        // 行动项编号
        if (actionItems.length > 0) {
            parts.push('【待办事项】');
            actionItems.forEach((item, idx) => {
                // 去掉"我/我们"开头，让行动更直接
                let cleaned = item.replace(/^(我|我们|咱们)/, '').trim();
                // 确保以行动动词结尾
                parts.push(`${idx + 1}. ${cleaned}`);
            });
        }
        
        // 无行动项时返回原文简述
        if (actionItems.length === 0) {
            return text;
        }
        
        let result = parts.join('\n');
        
        // 末尾加时间锚点
        result = result.replace(/[。！？]$/, '。');
        result += '\n请尽快落实。';
        
        return result;
    }
    
    /**
     * 获取原文
     */
    getOriginal() {
        return this.originalText;
    }
    
    /**
     * 获取整理稿
     */
    getRewritten() {
        return this.rewrittenText;
    }
    
    /**
     * 获取当前风格
     */
    getCurrentStyle() {
        return this.currentStyle;
    }
}

// 导出模块
window.TextRewriter = TextRewriter;
