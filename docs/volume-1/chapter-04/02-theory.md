# Theory

## What This Topic Is

Type Conversion and Coercion covers explicit conversion, implicit conversion, truthiness, equality, and the edge cases interviewers love. The language gives you rules; professional engineering requires knowing why those rules exist and how to apply them consistently.

### Explicit conversion with String, Number, Boolean, and BigInt

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Explicit conversion with String, Number, Boolean, and BigInt, start with the observable behavior, then connect that behavior to the underlying execution model.

### Implicit conversion rules

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Implicit conversion rules, start with the observable behavior, then connect that behavior to the underlying execution model.

### Truthy and falsy values

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Truthy and falsy values, start with the observable behavior, then connect that behavior to the underlying execution model.

### Loose equality versus strict equality

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Loose equality versus strict equality, start with the observable behavior, then connect that behavior to the underlying execution model.

### Abstract relational comparison

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Abstract relational comparison, start with the observable behavior, then connect that behavior to the underlying execution model.

### Object-to-primitive conversion

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Object-to-primitive conversion, start with the observable behavior, then connect that behavior to the underlying execution model.

### Interview edge cases

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Interview edge cases, start with the observable behavior, then connect that behavior to the underlying execution model.

## Why Developers Need It

Real systems are mostly boundary management. Values enter from users, APIs, files, databases, environment variables, and browser events. JavaScript code must transform those values without losing meaning. When developers understand the fundamentals, they avoid the two most expensive categories of bugs: code that accidentally works and code that fails only in edge conditions.

## Common Misconceptions

Coercion is not random. Some results are surprising because the rules are old and permissive, but the rules are still deterministic.

Another common mistake is treating the browser, Node.js, and the ECMAScript language as one thing. ECMAScript defines the core language. Hosts provide APIs. Engines implement and optimize execution. Keeping those layers separate makes explanations sharper.

## Trade-offs

The trade-off is usually between brevity and explicitness. JavaScript lets you write compact expressions, dynamic values, and flexible control flow. Professional code should still make important conversions, assumptions, and failure paths visible. Cleverness is useful only when it reduces real complexity.
