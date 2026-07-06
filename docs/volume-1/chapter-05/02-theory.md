# Theory

## What This Topic Is

Strings, Numbers, and Dates covers text, numeric data, BigInt, regular expressions, timestamps, and time calculations. The language gives you rules; professional engineering requires knowing why those rules exist and how to apply them consistently.

### String methods and template literals

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain String methods and template literals, start with the observable behavior, then connect that behavior to the underlying execution model.

### Unicode and user-visible text

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Unicode and user-visible text, start with the observable behavior, then connect that behavior to the underlying execution model.

### Regular expression basics

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Regular expression basics, start with the observable behavior, then connect that behavior to the underlying execution model.

### Number and Math objects

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Number and Math objects, start with the observable behavior, then connect that behavior to the underlying execution model.

### BigInt for integer precision

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain BigInt for integer precision, start with the observable behavior, then connect that behavior to the underlying execution model.

### Floating-point precision

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Floating-point precision, start with the observable behavior, then connect that behavior to the underlying execution model.

### Date object, timestamps, formatting, and calculations

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain Date object, timestamps, formatting, and calculations, start with the observable behavior, then connect that behavior to the underlying execution model.

## Why Developers Need It

Real systems are mostly boundary management. Values enter from users, APIs, files, databases, environment variables, and browser events. JavaScript code must transform those values without losing meaning. When developers understand the fundamentals, they avoid the two most expensive categories of bugs: code that accidentally works and code that fails only in edge conditions.

## Common Misconceptions

A string character is not always one UTF-16 code unit, money is not safely represented by arbitrary floating-point arithmetic, and a date without a timezone policy is a future incident report.

Another common mistake is treating the browser, Node.js, and the ECMAScript language as one thing. ECMAScript defines the core language. Hosts provide APIs. Engines implement and optimize execution. Keeping those layers separate makes explanations sharper.

## Trade-offs

The trade-off is usually between brevity and explicitness. JavaScript lets you write compact expressions, dynamic values, and flexible control flow. Professional code should still make important conversions, assumptions, and failure paths visible. Cleverness is useful only when it reduces real complexity.
