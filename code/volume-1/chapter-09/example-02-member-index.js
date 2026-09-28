'use strict';
const assert = require('node:assert/strict');

function buildMemberIndex(events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  if (events.length > 1000) throw new RangeError('at most 1000 events');
  const groups = new Map();
  for (let index = 0; index < events.length; index += 1) {
    if (!Object.hasOwn(events, index)) throw new TypeError('events must be dense');
    const event = events[index];
    if (event === null || typeof event !== 'object' || Array.isArray(event)) {
      throw new TypeError('event must be a data record');
    }
    const { team, member } = event;
    if (typeof team !== 'string' || team.length < 1 || team.length > 40 ||
        typeof member !== 'string' || member.length < 1 || member.length > 64) {
      throw new TypeError('team and member must be bounded strings');
    }
    if (!groups.has(team)) groups.set(team, new Set());
    groups.get(team).add(member);
  }
  return groups;
}

const input = [
  { team: 'blue', member: 'u1' }, { team: 'blue', member: 'u1' },
  { team: 'red', member: 'u2' }, { team: 'blue', member: 'u3' }
];
const groups = buildMemberIndex(input);
assert.deepEqual([...groups.keys()], ['blue', 'red']);
assert.deepEqual([...groups.get('blue')], ['u1', 'u3']);
assert.equal(groups.get('red').size, 1);
assert.throws(() => buildMemberIndex([null]), TypeError);
assert.throws(() => buildMemberIndex(new Array(1)), TypeError);
const report = Array.from(groups, ([team, members]) => ({ team, members: [...members] }));
console.log(JSON.stringify(report));

// Expected output:
// [{"team":"blue","members":["u1","u3"]},{"team":"red","members":["u2"]}]

// Expected O(n) time with conventional Map/Set implementations; O(n) entry storage.
// ECMAScript guarantees average sublinear access, not a universal O(1) bound.

groups.get('blue').add('local-only');
assert.deepEqual(input[0], { team: 'blue', member: 'u1' });
input[0].member = 'changed';
assert.equal(groups.get('blue').has('changed'), false);
assert.equal(buildMemberIndex([{ team: '__proto__', member: 'u1' }]).get('__proto__').has('u1'), true);
assert.equal(buildMemberIndex([]).size, 0);
for (const event of [{ team: '', member: 'u1' }, { team: 'blue', member: 1 }, [], undefined]) {
  assert.throws(() => buildMemberIndex([event]), TypeError);
}
assert.equal(buildMemberIndex(Array(1000).fill({ team: 'blue', member: 'u1' })).get('blue').size, 1);
assert.throws(() => buildMemberIndex(Array(1001).fill({ team: 'blue', member: 'u1' })), RangeError);
