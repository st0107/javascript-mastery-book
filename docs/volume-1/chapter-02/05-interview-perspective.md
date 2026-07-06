# Interview Perspective

## How To Answer Confidently

Start with the plain-language rule. Give a small example. Explain what the engine or host does internally. Then name the practical trade-off. This four-step answer pattern works for almost every JavaScript fundamentals question:

1. Observable behavior.
2. Why the rule exists.
3. Internal model.
4. Production implication.

## Beginner Questions

- What is var, let, and const, and when would you use it?
- What is Primitive types and reference types, and when would you use it?
- What is Dynamic typing, and when would you use it?
- What is typeof and its historical quirks, and when would you use it?

## Intermediate Questions

- What bugs can appear when a developer misunderstands Dynamic typing?
- What bugs can appear when a developer misunderstands typeof and its historical quirks?
- What bugs can appear when a developer misunderstands Stack and heap mental models?
- What bugs can appear when a developer misunderstands Creation, initialization, reassignment, and garbage collection?

## Senior Questions

- How would you teach this topic to a team that keeps shipping bugs in this area?
- Which trade-offs would you document in a shared utility or style guide?
- How would you design tests that prove edge cases are handled?

## FAANG Questions

- Predict the output of a short program and explain every step.
- Refactor a brittle implementation into a readable production version.
- Explain browser and Node.js differences without mixing host APIs with language rules.
- Identify which values live in local bindings, heap objects, or preserved lexical environments.

## Whiteboard Prompt

Draw the flow from source code to execution. Include parsing, scope creation, evaluation, memory references, and the relevant host environment.

## Follow-up Questions

- What changes if this code runs in strict mode?
- What changes if the value arrives from a form, URL, database, or environment variable?
- What would you measure before optimizing this code?
- What security issue appears if the input is controlled by an attacker?

## Interviewer Expectations

Interviewers expect precise vocabulary, not theatrical detail. Use terms like binding, reference, primitive value, object, execution context, iterable, truthy, falsy, and host API accurately. If you do not remember a corner case, say the rule you do know and reason from it.
