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
        this.connectorMap = {
            '然后': '其次',
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
     */
    formalStyle(text) {
        let result = text;
        
        // 1. 替换口语词为书面语
        const formalMap = {
            '咋': '怎么',
            '啥': '什么',
            '咋地': '怎么样',
            '没准儿': '可能',
            '甭': '不用',
            '然后': '其次',
            '还有': '此外',
            '那个': '',
            '的话': '',
        };
        
        Object.keys(formalMap).forEach(key => {
            const regex = new RegExp(key, 'g');
            result = result.replace(regex, formalMap[key]);
        });
        
        // 2. 补充完整句子（简单实现）
        // 如果句子以"因为"、"由于"开头，确保有"所以"
        if (result.includes('因为') && !result.includes('所以')) {
            result = result.replace(/因为(.+?)。/g, '因为$1，所以。');
        }
        
        // 3. 使用更正式的词汇
        result = result.replace(/用/g, '使用');
        result = result.replace(/买/g, '购买');
        result = result.replace(/看/g, '查看');
        
        // 4. 添加书面语连接词
        result = result.replace(/但是/g, '然而');
        result = result.replace(/所以/g, '因此');
        
        return result;
    }
    
    /**
     * 简洁风格
     */
    conciseStyle(text) {
        let result = text;
        
        // 1. 删除语气词和冗余词
        const redundantWords = ['嗯', '啊', '哦', '那个', '这个', '就是说', '的话'];
        redundantWords.forEach(word => {
            result = result.replace(new RegExp(word, 'g'), '');
        });
        
        // 2. 删除重复内容
        result = result.replace(/(.{1,10})\1+/g, '$1');
        
        // 3. 简化连接词
        result = result.replace(/首先，/g, '');
        result = result.replace(/其次，/g, '');
        result = result.replace(/最后，/g, '');
        
        // 4. 删除不必要的修饰词
        result = result.replace(/非常/g, '');
        result = result.replace(/特别/g, '');
        result = result.replace(/真的/g, '');
        
        // 5. 合并短句
        result = result.replace(/。([^。]{0,10}?)，/g, '，$1。');
        
        // 6. 清理多余标点
        result = result.replace(/[，,]{2,}/g, '，');
        result = result.replace(/\s+/g, '');
        
        return result.trim();
    }
    
    /**
     * 礼貌风格
     */
    politeStyle(text) {
        let result = text;
        
        // 1. 添加敬语
        result = result.replace(/你/g, '您');
        result = result.replace(/你们/g, '您们');
        
        // 2. 委婉表达
        const politeMap = {
            '不行': '可能不太方便',
            '不知道': '不太了解',
            '不行吗': '是否可以考虑',
            '必须': '建议',
            '一定要': '最好',
        };
        
        Object.keys(politeMap).forEach(key => {
            const regex = new RegExp(key, 'g');
            result = result.replace(regex, politeMap[key]);
        });
        
        // 3. 添加礼貌开头
        if (!result.startsWith('您好') && !result.startsWith('尊敬的')) {
            result = '您好，' + result;
        }
        
        // 4. 添加礼貌结尾
        if (!result.endsWith('谢谢') && !result.endsWith('感谢')) {
            result = result.replace(/[。！？]$/, '。谢谢！');
        }
        
        // 5. 使用委婉语气词
        result = result.replace(/吧$/g, '吧，可以吗？');
        result = result.replace(/吗$/g, '吗？');
        
        // 6. 添加"请"字
        if (result.includes('您') && !result.includes('请')) {
            result = result.replace(/您(.+?)(?=[，。])/, '请您$1');
        }
        
        return result;
    }
    
    /**
     * 行动导向风格
     */
    actionStyle(text) {
        let result = text;
        
        // 1. 识别行动词并添加标记
        const actionWords = ['做', '完成', '提交', '发送', '准备', '联系', '确认', '执行', '实施', '安排'];
        let actionCount = 0;
        
        actionWords.forEach(word => {
            const regex = new RegExp(`(.*?)${word}(.+?)(?=[，。])`, 'g');
            result = result.replace(regex, (match, p1, p2) => {
                if (!match.includes('【行动】')) {
                    actionCount++;
                    return `【行动${actionCount}】${p1}${word}${p2}`;
                }
                return match;
            });
        });
        
        // 2. 添加序号（如果有多个行动项）
        if (actionCount > 1) {
            for (let i = actionCount; i >= 1; i--) {
                result = result.replace(`【行动${i}】`, `${i}. `);
            }
        } else {
            result = result.replace(/【行动\d+】/g, '• ');
        }
        
        // 3. 使用动词开头
        const sentences = result.split(/(?<=[。！？])/);
        const processed = sentences.map(sentence => {
            sentence = sentence.trim();
            if (!sentence) return '';
            
            // 如果句子不是以动词开头，尝试调整
            const actionVerbs = ['完成', '提交', '发送', '准备', '联系', '确认', '执行', '安排', '做'];
            const hasVerb = actionVerbs.some(verb => sentence.includes(verb));
            
            if (hasVerb && !actionVerbs.some(verb => sentence.startsWith(verb))) {
                // 调整语序，把动词放到前面（简化实现）
                actionVerbs.forEach(verb => {
                    if (sentence.includes(verb)) {
                        const index = sentence.indexOf(verb);
                        const before = sentence.substring(0, index);
                        const after = sentence.substring(index);
                        sentence = after + before;
                    }
                });
            }
            
            return sentence;
        });
        
        result = processed.join('');
        
        // 4. 添加行动呼吁
        if (!result.includes('请') && !result.includes('建议')) {
            result = result.replace(/[。！？]$/, '。建议尽快执行。');
        }
        
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
