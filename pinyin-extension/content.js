// 内容脚本 - 监听中文输入并自动添加拼音和英文翻译
// 支持普通输入框、可编辑元素和PDF注释
// 优化版本：专为外国人学习中文设计

(function () {
  'use strict';

  // 配置
  const CONFIG = {
    debounceTime: 600, // 等待输入完成的时间
    colors: {
      pinyin: '#2196F3', // 拼音颜色 (蓝色)
      translation: '#4CAF50' // 翻译颜色 (绿色)
    }
  };

  let isEnabled = true;
  let showPinyin = true;
  let showTranslation = true;
  let processingMap = new WeakMap(); // 防止重复处理

  // 加载设置
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['pinyinEnabled', 'showPinyin', 'showTranslation']);
      isEnabled = result.pinyinEnabled !== false;
      showPinyin = result.showPinyin !== false;
      showTranslation = result.showTranslation !== false;
    } catch (e) {
      console.warn('读取设置失败', e);
    }
  }

  // 生成补充文本
  async function generateSupplement(text) {
    if (!text || !/[\u4e00-\u9fa5]/.test(text)) return null;

    let parts = [];

    // 获取拼音
    if (showPinyin && window.PinyinConverter) {
      try {
        const pinyin = window.PinyinConverter.getPinyin(text);
        if (pinyin && pinyin !== text) {
          parts.push(`(${pinyin})`);
        }
      } catch (e) {
        console.warn('拼音生成失败', e);
      }
    }

    // 获取翻译
    if (showTranslation && window.Translator) {
      try {
        const trans = await window.Translator.translateText(text);
        if (trans) {
          parts.push(`[${trans}]`);
        }
      } catch (e) {
        console.warn('翻译失败', e);
      }
    }

    if (parts.length === 0) return null;
    return ' ' + parts.join(' ');
  }

  // 插入文本到 Input/Textarea (保留撤销历史)
  function insertToInput(input, text) {
    // 检查是否已经添加了后缀 (简单的防重复)
    const val = input.value;
    const start = input.selectionStart;

    // 如果光标前的字符加上刚输入的内容已经有了后缀，则不添加
    // 这里做个简单的防抖：如果最后几个字符正好是 text，就不加了
    const beforeCursor = val.slice(0, start);
    if (beforeCursor.endsWith(text)) {
      return;
    }

    if (typeof input.setRangeText === 'function') {
      input.setRangeText(text, start, start, 'end');
      // 触发 input 事件以通知框架 (React/Vue等)
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // 降级处理
      input.value = val.slice(0, start) + text + val.slice(start);
      // 恢复光标到插入文本之后
      input.selectionStart = input.selectionEnd = start + text.length;
    }
  }

  // 插入文本到 ContentEditable (HTML)
  function insertToContentEditable(element, text) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // 防重复检查：检查光标位置前后的文本
    const range = selection.getRangeAt(0);
    // 这里比较难精确防重复，因为涉及DOM结构。
    // 暂时略过严格防重，依赖 debounce 和 input diff。

    // 创建带样式的节点
    const container = document.createElement('span');
    container.className = 'learning-supplement';
    container.contentEditable = 'false'; // 防止用户意外修改内部
    container.style.color = '#666';
    container.style.fontSize = '0.9em';
    container.style.marginLeft = '4px';
    container.style.userSelect = 'none'; // 避免被选中复制，如果用户不想要

    // 分离拼音和翻译以应用不同颜色
    // text 格式如 " (pinyin) [trans]"

    const pinyinMatch = text.match(/\((.*?)\)/);
    const transMatch = text.match(/\[(.*?)\]/);

    if (pinyinMatch) {
      const pSpan = document.createElement('span');
      pSpan.style.color = CONFIG.colors.pinyin;
      pSpan.textContent = `(${pinyinMatch[1]}) `;
      container.appendChild(pSpan);
    }

    if (transMatch) {
      const tSpan = document.createElement('span');
      tSpan.style.color = CONFIG.colors.translation;
      tSpan.textContent = `[${transMatch[1]}]`;
      container.appendChild(tSpan);
    }

    if (!pinyinMatch && !transMatch) {
      container.textContent = text;
    }

    range.insertNode(container);
    range.collapse(false);

    // 移动光标到后面，并插入一个空格以恢复正常打字
    // 使用零宽空格有时候会导致光标无法移动，使用普通空格更安全
    const space = document.createTextNode('\u00A0');
    range.insertNode(space);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  // 监听器处理函数
  function attachListener(element) {
    if (processingMap.has(element)) return;
    processingMap.set(element, true);

    let isComposing = false;
    let lastValue = element.value || element.textContent || '';
    let debounceTimer = null;

    element.addEventListener('compositionstart', () => {
      isComposing = true;
    });

    element.addEventListener('compositionend', (e) => {
      isComposing = false;
      handleInput(e); // 组合结束时处理
    });

    element.addEventListener('input', (e) => {
      if (isComposing) return;
      handleInput(e);
    });

    async function handleInput(e) {
      await loadSettings();
      if (!isEnabled) return;

      const currentValue = element.value || element.textContent || '';

      // 简单判断：长度增加且包含中文
      // 注意：如果用户删除了字符，currentValue.length < lastValue.length，我们不处理
      if (currentValue.length <= lastValue.length && e.inputType !== 'insertText') {
        // 除非是替换操作？暂时只处理增加
        lastValue = currentValue;
        return;
      }

      // 获取新增/变更的内容
      // e.data 在 input 事件中通常是刚输入的字符 (非 IME)
      // 在 compositionend 中是完整的 IME 词组
      let addedText = e.data;

      // 如果 e.data 为 null (例如粘贴)，尝试手动 diff
      if (!addedText && currentValue.length > lastValue.length) {
        addedText = currentValue.slice(lastValue.length); // 粗略估计
      }

      if (!addedText || !/[\u4e00-\u9fa5]/.test(addedText)) {
        lastValue = currentValue;
        return;
      }

      // 防抖处理，避免频繁请求
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        // 二次检查：确保内容没被删除
        const nowValue = element.value || element.textContent || '';
        if (nowValue.length < currentValue.length) {
          lastValue = nowValue;
          return;
        }

        const supplement = await generateSupplement(addedText);
        if (!supplement) return;

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          insertToInput(element, supplement);
        } else if (element.isContentEditable) {
          insertToContentEditable(element, supplement);
        }

        // 更新 lastValue
        lastValue = element.value || element.textContent || '';
      }, CONFIG.debounceTime);
    }
  }

  // 初始化观察者
  function init() {
    loadSettings();

    // 静态绑定
    const selector = 'input[type="text"], input[type="search"], textarea, [contenteditable="true"]';
    document.querySelectorAll(selector).forEach(attachListener);

    // 动态观察
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches(selector)) attachListener(node);
            if (node.querySelectorAll) {
              node.querySelectorAll(selector).forEach(attachListener);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 定期检查（针对PDF Viewer的 shadow dom 或 动态层）
    setInterval(() => {
      document.querySelectorAll(selector).forEach(attachListener);
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
