// Popup 脚本

let selectedFile = null;
let chapters = [];

document.getElementById('selectFileBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedFile = file;
  const fileInfo = document.getElementById('fileInfo');
  fileInfo.textContent = `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  fileInfo.style.display = 'block';

  document.getElementById('optionsSection').style.display = 'block';
});

document.getElementById('chapterPattern').addEventListener('change', (e) => {
  const customGroup = document.getElementById('customPatternGroup');
  if (e.target.value === 'custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
});

document.getElementById('splitBtn').addEventListener('click', async () => {
  if (!selectedFile) {
    alert('请先选择文件');
    return;
  }

  const options = {
    autoDetect: document.getElementById('autoDetectChapters').checked,
    pattern: document.getElementById('chapterPattern').value,
    customPattern: document.getElementById('customPattern').value,
    outputFormat: document.getElementById('outputFormat').value
  };

  // 验证自定义正则表达式
  if (options.pattern === 'custom' && !options.customPattern) {
    alert('请输入自定义正则表达式');
    return;
  }

  // 显示进度
  document.getElementById('progressSection').style.display = 'block';
  document.getElementById('optionsSection').style.display = 'none';
  document.getElementById('resultSection').style.display = 'none';

  updateProgress(0, '读取文件...');

  try {
    // 读取文件内容
    const arrayBuffer = await selectedFile.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    const fileName = selectedFile.name;
    const fileType = selectedFile.type || getFileType(fileName);

    updateProgress(20, '解析文件...');

    let resultChapters = [];

    // 根据文件类型处理
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      updateProgress(30, '处理 PDF 文件...');
      resultChapters = await processPDF(fileData, options);
    } else if (fileType.includes('epub') || fileName.endsWith('.epub')) {
      updateProgress(30, '处理 EPUB 文件...');
      resultChapters = await processEPUB(fileData, options);
    } else if (fileType.includes('mobi') || fileName.endsWith('.mobi')) {
      updateProgress(30, '处理 MOBI 文件...');
      resultChapters = await processMOBI(fileData, options);
    } else {
      throw new Error('不支持的文件格式，仅支持 PDF、EPUB 和 MOBI');
    }

    updateProgress(90, '完成拆分...');

    chapters = resultChapters;
    updateProgress(100, '完成！');

    setTimeout(() => {
      showResult(resultChapters.length);
    }, 500);
  } catch (error) {
    console.error('Error:', error);
    alert('处理失败: ' + error.message + '\n\n请确保：\n1. 文件格式正确\n2. 网络连接正常\n3. 文件未损坏');
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('optionsSection').style.display = 'block';
  }
});

function updateProgress(percent, text) {
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressText').textContent = text;
}

document.getElementById('downloadAllBtn').addEventListener('click', async () => {
  if (chapters.length === 0) return;

  const format = document.getElementById('outputFormat').value;
  const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');

  // 显示下载进度
  const downloadBtn = document.getElementById('downloadAllBtn');
  const originalText = downloadBtn.textContent;
  downloadBtn.disabled = true;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < chapters.length; i++) {
    try {
      downloadBtn.textContent = `下载中... (${i + 1}/${chapters.length})`;

      const chapter = chapters[i];
      const content = formatContent(chapter.content, format, chapter.title);
      const fileName = sanitizeFileName(`${baseName}_${chapter.title}.${format}`);

      // 创建 Blob 并下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: url,
          filename: fileName,
          saveAs: false
        }, (downloadId) => {
          URL.revokeObjectURL(url);
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(downloadId);
          }
        });
      });

      successCount++;

      // 延迟以避免浏览器阻止多个下载
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`下载章节 ${i + 1} 失败:`, error);
      failCount++;
    }
  }

  downloadBtn.disabled = false;
  downloadBtn.textContent = originalText;

  if (failCount === 0) {
    alert(`成功下载 ${successCount} 个章节文件！`);
  } else {
    alert(`下载完成：成功 ${successCount} 个，失败 ${failCount} 个`);
  }
});

function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const typeMap = {
    'pdf': 'application/pdf',
    'epub': 'application/epub+zip',
    'mobi': 'application/x-mobipocket-ebook'
  };
  return typeMap[ext] || 'application/octet-stream';
}

function formatContent(content, format, title) {
  const firstLine = content.split('\n')[0];
  const titleText = title || firstLine || '章节内容';
  
  switch (format) {
    case 'md':
      return `# ${titleText}\n\n${content}`;
    case 'html':
      // 将内容转换为 HTML，保留换行
      const htmlContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>\n');
      
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titleText}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #4285f4;
      padding-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>${titleText}</h1>
  <div>${htmlContent}</div>
</body>
</html>`;
    default:
      return content;
  }
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[<>:"/\\|?*]/g, '_');
}

function showResult(count) {
  document.getElementById('progressSection').style.display = 'none';
  document.getElementById('resultSection').style.display = 'block';
  document.getElementById('resultText').textContent = `成功拆分为 ${count} 个章节`;
}

