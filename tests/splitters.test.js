const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load(file, globals = {}) {
  const context = vm.createContext(globals);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  return context;
}

const parsers = [
  ['notebooklm-chapter-splitter/fileParser.js', (ctx, text) => ctx.detectChapters(text)],
  ['book-splitter-extension/fileProcessor.js', (ctx, text) => ctx.splitIntoChapters(text, {autoDetect: true, pattern: 'auto'})]
];

for (const [file, split] of parsers) {
  test(`${file}: blank text produces no downloadable chapters`, () => {
    assert.equal(split(load(file), ' \n\t\n').length, 0);
  });

  test(`${file}: retains preface and short chapters in order`, () => {
    const text = '序言不可丢失\n\n第一章：开始\n短文\n第二章：结束\n尾声';
    const result = split(load(file), text);
    assert.equal(result.length, 3);
    assert.equal(result[0].title, '前言');
    assert.equal(result.map(c => c.content).join('\n\n'), text.replace('\n第二章', '\n\n第二章'));
  });

  test(`${file}: preserves text without headings`, () => {
    const text = '只有正文，没有章节标题。';
    assert.equal(split(load(file), text)[0].content, text);
  });

  test(`${file}: PDF TOC titles do not create empty chapters or duplicate filenames`, async () => {
    const lines = [
      '短序言', '目录',
      'Chapter 1: Topic1', ' ', 'Chapter 2: Topic2', '\t', 'Chapter 3: Topic3', '',
      'Chapter 1: Topic1', '短文一',
      'Chapter 2: Topic2', '短文二',
      'Chapter 3: Topic3', '短文三'
    ];
    const ctx = load(file, {pdfjsLib: {
      GlobalWorkerOptions: {},
      getDocument: () => ({promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({getTextContent: async () => ({
          items: lines.map(str => ({str, hasEOL: true}))
        })})
      })})
    }});
    const result = file.includes('fileParser')
      ? await ctx.parsePDF({arrayBuffer: async () => new ArrayBuffer(0)})
      : await ctx.processPDF(new Uint8Array(), {autoDetect: true, pattern: 'auto'});

    assert.equal(result.length, 4);
    assert.deepEqual(Array.from(result, c => c.title), ['前言', 'Topic1', 'Topic2', 'Topic3']);
    assert.equal(result[0].content, '短序言\n目录');
    assert.deepEqual(Array.from(result.slice(1), c => c.content), [
      'Chapter 1: Topic1\n短文一', 'Chapter 2: Topic2\n短文二', 'Chapter 3: Topic3\n短文三'
    ]);
    // These titles need no filename sanitization in either popup.
    const filenames = Array.from(result, c => `${c.title}.txt`);
    assert.equal(new Set(filenames).size, filenames.length);
    assert.equal(filenames[1], 'Topic1.txt');
  });

  test(`${file}: skips heading-only entries before and after real content without a preface`, () => {
    const text = 'Chapter 1: Topic1\n \nChapter 1: Topic1\n正文\nChapter 2: Topic2\n\t';
    const result = split(load(file), text);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Topic1');
    assert.equal(result[0].content, 'Chapter 1: Topic1\n正文');
  });

  test(`${file}: PDF extraction preserves line breaks for chapter detection`, async () => {
    const globals = {pdfjsLib: {
      GlobalWorkerOptions: {},
      getDocument: () => ({promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({getTextContent: async () => ({items: [
          {str: '第一章：开始', hasEOL: true},
          {str: '正文'.repeat(40), hasEOL: true},
          {str: '第二章：结束', hasEOL: true},
          {str: '末章'.repeat(40), hasEOL: true}
        ]})})
      })})
    }};
    const ctx = load(file, globals);
    const result = file.includes('fileParser')
      ? await ctx.parsePDF({arrayBuffer: async () => new ArrayBuffer(0)})
      : await ctx.processPDF(new Uint8Array(), {autoDetect: true, pattern: 'auto'});
    assert.equal(result.length, 2);
    assert.match(result[0].content, /开始\n正文/);
    assert.match(result[1].content, /结束\n末章/);
  });
}

test('Markdown chapter titles use heading text', () => {
  const result = load('notebooklm-chapter-splitter/fileParser.js').detectChapters('# 开始\n正文\n## 结束\n末章');
  assert.deepEqual(Array.from(result, c => c.title), ['开始', '结束']);
});

function popup() {
  const elements = new Map();
  function element() {
    return {style: {}, disabled: false, textContent: '', innerHTML: '', listeners: {},
      addEventListener(event, callback) { this.listeners[event] = callback; },
      appendChild() {}, querySelector() { return element(); }};
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElement: element
  };
  const ctx = load('notebooklm-chapter-splitter/popup.js', {
    document, window: {}, setTimeout: callback => callback(),
    URL: {revokeObjectURL() {}}, chrome: {downloads: {download: async () => 1}}
  });
  const select = file => document.getElementById('fileInput').listeners.change({target: {files: [file]}});
  return {ctx, document, select};
}

const file = name => ({name, size: 1024, type: ''});
const chapter = title => [{title, content: '正文'}];

test('file name is displayed as text, not HTML', async () => {
  const {ctx, document, select} = popup();
  ctx.parsePDF = async () => chapter('新书');
  await select(file('<img src=x onerror=alert(1)>.pdf'));
  const info = document.getElementById('fileInfo');
  assert.equal(info.innerHTML, '');
  assert.match(info.textContent, /<img src=x onerror=alert\(1\)>/);
});

test('latest file wins when an older parse finishes later', async () => {
  const {ctx, document, select} = popup();
  let finishOld;
  ctx.parsePDF = () => new Promise(resolve => {finishOld = resolve;});
  const old = select(file('old.pdf'));
  ctx.parsePDF = async () => chapter('新书');
  await select(file('new.pdf'));
  finishOld(chapter('旧书'));
  await old;
  assert.equal(vm.runInContext('chapters[0].title', ctx), '新书');
  assert.equal(document.getElementById('splitBtn').disabled, false);
});

test('old parse errors do not overwrite latest success', async () => {
  const {ctx, document, select} = popup();
  let failOld;
  ctx.parsePDF = () => new Promise((resolve, reject) => {failOld = reject;});
  const old = select(file('old.pdf'));
  ctx.parsePDF = async () => chapter('新书');
  await select(file('new.pdf'));
  failOld(new Error('old error'));
  await old;
  assert.equal(document.getElementById('status').className, 'status success');
});

test('new selection clears old chapters and download state, even if parsing fails', async () => {
  const {ctx, document, select} = popup();
  ctx.parsePDF = async () => chapter('旧书');
  await select(file('old.pdf'));
  ctx.window._chapterFiles = [{url: 'blob:old'}];
  document.getElementById('downloadAllBtn').disabled = false;
  await select(file('invalid.txt'));
  assert.equal(vm.runInContext('chapters.length', ctx), 0);
  assert.equal(document.getElementById('downloadAllBtn').disabled, true);
  assert.equal(document.getElementById('chapterPreview').style.display, 'none');
  assert.equal(ctx.window._chapterFiles, null);
});

test('empty parse results cannot enable splitting', async () => {
  const {ctx, document, select} = popup();
  ctx.parsePDF = async () => [];
  await select(file('empty.pdf'));
  assert.equal(document.getElementById('splitBtn').disabled, true);
  assert.equal(document.getElementById('status').className, 'status error');
});

test('download failures are counted and never reported as success', async () => {
  const {ctx, document} = popup();
  ctx.chrome.downloads.download = async ({filename}) => {
    if (filename === 'bad.txt') throw new Error('blocked');
    return 1;
  };
  await ctx.downloadAllChapters([{url: 'blob:a', filename: 'good.txt'}, {url: 'blob:b', filename: 'bad.txt'}]);
  const status = document.getElementById('status');
  assert.equal(status.className, 'status error');
  assert.match(status.textContent, /成功 1.*失败 1/);
});

test('successful download requests report accepted count', async () => {
  const {ctx, document} = popup();
  await ctx.downloadAllChapters([{url: 'blob:a', filename: 'good.txt'}]);
  assert.equal(document.getElementById('status').className, 'status success');
  assert.match(document.getElementById('status').textContent, /1/);
});
