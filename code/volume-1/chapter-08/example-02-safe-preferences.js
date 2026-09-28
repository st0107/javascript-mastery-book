'use strict';

function parsePreferences(text) {
  if (typeof text !== 'string') throw new TypeError('JSON text required');
  if (text.length > 4096) throw new RangeError('preferences text too large');
  const input = JSON.parse(text);
  function checkRecord(value, allowed, name) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`${name} must be a record`);
    }
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) throw new TypeError(`unknown ${name} field: ${key}`);
    }
  }
  checkRecord(input, ['theme', 'notifications'], 'preferences');
  const theme = Object.hasOwn(input, 'theme') ? input.theme : 'light';
  if (theme !== 'light' && theme !== 'dark') throw new RangeError('unsupported theme');
  const notifications = Object.hasOwn(input, 'notifications') ? input.notifications : {};
  checkRecord(notifications, ['email', 'sms'], 'notifications');
  const email = Object.hasOwn(notifications, 'email') ? notifications.email : false;
  const sms = Object.hasOwn(notifications, 'sms') ? notifications.sms : false;
  if (typeof email !== 'boolean' || typeof sms !== 'boolean') {
    throw new TypeError('notification values must be booleans');
  }
  return { theme, notifications: { email, sms } };
}
const assert = require('node:assert/strict');
assert.deepEqual(parsePreferences('{}'), { theme: 'light', notifications: { email: false, sms: false } });
assert.deepEqual(parsePreferences('{"theme":"dark","notifications":{"sms":true}}'), {
  theme: 'dark', notifications: { email: false, sms: true }
});
for (const text of ['null', '[]', 'true', '{"notifications":null}', '{"notifications":[]}',
  '{"notifications":{"email":"false"}}', '{"admin":true}', '{"__proto__":{"admin":true}}',
  '{"notifications":{"constructor":{}}}', '{"notifications":{"__proto__":{}}}']) {
  assert.throws(() => parsePreferences(text), TypeError);
}
assert.throws(() => parsePreferences({}), TypeError);
assert.throws(() => parsePreferences('{"theme":null}'), RangeError);
assert.throws(() => parsePreferences(' '.repeat(4097)), RangeError);
assert.throws(() => parsePreferences('{'), SyntaxError);
const first = parsePreferences('{}');
const second = parsePreferences('{}');
first.notifications.email = true;
assert.equal(second.notifications.email, false);
assert.notEqual(first.notifications, second.notifications);
assert.equal(Object.getPrototypeOf(first), Object.prototype);
assert.equal(Object.hasOwn(first, '__proto__'), false);
console.log('JSON preference schema, dangerous-key, and ownership checks passed.');

// Expected output:
// JSON preference schema, dangerous-key, and ownership checks passed.

// Work is bounded by input text and parsed fields; the returned schema is fixed-sized.
