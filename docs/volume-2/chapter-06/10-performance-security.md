# Performance and Security Notes

## Count the Work Done Before Each Yield

A generator can defer work without reducing its total cost. Transforming every one of `n` rows still invokes the transformation `n` times if the consumer exhausts the sequence. A consumer that needs only the first matching row may save work, but a filter might inspect the entire source to find it. One request for a result is not necessarily one unit of computation.

Describe a pipeline in terms of inspected input, emitted output, and buffering. For a fixed-cost transformation of `n` inputs with `m` accepted outputs, total work is `O(n)` and a streaming stage can use constant bookkeeping. Collecting the results adds `O(m)` references. A batch of size `b` adds `O(b)` slots, and the actual retained record bytes matter as well. If the source is an existing array, the pipeline may retain that whole array until it finishes or becomes unreachable.

Lazy control flow has its own costs: resumption, result objects, callback calls, and any copying performed at ownership boundaries. Engines may optimize some of those costs; the language does not promise that a generator will beat an array method or a direct loop. Measure the intended workload, including early exits and fully consumed runs, on the actual supported runtime.

## Bound Inspected Inputs, Not Just Accepted Outputs

This search deliberately counts raw values presented by the source. Its limit is an operational policy, not an assertion that a match exists within the budget:

```js
'use strict';
function findWithin(source, predicate, maxInspected) {
  if (!Number.isSafeInteger(maxInspected) || maxInspected < 0 || maxInspected > 1000000) {
    throw new RangeError('Inspection budget must be an integer from 0 through 1000000');
  }
  let inspected = 0;
  if (maxInspected === 0) return { found: false, inspected };
  for (const value of source) {
    inspected += 1;
    if (predicate(value)) return { found: true, value, inspected };
    if (inspected === maxInspected) return { found: false, inspected };
  }
  return { found: false, inspected };
}

let closed = 0;
function* queuedForever() {
  try { while (true) yield 'queued'; }
  finally { closed += 1; }
}
const result = findWithin(queuedForever(), state => state === 'done', 3);
console.log(result.found, result.inspected, closed);
console.log(findWithin(null, () => true, 0).inspected);
// Expected output:
// false 3 1
// 0
```

The zero-budget path intentionally never touches the source or predicate. For positive budgets, both are trusted application collaborators. Returning from the loop closes an active upstream iterator when it offers `return`. The algorithm makes at most the allowed number of predicate calls and never pulls an extra value after reaching that budget. Its own bookkeeping uses constant space; each source step and predicate call can have additional costs.

This bound applies to the source passed directly to the function. If that source is itself a filter, it could do arbitrarily much upstream work before producing one value. A hostile or buggy `next`, iterator getter, predicate, or cleanup method can block synchronously. A counter around them cannot interrupt code that never returns. Enforce expensive-work limits at the layer doing the work; isolating untrusted computation needs a separate execution boundary.

## Yield Does Not Schedule a Browser Paint or Timer

```js
'use strict';
const events = [];
function* work() {
  events.push('producer');
  yield 'result';
  events.push('producer-finished');
}
const cursor = work();
events.push('caller-before');
console.log(cursor.next().value);
events.push('caller-after');
console.log(events.join(','));
cursor.next();
console.log(events.join(','));
// Expected output:
// result
// caller-before,producer,caller-after
// caller-before,producer,caller-after,producer-finished
```

The caller and producer alternate on the same synchronous execution path. A tight consuming loop can keep the thread busy even though the producer yields many times. Cooperative scheduling requires an explicit host or asynchronous mechanism; generators alone do not supply one. Async iterators also need a deliberate work and cancellation policy rather than an assumption that every step is cheap.

## Retention and Ownership Are Separate from Allocation Rate

A suspended generator can keep a resource handle, source array, closure, current batch, or traversal stack reachable. Returning from the generator can release internal execution state, but it does not remove references held by callers or invalidate objects already yielded. Conversely, a fresh batch array can contain references to large shared records. Avoid promising constant memory solely because the producer never builds the final result array.

The [export example](04-production-examples.md) copies a small primitive schema and caps the batch size. That controls the producer's output buffer and prevents later input mutation from rewriting a previously produced row. If consumers retain all batches, their aggregate memory still grows with the export. If the schema later gains nested attachments, revisit both copying cost and ownership.

## Iterating Can Execute Application Code

Obtaining `Symbol.iterator`, calling it, reading a result object, and calling `next` or `return` can run user-defined code. A shape check or a `try...catch` does not make that code safe. These chapter APIs operate on trusted iterables and callbacks; external data should be parsed into a documented data representation before application traversal.

Resource-bearing iterators also expose authority: possession of a cursor may allow reading more data. Closing a cursor can stop future reads under that implementation's contract, but it cannot retract values already delivered. Apply authorization before opening the source and again where the surrounding system's policy requires it. Do not log full records or captured exceptions indiscriminately when instrumenting pulls.

## Benchmark and Review Checklist

- Compare the same results and ownership policy across direct loops, arrays, and lazy pipelines.
- Include early-stopping consumers and full exhaustion; they have different economics.
- Measure peak retained memory as well as throughput and allocation rate.
- Include validation, copying, upstream filtering, and cleanup costs in the measurement.
- Bound input size, batch size, and traversal depth where those quantities control work.
- Keep cleanup deterministic and fast; report its errors under a documented policy.
- Verify runtime support for each optional [iterator helper](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator), rather than inferring it from basic generator support.

The [iteration operations](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-operations-on-iterator-objects) define observable behavior. They do not prescribe object allocation strategies or optimization results for a particular engine build.
