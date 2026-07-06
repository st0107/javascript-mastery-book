# Edge Cases, Debugging, and Failure Modes

## Why Edge Cases Matter

Edge cases are compressed lessons. They expose the exact point where a casual mental model stops working and the real JavaScript rule takes over. For Strings, Numbers, and Dates, the important habit is to slow down and ask three questions: what value is actually present, which rule is being applied, and which environment is supplying the surrounding behavior.

In production, edge cases often arrive through data rather than syntax. A form sends an empty string. A URL parameter is missing. A backend sends `null` where an object was expected. A feature flag service omits a nested key. A loop receives a sparse array or a record with inherited properties. The bug is rarely that JavaScript is unpredictable; the bug is usually that the program accepted unclear input and waited too long to clarify it.

## Debugging Playbook

1. Reproduce the behavior with the smallest possible input.
2. Log both the value and its type at the boundary.
3. Separate ECMAScript behavior from browser or Node.js behavior.
4. Identify whether a primitive value, object reference, binding, or host API is involved.
5. Replace implicit assumptions with explicit guards.
6. Add a regression test that names the edge case.

This playbook prevents the most common debugging mistake: explaining the symptom instead of the rule. In an interview, the same discipline makes your answer sound calm and senior. You are not guessing; you are narrowing the execution path.

## Topic-Specific Edge Cases

### String methods and template literals

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For String methods and template literals, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

### Unicode and user-visible text

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For Unicode and user-visible text, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

### Regular expression basics

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For Regular expression basics, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

### Number and Math objects

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For Number and Math objects, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

### BigInt for integer precision

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For BigInt for integer precision, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

### Floating-point precision

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For Floating-point precision, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

### Date object, timestamps, formatting, and calculations

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For Date object, timestamps, formatting, and calculations, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.

## Common Failure Modes

- Boundary drift: parsing is delayed until many functions have already handled the value.
- Silent defaults: missing values are converted into defaults that hide upstream contract breaks.
- Shared mutation: a helper changes caller-owned data and creates action-at-a-distance bugs.
- Host confusion: code assumes a browser API exists in Node.js or a Node.js API exists in the browser.
- Over-compression: clever syntax hides a branch, conversion, or allocation that should be visible.

## Debugging Example

```js
function debugBoundaryValue(label, value) {
  return {
    label,
    value,
    type: typeof value,
    isArray: Array.isArray(value),
    isNull: value === null,
    truthy: Boolean(value)
  };
}
```

This helper is intentionally boring. When debugging fundamentals, boring is a feature. It tells you what the runtime sees before your assumptions reshape the story.

## Interview Drill

Take one topic from this chapter and prepare a two-minute explanation:

1. Define it.
2. Show one production example.
3. Show one edge case.
4. Explain the internal reason.
5. Name the safest professional default.

If your explanation skips the edge case, it sounds memorized. If it skips the production implication, it sounds academic. The strongest answers connect both.
