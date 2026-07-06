# Variables and Data Types

## Introduction

Variables and Data Types matters because bindings, primitive values, reference values, dynamic typing, memory behavior, and variable lifecycle. A professional JavaScript engineer is expected to reason beyond syntax: what the engine creates, what the host environment provides, which values live in memory, and which choices produce maintainable systems.

The recurring misconception is this: `const` does not make an object immutable. It prevents rebinding the variable name. The object behind that binding can still be mutated unless you design against mutation.

In interviews, this topic is a signal. Interviewers are rarely testing whether you can recite trivia. They are testing whether you can predict behavior, communicate trade-offs, and write code that holds up when requirements become less friendly.

## Learning Objectives

By the end of this chapter, you will be able to:

- Explain `var`, `let`, and `const`.
- Explain Primitive types and reference types.
- Explain Dynamic typing.
- Explain `typeof` and its historical quirks.
- Explain Stack and heap mental models.
- Explain Creation, initialization, reassignment, and garbage collection.
- Explain Temporal dead zone and hoisting.
- Draw a memory or execution diagram for the topic.
- Explain browser and Node.js differences where they matter.
- Answer beginner, intermediate, senior, and FAANG-style interview questions confidently.
