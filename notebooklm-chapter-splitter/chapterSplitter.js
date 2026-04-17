// chapterSplitter.js - 章节拆分模块

// 全局配置
const CONFIG = {
  maxChapterLength: 50000, // 最大章节长度（字符数）
  minChapterLength: 100,   // 最小章节长度（字符数）
  defaultChapterSize: 10000 // 默认拆分大小
};

// 按固定长度拆分文本
function splitByLength(text, maxLength = CONFIG.maxChapterLength) {
  const chapters = [];
  let currentChapter = '';
  let chapterNumber = 1;

  const paragraphs = text.split(/\n\n+/);

  paragraphs.forEach(paragraph => {
    if ((currentChapter.length + paragraph.length) > maxLength && currentChapter.length > 0) {
      chapters.push({
        title: `章节 ${chapterNumber}`,
        content: currentChapter.trim()
      });
      chapterNumber++;
      currentChapter = paragraph;
    } else {
      currentChapter += (currentChapter ? '\n\n' : '') + paragraph;
    }
  });

  // 添加最后一个章节
  if (currentChapter.trim()) {
    chapters.push({
      title: `章节 ${chapterNumber}`,
      content: currentChapter.trim()
    });
  }

  return chapters;
}

// 按段落拆分（保持段落完整性）
function splitByParagraphs(text, paragraphsPerChapter = 50) {
  const chapters = [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
    const chapterParagraphs = paragraphs.slice(i, i + paragraphsPerChapter);
    const content = chapterParagraphs.join('\n\n');
    const chapterNumber = Math.floor(i / paragraphsPerChapter) + 1;

    chapters.push({
      title: `章节 ${chapterNumber}`,
      content: content.trim()
    });
  }

  return chapters;
}

// 智能拆分（尝试识别段落和句子边界）
function splitIntelligently(text, targetLength = CONFIG.defaultChapterSize) {
  const chapters = [];
  let currentChapter = '';
  let chapterNumber = 1;
  let position = 0;

  const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g) || [text];

  sentences.forEach(sentence => {
    const sentenceLength = sentence.trim().length;

    // 如果单个句子超过最大长度，强制分割
    if (sentenceLength > CONFIG.maxChapterLength) {
      if (currentChapter.trim()) {
        chapters.push({
          title: `章节 ${chapterNumber}`,
          content: currentChapter.trim()
        });
        chapterNumber++;
        currentChapter = '';
      }

      // 将长句子分割成多个章节
      let remaining = sentence;
      while (remaining.length > CONFIG.maxChapterLength) {
        chapters.push({
          title: `章节 ${chapterNumber}`,
          content: remaining.substring(0, CONFIG.maxChapterLength).trim()
        });
        chapterNumber++;
        remaining = remaining.substring(CONFIG.maxChapterLength);
      }
      currentChapter = remaining;
    } else if ((currentChapter.length + sentenceLength) > CONFIG.maxChapterLength && currentChapter.length > 0) {
      // 当前章节已满，开始新章节
      chapters.push({
        title: `章节 ${chapterNumber}`,
        content: currentChapter.trim()
      });
      chapterNumber++;
      currentChapter = sentence;
    } else {
      // 添加到当前章节
      currentChapter += (currentChapter ? ' ' : '') + sentence.trim();
    }
  });

  // 添加最后一个章节
  if (currentChapter.trim()) {
    chapters.push({
      title: `章节 ${chapterNumber}`,
      content: currentChapter.trim()
    });
  }

  return chapters;
}

// 清理章节内容
function cleanChapterContent(content) {
  return content
    .replace(/\r\n/g, '\n')           // 统一换行符
    .replace(/\n{3,}/g, '\n\n')      // 最多保留两个连续换行
    .replace(/[ \t]+/g, ' ')          // 合并空格和制表符
    .replace(/^\s+|\s+$/gm, '')      // 去除每行首尾空白
    .trim();
}

// 为章节添加标题编号
function addChapterNumbers(chapters) {
  return chapters.map((chapter, index) => ({
    ...chapter,
    title: `${index + 1}. ${chapter.title}`,
    originalTitle: chapter.title
  }));
}

// 过滤空章节和过短章节
function filterChapters(chapters, minLength = CONFIG.minChapterLength) {
  return chapters.filter(chapter =>
    chapter.content && chapter.content.trim().length >= minLength
  );
}

// 合并相邻的短章节
function mergeShortChapters(chapters, minLength = CONFIG.minChapterLength * 2) {
  const merged = [];
  let currentChapter = null;

  chapters.forEach(chapter => {
    if (!currentChapter) {
      currentChapter = { ...chapter };
    } else if (currentChapter.content.length < minLength) {
      // 合并到当前章节
      currentChapter.content += '\n\n' + chapter.content;
      currentChapter.title += ' & ' + chapter.title;
    } else {
      // 保存当前章节，开始新章节
      merged.push(currentChapter);
      currentChapter = { ...chapter };
    }
  });

  if (currentChapter) {
    merged.push(currentChapter);
  }

  return merged;
}

// 主要的拆分函数
function splitChapters(text, options = {}) {
  const {
    mode = 'auto',        // auto, length, paragraphs, intelligent
    maxLength = CONFIG.maxChapterLength,
    paragraphsPerChapter = 50,
    autoDetect = true,
    includeNumbers = false
  } = options;

  let chapters = [];

  // 首先尝试自动检测章节
  if (autoDetect && mode === 'auto') {
    // 这个函数在 fileParser.js 中定义
    if (typeof detectChapters === 'function') {
      chapters = detectChapters(text);
    }
  }

  // 如果没有检测到章节或只有一个大章节，进行拆分
  if (chapters.length <= 1 || (chapters.length === 1 && chapters[0].content.length > maxLength)) {
    const contentToSplit = chapters.length > 0 ? chapters[0].content : text;

    switch (mode) {
      case 'length':
        chapters = splitByLength(contentToSplit, maxLength);
        break;
      case 'paragraphs':
        chapters = splitByParagraphs(contentToSplit, paragraphsPerChapter);
        break;
      case 'intelligent':
        chapters = splitIntelligently(contentToSplit, maxLength);
        break;
      default:
        // 默认使用智能拆分
        chapters = splitIntelligently(contentToSplit, maxLength);
    }
  }

  // 清理章节内容
  chapters = chapters.map(chapter => ({
    ...chapter,
    content: cleanChapterContent(chapter.content)
  }));

  // 过滤过短的章节
  chapters = filterChapters(chapters);

  // 合并短章节
  chapters = mergeShortChapters(chapters);

  // 添加章节编号
  if (includeNumbers) {
    chapters = addChapterNumbers(chapters);
  }

  return chapters;
}

// 导出到全局作用域（供 popup.js 使用）
if (typeof window !== 'undefined') {
  window.splitChapters = splitChapters;
  window.splitByLength = splitByLength;
  window.splitByParagraphs = splitByParagraphs;
  window.splitIntelligently = splitIntelligently;
}
