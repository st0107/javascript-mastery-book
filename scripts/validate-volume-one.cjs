'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const volume = path.join(root, 'docs', 'volume-1');
const requested = process.argv.slice(2);
if (requested.length && (requested.length !== 2 || requested[0] !== '--chapter' ||
    !/^(0[1-9]|1[01])$/.test(requested[1]))) {
  throw new Error('Usage: node scripts/validate-volume-one.cjs [--chapter 01..11]');
}
const chapterNames = requested.length ? [`chapter-${requested[1]}`] :
  Array.from({ length: 11 }, (_, index) => `chapter-${String(index + 1).padStart(2, '0')}`);
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
  for (const name of ['README.md', 'SUMMARY.md', 'preface.md', 'chapter-01-execution-model.md']) {
    files.push(path.join(volume, name));
  }
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
for (const chapter of chapterNames) {
  for (const section of sections) {
    const target = `${chapter}/${section}`;
    const id = `volume-1/${chapter}/${section.replace(/^\d\d-/, '').replace(/\.md$/, '')}`;
    assert.ok(sidebarIds.has(id), `Sidebar omits ${id}`);
    assert.ok(mkdocs.includes(`volume-1/${target}`), `MkDocs omits ${target}`);
    assert.ok(summary.includes(`](${target})`), `Volume summary omits ${target}`);
    assert.ok(contents.includes(`](volume-1/${target})`), `Book contents omit ${target}`);
  }
  const introduction = fs.readFileSync(path.join(volume, chapter, sections[0]), 'utf8');
  assert.match(introduction, /^## Prerequisites/m, `${chapter}: prerequisites missing`);
  const exercises = fs.readFileSync(path.join(volume, chapter, sections[5]), 'utf8');
  const exerciseHeadings = [...exercises.matchAll(/^## (?:Exercise )?\d+[.:]/gm)];
  assert.ok(exerciseHeadings.length >= 6, `${chapter}: fewer than six exercises`);
  exerciseCount += exerciseHeadings.length;
  const mcqs = fs.readFileSync(path.join(volume, chapter, sections[6]), 'utf8');
  const answers = [...mcqs.matchAll(/\*\*Answer:\s*([A-D])/g)].map(match => match[1]);
  assert.ok(answers.length >= 16, `${chapter}: fewer than sixteen MCQ answers`);
  assert.equal(new Set(answers).size, 4, `${chapter}: MCQs do not use all answer positions`);
  questionCount += answers.length;
}
if (!requested.length) {
  for (const extra of ['preface', 'chapter-01-execution-model']) {
    assert.ok(sidebarIds.has(`volume-1/${extra}`), `Sidebar omits ${extra}`);
    assert.ok(mkdocs.includes(`volume-1/${extra}.md`), `MkDocs omits ${extra}`);
  }
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n').trimEnd();
}

function expectedOutput(source, location) {
  const marker = '// Expected output:';
  const offset = source.indexOf(marker);
  assert.notEqual(offset, -1, `${location}: expected-output comment is missing`);
  const lines = source.slice(offset + marker.length).replace(/^\r?\n/, '').split(/\r?\n/);
  const expected = [];
  for (const line of lines) {
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
  const exampleDirectory = chapter.startsWith('chapter-') ?
    path.join(root, 'code', 'volume-1', chapter) : path.join(root, 'code', 'chapter-01');
  const blocks = [...source.matchAll(/^```(js|javascript)\s*\r?\n([\s\S]*?)^```\s*$/gm)];
  for (let index = 0; index < blocks.length; index += 1) {
    const program = blocks[index][2];
    const location = `${relative}, JavaScript block ${index + 1}`;
    const expected = expectedOutput(program, location);
    const extension = program.includes('// Runtime: Node.js ES module') ? '.mjs' : '.cjs';
    // The exact owned temporary file preserves real module and relative-import semantics.
    const temporary = path.join(exampleDirectory, `.book-snippet-${randomUUID()}${extension}`);
    assert.ok(fs.existsSync(exampleDirectory), `${location}: code folder is missing`);
    let created = false;
    try {
      fs.writeFileSync(temporary, program, { flag: 'wx' });
      created = true;
      const result = spawnSync(process.execPath, ['--preserve-symlinks-main', temporary], {
        encoding: 'utf8', cwd: exampleDirectory, windowsHide: true, timeout: 10000
      });
      if (result.error) throw result.error;
      assert.equal(result.status, 0, `${location}: execution failed\n${result.stderr}`);
      assert.equal(normalize(result.stderr), '', `${location}: unexpected stderr`);
      assert.equal(normalize(result.stdout), expected, `${location}: stdout differs`);
      snippetCount += 1;
    } finally {
      // No recursive deletion: remove only this invocation's explicitly created file.
      if (created) fs.unlinkSync(temporary);
    }
  }
  const prose = source.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  for (const match of prose.matchAll(/\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const target = href.split('#')[0];
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), target)), `${relative}: broken link ${href}`);
    linkCount += 1;
  }
  const diagrams = [...source.matchAll(/^```mermaid\s*\r?\n([\s\S]*?)^```\s*$/gm)].map(match => normalize(match[1]));
  const diagramSources = [...prose.matchAll(/`diagrams\/([^`]+\.mmd)`/g)];
  for (const match of diagramSources) {
    const diagram = normalize(fs.readFileSync(path.join(root, 'diagrams', match[1]), 'utf8'));
    assert.ok(diagrams.includes(diagram), `${relative}: diagram differs from ${match[1]}`);
    diagramCount += 1;
  }
  assert.equal(diagrams.length, diagramSources.length, `${relative}: diagram source coverage differs`);
}

console.log(`Volume 1 validation passed: ${files.length} documents, ${snippetCount} runnable blocks, ${linkCount} local links, ${diagramCount} synchronized diagrams.`);
console.log(`Chapter structure and navigation passed: ${chapterNames.length * sections.length} sections, ${exerciseCount} exercises, ${questionCount} MCQs.`);
