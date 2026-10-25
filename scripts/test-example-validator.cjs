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

function run(dir, script = validator) {
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script];
  if (dir !== undefined) args.push('-ExamplesPath', dir);
  const result = spawnSync(process.platform === 'win32' ? 'powershell' : 'pwsh', args,
    { encoding: 'utf8', cwd: fixtureRoot, windowsHide: true, timeout: 30000 });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

try {
  const passing = directory('passing');
  fixture(passing, 'a.js', "console.log('CommonJS example ran');\n");
  fixture(passing, 'b.mjs', "import assert from 'node:assert/strict'; assert.equal(2 + 2, 4); console.log('ES module ran');\n");
  fixture(passing, 'c.cjs', "console.log('Explicit CommonJS example ran');\n");
  fixture(passing, 'ignored.txt', "throw new Error('Not a JavaScript example');\n");
  fixture(passing, '.book-snippet-active.cjs', "throw new Error('Owned by the concurrent documentation validator');\n");
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

  // Invoke an exact copy from another cwd without passing ExamplesPath.
  directory('default-root');
  const scriptDirectory = directory('default-root/scripts');
  const codeDirectory = directory('default-root/code');
  fixture(scriptDirectory, 'validate-examples.ps1', fs.readFileSync(validator, 'utf8'));
  fixture(codeDirectory, 'default.cjs', "console.log('DEFAULT_ROOT_OK');\n");
  const defaultRoot = run(undefined, path.join(scriptDirectory, 'validate-examples.ps1'));
  assert.equal(defaultRoot.status, 0, defaultRoot.output);
  assert.match(defaultRoot.output, /DEFAULT_ROOT_OK/);
  assert.match(defaultRoot.output, /All 1 JavaScript examples ran successfully/);

  // A process-launch failure must identify the actual documentation block, not
  // only its random temporary filename. Exercise the production failure path.
  const documentationValidator = path.join(__dirname, 'validate-volume-one.cjs');
  const preloadDirectory = directory('preloads');
  for (const code of ['ETIMEDOUT', 'EACCES']) {
    const preloadName = `${code}.cjs`;
    fixture(preloadDirectory, preloadName, `
      require('node:child_process').spawnSync = (executable, args) => {
        console.log('CREATED_SNIPPET=' + args[1]);
        return {
          error: Object.assign(new Error('fixture process failure'), { code: '${code}' }),
          status: null, stdout: 'PARTIAL_OUTPUT', stderr: 'PROCESS_DIAGNOSTIC'
        };
      };
    `);
    const result = spawnSync(process.execPath, [
      '--require', path.join(preloadDirectory, preloadName),
      documentationValidator, '--chapter', '02'
    ], { encoding: 'utf8', cwd: fixtureRoot, windowsHide: true, timeout: 30000 });
    if (result.error) throw result.error;
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0, output);
    assert.match(output, /chapter-02[\\/]01-introduction\.md, JavaScript block 1/);
    assert.match(output, code === 'ETIMEDOUT' ?
      /exceeded the 10000 ms execution limit/ : /could not execute \(EACCES\)/);
    assert.match(output, /PARTIAL_OUTPUT/);
    assert.match(output, /PROCESS_DIAGNOSTIC/);
    assert.doesNotMatch(output, /Volume 1 validation passed/);
    const createdSnippet = /CREATED_SNIPPET=([^\r\n]+)/.exec(result.stdout);
    assert.ok(createdSnippet, 'Missing fixture snippet path');
    assert.equal(fs.existsSync(createdSnippet[1]), false, 'Failed snippet was not cleaned up');
  }
  console.log('Example validator regression checks passed.');
} finally {
  // Remove only the exact files and empty directories created by this test.
  for (const file of files) fs.unlinkSync(file);
  for (const dir of directories.reverse()) fs.rmdirSync(dir);
  fs.rmdirSync(fixtureRoot);
}
