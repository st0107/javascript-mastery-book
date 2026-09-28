# Control Flow: Interview Perspective

## Beginner: Trace Continue and Break

```js
const seen = [];
for (let index = 0; index < 6; index++) {
  if (index === 2) continue;
  if (index === 4) break;
  seen.push(index);
}
console.log(seen.join(','));
// Expected output:
// 0,1,3
```

At 2, continue skips the append but still reaches the for update. At 4, break exits the loop before appending. Index 5 is never visited. A good explanation names both the skipped statements and the next executed step.

## Intermediate: A Switch Inside a Loop

```js
const seen = [];
for (const value of ['skip', 'keep']) {
  switch (value) {
    case 'skip':
      break;
    default:
      seen.push('case');
  }
  seen.push('after');
}
console.log(seen.join(','));
// Expected output:
// after,case,after
```

The break exits the switch, so code after the switch still runs. If the intended policy is to skip the rest of the loop iteration, use continue in that context. If the policy is to leave the whole function, return expresses that target.

## Intermediate: Values or Keys?

For an array of jobs, use `for...of` for values. For a dictionary, use `Object.keys` or `Object.entries` for own enumerable properties. `for...in` also considers inherited enumerable string keys, which can be surprising for data processing.

Follow-up: "Does const inside for...of make a job immutable?" No. Each iteration has a binding whose object can still be mutated. Show whether the output should retain the original object or create a separate result.

## Senior: Review a Batch Policy

State the precedence explicitly: malformed records are skipped; valid fatal markers stop; other cancelled jobs are skipped; remaining normal jobs become outputs. Then prove the invariant: every result corresponds to a valid, normal, non-cancelled record before the first valid fatal marker.

A useful test contains a cancelled fatal record followed by a normal record. If the normal record is processed, the implementation ignored the intended stop policy.

## Design Challenge: Termination Under Mutation

A loop appends to the same array it is traversing. Ask whether newly appended items are part of the work set. Without a fixed snapshot or explicit count budget, an iterator can observe continuing growth and fail to finish.

For a fixed batch, forbid mutation during traversal or process a snapshot according to a documented shallow-copy policy. For a queue, design an explicit stopping condition, maximum work budget, and scheduling boundary. Calling a growing queue "just an array loop" hides those requirements.

## How to Explain Complexity

Count visited records and output records. An early break improves some inputs but does not remove the worst-case linear scan. Nested loops over a rectangular matrix with r rows and c columns visit at most r times c cells; ragged matrices are better described by total cell count plus row overhead.

Do not claim that switch is always faster than if. Runtime strategy and workload determine performance; branch correctness comes first.
