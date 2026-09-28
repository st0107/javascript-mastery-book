'use strict';
const assert = require('node:assert/strict');

assert.equal(this, module.exports);
assert.equal(exports, module.exports);
assert.equal(require('node:path'), require('node:path'));
const localRecord = { exports: {} };
let alias = localRecord.exports;
alias.ready = true;
alias = { ready: false };
assert.equal(localRecord.exports.ready, true);
assert.notStrictEqual(alias, localRecord.exports);
assert.throws(() => { commonjsLessonUndeclared = 1; }, ReferenceError);
console.log('CommonJS assertions passed');
// Expected output:
// CommonJS assertions passed
