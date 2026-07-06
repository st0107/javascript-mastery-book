# Exercises and Coding Challenges

## Easy

Problem: Write a small function that demonstrates one rule from Variables and Data Types. Include one valid input and one invalid or edge input.

Hint: Keep the function pure so the result is easy to test.

Solution:

```js
function describeValue(value) {
  return {
    value,
    type: typeof value,
    truthy: Boolean(value)
  };
}
```

Complexity: `O(1)` time and `O(1)` space.

## Medium

Problem: Build a validation helper for data entering a production service.

Hint: Parse first, validate second, and return a normalized value.

Solution:

```js
function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}
```

Complexity: `O(n)` time for trimming a string of length `n`, `O(n)` space for the normalized string.

## Hard

Problem: Refactor a function with hidden mutation into a function that returns a new result without modifying caller-owned objects.

Hint: Treat ownership as part of the function contract.

Solution:

```js
function markOrderReviewed(order, reviewerId) {
  return {
    ...order,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString()
  };
}
```

Complexity: `O(k)` time and space where `k` is the number of enumerable properties copied from the order.

## FAANG-Level

Problem: Given an array of event records, normalize the valid records, skip recoverable invalid records, and stop processing on a fatal event. Explain each control-flow decision and memory allocation.

Optimal Solution:

```js
function normalizeEvents(events) {
  const normalized = [];

  for (const event of events) {
    if (event.type === 'fatal') break;
    if (typeof event.id !== 'string') continue;

    normalized.push({
      id: event.id,
      type: String(event.type ?? 'unknown')
    });
  }

  return normalized;
}
```

Complexity: `O(n)` time and `O(m)` space, where `n` is the number of input events and `m` is the number of retained events.

Brute force would copy every event first and filter later, wasting memory. A better solution validates as it iterates. The optimal solution above validates, normalizes, and exits early in one pass.
