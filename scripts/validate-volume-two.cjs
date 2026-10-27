'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const volume = path.join(root, 'docs', 'volume-2');
const snippetTimeoutMs = 10000;
const requested = process.argv.slice(2);
if (requested.length && (requested.length !== 2 || requested[0] !== '--chapter' ||
    !/^(?:0[1-9]|[1-9][0-9])$/.test(requested[1]))) {
  throw new Error('Usage: node scripts/validate-volume-two.cjs [--chapter NN]');
}

// Planned chapters remain in the contents list without a chapter directory.
// Once a directory is created, all required sections must be present.
const chapterNames = requested.length ? [`chapter-${requested[1]}`] :
  fs.readdirSync(volume, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^chapter-\d{2}$/.test(entry.name))
    .map(entry => entry.name).sort();
assert.ok(chapterNames.length > 0, 'No authored Volume 2 chapters found');
const sections = [
  '01-introduction.md', '02-theory.md', '03-internal-working.md',
  '04-production-examples.md', '05-interview-perspective.md',
  '06-exercises-coding-challenges.md', '07-mcqs.md', '08-revision-summary.md',
  '09-edge-cases-debugging.md', '10-performance-security.md', '11-professional-field-guide.md'
];
const files = [];
for (const chapter of chapterNames) {
  for (const section of sections) {
    const file = path.join(volume, chapter, section);
    assert.ok(fs.existsSync(file), `Missing section: ${file}`);
    files.push(file);
  }
}
if (!requested.length) {
  for (const name of ['index.md', 'SUMMARY.md']) files.push(path.join(volume, name));
}

const sidebarIds = new Set();
function collectIds(items) {
  for (const item of items) {
    if (typeof item === 'string') sidebarIds.add(item);
    else if (Array.isArray(item.items)) collectIds(item.items);
  }
}
collectIds(require(path.join(root, 'sidebars.js')).tutorialSidebar);
const mkdocs = fs.readFileSync(path.join(root, 'mkdocs.yml'), 'utf8');
const summary = fs.readFileSync(path.join(volume, 'SUMMARY.md'), 'utf8');
const contents = fs.readFileSync(path.join(root, 'docs', 'table-of-contents.md'), 'utf8');
let exerciseCount = 0;
let questionCount = 0;
const coverageIssues = [];
for (const chapter of chapterNames) {
  for (const section of sections) {
    const target = `${chapter}/${section}`;
    const id = `volume-2/${chapter}/${section.replace(/^\d\d-/, '').replace(/\.md$/, '')}`;
    assert.ok(sidebarIds.has(id), `Sidebar omits ${id}`);
    assert.ok(mkdocs.includes(`volume-2/${target}`), `MkDocs omits ${target}`);
    assert.ok(summary.includes(`](${target})`), `Volume summary omits ${target}`);
    assert.ok(contents.includes(`](volume-2/${target})`), `Book contents omit ${target}`);
  }
  const introduction = fs.readFileSync(path.join(volume, chapter, sections[0]), 'utf8');
  assert.match(introduction, /^## Prerequisites(?:\s|$)/m, `${chapter}: prerequisites missing`);
  const exercises = fs.readFileSync(path.join(volume, chapter, sections[5]), 'utf8');
  const exerciseHeadings = [...exercises.matchAll(/^## (?:Exercise )?\d+[.:]/gm)];
  if (exerciseHeadings.length < 6) coverageIssues.push(`${chapter}: ${exerciseHeadings.length} exercises; at least six required`);
  exerciseCount += exerciseHeadings.length;
  const mcqs = fs.readFileSync(path.join(volume, chapter, sections[6]), 'utf8');
  const answers = [...mcqs.matchAll(/\*\*Answer:\s*([A-D])/g)].map(match => match[1]);
  if (answers.length < 16) coverageIssues.push(`${chapter}: ${answers.length} MCQs; at least sixteen required`);
  if (new Set(answers).size !== 4) coverageIssues.push(`${chapter}: MCQs do not use all four answer positions`);
  questionCount += answers.length;
}
if (!requested.length) {
  for (const extra of ['index', 'SUMMARY']) {
    assert.ok(sidebarIds.has(`volume-2/${extra}`), `Sidebar omits ${extra}`);
    assert.ok(mkdocs.includes(`volume-2/${extra}.md`), `MkDocs omits ${extra}`);
  }
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n').trimEnd();
}

function expectedOutput(source, location) {
  // Existing chapters also label quiz answers and host-specific demonstrations.
  // Accept their labels, while comparing the actual output just as strictly.
  const marker = /^\/\/ Expected output(?: \(check after answering\)| in Node\.js)?:([^\r\n]*)\r?$/m.exec(source);
  assert.ok(marker, `${location}: expected-output comment is missing`);
  const expected = marker[1].trim() ? [marker[1].trimStart()] : [];
  const following = source.slice(marker.index + marker[0].length).replace(/^\r?\n/, '').split(/\r?\n/);
  for (const line of following) {
    if (!line.startsWith('//')) break;
    expected.push(line.replace(/^\/\/ ?/, ''));
  }
  assert.ok(expected.length, `${location}: expected-output comment is empty`);
  return expected.join('\n') === '(none)' ? '' : normalize(expected.join('\n'));
}

let snippetCount = 0;
let linkCount = 0;
let diagramCount = 0;
let currentGroup;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  const chapter = path.basename(path.dirname(file));
  if (chapter !== currentGroup) {
    currentGroup = chapter;
    console.log(`Checking ${chapter}...`);
  }
  const exampleDirectory = path.join(root, 'code', 'volume-2', chapter);
  const blocks = [...source.matchAll(/^```(js|javascript)[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  for (let index = 0; index < blocks.length; index += 1) {
    const program = blocks[index][2];
    const location = `${relative}, JavaScript block ${index + 1}`;
    const expected = expectedOutput(program, location);
    const extension = program.includes('// Runtime: Node.js ES module') ? '.mjs' : '.cjs';
    assert.ok(fs.existsSync(exampleDirectory), `${location}: code folder is missing`);
    const temporary = path.join(exampleDirectory, `.book-snippet-${randomUUID()}${extension}`);
    let created = false;
    try {
      // A real file beside chapter dependencies preserves normal import semantics.
      fs.writeFileSync(temporary, program, { flag: 'wx' });
      created = true;
      const result = spawnSync(process.execPath, ['--preserve-symlinks-main', temporary], {
        encoding: 'utf8', cwd: exampleDirectory, windowsHide: true, timeout: snippetTimeoutMs
      });
      if (result.error) {
        const reason = result.error.code === 'ETIMEDOUT' ?
          `exceeded the ${snippetTimeoutMs} ms execution limit` :
          `could not execute (${result.error.code || result.error.message})`;
        const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
        throw new Error(`${location}: ${reason}${output ? `\n${output}` : ''}`, { cause: result.error });
      }
      assert.equal(result.status, 0, `${location}: execution failed\n${result.stderr}`);
      assert.equal(normalize(result.stderr), '', `${location}: unexpected stderr`);
      assert.equal(normalize(result.stdout), expected, `${location}: stdout differs`);
      snippetCount += 1;
    } finally {
      // Remove only the exact temporary file created by this invocation.
      if (created) fs.unlinkSync(temporary);
    }
  }
  const prose = source.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
  for (const match of prose.matchAll(/\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const target = href.split('#')[0];
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), target)), `${relative}: broken link ${href}`);
    linkCount += 1;
  }
  const embedded = [...source.matchAll(/^```mermaid[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)]
    .map(match => normalize(match[1]));
  const diagramSources = [...prose.matchAll(/`diagrams\/([^`]+\.mmd)`/g)];
  const stored = diagramSources.map(match => {
    const file = path.join(root, 'diagrams', match[1]);
    assert.ok(fs.existsSync(file), `${relative}: missing diagram source ${match[1]}`);
    return normalize(fs.readFileSync(file, 'utf8'));
  });
  assert.deepEqual(embedded.sort(), stored.sort(), `${relative}: diagram source coverage or content differs`);
  diagramCount += stored.length;
}

assert.equal(coverageIssues.length, 0,
  `Practice coverage is incomplete after checking ${files.length} documents and ${snippetCount} runnable blocks:\n${coverageIssues.join('\n')}`);
console.log(`Volume 2 validation passed: ${files.length} documents, ${snippetCount} runnable blocks, ${linkCount} local links, ${diagramCount} synchronized diagrams.`);
console.log(`Chapter structure and navigation passed: ${chapterNames.length * sections.length} sections, ${exerciseCount} exercises, ${questionCount} MCQs.`);
