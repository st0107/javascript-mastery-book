# Production Examples

## Build a Detached Paid-Order Summary

A report accepts at most 1000 ordinary order records. Every index must be present. Each record requires a unique nonempty ID of at most 64 characters, status paid/pending/cancelled, and an integer-cent amount from zero through 100,000,000. Unknown fields are ignored.

The function validates every record, including records later excluded from the report. It sorts paid orders by descending amount, then by ID code-unit order for a deterministic tie break. It returns fresh item records containing only primitive fields and does not mutate or retain caller-owned records.

```js
'use strict';
const assert = require('node:assert/strict');

function summarizeOrders(input) {
  if (!Array.isArray(input)) throw new TypeError('orders must be an array');
  if (input.length > 1000) throw new RangeError('at most 1000 orders');
  const seen = new Set();
  const normalized = [];
  for (let index = 0; index < input.length; index += 1) {
    if (!Object.hasOwn(input, index)) throw new TypeError('orders must be dense');
    const row = input[index];
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new TypeError('order must be a data record');
    }
    const { id, status, amountCents } = row;
    if (typeof id !== 'string' || id.length < 1 || id.length > 64) {
      throw new TypeError('order id must be a bounded string');
    }
    if (!['paid', 'pending', 'cancelled'].includes(status)) throw new RangeError('unknown status');
    if (!Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > 100000000) {
      throw new RangeError('amountCents out of range');
    }
    if (seen.has(id)) throw new RangeError('duplicate order id');
    seen.add(id);
    normalized.push({ id, status, amountCents });
  }
  const paid = normalized.filter(row => row.status === 'paid');
  const ordered = paid.toSorted((a, b) =>
    b.amountCents - a.amountCents || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  return {
    paidCount: ordered.length,
    totalCents: ordered.reduce((sum, row) => sum + row.amountCents, 0),
    items: ordered.map(({ id, amountCents }) => ({ id, amountCents }))
  };
}

const input = [
  { id: 'b', status: 'paid', amountCents: 500 },
  { id: 'a', status: 'paid', amountCents: 500 },
  { id: 'c', status: 'pending', amountCents: 900 }
];
const result = summarizeOrders(input);
assert.deepEqual(result, {
  paidCount: 2, totalCents: 1000,
  items: [{ id: 'a', amountCents: 500 }, { id: 'b', amountCents: 500 }]
});
assert.deepEqual(input.map(row => row.id), ['b', 'a', 'c']);
assert.notEqual(result.items[0], input[1]);
assert.throws(() => summarizeOrders(new Array(1)), TypeError);
assert.throws(() => summarizeOrders([input[0], input[0]]), RangeError);
console.log(JSON.stringify(result));
console.log(JSON.stringify(summarizeOrders([])));

// Expected output:
// {"paidCount":2,"totalCents":1000,"items":[{"id":"a","amountCents":500},{"id":"b","amountCents":500}]}
// {"paidCount":0,"totalCents":0,"items":[]}

// O(n) scans plus sorting cost S(p), under usual expected Set lookup costs.
// O(n) owned records/index storage plus the sort implementation's workspace.
```

The first loop establishes the complete input contract and creates owned normalized records. filter selects by status; toSorted preserves the paid array's order while creating a sorted result; map projects output fields; reduce produces the total from an explicit zero accumulator.

With 1000 orders and at most 100,000,000 cents per order, the maximum total is 100,000,000,000 cents. It remains an exact safe integer. Increasing either bound requires reviewing that product. These are integer-cent inputs; accepting decimal currency strings would need a separate parser and rounding policy.

The output is detached for the stated primitive-field schema, not recursively cloned arbitrary data. A caller may edit result.items without changing the source order records. Unknown nested metadata is deliberately omitted.

Companion: `code/volume-1/chapter-09/example-01-order-summary.js`. It also asserts both ownership directions, all invalid root shapes, unsafe/nonintegral amounts, invalid excluded records, duplicate IDs, and both batch-size boundaries.

## Build a Team-to-Member Index

A membership report receives at most 1000 dense events. Each event contains a team string of length 1 through 40 and a member string of length 1 through 64. Values are case-sensitive opaque labels; the function does not trim or normalize identities.

The result is a new Map from team to a new Set of member IDs. Teams and members retain first-seen order. Duplicate membership events are intentionally idempotent. No input event object is retained.

```js
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
```

A Map models the grouping key directly; each Set models unique membership. Updating an existing team does not move its insertion position. Using a Set of event objects would not deduplicate two distinct objects with equal team/member text.

The returned Map and Sets are mutable and owned by the caller. That is an explicit API choice: callers can extend their local index without altering input records. The report projection creates arrays suitable for JSON output; JSON.stringify on a Map itself would not serialize entries as this report expects.

Companion: `code/volume-1/chapter-09/example-02-member-index.js`. Assertions cover duplicate events, "__proto__" as ordinary entry data, input/output independence, empty input, holes, invalid labels, and the 1000-event bound.

## Failure and Trust Contracts

Both functions reject malformed batches rather than silently dropping bad records. Local temporary collections become unreachable when a validation error escapes, and inputs remain unchanged. The caller can decide how to report a rejected batch; the helpers do not log raw records or perform external writes.

Inputs are ordinary application data, typically produced by parsing a supported format. Reading a getter or iterating a proxy can run arbitrary JavaScript; these functions are not object sandboxes. The explicit own-index checks ensure a dense data contract, while request-size limits must also be enforced before deserialization.

## Trade-offs to Review

The order example favors visible stages and ownership over minimizing temporary arrays. Its input is bounded to 1000 items. For a measured memory bottleneck, a single loop may combine projection, selection, and aggregation while preserving validation of every item. Sorting still needs the selected items.

The membership index retains at most the accepted batch's keys and members. A service-wide persistent index needs independent lifetime, eviction, and update policies. Map and Set make collection operations explicit; they do not provide those policies automatically.

Read [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) for entry semantics, and [toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted) for the copying sort behavior.
