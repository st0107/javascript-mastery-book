# Exercises and Coding Challenges

These six exercises move from individual property rules to copying, controlled state, receiver forwarding, proxy invariants, and revocation. State the accepted object model before writing a helper. The programs use trusted ordinary records created by application code, not hostile proxies or arbitrary class instances.

Every JavaScript block is an independent Node.js 20-or-later program. Run the combined assertion companion with `node code/volume-2/chapter-05/example-03-descriptor-challenges.js`. Attempt each requirement before reading the solution.

## Exercise 1: Fix an Identity Without Freezing the Record

**Requirements:** Implement `createRecord(id)` for an ID matching `R-` followed by one to six decimal digits. Return a fresh ordinary record whose `id` is enumerable, non-writable, and non-configurable. Its `state` begins as `'queued'` and remains writable. Prove that changing the identity and deleting it fail, but changing the state succeeds. Reject coercible non-string inputs.

**Example:** `createRecord('R-7')` exposes the keys `id,state`; setting its state to `'done'` succeeds. Passing `7` throws a `TypeError`.

**Hint:** `Object.defineProperty` defaults omitted flags to false for a new property. Specify the intended flags anyway so the API contract is visible.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function createRecord(id) {
  if (typeof id !== 'string' || !/^R-\d{1,6}$/.test(id)) {
    throw new TypeError('Expected R- followed by one to six digits');
  }
  const record = {};
  Object.defineProperty(record, 'id', {
    value: id, enumerable: true, writable: false, configurable: false
  });
  record.state = 'queued';
  return record;
}

const record = createRecord('R-7');
assert.throws(() => createRecord(7), TypeError);
assert.throws(() => { record.id = 'R-8'; }, TypeError);
assert.equal(Reflect.deleteProperty(record, 'id'), false);
record.state = 'done';
assert.equal(record.state, 'done');
console.log(Object.keys(record).join(','));
const descriptor = Object.getOwnPropertyDescriptor(record, 'id');
console.log(record.id, descriptor.writable, descriptor.configurable);

// Expected output:
// id,state
// R-7 false false
```

**Complexity:** The ID grammar has a bounded accepted size; validation is linear in the inspected input length and the returned object has constant space. The descriptor protects this property's binding to its primitive value. It does not freeze the remaining record or provide an authorization decision.

## Exercise 2: Copy Descriptors Without Running Getters

**Requirements:** Implement a shallow copy for a trusted ordinary record with either `Object.prototype` or `null` as its prototype. Preserve that prototype and every own descriptor, including symbol and non-enumerable properties. Do not invoke a getter while copying. The new object may remain extensible even if the source is not. Demonstrate that referenced arrays remain shared.

**Example:** Copy a record with `count: 2`, a getter `double`, and a non-enumerable symbol. No getter runs during copying. Changing the copy's count to `3` makes its getter return `6`, while the source getter returns `4`.

**Hint:** Copy property descriptors, not property values. This contract deliberately excludes arrays, internal-slot-bearing built-ins, class instances, and untrusted proxies. A prototype check does not detect every proxy.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function copyRecordDescriptors(source) {
  if (source === null || typeof source !== 'object') throw new TypeError('Expected a record');
  const prototype = Object.getPrototypeOf(source);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Unsupported record');
  return Object.create(prototype, Object.getOwnPropertyDescriptors(source));
}

let reads = 0;
const tag = Symbol('tag');
const source = { count: 2, items: [] };
Object.defineProperty(source, 'double', {
  get() { reads += 1; return this.count * 2; }, enumerable: false, configurable: true
});
Object.defineProperty(source, tag, { value: 'internal' });
Object.preventExtensions(source);
const copy = copyRecordDescriptors(source);
assert.equal(reads, 0);
assert.equal(Object.getPrototypeOf(copy), Object.prototype);
assert.equal(copy.items, source.items);
assert.deepEqual(Object.getOwnPropertyDescriptor(copy, tag), Object.getOwnPropertyDescriptor(source, tag));
assert.equal(Object.isExtensible(copy), true);
assert.throws(() => copyRecordDescriptors([]), TypeError);
console.log(reads, Object.keys(copy).includes('double'), copy.items === source.items);
copy.count = 3;
console.log(copy.double, source.double, reads);

// Expected output:
// 0 false true
// 6 4 2
```

**Complexity:** For `k` own keys, ordinary descriptor enumeration and reconstruction take `O(k)` time and space. No nested graph is cloned. Accessor functions are also shared, so a getter that closes over external state can still share that state between the objects. See [Object.getOwnPropertyDescriptors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptors).

## Exercise 3: Keep a Validated Setter on a Frozen Interface

**Requirements:** Implement `createQuota(limit)`. The limit must be a safe integer from `0` through `1,000,000`. Expose a frozen object with an enumerable `remaining` accessor. Assigning a safe integer between zero and the limit changes private closure state; other assignments throw without changing the last valid value. Explain why a successful setter call is compatible with `Object.isFrozen(quota) === true`.

**Example:** A quota created with `5` can change its remaining amount to `3`. Assigning `-1` throws and leaves `3` intact.

**Hint:** Freeze fixes ordinary property descriptors. It does not remove an existing setter or freeze the lexical environment that setter uses.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function createQuota(limit) {
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1_000_000) {
    throw new RangeError('Invalid limit');
  }
  let remaining = limit;
  return Object.freeze({
    get remaining() { return remaining; },
    set remaining(next) {
      if (!Number.isSafeInteger(next) || next < 0 || next > limit) {
        throw new RangeError('Invalid remaining amount');
      }
      remaining = next;
    }
  });
}

const quota = createQuota(5);
assert.equal(Reflect.set(quota, 'remaining', 3), true);
assert.throws(() => { quota.remaining = -1; }, RangeError);
assert.throws(() => { quota.remaining = '2'; }, RangeError);
assert.throws(() => { quota.extra = true; }, TypeError);
assert.throws(() => createQuota(Infinity), RangeError);
assert.equal(quota.remaining, 3);
console.log(Object.isFrozen(quota), quota.remaining);
console.log(typeof Object.getOwnPropertyDescriptor(quota, 'remaining').set);

// Expected output:
// true 3
// function
```

**Complexity:** Each validation and update has constant time and space for this bounded Number domain. This is a fixed interface with controlled mutable state, not an immutable snapshot. That distinction belongs in the API's name and documentation.

## Exercise 4: Trace Reads Without Replacing the Receiver

**Requirements:** Write `traceReads(target, events)` for a trusted ordinary target and an ordinary event array. Append each property key whose read reaches the proxy, then perform the default read with the original receiver. Show that an object inheriting from the proxy supplies its own state to a target getter. Do not claim that the log includes reads resolved directly on the child.

**Example:** The target has `prefix: 'base'` and a `label` getter. A child with its own prefix `'child'` reads `'child!'`. Reading the getter directly through the proxy produces `'base!'`.

**Hint:** `target[key]` supplies the target as the getter's receiver. Forward all three arguments with `Reflect.get` instead.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function traceReads(target, events) {
  return new Proxy(target, {
    get(object, key, receiver) {
      events.push(key);
      return Reflect.get(object, key, receiver);
    }
  });
}

const events = [];
const target = { prefix: 'base', get label() { return this.prefix + '!'; } };
const proxy = traceReads(target, events);
const child = Object.create(proxy);
Object.defineProperty(child, 'prefix', { value: 'child' });
assert.equal(child.label, 'child!');
assert.deepEqual(events, ['label']);
events.length = 0;
console.log(child.label, proxy.label);
console.log(events.join(','));
assert.equal(Reflect.get(proxy, 'label', { prefix: 'explicit' }), 'explicit!');

// Expected output:
// child! base!
// label,label,prefix
```

**Complexity:** The trap adds one append per intercepted read; the getter and prototype lookup still have their own costs. Retaining `r` events takes `O(r)` space. Production diagnostics need a retention bound and must avoid logging sensitive values. [Reflect.get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get) documents the receiver parameter.

## Exercise 5: Filter Keys Without Violating Proxy Invariants

**Requirements:** For a trusted ordinary target, hide configurable own string keys beginning with `_` from `Reflect.ownKeys(view)` while the target is extensible. Always preserve symbols and non-configurable keys. Once the target becomes non-extensible, return its complete own-key list. Direct reads remain possible: this is a display filter, not private storage.

**Example:** A configurable `_draft` key is omitted initially. A non-configurable `_fixed` key remains. After `Object.preventExtensions(target)`, both keys appear.

**Hint:** A proxy cannot omit a non-configurable own key. A non-extensible target requires exactly its actual own keys, without extras or omissions.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function filteredKeys(target) {
  return new Proxy(target, {
    ownKeys(object) {
      const keys = Reflect.ownKeys(object);
      if (!Reflect.isExtensible(object)) return keys;
      return keys.filter(key => typeof key !== 'string' || !key.startsWith('_') ||
        !Reflect.getOwnPropertyDescriptor(object, key).configurable);
    }
  });
}

const tag = Symbol('tag');
const target = { visible: 1, _draft: 'work' };
Object.defineProperty(target, '_fixed', { value: 2, enumerable: true });
target[tag] = 3;
const view = filteredKeys(target);
assert.deepEqual(Reflect.ownKeys(view), ['visible', '_fixed', tag]);
assert.equal(view._draft, 'work');
console.log(Reflect.ownKeys(view).map(String).join(','));
Object.preventExtensions(target);
assert.deepEqual(Reflect.ownKeys(view), Reflect.ownKeys(target));
console.log(Reflect.ownKeys(view).length, view._draft);

// Expected output:
// visible,_fixed,Symbol(tag)
// 4 work
```

**Complexity:** `O(k)` time and temporary space for `k` own keys under the trusted ordinary-object contract. Filtering a key list does not prevent `get`, `in`, or descriptor inspection from observing those properties. Read the [ownKeys invariants](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/ownKeys) before extending this policy.

## Exercise 6: Issue and Revoke a Bounded Counter Lease

**Requirements:** Construct a private null-prototype target with one `count` property. Accept only safe integer counts from `0` through `100`. Issue a proxy that allows validated assignment to `count`, rejects other mutations, and can be revoked explicitly. Reject `defineProperty`, deletion, prototype changes, and preventing extensions. Invalid counts must throw before mutation; unsupported mutations return false through Reflect and therefore throw for corresponding strict assignments. Previously copied numbers remain usable after revocation.

**Example:** A lease beginning at `2` accepts `view.count += 1`. Adding `other` through `Reflect.set` returns false. After revocation, reading `view.count` throws, while the number saved earlier is still `3`.

**Hint:** The set trap may deliberately use the target as the receiver to update this private data slot without re-entering the proxy's blocked `defineProperty` trap. That is a narrow policy for this target shape, not a generally transparent forwarding recipe.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function createCounterLease(initial) {
  function validate(value) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 100) {
      throw new RangeError('Count must be an integer from 0 through 100');
    }
  }
  validate(initial);
  const target = Object.assign(Object.create(null), { count: initial });
  const { proxy, revoke } = Proxy.revocable(target, {
    set(object, key, value) {
      if (key !== 'count') return false;
      validate(value);
      return Reflect.set(object, key, value, object);
    },
    defineProperty() { return false; },
    deleteProperty() { return false; },
    setPrototypeOf() { return false; },
    preventExtensions() { return false; }
  });
  return Object.freeze({ view: proxy, revoke });
}

const { view, revoke } = createCounterLease(2);
view.count += 1;
assert.throws(() => { view.count = 101; }, RangeError);
assert.equal(view.count, 3);
assert.throws(() => Object.defineProperty(view, 'count', { value: 7 }), TypeError);
assert.equal(Reflect.deleteProperty(view, 'count'), false);
assert.equal(Reflect.setPrototypeOf(view, {}), false);
assert.equal(Reflect.preventExtensions(view), false);
console.log(view.count, Reflect.set(view, 'other', 1));
const saved = view.count;
revoke();
revoke();
assert.throws(() => view.count, TypeError);
assert.throws(() => Reflect.ownKeys(view), TypeError);
console.log(saved, 'revoked');

// Expected output:
// 3 false
// 3 revoked
```

**Complexity:** Each supported operation is constant time and the lease stores constant state. Revocation blocks subsequent operations through this proxy; it does not erase copies or revoke other aliases. This construction avoids exposing the target and has no nested objects or callable values to leak. Do not generalize it to arbitrary object graphs without a new contract. See [Proxy.revocable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable).

## Review Questions After Solving

- Which exercise changes property metadata, and which changes data through an accessor?
- Which copies retain shared identities, and which expose only primitives?
- Which traps return false, which deliberately throw, and how does strict mode change the caller's observation?
- Which proxy invariants depend on the target's current descriptor and extensibility state?
- Which helpers trust ordinary input records, and what would an untrusted proxy add to their threat model?
