// fileParser.js - 文件解析模块

async function loadPDFJS() {
  if (typeof pdfjsLib !== 'undefined') return;

  const script = document.createElement('script');
  script.src = 'libs/pdf.min.js';

  await new Promise((resolve, reject) => {
    script.onload = () => {
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
        resolve();
      } else {
        reject(new Error('PDF.js 加载失败'));
      }
    };
    script.onerror = () => reject(new Error('无法加载 PDF.js，请确保扩展文件完整'));
    document.head.appendChild(script);
  });
}

async function loadJSZip() {
  if (typeof JSZip !== 'undefined') return;

  const script = document.createElement('script');
  script.src = 'libs/jszip.min.js';

  await new Promise((resolve, reject) => {
    script.onload = () => {
      if (typeof JSZip !== 'undefined') {
        resolve();
      } else {
        reject(new Error('JSZip 加载失败'));
      }
    };
    script.onerror = () => reject(new Error('无法加载 JSZip，请确保扩展文件完整'));
    document.head.appendChild(script);
  });
}

// 解析 PDF 文件
async function parsePDF(file) {
  await loadPDFJS();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  // 提取所有页面的文本
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  // 检测章节
  return detectChapters(fullText);
}

// 解析 EPUB 文件
async function parseEPUB(file) {
  await loadJSZip();

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 查找 OPF 文件
  let opfContent = null;
  let opfPath = '';

  for (const filename in zip.files) {
    if (filename.endsWith('.opf')) {
      opfPath = filename.substring(0, filename.lastIndexOf('/') + 1);
      opfContent = await zip.files[filename].async('text');
      break;
    }
  }

  if (!opfContent) {
    throw new Error('无法找到 EPUB 的 OPF 文件');
  }

  // 解析 OPF 获取章节列表
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfContent, 'text/xml');
  const manifestItems = opfDoc.querySelectorAll('manifest item');
  const spineItems = opfDoc.querySelectorAll('spine itemref');

  const chapters = [];
  let chapterIndex = 1;

  // 按 spine 顺序读取章节
  for (const spineItem of spineItems) {
    const idref = spineItem.getAttribute('idref');
    const manifestItem = Array.from(manifestItems).find(item => item.getAttribute('id') === idref);

    if (manifestItem) {
      const href = manifestItem.getAttribute('href');
      const filePath = opfPath + href;

      if (zip.files[filePath]) {
        const content = await zip.files[filePath].async('text');
        const htmlDoc = parser.parseFromString(content, 'text/html');
        const text = htmlDoc.body.textContent || htmlDoc.body.innerText || '';

        // 尝试提取章节标题
        const titleElement = htmlDoc.querySelector('h1, h2, .chapter-title, [class*="chapter"]');
        let title = titleElement ? titleElement.textContent.trim() : `章节 ${chapterIndex}`;

        if (text.trim()) {
          chapters.push({
            title: title,
            content: text.trim()
          });
          chapterIndex++;
        }
      }
    }
  }

  return chapters.length > 0 ? chapters : detectChapters(chapters.map(c => c.content).join('\n\n'));
}

// 解析 MOBI 文件
async function parseMOBI(file) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // MOBI 格式较复杂，这里提供基础实现
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let text = '';

  // 尝试查找 HTML 内容
  for (let i = 0; i < uint8Array.length - 100; i++) {
    const chunk = decoder.decode(uint8Array.slice(i, i + 100));
    if (chunk.includes('<html') || chunk.includes('<body')) {
      let htmlStart = i;
      while (htmlStart > 0 && uint8Array[htmlStart] !== 0x3C) htmlStart--;

      const remaining = uint8Array.slice(htmlStart);
      text = decoder.decode(remaining);
      break;
    }
  }

  if (!text || text.trim().length < 100) {
    // 如果无法解析，尝试直接解码
    text = decoder.decode(uint8Array);
    text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
  }

  if (!text || text.trim().length < 100) {
    throw new Error('无法从 MOBI 文件中提取内容。建议先转换为 EPUB 或 PDF 格式。');
  }

  return detectChapters(text);
}

// 检测章节
function detectChapters(text) {
  const chapters = [];

  // 章节检测模式（按优先级排序）
  const patterns = [
    /^第[零一二三四五六七八九十百千\d]+章[：:\s]*(.+)?$/m,
    /^第\d+章[：:\s]*(.+)?$/m,
    /^Chapter\s+\d+[：:\s]*(.+)?$/im,
    /^[IVX]+\.\s*(.+)?$/m,
    /^(#{1,3})\s+(.+)$/m
  ];

  const lines = text.split('\n');
  const chapterStarts = [];

  // 查找所有章节标题
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        chapterStarts.push({
          index: i,
          title: (match[1] || match[0]).trim(),
          fullMatch: match[0]
        });
        break;
      }
    }
  }

  // 如果没有找到章节，将整个文本作为一个章节
  if (chapterStarts.length === 0) {
    return [{
      title: '完整内容',
      content: text.trim()
    }];
  }

  // 根据章节标题拆分内容
  for (let i = 0; i < chapterStarts.length; i++) {
    const start = chapterStarts[i];
    const end = i < chapterStarts.length - 1 ? chapterStarts[i + 1].index : lines.length;

    const chapterLines = lines.slice(start.index, end);
    const content = chapterLines.join('\n').trim();

    if (content.length > 50) { // 过滤太短的章节
      chapters.push({
        title: start.title,
        content: content
      });
    }
  }

  return chapters.length > 0 ? chapters : [{
    title: '完整内容',
    content: text.trim()
  }];
}
