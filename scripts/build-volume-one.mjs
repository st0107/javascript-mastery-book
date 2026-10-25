import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import GithubSlugger from 'github-slugger';
import puppeteer from 'puppeteer-core';
import { zipSync, strToU8 } from 'fflate';

// The website and both books read the same authored Markdown. Browser rendering
// makes Mermaid images available offline, without a separate LaTeX installation.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const volume = path.join(root, 'docs/volume-1');
const destination = path.join(root, 'build/volume-1');
const requested = process.argv.slice(2);
assert.ok(requested.length <= 1 && (!requested.length || ['pdf', 'epub', 'all'].includes(requested[0])),
  'Usage: node scripts/build-volume-one.mjs [pdf|epub|all]');
const format = requested[0] || 'all';
const title = 'JavaScript Mastery: Volume I';
const subtitle = 'JavaScript Fundamentals';
const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const walk = (node, fn) => { fn(node); node.children?.forEach(child => walk(child, fn)); };
const plain = node => node.value || (node.children || []).map(plain).join('');
const idFor = file => path.relative(volume, file).replace(/\\/g, '/').replace(/\.md$/, '').replace(/\//g, '-');
const parser = unified().use(remarkParse).use(remarkGfm);
const renderer = unified().use(remarkRehype).use(rehypeStringify, { closeSelfClosing: true });
const metadata = JSON.parse(await fs.readFile(path.join(root, 'book.json'), 'utf8'));
const sections = ['01-introduction.md', '02-theory.md', '03-internal-working.md',
  '04-production-examples.md', '05-interview-perspective.md', '06-exercises-coding-challenges.md',
  '07-mcqs.md', '08-revision-summary.md', '09-edge-cases-debugging.md',
  '10-performance-security.md', '11-professional-field-guide.md'];
const files = [path.join(volume, 'README.md'), path.join(volume, 'preface.md')];
for (let chapter = 1; chapter <= 11; chapter++) {
  for (const section of sections) files.push(path.join(volume, `chapter-${String(chapter).padStart(2, '0')}`, section));
}
files.push(path.join(volume, 'chapter-01-execution-model.md'));
const documents = [];
const diagrams = [];
const hash = createHash('sha256');
for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  hash.update(path.relative(root, file).replace(/\\/g, '/')).update(source);
  const tree = parser.parse(source);
  const heading = tree.children.find(node => node.type === 'heading' && node.depth === 1);
  assert.ok(heading, `Missing title: ${file}`);
  const id = idFor(file);
  const slugger = new GithubSlugger();
  const anchors = new Map();
  walk(tree, node => {
    if (node.type === 'heading') {
      const slug = slugger.slug(plain(node));
      const headingId = node === heading ? id : `${id}--${slug}`;
      anchors.set(slug, headingId);
      node.data = { hProperties: { id: headingId } };
    }
    if (node.type === 'html') throw new Error(`Raw HTML needs explicit export handling: ${file}`);
  });
  documents.push({ file, source, tree, id, anchors, title: plain(heading), chapterStart: /01-introduction\.md$/.test(file) });
}
const byFile = new Map(documents.map(doc => [path.normalize(doc.file), doc]));
for (const doc of documents) {
  walk(doc.tree, node => {
    if (node.type === 'link') {
      if (/^(https?:|mailto:)/.test(node.url)) return;
      const [local, fragment] = node.url.split('#');
      const resolved = path.resolve(path.dirname(doc.file), local || path.basename(doc.file));
      const target = byFile.get(resolved);
      if (target) {
        const anchor = fragment ? target.anchors.get(decodeURIComponent(fragment)) : target.id;
        assert.ok(anchor, `Missing export anchor: ${doc.file} -> ${node.url}`);
        node.url = `${target.id}.xhtml#${anchor}`;
      } else if (resolved === path.join(volume, 'SUMMARY.md')) {
        node.url = 'nav.xhtml#contents';
      } else {
        assert.ok(existsSync(resolved), `Missing local source: ${doc.file} -> ${node.url}`);
        const repoPath = path.relative(root, resolved).replace(/\\/g, '/');
        assert.ok(!repoPath.startsWith('../'), `Link escapes repository: ${node.url}`);
        node.url = `https://github.com/st0107/javascript-mastery-book/blob/main/${repoPath}${fragment ? '#' + fragment : ''}`;
      }
    }
    if (node.type === 'code' && node.lang === 'mermaid') {
      const index = diagrams.length + 1;
      diagrams.push({ id: `diagram-${index}`, source: node.value, document: doc.id });
      node.type = 'image';
      node.url = `images/diagram-${index}.png`;
      node.alt = `${doc.title}: diagram ${index}`;
      delete node.value;
      delete node.lang;
    }
  });
  doc.html = renderer.stringify(await renderer.run(doc.tree));
}
assert.equal(documents.length, 124);
assert.equal(diagrams.length, 24);

await fs.mkdir(path.join(destination, 'images'), { recursive: true });
await fs.mkdir(path.join(root, 'pdf'), { recursive: true });
await fs.mkdir(path.join(root, 'epub'), { recursive: true });
const css = await fs.readFile(path.join(root, 'scripts/volume-one-book.css'), 'utf8');
await fs.writeFile(path.join(destination, 'book.css'), css);
const xhtml = (name, body) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en"><head><meta charset="utf-8"/><title>${escape(name)}</title><link rel="stylesheet" type="text/css" href="book.css"/></head><body>${body}</body></html>`;
const cover = `<section class="cover" id="cover"><p class="eyebrow">THE JAVASCRIPT MASTERY SERIES</p><p class="volume-number">VOLUME I</p><h1>JavaScript<br/>Fundamentals</h1><p class="cover-description">Understand the language.<br/>Trace the behavior.<br/>Build with confidence.</p><p class="cover-topics">Values · Functions · Objects · Collections · Errors · Modules</p><p class="author">${escape(metadata.author)}</p></section>`;
const navGroups = [];
for (const doc of documents) {
  if (doc.chapterStart) {
    navGroups.push({ doc, children: [] });
  } else if (/chapter-\d\d\//.test(path.relative(volume, doc.file).replace(/\\/g, '/'))) {
    navGroups.at(-1).children.push(doc);
  } else navGroups.push({ doc, children: [] });
}
const navLink = doc => `<a href="${doc.id}.xhtml#${doc.id}">${escape(doc.title)}</a>`;
const navBody = `<nav epub:type="toc" id="contents"><h1>Contents</h1><ol>${navGroups.map(group => `<li>${navLink(group.doc)}${group.children.length ? `<ol>${group.children.map(doc => `<li>${navLink(doc)}</li>`).join('')}</ol>` : ''}</li>`).join('')}</ol></nav>`;
await fs.writeFile(path.join(destination, 'cover.xhtml'), xhtml(title, cover));
await fs.writeFile(path.join(destination, 'nav.xhtml'), xhtml('Contents', navBody));
for (const doc of documents) await fs.writeFile(path.join(destination, `${doc.id}.xhtml`), xhtml(doc.title, `<main>${doc.html}</main>`));

function browserPath() {
  const candidates = [process.env.BOOK_BROWSER_PATH, process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  const browser = candidates.find(candidate => candidate && existsSync(candidate));
  assert.ok(browser, 'Install Chrome/Chromium/Edge or set BOOK_BROWSER_PATH to its executable.');
  return browser;
}
const mime = { '.html': 'text/html', '.xhtml': 'application/xhtml+xml', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
// Serve only this export and Mermaid's local distribution, on loopback.
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const base = name.startsWith('/mermaid/') ? path.join(root, 'node_modules/mermaid/dist') : destination;
    const relative = name.startsWith('/mermaid/') ? name.slice(9) : name.slice(1);
    const file = path.resolve(base, relative);
    if (!file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({ executablePath: browserPath(), headless: true, protocolTimeout: 180000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 });
  await fs.writeFile(path.join(destination, 'render.html'), '<!doctype html><html><head><meta charset="utf-8"/><style>body{margin:0;background:white;}#drawing{display:inline-block;padding:14px;}svg{max-width:850px!important;height:auto;}</style></head><body><div id="drawing"></div><script type="module">import mermaid from "/mermaid/mermaid.esm.min.mjs";mermaid.initialize({startOnLoad:false,theme:"neutral",securityLevel:"strict",fontFamily:"Arial, sans-serif",themeVariables:{fontSize:"18px"},flowchart:{htmlLabels:false,useMaxWidth:true,nodeSpacing:25,rankSpacing:25,padding:8}});window.bookMermaid=mermaid;</script></body></html>');
  await page.goto(`${baseUrl}/render.html`);
  await page.waitForFunction(() => window.bookMermaid);
  for (const diagram of diagrams) {
    const svg = await page.evaluate(async ({ id, source }) => {
      let result = await window.bookMermaid.render(id, source);
      const drawing = document.getElementById('drawing');
      drawing.innerHTML = result.svg;
      const box = drawing.querySelector('svg').viewBox.baseVal;
      // A printed page cannot scroll. Reflow only very wide LR graphs; all node
      // labels and edges stay unchanged, and the authored source is untouched.
      if (box.width > 1050 && box.width / box.height > 2.1 && /^flowchart LR/m.test(source)) {
        result = await window.bookMermaid.render(`${id}-portrait`, source.replace(/^flowchart LR/m, 'flowchart TD'));
        drawing.innerHTML = result.svg;
      }
      return result.svg;
    }, diagram);
    await fs.writeFile(path.join(destination, 'images', `${diagram.id}.svg`), svg);
    await (await page.$('#drawing')).screenshot({ path: path.join(destination, 'images', `${diagram.id}.png`) });
  }
  console.log(`Rendered ${diagrams.length} diagrams from the authored Markdown.`);
  const pdfHref = html => html.replace(/href="[^"#]+\.xhtml#([^"]+)"/g, 'href="#$1"');
  const printToc = `<section class="print-contents" id="contents"><h1>Contents</h1><ol>${navGroups.map(group => `<li>${navLink(group.doc)}</li>`).join('')}</ol><p class="contents-note">Each chapter includes theory, internals, production examples, interviews, exercises, MCQs, revision, debugging, performance and security, and a professional field guide.</p></section>`;
  const printBody = cover + printToc + documents.map(doc => `<article class="${doc.chapterStart || !/chapter-\d\d-/.test(doc.id) ? 'chapter-start' : 'section'}">${doc.chapterStart ? `<p class="chapter-label">CHAPTER ${Number(doc.id.match(/chapter-(\d+)/)[1])}</p>` : ''}${doc.html}</article>`).join('\n');
  const printHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${escape(title)} - ${subtitle}</title><link rel="stylesheet" href="book.css"/></head><body class="print-book">${pdfHref(printBody)}</body></html>`;
  await fs.writeFile(path.join(destination, 'volume-1.html'), printHtml);
  await page.goto(`${baseUrl}/volume-1.html`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
  const problems = await page.evaluate(() => {
    const missing = [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash);
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    return { missing, duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index), images: document.images.length };
  });
  assert.deepEqual(problems.missing, [], 'Broken PDF internal links');
  assert.deepEqual(problems.duplicateIds, [], 'Duplicate book anchors');
  assert.equal(problems.images, 24);
  if (format !== 'epub') {
    await page.pdf({ path: path.join(root, 'pdf/javascript-mastery-volume-1.pdf'), format: 'A4',
      printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font:8px Arial;color:#64748b;text-align:center">JavaScript Mastery · Volume I <span style="margin-left:14px" class="pageNumber"></span></div>',
      margin: { top: '18mm', right: '18mm', bottom: '19mm', left: '18mm' }, tagged: true, outline: true, timeout: 180000 });
    console.log('PDF generated: pdf/javascript-mastery-volume-1.pdf');
  }
  if (format !== 'pdf') {
    const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const resources = ['cover.xhtml', 'nav.xhtml', 'book.css', ...documents.map(doc => `${doc.id}.xhtml`), ...diagrams.map(diagram => `images/${diagram.id}.png`)];
    const opf = `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="en"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:javascript-mastery:volume-1</dc:identifier><dc:title>${escape(title)}: ${subtitle}</dc:title><dc:language>en</dc:language><dc:creator>${escape(metadata.author)}</dc:creator><dc:rights>MIT License</dc:rights><meta property="dcterms:modified">${modified}</meta></metadata><manifest>${resources.map((name, index) => `<item id="resource-${index}" href="${name}" media-type="${mime[path.extname(name)]}"${name === 'nav.xhtml' ? ' properties="nav"' : ''}/>`).join('')}</manifest><spine>${resources.filter(name => name.endsWith('.xhtml')).map(name => `<itemref idref="resource-${resources.indexOf(name)}"/>`).join('')}</spine></package>`;
    const archive = { mimetype: [strToU8('application/epub+zip'), { level: 0 }],
      'META-INF/container.xml': strToU8('<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'),
      'EPUB/package.opf': strToU8(opf) };
    for (const name of resources) archive[`EPUB/${name}`] = new Uint8Array(await fs.readFile(path.join(destination, name)));
    await fs.writeFile(path.join(root, 'epub/javascript-mastery-volume-1.epub'), zipSync(archive, { level: 6 }));
    console.log('EPUB generated: epub/javascript-mastery-volume-1.epub');
  }
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify({ title, sourceHash: hash.digest('hex'), format,
    documents: documents.map(doc => path.relative(root, doc.file).replace(/\\/g, '/')), diagrams: diagrams.length,
    checkedInternalLinks: true, generatedAt: new Date().toISOString() }, null, 2) + '\n');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
