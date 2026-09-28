# Performance and Security

## Count the Work Inside the Operands

A logical operator performs a small selection, but its operands may search collections, allocate strings, or invoke application code. `enabled && allowedIds.includes(id)` avoids the search when enabled is falsy. When enabled is true, searching n IDs is O(n) in the worst case; comparing each string also depends on ID length.

The production gate bounds both list length and ID length. Its complete validation pass precedes the staff shortcut because malformed configuration must deny everyone. Moving staff first changes that policy. Performance work must preserve decisions as well as happy-path results.

For repeated lookups against one stable configuration, validating once and building a Set may pay off. Construction consumes O(n) storage; rebuilding on every request loses the benefit. Define configuration ownership and invalidation before retaining such an index. ECMAScript requires average sublinear Set access, not one particular hash-table implementation or a universal constant-time guarantee. See [Set performance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#performance).

## Lazy Defaults Avoid Unneeded Work

```js
let builds = 0;
function buildDefault() { builds += 1; return { retries: 3 }; }
const supplied = { retries: 0 };
const selected = supplied ?? buildDefault();
console.log(selected === supplied);
console.log(builds);
const fallback = null ?? buildDefault();
console.log(fallback.retries, builds);

// Expected output:
// true
// 0
// 3 1
```

This is useful when a fallback requires work. It does not imply every allocation should become a cache. Reusing a mutable fallback can create shared state; building a fresh record can be the correct ownership choice.

## Avoid Unproven Numeric Micro-optimizations

`value | 0` and `~~value` convert to signed 32-bit values. They can wrap, truncate, or turn NaN into zero. Applying them to pagination, money, or identifiers changes accepted values. Choose a validation contract first, then measure the actual workload.

String concatenation may copy or defer copying depending on engine strategy. BigInt arithmetic depends on operand magnitude. Do not label every + operation constant-time simply because the source contains one operator. Bounded Number arithmetic is a useful constant-cost model here; arbitrary strings and integers need size-aware reasoning.

## Defaults Can Change Access Decisions

Security-sensitive flags should be booleans from a trusted source. The string "false" is truthy, so a guard such as `if (input.enabled)` can enable an operation the sender appeared to disable. The chapter's gate requires `enabled === true` and `active === true`; malformed shapes deny access.

A missing allowlist needs a named policy. Falling back to true, or placing `|| true` after membership testing, can grant access when data is absent. An empty list denies ordinary members. A trusted staff bypass is a separate explicit policy, not a reason to trust a role submitted by a browser.

These guards operate on ordinary application data. Getters and proxies can run code during reads; shape checking is not a sandbox for arbitrary JavaScript objects. Bound serialized request size before parsing and obtain identity/roles from the authentication layer.

## Keep Decisions Reviewable

Split an access expression when a reviewer cannot identify each condition. Name predicates when that clarifies policy, and preserve short-circuiting when a later operation depends on an earlier guard. Do not reorder effectful getters or callbacks based only on apparent cost.

Measure the complete request or batch with representative enabled/disabled ratios and list sizes. Repeated addition of constants says little about real validation, search, and I/O costs.
