// 拼音转换库 - 封装 pinyin-pro
(function () {
  'use strict';

  // 检查全局对象
  function getPinyinLib() {
    return window.pinyinPro || window.pinyin;
  }

  // 获取拼音（带声调）
  function getPinyin(text) {
    const lib = getPinyinLib();
    if (lib) {
      try {
        // format: symbol (声调符号), number (数字声调), none (无声调)
        if (typeof lib.pinyin === 'function') {
          return lib.pinyin(text, { toneType: 'symbol', type: 'string' });
        }
        if (typeof lib === 'function') {
          return lib(text, { toneType: 'symbol' });
        }
      } catch (e) {
        console.warn('拼音转换出错:', e);
      }
    }
    return text; // 降级：返回原文
  }

  // 导出API
  window.PinyinConverter = {
    getPinyin
  };
})();
