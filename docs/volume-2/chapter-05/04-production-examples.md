# Production Examples

## An Owned Export Configuration

An export service accepts exactly two root fields: `format`, either `'csv'` or `'json'`, and `options`. Options contain exactly `maxRows`, an integer from 1 through 100,000, and `includeHeader`, a boolean. Unknown string or symbol keys, missing fields, accessors, and unsupported prototypes are rejected. Accepted inputs are trusted ordinary application records with `Object.prototype` or `null` as their prototype; this is not a proxy detector or a sandbox for hostile JavaScript objects.

The output must be independent of later input mutation. The implementation reads own data descriptors, validates primitive values, builds new null-prototype records, and freezes both levels. It does not recursively freeze caller-owned objects. Using descriptor inspection avoids invoking ordinary input getters; a proxy could still execute traps during that inspection and is outside this input contract.

```js
'use strict';


function readDataRecord(input, keys, label) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError(`${label} must be an ordinary data record`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} has an unsupported prototype`);
  }
  if (Reflect.ownKeys(input).length !== keys.length) {
    throw new TypeError(`${label} has unexpected or missing fields`);
  }
  const values = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label}.${key} must be an own data property`);
    }
    values[key] = descriptor.value;
  }
  return values;
}

function createExportConfig(input) {
  const { format, options } = readDataRecord(input, ['format', 'options'], 'config');
  const { maxRows, includeHeader } = readDataRecord(
    options, ['maxRows', 'includeHeader'], 'options'
  );
  if (format !== 'csv' && format !== 'json') throw new RangeError('Unsupported format');
  if (!Number.isInteger(maxRows) || maxRows < 1 || maxRows > 100000) {
    throw new RangeError('maxRows must be an integer from 1 through 100000');
  }
  if (typeof includeHeader !== 'boolean') throw new TypeError('includeHeader must be boolean');

  const ownedOptions = Object.freeze(Object.assign(Object.create(null), { maxRows, includeHeader }));
  return Object.freeze(Object.assign(Object.create(null), { format, options: ownedOptions }));
}

const source = { format: 'csv', options: { maxRows: 500, includeHeader: true } };
const config = createExportConfig(source);
source.options.maxRows = 1;
console.log(config.format, config.options.maxRows, config.options.includeHeader);
console.log(Object.isFrozen(config), Object.isFrozen(config.options));
console.log(config.options === source.options);
try {
  config.options.maxRows = 2;
} catch (error) {
  console.log(error.name);
}
// Expected output:
// csv 500 true
// true true
// false
// TypeError
```

### Why the Boundary Holds

The key-count check is combined with a descriptor check for every required name. Counting alone would accept a wrong key set of the same size. Each accepted leaf is a primitive, so copying those leaves and the two containers detaches the entire supported graph. The null prototypes keep inherited setters and names out of these output records. Freezing then prevents replacing, adding, or deleting their own data fields.

`Number.isInteger` is sufficient here because the accepted range is far inside the safe-integer range. It is combined with a finite upper bound, so `Infinity`, unsafe large values, fractions, numeric strings, and `NaN` fail. Non-enumerable data fields are accepted when their names and values satisfy the contract; symbols are rejected as additional fields.

The companion `code/volume-2/chapter-05/example-01-owned-config.js` asserts both endpoints, invalid numeric values, missing/extra fields, symbol keys, accessor rejection without getter calls, unsupported prototypes, detached identity, and strict mutation failures. Inspect [own property descriptors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor) before extending the schema.

**Cost:** Inspecting `k` input own keys takes `O(k)` time and temporary space. Successful inputs have fixed field counts and the returned graph has constant size. For much larger input, enforce payload limits before constructing or reflecting on the object. A valid configuration still does not authorize an export or enforce its row limit inside a separate worker; the consumer must honor the configuration contract.

## A Revocable Progress View

An owner manages one job's progress. Observers receive a view with only `jobId`, `state`, and `progress` primitive values. The owner can advance progress monotonically from zero through 100 or release the view. Observers cannot write, define, delete, change the prototype, or prevent extensions through the view. The target stays private and has no nested objects or callable members to escape.

```js
'use strict';


function createProgressView(jobId) {
  if (typeof jobId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(jobId)) {
    throw new TypeError('jobId must contain 1-64 identifier characters');
  }
  const target = Object.assign(Object.create(null), { jobId, state: 'queued', progress: 0 });
  let released = false;
  const deny = () => false;
  const { proxy, revoke } = Proxy.revocable(target, {
    get(object, key, receiver) { return Reflect.get(object, key, receiver); },
    set: deny,
    defineProperty: deny,
    deleteProperty: deny,
    setPrototypeOf: deny,
    preventExtensions: deny
  });

  return Object.freeze({
    view: proxy,
    advance(next) {
      if (released) throw new Error('Progress view has been released');
      if (!Number.isInteger(next) || next < target.progress || next > 100) {
        throw new RangeError('Progress must be a nondecreasing integer through 100');
      }
      target.progress = next;
      target.state = next === 100 ? 'complete' : next === 0 ? 'queued' : 'running';
      return next;
    },
    release() {
      if (released) return false;
      released = true;
      revoke();
      return true;
    }
  });
}

const owner = createProgressView('export-17');
const observer = owner.view;
owner.advance(25);
console.log(observer.jobId, observer.state, observer.progress);
console.log(Reflect.set(observer, 'progress', 99));
console.log(Reflect.defineProperty(observer, 'progress', { value: 99 }));
owner.advance(100);
const saved = observer.progress;
console.log(owner.release(), owner.release());
try {
  console.log(observer.progress);
} catch (error) {
  console.log(error.name);
}
console.log(saved);
// Expected output:
// export-17 running 25
// false
// false
// true false
// TypeError
// 100
```

### Mutable Owner, Restricted Observer

The owner updates its private ordinary target directly. Denial traps affect operations through the proxy; they do not make the target frozen. Descriptor inspection honestly reports writable data properties because those descriptors belong to the target. The operation policy nevertheless rejects writes made through the view. Reporting forged non-writable/non-configurable descriptors would introduce unnecessary invariant problems.

Returning false from these traps produces false for the corresponding Reflect calls. Strict assignments and `Object.defineProperty` convert rejection to an exception. Rejecting `preventExtensions` also prevents an observer from freezing or sealing the target through the proxy. The target remains extensible, and the missing inspection traps truthfully forward its status.

Release is idempotent at the owner API: the first call returns true, later calls return false. Future owner advances fail, and future forwarded operations through the proxy throw. A copied progress number remains usable. The owner's retained closure and previously copied values are not erased; revocation is a lifecycle operation, not retroactive secrecy or a promise of garbage collection. See [Proxy.revocable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable).

**Cost:** The schema has fixed size. Each supported operation uses constant bookkeeping under the ordinary-target contract. A caller can retain the view or owner as long as it likes; releasing the view does not force collection. If a future revision exposes a collection or method, revisit the whole boundary rather than assuming the shallow proxy continues to restrict the reachable graph.

The companion `code/volume-2/chapter-05/example-02-revocable-view.js` checks all denied mutation routes, progress validation without partial changes, extracted owner methods, descriptor-copy isolation, repeated release, and post-release access. An explicit `getSnapshot()` API is often simpler when observers only need occasional copies; a proxy is justified here by a deliberate property-read interface.
