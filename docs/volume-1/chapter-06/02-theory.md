# Control Flow: Theory

## Branches Select Executed Statements

An `if` evaluates its condition and converts the result to Boolean. Only the selected branch executes. An `else if` is another conditional evaluated only after earlier conditions fail. Use explicit comparisons when values such as zero or an empty string are valid data; truthiness alone does not express every domain rule.

```js
const remaining = 0;
let label;
if (remaining < 0) {
  label = 'invalid';
} else if (remaining === 0) {
  label = 'sold out';
} else {
  label = 'available';
}
console.log(label);
console.log(remaining === 0 ? 'disable purchase' : 'allow purchase');
// Expected output:
// sold out
// disable purchase
```

The conditional operator chooses a value. `if` chooses a block of work. Prefer a short conditional expression for a simple assignment, and blocks for validation, multiple effects, or an important policy ordering. Braces prevent accidental ambiguity as branches grow.

## Guard Clauses Reduce Nesting

A guard rejects or returns for an exceptional path before the main work. Guard order still matters: validate shape before reading nested fields, then validate the domain before causing effects.

```js
function shippingLabel(order) {
  if (order === null || typeof order !== 'object') return 'invalid';
  if (order.paid !== true) return 'payment required';
  if (order.shipped === true) return 'already shipped';
  return 'ready';
}
console.log(shippingLabel(null));
console.log(shippingLabel({ paid: true, shipped: false }));
// Expected output:
// invalid
// ready
```

This helper selects a label; it is not a general order schema validator. Production input validation below is stricter. A guard returning false and a guard throwing an error communicate different contracts.

## Switch Uses Strict Matching and Allows Fallthrough

`switch` evaluates its discriminant once and looks for a case using strict-equality matching. After a match, execution continues through statements until an exit; later labels do not automatically stop it. Grouped empty cases can deliberately share a body. A `default` handles unmatched values. [Switch reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch).

```js
function category(status) {
  switch (status) {
    case 'queued':
    case 'running':
      return 'active';
    case 'complete':
      return 'finished';
    default:
      return 'unknown';
  }
}
console.log(category('queued'));
console.log(category('complete'));
console.log(category(1));
// Expected output:
// active
// finished
// unknown
```

Use braces around a case body if it declares a block-scoped variable that would conflict with another case. Labels alone do not create separate scopes. A `return` exits the enclosing function, so it also prevents fallthrough; a `break` exits only the switch.

## Three Loop Schedules

| Loop | Schedule | Good fit |
| --- | --- | --- |
| `for (init; test; update)` | Initialize once; test; body; update; repeat | Counted or indexed traversal |
| `while (test)` | Test; body; repeat | Work controlled by changing state |
| `do { body } while (test)` | Body; test; repeat | A first attempt is required |

A loop's test is checked at its specified point, not continuously while the body executes. A test can be false initially; then `for` and `while` skip their bodies, while `do...while` still runs once. [While](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while), [do...while](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/do...while).

```js
let pretested = 0;
while (false) {
  pretested++;
}
let posttested = 0;
do {
  posttested++;
} while (false);
const visited = [];
for (let index = 0; index < 3; index++) {
  visited.push(index);
}
console.log(pretested, posttested);
console.log(visited.join(','));
// Expected output:
// 0 1
// 0,1,2
```

Write the progress step where every non-exiting path reaches it. In a classic `for` loop, `continue` proceeds to the update expression, then the next test. In a `while` loop, it proceeds to the test; it does not run any skipped update statement in the body. [Continue reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/continue).

```js
const kept = [];
for (let index = 0; index < 4; index++) {
  if (index === 1) continue;
  kept.push(index);
}
console.log(kept.join(','));
// Expected output:
// 0,2,3
```

## Values Versus Property Keys

`for...of` consumes an iterable, such as an array or string. For an ordinary array it visits values; for a string it visits code points. A plain object is not automatically iterable. `for...in` enumerates enumerable string property keys, including inherited ones; it omits symbol keys. [For...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of), [for...in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in).

```js
const stock = Object.create({ inherited: 7 });
stock.own = 3;
const allKeys = [];
for (const key in stock) allKeys.push(key);
const ownValues = [];
for (const key of Object.keys(stock)) ownValues.push(stock[key]);
console.log(allKeys.join(','));
console.log(ownValues.join(','));

const items = ['a', 'b'];
items.note = 'metadata';
const values = [];
for (const item of items) values.push(item);
console.log(values.join(','));
// Expected output:
// own,inherited
// 3
// a,b
```

`Object.keys` supplies own enumerable string keys when that is the intended object traversal. Do not use `for...in` as an array-value loop. A sparse array's ordinary value iterator yields `undefined` for a hole; property enumeration only finds present keys.

`const item` in a `for...of` loop creates a binding for each iteration. It does not freeze an object held by that binding. Copy or construct output records deliberately when shared mutation would be wrong.

## Exits Have Different Targets

| Statement | Target |
| --- | --- |
| `break` | Nearest enclosing loop or switch |
| `continue` | Next iteration of the nearest enclosing loop |
| `return value` | Entire current function call |
| `throw error` | Nearest applicable catch, or outward propagation |
| `break label` | The enclosing statement with that label |
| `continue label` | The enclosing loop with that label |

A labeled break can exit nested loops without an extra flag. Use a descriptive target and keep its scope small. A labeled continue must target a loop; labels are not general-purpose jumps. [Labeled statement reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label).

```js
const shelves = [['empty', 'book'], ['book']];
let found = 'none';
search:
for (let row = 0; row < shelves.length; row++) {
  for (let column = 0; column < shelves[row].length; column++) {
    if (shelves[row][column] === 'book') {
      found = row + ':' + column;
      break search;
    }
  }
}
console.log(found);
// Expected output:
// 0:1
```

A small search function can often `return` the result instead, making a label unnecessary. Use the construct whose target expresses the requirement most clearly.

## Termination and Invariants

A termination argument states what moves toward an exit. For an indexed scan over an unchanged finite array, the index increases until it reaches length. A loop invariant states what remains true at a boundary: before each job iteration, the output contains only valid, non-cancelled normal jobs from the already-visited prefix.

The invariant explains correctness; the progress argument explains termination. Changing the input while traversing it can invalidate both arguments. The production batch treats its input as an unchanged finite list during the synchronous call.
