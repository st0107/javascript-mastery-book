# Production Examples

## Scenario

A job runner processes queued tasks, skips invalid entries, retries transient failures, and stops cleanly when a shutdown signal is received.

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

### Example 1: guard clauses and loop control

File: `code/volume-1/chapter-06/example-01-job-runner.js`

```js
'use strict';

function processJobs(jobs) {
  const processed = [];

  for (const job of jobs) {
    if (job.cancelled) continue;
    if (job.priority === 'fatal') break;

    processed.push({ id: job.id, status: 'processed' });
  }

  return processed;
}

console.log(processJobs([
  { id: 'a', cancelled: false, priority: 'normal' },
  { id: 'b', cancelled: true, priority: 'normal' },
  { id: 'c', cancelled: false, priority: 'fatal' }
]));
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

### Example 2: switch dispatch with explicit defaults

File: `code/volume-1/chapter-06/example-02-switch-dispatch.js`

```js
'use strict';

function reduceOrderState(state, event) {
  switch (event.type) {
    case 'PAID':
      return { ...state, paid: true };
    case 'SHIPPED':
      return { ...state, shipped: true };
    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}

console.log(reduceOrderState({ paid: false, shipped: false }, { type: 'PAID' }));
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

## Best Practices

- Make important assumptions visible in names, guards, and return values.
- Validate data at system boundaries.
- Prefer explicit conversion over accidental coercion.
- Keep functions focused enough to test directly.
- Use immutable updates when shared state would create hidden coupling.
- Write code that a teammate can debug without knowing the original author.

## Common Mistakes

- Trusting external input before parsing it.
- Compressing control flow until failure paths disappear.
- Depending on host-specific APIs inside shared language utilities.
- Mutating objects passed by callers without documenting ownership.
- Hiding performance costs inside innocent-looking helper functions.

## Edge Cases

Edge cases are not interview decorations. They are compressed lessons about the language. When you encounter surprising behavior, ask which specification rule is being applied, which host API is involved, and whether the value came from a trusted or untrusted boundary.
