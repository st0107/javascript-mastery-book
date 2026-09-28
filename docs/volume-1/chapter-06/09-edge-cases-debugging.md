# Control Flow: Edge Cases and Debugging

## Missing a While Update

A continue placed before the only increment can make a while loop repeat the same input forever. Keep this demonstration safe by placing the update before the guard:

```js
const values = [0, 2, 0, 4];
let index = 0;
let sum = 0;
while (index < values.length) {
  const value = values[index];
  index++;
  if (value === 0) continue;
  sum += value;
}
console.log(index, sum);
// Expected output:
// 4 6
```

To debug a hanging loop, inspect the condition variables and every continue path. Set a breakpoint at the loop test and confirm that at least one bounded progress measure changes. Do not reproduce an unbounded loop in a shared runtime merely to demonstrate the failure.

## Accidental Fallthrough

```js
const actions = [];
switch ('paid') {
  case 'paid':
    actions.push('payment');
    // Deliberate fallthrough for this demonstration.
  case 'shipped':
    actions.push('shipment');
    break;
}
console.log(actions.join(','));
// Expected output:
// payment,shipment
```

The shipment statement runs even though the discriminant is paid. A real transition handler should return or break unless shared execution is part of the policy. A comment documents intended fallthrough; it does not make unintended behavior correct.

## Sparse Arrays and Extra Properties

```js
const list = [];
list[1] = 'job';
list.note = 'metadata';
const keys = [];
for (const key in list) keys.push(key);
const values = [];
for (const value of list) values.push(String(value));
console.log(keys.join(','));
console.log(values.join(','));
// Expected output:
// 1,note
// undefined,job
```

Different iteration forms traverse different abstractions. Pick one based on the contract; do not assume changing loop syntax preserves which entries are visited.

## Mutating a Collection During Traversal

```js
const queue = ['a'];
const visited = [];
for (const item of queue) {
  visited.push(item);
  if (item === 'a') queue.push('b');
}
console.log(visited.join(','));
// Expected output:
// a,b
```

The ordinary array iterator observes the appended element here. An append on every iteration could prevent completion. A fixed-batch function should establish its no-mutation assumption or use a deliberate snapshot; an evolving queue needs an explicit budget.

## Labels Make the Target Explicit

```js
const accepted = [];
rows:
for (const row of [[1, 2], [3, -1], [4]]) {
  for (const value of row) {
    if (value < 0) continue rows;
  }
  accepted.push(row.join(':'));
}
console.log(accepted.join(','));
// Expected output:
// 1:2,4
```

The labeled continue skips the rest of the outer row iteration. It does not merely continue the inner value loop. A helper returning whether the row is acceptable could express the same policy when it improves readability.

## Debugging Checklist

Build a tiny input containing one normal, one malformed, one cancelled, and one fatal record. Include a record satisfying competing conditions. Record the branch taken and the output length after each visit.

Distinguish an invalid batch from an invalid entry: the production batch rejects a non-array but skips a malformed record. Check mutation separately by comparing input state before and after and by changing a returned record in a test.
