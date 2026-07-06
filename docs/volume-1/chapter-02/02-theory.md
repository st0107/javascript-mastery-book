# Theory

## What This Topic Is

Variables and Data Types covers bindings, primitive values, reference values, dynamic typing, memory behavior, and variable lifecycle. The language gives you rules; professional engineering requires knowing why those rules exist and how to apply them consistently.

### var, let, and const

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain var, let, and const, start with the observable behavior, then connect that behavior to the underlying execution model.

### Primitive types and reference types

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Primitive types and reference types, start with the observable behavior, then connect that behavior to the underlying execution model.

### Dynamic typing

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Dynamic typing, start with the observable behavior, then connect that behavior to the underlying execution model.

### typeof and its historical quirks

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain typeof and its historical quirks, start with the observable behavior, then connect that behavior to the underlying execution model.

### Stack and heap mental models

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Stack and heap mental models, start with the observable behavior, then connect that behavior to the underlying execution model.

### Creation, initialization, reassignment, and garbage collection

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Creation, initialization, reassignment, and garbage collection, start with the observable behavior, then connect that behavior to the underlying execution model.

### Temporal dead zone and hoisting

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Temporal dead zone and hoisting, start with the observable behavior, then connect that behavior to the underlying execution model.

## Why Developers Need It

Real systems are mostly boundary management. Values enter from users, APIs, files, databases, environment variables, and browser events. JavaScript code must transform those values without losing meaning. When developers understand the fundamentals, they avoid the two most expensive categories of bugs: code that accidentally works and code that fails only in edge conditions.

## Common Misconceptions

`const` does not make an object immutable. It prevents rebinding the variable name. The object behind that binding can still be mutated unless you design against mutation.

Another common mistake is treating the browser, Node.js, and the ECMAScript language as one thing. ECMAScript defines the core language. Hosts provide APIs. Engines implement and optimize execution. Keeping those layers separate makes explanations sharper.

## Trade-offs

The trade-off is usually between brevity and explicitness. JavaScript lets you write compact expressions, dynamic values, and flexible control flow. Professional code should still make important conversions, assumptions, and failure paths visible. Cleverness is useful only when it reduces real complexity.
