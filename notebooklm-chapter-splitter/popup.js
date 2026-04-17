// popup.js - 主界面逻辑

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
  fileInfo.innerHTML = `
    <strong>文件名：</strong>${file.name}<br>
    <strong>大小：</strong>${(file.size / 1024 / 1024).toFixed(2)} MB<br>
    <strong>类型：</strong>${file.type || file.name.split('.').pop().toUpperCase()}
  `;

  showStatus('正在解析文件...', 'info');
  document.getElementById('splitBtn').disabled = true;

  try {
    // 解析文件并检测章节
    chapters = await parseFileAndDetectChapters(file);
    
    if (chapters.length > 0) {
      displayChapters(chapters);
      document.getElementById('splitBtn').disabled = false;
      showStatus(`成功检测到 ${chapters.length} 个章节`, 'success');
    } else {
      showStatus('未检测到章节，将按固定长度拆分', 'info');
      document.getElementById('splitBtn').disabled = false;
    }
  } catch (error) {
    console.error('解析文件失败:', error);
    showStatus('解析文件失败: ' + error.message, 'error');
  }
});

document.getElementById('splitBtn').addEventListener('click', async () => {
  if (!selectedFile || chapters.length === 0) {
    showStatus('请先选择文件', 'error');
    return;
  }

  const progressDiv = document.getElementById('progress');
  const progressBar = progressDiv.querySelector('.progress-bar');
  const progressText = progressDiv.querySelector('.progress-text');
  
  progressDiv.style.display = 'block';
  document.getElementById('splitBtn').disabled = true;
  document.getElementById('downloadAllBtn').disabled = true;

  try {
    // 拆分章节并准备下载
    const chapterFiles = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      progressText.textContent = `正在处理第 ${i + 1}/${chapters.length} 章: ${chapter.title}`;
      progressBar.style.width = `${((i + 1) / chapters.length) * 100}%`;
      
      const chapterText = chapter.content;
      const blob = new Blob([chapterText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      chapterFiles.push({
        url,
        filename: sanitizeFilename(chapter.title) + '.txt',
        title: chapter.title
      });
    }

    window._chapterFiles = chapterFiles;
    
    progressText.textContent = '拆分完成！';
    document.getElementById('downloadAllBtn').disabled = false;
    showStatus(`成功拆分 ${chapters.length} 个章节`, 'success');
    
    setTimeout(() => {
      downloadAllChapters(chapterFiles);
    }, 500);
    
  } catch (error) {
    console.error('拆分失败:', error);
    showStatus('拆分失败: ' + error.message, 'error');
  } finally {
    document.getElementById('splitBtn').disabled = false;
  }
});

document.getElementById('downloadAllBtn').addEventListener('click', async () => {
  if (window._chapterFiles) {
    downloadAllChapters(window._chapterFiles);
  }
});

function displayChapters(chapters) {
  const chapterList = document.getElementById('chapterList');
  const preview = document.getElementById('chapterPreview');
  
  chapterList.innerHTML = '';
  chapters.forEach((chapter, index) => {
    const item = document.createElement('div');
    item.className = 'chapter-item';
    item.textContent = `${index + 1}. ${chapter.title} (${chapter.content.length} 字符)`;
    chapterList.appendChild(item);
  });
  
  preview.style.display = 'block';
}

async function parseFileAndDetectChapters(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  switch (fileExtension) {
    case 'pdf':
      return await parsePDF(file);
    case 'epub':
      return await parseEPUB(file);
    case 'mobi':
    case 'azw3':
      return await parseMOBI(file);
    default:
      throw new Error('不支持的文件格式');
  }
}

function sanitizeFilename(filename) {
  // 清理文件名，移除非法字符
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

async function downloadAllChapters(chapterFiles) {
  for (let i = 0; i < chapterFiles.length; i++) {
    const file = chapterFiles[i];
    try {
      await chrome.downloads.download({
        url: file.url,
        filename: file.filename,
        saveAs: false
      });
      // 添加小延迟避免浏览器限制
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`下载 ${file.filename} 失败:`, error);
    }
  }
  
  showStatus(`已开始下载 ${chapterFiles.length} 个章节文件`, 'success');
}

