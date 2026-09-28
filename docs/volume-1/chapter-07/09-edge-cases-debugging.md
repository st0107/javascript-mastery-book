# Edge Cases, Debugging, and Failure Modes

## A Newline Changes Return Behavior

```js
'use strict';
function broken() {
  return
  { status: 'ready' };
}
function fixed() {
  return { status: 'ready' };
}
console.log(broken());
console.log(fixed().status);
// Expected output:
// undefined
// ready
```

The newline after return ends the statement. The following braces are not its result expression. Keep the expression on the same line, or put an opening parenthesis there before wrapping a long expression. A linter can catch this pattern before runtime.

## Defaults Cannot Read Later Parameters

```js
'use strict';
function later(first = second, second = 2) { return first + second; }
try { later(); } catch (error) { console.log(error.name); }
console.log(later(1));
// Expected output:
// ReferenceError
// 3
```

At the first default, second is not initialized. Supplying first bypasses that default. Do not silently depend on callers avoiding a fragile initialization path; place the dependency first or compute it in the body.

## A Callback Can Change Shared Inputs

```js
'use strict';
function visit(items, callback) {
  for (const item of items) callback(item);
}
const items = [{ count: 1 }];
visit(items, item => { item.count += 1; });
console.log(items[0].count);
// Expected output:
// 2
```

Passing the item does not clone it. If callbacks should receive snapshots, select and copy the required fields. If they may mutate, document that permission. Copying an array of objects alone does not isolate the objects.

## Extra Arguments Are Observable

Some callback APIs supply a value, index, and collection. A function written for `(text, radix)` can misinterpret that signature. The [callback adaptation exercise](06-exercises-coding-challenges.md#exercise-4-adapt-an-extra-callback-argument) demonstrates a concrete failure. Wrap the target to select the intended arguments rather than relying on matching names.

## Definitions Can Succeed While Calls Fail

```js
'use strict';
const parse = value => value.trim();
console.log(typeof parse);
try { parse(null); } catch (error) { console.log(error.name); }
// Expected output:
// function
// TypeError
```

A file that only defines parse can exit successfully without testing its body. Meaningful tests must invoke the function with accepted inputs, boundaries, and required failure cases. This distinction is why the companion programs contain assertions.

## Debugging Procedure

1. Confirm that the value being called is actually a function.
2. Inspect the supplied values and the receiving signature, including extra callback arguments.
3. Check defaults and whether null was incorrectly treated as omission.
4. Trace the return path; do not confuse console output with a returned value.
5. Draw shared references before blaming parameter reassignment for a mutation.
6. Check whether a method lost its receiver or an arrow captured an unintended one.
7. Separate callback errors from effects already performed; catching does not roll back.
8. For recursion, verify both progress and realistic maximum depth.
