// 翻译服务模块 - 提供中文到英文的翻译功能
// 使用免费的Google Translate API（无需API密钥）

(function () {
    'use strict';

    // 翻译缓存，避免重复翻译相同内容
    const translationCache = new Map();
    const MAX_CACHE_SIZE = 500;

    /**
     * 使用Google Translate免费接口进行翻译
     * @param {string} text - 要翻译的中文文本
     * @param {string} targetLang - 目标语言代码（默认：'en'）
     * @returns {Promise<string>} 翻译结果
     */
    async function translateText(text, targetLang = 'en') {
        // 检查缓存
        const cacheKey = `${text}_${targetLang}`;
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey);
        }

        // 如果文本为空或不是中文，直接返回
        if (!text || !/[\u4e00-\u9fa5]/.test(text)) {
            return '';
        }

        try {
            // 方法1：使用Google Translate的免费API端点
            // 注意：这个API有使用限制，但不需要API密钥
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`翻译API返回错误: ${response.status}`);
            }

            const data = await response.json();

            // Google Translate API返回格式: [[["翻译结果", ...], ...], ...]
            let translatedText = '';
            if (data && data[0] && Array.isArray(data[0])) {
                translatedText = data[0]
                    .map(item => item[0])
                    .filter(Boolean)
                    .join('');
            }

            // 如果翻译成功，存入缓存
            if (translatedText) {
                // 限制缓存大小
                if (translationCache.size >= MAX_CACHE_SIZE) {
                    const firstKey = translationCache.keys().next().value;
                    translationCache.delete(firstKey);
                }
                translationCache.set(cacheKey, translatedText);
                return translatedText;
            }

            return '';
        } catch (error) {
            console.warn('翻译失败，尝试备用方案:', error);

            // 备用方案：使用简单的词汇表（常用词翻译）
            return getSimpleTranslation(text);
        }
    }

    /**
     * 简单的词汇表翻译（备用方案）
     * @param {string} text - 中文文本
     * @returns {string} 英文翻译
     */
    function getSimpleTranslation(text) {
        // 常用中文词汇的英文翻译（作为备用）
        const commonTranslations = {
            '你好': 'Hello',
            '谢谢': 'Thank you',
            '对不起': 'Sorry',
            '再见': 'Goodbye',
            '是的': 'Yes',
            '不是': 'No',
            '学习': 'Study',
            '工作': 'Work',
            '学校': 'School',
            '老师': 'Teacher',
            '学生': 'Student',
            '朋友': 'Friend',
            '家人': 'Family',
            '中国': 'China',
            '北京': 'Beijing',
            '上海': 'Shanghai',
            '今天': 'Today',
            '明天': 'Tomorrow',
            '昨天': 'Yesterday',
            '早上': 'Morning',
            '下午': 'Afternoon',
            '晚上': 'Evening',
            '吃饭': 'Eat',
            '喝水': 'Drink water',
            '睡觉': 'Sleep',
            '起床': 'Get up',
            '去': 'Go',
            '来': 'Come',
            '看': 'Look',
            '听': 'Listen',
            '说': 'Speak',
            '读': 'Read',
            '写': 'Write',
            '大': 'Big',
            '小': 'Small',
            '好': 'Good',
            '坏': 'Bad',
            '新': 'New',
            '旧': 'Old',
            '快': 'Fast',
            '慢': 'Slow',
            '多': 'Many',
            '少': 'Few',
            '一': 'One',
            '二': 'Two',
            '三': 'Three',
            '四': 'Four',
            '五': 'Five',
            '六': 'Six',
            '七': 'Seven',
            '八': 'Eight',
            '九': 'Nine',
            '十': 'Ten',
        };

        // 尝试完整匹配
        if (commonTranslations[text]) {
            return commonTranslations[text];
        }

        // 尝试逐字翻译（简单拼接）
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (commonTranslations[char]) {
                result += commonTranslations[char] + ' ';
            }
        }

        return result.trim() || '';
    }

    /**
     * 批量翻译（优化性能）
     * @param {string[]} texts - 要翻译的文本数组
     * @param {string} targetLang - 目标语言
     * @returns {Promise<string[]>} 翻译结果数组
     */
    async function translateBatch(texts, targetLang = 'en') {
        const results = await Promise.all(
            texts.map(text => translateText(text, targetLang))
        );
        return results;
    }

    // 导出API
    window.Translator = {
        translateText,
        translateBatch,
        getSimpleTranslation,
        clearCache: () => translationCache.clear()
    };
})();

