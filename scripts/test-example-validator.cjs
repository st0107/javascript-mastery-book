'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'javascript-book-validator-'));
const directories = [];
const files = [];
const validator = path.join(__dirname, 'validate-examples.ps1');

function directory(name) {
  const target = path.join(fixtureRoot, name);
  fs.mkdirSync(target);
  directories.push(target);
  return target;
}

function fixture(dir, name, source) {
  const target = path.join(dir, name);
  fs.writeFileSync(target, source);
  files.push(target);
}

function run(dir) {
  const result = spawnSync(process.platform === 'win32' ? 'powershell' : 'pwsh', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', validator,
    '-ExamplesPath', dir
  ], { encoding: 'utf8', cwd: fixtureRoot, windowsHide: true, timeout: 30000 });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

try {
  const passing = directory('passing');
  fixture(passing, 'a.js', "console.log('CommonJS example ran');\n");
  fixture(passing, 'b.mjs', "import assert from 'node:assert/strict'; assert.equal(2 + 2, 4); console.log('ES module ran');\n");
  fixture(passing, 'c.cjs', "console.log('Explicit CommonJS example ran');\n");
  fixture(passing, 'ignored.txt', "throw new Error('Not a JavaScript example');\n");
  const success = run(passing);
  assert.equal(success.status, 0, success.output);
  assert.match(success.output, /All 3 JavaScript examples ran successfully/);
  assert.match(success.output, /ES module ran/);

  const failing = directory('failing');
  fixture(failing, 'a.js', 'process.exit(7);\n');
  fixture(failing, 'z.js', "console.log('SHOULD_NOT_RUN');\n");
  const failure = run(failing);
  assert.notEqual(failure.status, 0, failure.output);
  assert.match(failure.output, /exit code 7/);
  assert.doesNotMatch(failure.output, /SHOULD_NOT_RUN|ran successfully/);

  const empty = run(directory('empty'));
  assert.notEqual(empty.status, 0, empty.output);
  assert.match(empty.output, /No JavaScript examples found/);
  console.log('Example validator regression checks passed.');
} finally {
  // Remove only the exact files and empty directories created by this test.
  for (const file of files) fs.unlinkSync(file);
  for (const dir of directories.reverse()) fs.rmdirSync(dir);
  fs.rmdirSync(fixtureRoot);
}
