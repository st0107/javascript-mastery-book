const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const volumeDir = path.join(root, 'docs', 'volume-1');
const codeDir = path.join(root, 'code', 'volume-1');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${content.trim()}\n`, 'utf8');
}

function link(chapter, file) {
  return `${chapter}/${file}`;
}

const chapters = [
  {
    id: 'chapter-01',
    title: 'Introduction to JavaScript',
    short: 'Introduction',
    focus: 'the language, its history, the ECMAScript standard, and the environments that execute JavaScript',
    topics: [
      'History and evolution of JavaScript',
      'ECMAScript and the TC39 process',
      'Browser JavaScript versus Node.js',
      'The JavaScript ecosystem',
      'Where JavaScript runs',
      'JavaScript engines and runtime architecture',
      'Browser architecture at a practical level',
      'How interviewers evaluate JavaScript fundamentals'
    ],
    misconception: 'JavaScript is often dismissed as a small scripting language. In practice, it is a standardized, aggressively optimized language that sits inside browsers, servers, CLIs, edge runtimes, desktop apps, and embedded systems.',
    productionStory: 'A checkout team ships the same pricing validation rules to the browser for immediate feedback and to Node.js on the server for authoritative enforcement.',
    browser: 'In the browser, JavaScript is hosted by the window or worker environment. The engine executes ECMAScript, while browser APIs provide DOM access, networking, storage, timers, rendering coordination, and security boundaries such as same-origin policy.',
    node: 'In Node.js, JavaScript runs with APIs for files, streams, processes, buffers, cryptography, diagnostics, and networking. There is no DOM by default, and modules are loaded through CommonJS or native ECMAScript modules depending on project configuration.',
    diagram: `flowchart LR
  Source[JavaScript source] --> Parser[Parser]
  Parser --> AST[AST]
  AST --> Bytecode[Interpreter bytecode]
  Bytecode --> Feedback[Runtime feedback]
  Feedback --> Optimizer[JIT optimizer]
  Optimizer --> MachineCode[Optimized machine code]
  Browser[Browser APIs] --> Runtime[Host runtime]
  Node[Node.js APIs] --> Runtime
  MachineCode --> Runtime`,
    flow: `flowchart TD
  A[Requirement] --> B{Needs browser capability?}
  B -->|DOM, UI, storage| C[Browser runtime]
  B -->|Files, processes, backend I/O| D[Node.js runtime]
  C --> E[ECMAScript language rules]
  D --> E
  E --> F[Engine executes code]`,
    examples: [
      {
        name: 'example-01-runtime-detection.js',
        title: 'runtime capability detection',
        code: `'use strict';

function getRuntimeCapabilities() {
  const hasWindow = typeof window !== 'undefined';
  const hasProcess = typeof process !== 'undefined' && Boolean(process.versions?.node);

  return {
    runtime: hasWindow ? 'browser' : hasProcess ? 'node' : 'unknown',
    canUseDom: hasWindow && typeof document !== 'undefined',
    canUseFileSystem: hasProcess
  };
}

console.log(getRuntimeCapabilities());
`
      },
      {
        name: 'example-02-shared-validation.js',
        title: 'shared validation in browser and Node.js',
        code: `'use strict';

function validateCheckoutAmount(amountInCents) {
  if (!Number.isInteger(amountInCents)) {
    throw new TypeError('Checkout amount must be an integer number of cents.');
  }

  if (amountInCents <= 0) {
    throw new RangeError('Checkout amount must be positive.');
  }

  return { amountInCents, valid: true };
}

console.log(validateCheckoutAmount(2599));
`
      }
    ]
  },
  {
    id: 'chapter-02',
    title: 'Variables and Data Types',
    short: 'Variables',
    focus: 'bindings, primitive values, reference values, dynamic typing, memory behavior, and variable lifecycle',
    topics: [
      '`var`, `let`, and `const`',
      'Primitive types and reference types',
      'Dynamic typing',
      '`typeof` and its historical quirks',
      'Stack and heap mental models',
      'Creation, initialization, reassignment, and garbage collection',
      'Temporal dead zone and hoisting'
    ],
    misconception: '`const` does not make an object immutable. It prevents rebinding the variable name. The object behind that binding can still be mutated unless you design against mutation.',
    productionStory: 'A payment service normalizes incoming JSON into stable, explicit bindings before calculating risk scores and writing audit records.',
    browser: 'Browser code tends to hold references to DOM nodes, event objects, cached data, and component state. Long-lived references can accidentally prevent garbage collection, especially when closures keep detached nodes reachable.',
    node: 'Node.js services often keep module-level configuration and connection pools alive for the lifetime of the process. Per-request data should stay request-local so one user request cannot leak into another.',
    diagram: `flowchart TB
  subgraph Stack["Execution context / stack-like records"]
    orderId["orderId -> 'A-42'"]
    cartRef["cart -> #obj1"]
  end
  subgraph Heap["Heap"]
    obj1["#obj1 { items, total }"]
    arr1["items -> #arr1"]
  end
  cartRef --> obj1
  obj1 --> arr1`,
    flow: `flowchart TD
  A[Declaration is parsed] --> B[Binding is created]
  B --> C{Declaration kind}
  C -->|var| D[Initialized to undefined]
  C -->|let / const| E[Uninitialized TDZ]
  D --> F[Execution reaches assignment]
  E --> F
  F --> G[Value stored or reference assigned]`,
    examples: [
      {
        name: 'example-01-const-object-mutation.js',
        title: 'const binding versus object mutation',
        code: `'use strict';

const account = {
  id: 'acct_100',
  status: 'active'
};

account.status = 'suspended';

console.log(account);
`
      },
      {
        name: 'example-02-type-guards.js',
        title: 'production type guards',
        code: `'use strict';

function normalizeUser(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('Expected a user object.');
  }

  const { id, email } = input;

  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new TypeError('User id and email must be strings.');
  }

  return { id, email: email.toLowerCase() };
}

console.log(normalizeUser({ id: 'U-1', email: 'LEA@EXAMPLE.COM' }));
`
      }
    ]
  },
  {
    id: 'chapter-03',
    title: 'Operators and Expressions',
    short: 'Operators',
    focus: 'how JavaScript combines values, evaluates expressions, and decides precedence',
    topics: [
      'Arithmetic, assignment, comparison, logical, and bitwise operators',
      'Conditional expressions',
      'Optional chaining',
      'Nullish coalescing',
      'Short-circuit evaluation',
      'Operator precedence and associativity',
      'Expression design for readable production code'
    ],
    misconception: 'Operators are not just syntax sugar. Many operators perform coercion, short-circuit evaluation, property access, or assignment side effects, so reading them as simple arithmetic symbols leads to wrong conclusions.',
    productionStory: 'A feature flag service combines user attributes, rollout percentages, defaults, and null-safe configuration access without crashing when optional nested data is absent.',
    browser: 'Browser code frequently uses optional chaining around feature detection, DOM queries, and configuration loaded from script tags. The main risk is silently accepting missing elements when the application should fail loudly.',
    node: 'Node.js code often combines environment variables, parsed configuration, and defaults. Nullish coalescing is usually safer than `||` when `0`, empty strings, or `false` are valid values.',
    diagram: `flowchart LR
  A[Expression] --> B[Operands]
  A --> C[Operator]
  C --> D{May short-circuit?}
  D -->|Yes| E[Skip later operand]
  D -->|No| F[Evaluate all required operands]
  F --> G[Result value]
  E --> G`,
    flow: `flowchart TD
  A[Read expression] --> B[Apply precedence]
  B --> C[Apply associativity]
  C --> D[Evaluate operands left to right where required]
  D --> E[Apply operator semantics]
  E --> F[Return value or assign result]`,
    examples: [
      {
        name: 'example-01-nullish-config.js',
        title: 'safe configuration defaults',
        code: `'use strict';

function resolveRetryPolicy(config) {
  return {
    retries: config.retries ?? 3,
    timeoutMs: config.timeoutMs ?? 1500,
    enabled: config.enabled ?? true
  };
}

console.log(resolveRetryPolicy({ retries: 0, enabled: false }));
`
      },
      {
        name: 'example-02-feature-gate.js',
        title: 'logical operators in feature gates',
        code: `'use strict';

function canAccessBeta(user, feature) {
  return Boolean(
    user?.active &&
      feature?.enabled &&
      (user.role === 'staff' || feature.allowedUserIds.includes(user.id))
  );
}

console.log(canAccessBeta({ id: 'u1', active: true, role: 'member' }, {
  enabled: true,
  allowedUserIds: ['u1']
}));
`
      }
    ]
  },
  {
    id: 'chapter-04',
    title: 'Type Conversion and Coercion',
    short: 'Coercion',
    focus: 'explicit conversion, implicit conversion, truthiness, equality, and the edge cases interviewers love',
    topics: [
      'Explicit conversion with `String`, `Number`, `Boolean`, and `BigInt`',
      'Implicit conversion rules',
      'Truthy and falsy values',
      'Loose equality versus strict equality',
      'Abstract relational comparison',
      'Object-to-primitive conversion',
      'Interview edge cases'
    ],
    misconception: 'Coercion is not random. Some results are surprising because the rules are old and permissive, but the rules are still deterministic.',
    productionStory: 'An API gateway receives query parameters as strings and must convert pagination, filters, and flags deliberately before passing them to business logic.',
    browser: 'Browsers deliver many values as strings: form inputs, dataset attributes, URL search parameters, local storage values, and cookies. Treating those strings as already typed is a common source of bugs.',
    node: 'Node.js receives strings from environment variables, command-line arguments, headers, and many text protocols. Server code should parse at boundaries and keep internal data typed.',
    diagram: `flowchart TD
  Input[External input] --> Raw[String or unknown]
  Raw --> Parse[Explicit parser]
  Parse --> Validate[Validate range and domain]
  Validate --> Typed[Typed internal value]
  Typed --> Logic[Business logic]`,
    flow: `flowchart TD
  A[Value reaches operation] --> B{Operation requires a type?}
  B -->|No| C[Use value as-is]
  B -->|Yes| D[Apply conversion hint]
  D --> E[Primitive conversion]
  E --> F[Operation result]`,
    examples: [
      {
        name: 'example-01-query-parser.js',
        title: 'explicit query parsing',
        code: `'use strict';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(\`\${fieldName} must be a positive integer.\`);
  }

  return parsed;
}

console.log({
  page: parsePositiveInteger('2', 'page'),
  pageSize: parsePositiveInteger('25', 'pageSize')
});
`
      },
      {
        name: 'example-02-boolean-env.js',
        title: 'safe boolean conversion',
        code: `'use strict';

function parseBoolean(value, fieldName) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new TypeError(\`\${fieldName} must be "true" or "false".\`);
}

console.log(parseBoolean('false', 'CACHE_ENABLED'));
`
      }
    ]
  },
  {
    id: 'chapter-05',
    title: 'Strings, Numbers, and Dates',
    short: 'Built-ins',
    focus: 'text, numeric data, BigInt, regular expressions, timestamps, and time calculations',
    topics: [
      'String methods and template literals',
      'Unicode and user-visible text',
      'Regular expression basics',
      'Number and Math objects',
      'BigInt for integer precision',
      'Floating-point precision',
      'Date object, timestamps, formatting, and calculations'
    ],
    misconception: 'A string character is not always one UTF-16 code unit, money is not safely represented by arbitrary floating-point arithmetic, and a date without a timezone policy is a future incident report.',
    productionStory: 'A billing platform formats localized invoices, stores money in integer cents, validates invoice IDs with regular expressions, and compares timestamps in UTC.',
    browser: 'Browser UIs format numbers and dates using the user locale. `Intl` is usually better than hand-written formatting, but storage and API contracts should stay locale-neutral.',
    node: 'Node.js services should normalize timestamps at system boundaries, log ISO strings, and avoid relying on the server machine locale for business rules.',
    diagram: `flowchart LR
  UserInput[User text] --> Normalize[String normalization]
  Normalize --> Validate[Regex / parser]
  Validate --> Store[Canonical storage]
  Store --> Format[Intl formatting]
  Format --> UserOutput[User display]`,
    flow: `flowchart TD
  A[Receive amount/date/text] --> B[Normalize]
  B --> C[Validate]
  C --> D[Store canonical value]
  D --> E[Compute using canonical representation]
  E --> F[Format at presentation boundary]`,
    examples: [
      {
        name: 'example-01-money-formatting.js',
        title: 'money with integer cents',
        code: `'use strict';

function formatMoneyFromCents(cents, locale, currency) {
  if (!Number.isInteger(cents)) {
    throw new TypeError('Money must be stored as integer cents.');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(cents / 100);
}

console.log(formatMoneyFromCents(1299, 'en-US', 'USD'));
`
      },
      {
        name: 'example-02-date-window.js',
        title: 'UTC timestamp windows',
        code: `'use strict';

function isWithinWindow(nowMs, startIso, durationMs) {
  const startMs = Date.parse(startIso);

  if (Number.isNaN(startMs)) {
    throw new TypeError('Invalid ISO timestamp.');
  }

  return nowMs >= startMs && nowMs < startMs + durationMs;
}

console.log(isWithinWindow(Date.parse('2026-07-06T10:30:00.000Z'), '2026-07-06T10:00:00.000Z', 60 * 60 * 1000));
`
      }
    ]
  },
  {
    id: 'chapter-06',
    title: 'Control Flow',
    short: 'Control Flow',
    focus: 'branching, looping, iteration protocols, early exit, and labels',
    topics: [
      '`if`, `else`, `switch`, and ternary expressions',
      '`for`, `while`, and `do...while` loops',
      '`for...of` and iterable values',
      '`for...in` and enumerable property names',
      '`break`, `continue`, and labels',
      'Guard clauses and production control-flow design'
    ],
    misconception: 'Control flow is not beginner-only material. Readable branching, bounded loops, early exits, and correct iteration choices are what make production code auditable under pressure.',
    productionStory: 'A job runner processes queued tasks, skips invalid entries, retries transient failures, and stops cleanly when a shutdown signal is received.',
    browser: 'Browser control flow must respect responsiveness. Long loops can block rendering and input; large work should be chunked, scheduled, streamed, or moved to a worker.',
    node: 'Node.js services also run on a single main JavaScript thread. CPU-heavy loops block the event loop and delay every request sharing that process.',
    diagram: `flowchart TD
  A[Input collection] --> B{Has next item?}
  B -->|No| C[Return result]
  B -->|Yes| D{Valid item?}
  D -->|No| B
  D -->|Yes| E[Process item]
  E --> F{Fatal condition?}
  F -->|Yes| C
  F -->|No| B`,
    flow: `flowchart TD
  A[Evaluate condition] --> B{Condition truthy?}
  B -->|Yes| C[Execute branch or loop body]
  C --> D{break / continue / return?}
  D -->|continue| A
  D -->|break / return| E[Exit]
  D -->|none| A
  B -->|No| E`,
    examples: [
      {
        name: 'example-01-job-runner.js',
        title: 'guard clauses and loop control',
        code: `'use strict';

function processJobs(jobs) {
  const processed = [];

  for (const job of jobs) {
    if (job.cancelled) continue;
    if (job.priority === 'fatal') break;

    processed.push({ id: job.id, status: 'processed' });
  }

  return processed;
}

console.log(processJobs([
  { id: 'a', cancelled: false, priority: 'normal' },
  { id: 'b', cancelled: true, priority: 'normal' },
  { id: 'c', cancelled: false, priority: 'fatal' }
]));
`
      },
      {
        name: 'example-02-switch-dispatch.js',
        title: 'switch dispatch with explicit defaults',
        code: `'use strict';

function reduceOrderState(state, event) {
  switch (event.type) {
    case 'PAID':
      return { ...state, paid: true };
    case 'SHIPPED':
      return { ...state, shipped: true };
    default:
      throw new Error(\`Unsupported event type: \${event.type}\`);
  }
}

console.log(reduceOrderState({ paid: false, shipped: false }, { type: 'PAID' }));
`
      }
    ]
  }
];

function commonIntro(chapter) {
  return `# ${chapter.title}

## Introduction

${chapter.title} matters because ${chapter.focus}. A professional JavaScript engineer is expected to reason beyond syntax: what the engine creates, what the host environment provides, which values live in memory, and which choices produce maintainable systems.

The recurring misconception is this: ${chapter.misconception}

In interviews, this topic is a signal. Interviewers are rarely testing whether you can recite trivia. They are testing whether you can predict behavior, communicate trade-offs, and write code that holds up when requirements become less friendly.

## Learning Objectives

By the end of this chapter, you will be able to:

${chapter.topics.map((topic) => `- Explain ${topic}.`).join('\n')}
- Draw a memory or execution diagram for the topic.
- Explain browser and Node.js differences where they matter.
- Answer beginner, intermediate, senior, and FAANG-style interview questions confidently.`;
}

function theory(chapter) {
  return `# Theory

## What This Topic Is

${chapter.title} covers ${chapter.focus}. The language gives you rules; professional engineering requires knowing why those rules exist and how to apply them consistently.

${chapter.topics.map((topic) => `### ${topic.replace(/`/g, '')}

This area matters in production because it affects correctness, readability, debugging, and interview communication. When you explain ${topic.replace(/`/g, '')}, start with the observable behavior, then connect that behavior to the underlying execution model.`).join('\n\n')}

## Why Developers Need It

Real systems are mostly boundary management. Values enter from users, APIs, files, databases, environment variables, and browser events. JavaScript code must transform those values without losing meaning. When developers understand the fundamentals, they avoid the two most expensive categories of bugs: code that accidentally works and code that fails only in edge conditions.

## Common Misconceptions

${chapter.misconception}

Another common mistake is treating the browser, Node.js, and the ECMAScript language as one thing. ECMAScript defines the core language. Hosts provide APIs. Engines implement and optimize execution. Keeping those layers separate makes explanations sharper.

## Trade-offs

The trade-off is usually between brevity and explicitness. JavaScript lets you write compact expressions, dynamic values, and flexible control flow. Professional code should still make important conversions, assumptions, and failure paths visible. Cleverness is useful only when it reduces real complexity.`;
}

function internals(chapter) {
  return `# Internal Working

## Engine-Level View

When JavaScript source reaches an engine, it is parsed into tokens and then into an abstract syntax tree. The engine records scope information, creates internal representations for declarations, and emits bytecode or optimized machine code depending on execution history. The exact pipeline differs between engines, but the observable language rules remain defined by ECMAScript.

Modern engines optimize common paths aggressively. They prefer stable shapes, predictable types, clear control flow, and code that does not force the engine to abandon assumptions. This does not mean you should write unnatural code for the optimizer. It means you should avoid patterns that make correctness and optimization harder at the same time.

## Memory Diagram

\`\`\`mermaid
${chapter.diagram}
\`\`\`

## Flowchart

\`\`\`mermaid
${chapter.flow}
\`\`\`

## Execution Steps

1. The host loads a script or module.
2. The engine parses the source and builds scope information.
3. Declarations are registered according to their kind.
4. Top-level code begins executing.
5. Expressions and statements create values, references, and control-flow decisions.
6. Functions create new execution contexts when called.
7. Objects and closures remain reachable while references to them exist.
8. Values with no reachable references become eligible for garbage collection.

## Browser Perspective

${chapter.browser}

## Node.js Perspective

${chapter.node}

## Performance

Most fundamental operations are fast enough for ordinary application code. Performance problems appear when a simple operation is placed inside a hot loop, repeated across large data, or combined with allocation-heavy patterns. Analyze complexity first, then profile. Optimize only the path that measurements identify.

## Security Notes

Security begins at boundaries. Parse and validate external input. Avoid dynamic code execution. Keep secrets out of browser JavaScript. Treat serialization and deserialization as security-sensitive operations. Make failure modes explicit so unsafe values do not drift through the program as if they were trusted.`;
}

function production(chapter) {
  return `# Production Examples

## Scenario

${chapter.productionStory}

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

${chapter.examples.map((example, index) => `### Example ${index + 1}: ${example.title}

File: \`code/volume-1/${chapter.id}/${example.name}\`

\`\`\`js
${example.code.trim()}
\`\`\`

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is \`O(1)\` unless the code iterates through input collections; in that case the time complexity is \`O(n)\` and space depends on the returned structure.`).join('\n\n')}

## Best Practices

- Make important assumptions visible in names, guards, and return values.
- Validate data at system boundaries.
- Prefer explicit conversion over accidental coercion.
- Keep functions focused enough to test directly.
- Use immutable updates when shared state would create hidden coupling.
- Write code that a teammate can debug without knowing the original author.

## Common Mistakes

- Trusting external input before parsing it.
- Compressing control flow until failure paths disappear.
- Depending on host-specific APIs inside shared language utilities.
- Mutating objects passed by callers without documenting ownership.
- Hiding performance costs inside innocent-looking helper functions.

## Edge Cases

Edge cases are not interview decorations. They are compressed lessons about the language. When you encounter surprising behavior, ask which specification rule is being applied, which host API is involved, and whether the value came from a trusted or untrusted boundary.`;
}

function interview(chapter) {
  return `# Interview Perspective

## How To Answer Confidently

Start with the plain-language rule. Give a small example. Explain what the engine or host does internally. Then name the practical trade-off. This four-step answer pattern works for almost every JavaScript fundamentals question:

1. Observable behavior.
2. Why the rule exists.
3. Internal model.
4. Production implication.

## Beginner Questions

${chapter.topics.slice(0, 4).map((topic) => `- What is ${topic.replace(/`/g, '')}, and when would you use it?`).join('\n')}

## Intermediate Questions

${chapter.topics.slice(2, 6).map((topic) => `- What bugs can appear when a developer misunderstands ${topic.replace(/`/g, '')}?`).join('\n')}

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

Interviewers expect precise vocabulary, not theatrical detail. Use terms like binding, reference, primitive value, object, execution context, iterable, truthy, falsy, and host API accurately. If you do not remember a corner case, say the rule you do know and reason from it.`;
}

function exercises(chapter) {
  return `# Exercises and Coding Challenges

## Easy

Problem: Write a small function that demonstrates one rule from ${chapter.title}. Include one valid input and one invalid or edge input.

Hint: Keep the function pure so the result is easy to test.

Solution:

\`\`\`js
function describeValue(value) {
  return {
    value,
    type: typeof value,
    truthy: Boolean(value)
  };
}
\`\`\`

Complexity: \`O(1)\` time and \`O(1)\` space.

## Medium

Problem: Build a validation helper for data entering a production service.

Hint: Parse first, validate second, and return a normalized value.

Solution:

\`\`\`js
function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(\`\${fieldName} must be a non-empty string.\`);
  }

  return value.trim();
}
\`\`\`

Complexity: \`O(n)\` time for trimming a string of length \`n\`, \`O(n)\` space for the normalized string.

## Hard

Problem: Refactor a function with hidden mutation into a function that returns a new result without modifying caller-owned objects.

Hint: Treat ownership as part of the function contract.

Solution:

\`\`\`js
function markOrderReviewed(order, reviewerId) {
  return {
    ...order,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString()
  };
}
\`\`\`

Complexity: \`O(k)\` time and space where \`k\` is the number of enumerable properties copied from the order.

## FAANG-Level

Problem: Given an array of event records, normalize the valid records, skip recoverable invalid records, and stop processing on a fatal event. Explain each control-flow decision and memory allocation.

Optimal Solution:

\`\`\`js
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
\`\`\`

Complexity: \`O(n)\` time and \`O(m)\` space, where \`n\` is the number of input events and \`m\` is the number of retained events.

Brute force would copy every event first and filter later, wasting memory. A better solution validates as it iterates. The optimal solution above validates, normalizes, and exits early in one pass.`;
}

function edgeCases(chapter) {
  return `# Edge Cases, Debugging, and Failure Modes

## Why Edge Cases Matter

Edge cases are compressed lessons. They expose the exact point where a casual mental model stops working and the real JavaScript rule takes over. For ${chapter.title}, the important habit is to slow down and ask three questions: what value is actually present, which rule is being applied, and which environment is supplying the surrounding behavior.

In production, edge cases often arrive through data rather than syntax. A form sends an empty string. A URL parameter is missing. A backend sends \`null\` where an object was expected. A feature flag service omits a nested key. A loop receives a sparse array or a record with inherited properties. The bug is rarely that JavaScript is unpredictable; the bug is usually that the program accepted unclear input and waited too long to clarify it.

## Debugging Playbook

1. Reproduce the behavior with the smallest possible input.
2. Log both the value and its type at the boundary.
3. Separate ECMAScript behavior from browser or Node.js behavior.
4. Identify whether a primitive value, object reference, binding, or host API is involved.
5. Replace implicit assumptions with explicit guards.
6. Add a regression test that names the edge case.

This playbook prevents the most common debugging mistake: explaining the symptom instead of the rule. In an interview, the same discipline makes your answer sound calm and senior. You are not guessing; you are narrowing the execution path.

## Topic-Specific Edge Cases

${chapter.topics.map((topic) => `### ${topic.replace(/`/g, '')}

The edge case to watch is the gap between the friendly example and the value that arrives from a real system. For ${topic.replace(/`/g, '')}, test the missing value, the empty value, the boundary value, and the value that has the right shape but the wrong meaning. Then decide whether the function should return a default, throw an exception, skip the item, or preserve the value for a later layer.

Interview explanation: state the rule first, then the surprising result. For production explanation: name the prevention strategy. A strong answer does both.`).join('\n\n')}

## Common Failure Modes

- Boundary drift: parsing is delayed until many functions have already handled the value.
- Silent defaults: missing values are converted into defaults that hide upstream contract breaks.
- Shared mutation: a helper changes caller-owned data and creates action-at-a-distance bugs.
- Host confusion: code assumes a browser API exists in Node.js or a Node.js API exists in the browser.
- Over-compression: clever syntax hides a branch, conversion, or allocation that should be visible.

## Debugging Example

\`\`\`js
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
\`\`\`

This helper is intentionally boring. When debugging fundamentals, boring is a feature. It tells you what the runtime sees before your assumptions reshape the story.

## Interview Drill

Take one topic from this chapter and prepare a two-minute explanation:

1. Define it.
2. Show one production example.
3. Show one edge case.
4. Explain the internal reason.
5. Name the safest professional default.

If your explanation skips the edge case, it sounds memorized. If it skips the production implication, it sounds academic. The strongest answers connect both.`;
}

function performanceSecurity(chapter) {
  return `# Performance and Security Notes

## Performance Model

Performance in ${chapter.title} starts with clarity. The fastest bug is still a bug. Before optimizing, identify whether the work is constant time, linear in input size, or nested across multiple collections. Then measure the actual path under realistic data.

The engine can optimize predictable code, but it cannot save unclear ownership, unbounded loops, repeated parsing, or accidental allocation in hot paths. Most JavaScript performance work begins with three questions:

1. How many times does this execute?
2. How much memory does each execution allocate?
3. Does the shape or type of the data stay stable?

## Complexity Checklist

${chapter.topics.map((topic) => `- ${topic}: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.`).join('\n')}

## Optimization Techniques

- Move loop-invariant work outside loops.
- Prefer one pass when validation, normalization, and selection can be combined cleanly.
- Avoid parsing the same value repeatedly across layers.
- Keep hot data structures shape-stable.
- Do not allocate defensive copies in inner loops unless the copy protects a real ownership boundary.
- Profile before and after changes so optimization does not become folklore.

## Browser Performance

Browser JavaScript shares the main thread with rendering, input handling, style calculation, layout, and painting. A loop that feels acceptable in Node.js can create a frozen UI in a browser tab. For large work, consider chunking, streaming, request scheduling, virtualization, or Web Workers.

The browser also makes memory leaks visible in a different way. A detached DOM node can stay alive if a closure or cache still references it. Event listeners, timers, observers, and global arrays should have clear cleanup paths.

## Node.js Performance

Node.js services can handle many concurrent operations because I/O is asynchronous, but CPU-heavy JavaScript still blocks the main event loop. A synchronous loop over a huge payload can delay unrelated HTTP requests. For expensive work, consider batching, streaming, worker threads, native services, or queue-based processing.

In server code, performance and reliability meet at backpressure. A service that parses and stores unlimited input without limits is both slow and unsafe.

## Security Model

Security for ${chapter.title} is mostly boundary discipline. Values from users, URLs, headers, cookies, local storage, environment variables, files, databases, and third-party services are not trustworthy just because they look friendly in development.

Security-sensitive JavaScript should:

- Validate type, shape, range, and allowed values.
- Avoid dynamic code execution such as \`eval\` and string-built functions.
- Keep secrets out of browser-delivered code.
- Treat serialization formats as untrusted input.
- Avoid prototype pollution by rejecting dangerous keys such as \`__proto__\`, \`constructor\`, and \`prototype\` when merging objects.
- Log enough context for diagnosis without leaking personal data or secrets.

## Threat Examples

- A query parameter that becomes a number without validation can bypass pagination limits.
- A string that becomes HTML without escaping can create cross-site scripting.
- A JSON object merged into configuration can alter prototypes if keys are not filtered.
- A long input processed by a vulnerable regular expression can pin a CPU core.
- A default value can accidentally grant access when missing data should have failed closed.

## Professional Default

The professional default is explicitness at boundaries and simplicity in the core. Once data is parsed and validated, internal functions can stay smaller, faster, and easier to reason about. This is not ceremony. It is how large JavaScript systems remain debuggable.`;
}

function professionalGuide(chapter) {
  return `# Professional Field Guide

## How Staff Engineers Think About This Topic

A staff-level JavaScript engineer does not treat ${chapter.title} as isolated syntax. They ask how the rule affects API contracts, debugging, performance, security, teaching, and long-term maintenance. They also know when to stop explaining internals and make the code obvious enough that fewer internals are needed.

The best professional code makes the important path easy and the dangerous path hard. It names values honestly, validates hostile inputs, avoids hidden mutation, and fails where the error still has context.

## Code Review Checklist

${chapter.topics.map((topic) => `- ${topic}: is the code using this feature because it clarifies intent, or because it is shorter?`).join('\n')}
- Are boundary conversions explicit?
- Are error messages useful without leaking sensitive information?
- Is ownership of objects and arrays clear?
- Are browser-only or Node-only APIs isolated from shared utilities?
- Are edge cases covered by tests?
- Is there any hidden global state?
- Can a teammate predict the output without executing the code mentally for several minutes?

## Whiteboard Strategy

When asked to whiteboard ${chapter.title}, draw the smallest useful model:

1. Input values enter the program.
2. Bindings or references are created.
3. Rules evaluate expressions or statements.
4. Memory changes or control flow changes.
5. Output is returned or an error is thrown.

Do not draw every internal engine structure unless the interviewer asks. A precise small diagram is stronger than a large vague one.

## Follow-Up Answers

### What if the input is missing?

Say whether missing input is acceptable. If it is acceptable, choose an explicit default. If it is not acceptable, throw early with a message that names the field. Do not let missing input become \`undefined\` that fails three layers later.

### What if this runs in the browser?

Identify the browser APIs involved and mention main-thread responsiveness, DOM availability, user-controlled input, and security constraints. If the code touches the DOM or URL, discuss validation and escaping.

### What if this runs in Node.js?

Identify process-level concerns: environment variables, file and network I/O, concurrency, event-loop blocking, logs, and secrets. Node.js gives powerful host APIs, so boundary discipline matters even more.

### What if performance becomes a problem?

Give the complexity first. Then describe what you would measure. Only then suggest a change. This order signals engineering judgment.

## Mini Case Study

A team receives intermittent production bugs around ${chapter.short.toLowerCase()}. The junior response is to patch the failing line. The senior response is to ask where the value entered the system, what contract was assumed, whether the code path differs between browser and server, and why tests did not include the edge value.

The fix usually includes more than one line:

- A boundary parser or guard.
- A clearer function contract.
- A regression test for the surprising value.
- A code review note explaining the rule.
- A monitoring or logging improvement if the bug came from external data.

## Mastery Questions

- Can you explain this topic without using the word "magic"?
- Can you produce a memory or flow diagram in under two minutes?
- Can you name one browser-specific concern and one Node.js-specific concern?
- Can you write a production example that validates input?
- Can you identify when not to use the feature?
- Can you teach the edge case without making the language sound random?

## Final Interview Script

Here is the answer shape to practice:

"${chapter.title} is about ${chapter.focus}. The key rule is that JavaScript follows deterministic specification behavior, while the host environment supplies extra APIs. In production I would make the boundary explicit, keep the internal representation stable, and test the surprising values. Internally, the engine evaluates the relevant expression or statement according to lexical scope, value/reference behavior, and host interaction. The trade-off is between concise code and code whose assumptions are easy to audit."

That script is not meant to be memorized word for word. It is a scaffold for confident reasoning. Replace the generic phrases with the specific rule from the question, and you will sound like an engineer explaining a system, not a candidate reciting notes.`;
}

function mcqs(chapter) {
  const bank = {
    'chapter-01': [
      ['Who standardizes the JavaScript language?', 'TC39 standardizes ECMAScript, which defines the core JavaScript language.'],
      ['Which part is supplied by the browser rather than ECMAScript?', 'The DOM is a browser host API, not a core language feature.'],
      ['Why does Node.js not expose `document` by default?', 'Node.js is not a browser host and does not include a DOM tree.'],
      ['What is a JavaScript engine responsible for?', 'Parsing, compiling, optimizing, and executing ECMAScript code.'],
      ['Why did JavaScript become strategically important?', 'It became the native programmable language of the web and later expanded to servers and tooling.'],
      ['What is the relationship between JavaScript and ECMAScript?', 'JavaScript is the common language implementation; ECMAScript is the standardized language specification.'],
      ['What does a runtime add to an engine?', 'Host APIs such as timers, I/O, networking, storage, or DOM access.'],
      ['Why are browser and Node.js interview answers often mixed up?', 'Candidates confuse language features with host-provided APIs.'],
      ['Which environment commonly provides `process`?', 'Node.js provides `process` for runtime and operating-system interaction.'],
      ['Which environment commonly provides `window`?', 'Browsers provide `window` in page contexts.'],
      ['What is the value of learning engine internals?', 'It improves explanations of parsing, execution, memory, and optimization behavior.'],
      ['Why should feature detection be preferred over user-agent assumptions?', 'Capabilities are more reliable than guessing behavior from environment labels.'],
      ['What does the parser produce conceptually?', 'An abstract syntax tree plus scope information used by later execution stages.'],
      ['Why can JavaScript run on edge platforms?', 'The language is portable and can be embedded in runtimes beyond browsers and servers.'],
      ['What is the safest way to describe browser APIs?', 'They are host capabilities exposed to JavaScript, not part of the core language.'],
      ['Why does the ecosystem matter for interviews?', 'Tooling, packages, transpilers, and runtimes shape real-world JavaScript work.'],
      ['What should a good runtime explanation separate?', 'Language rules, engine implementation, and host APIs.'],
      ['Why is JavaScript single-threaded a partial truth?', 'The main execution thread is single for JS code, but hosts can use workers and background threads.'],
      ['What is JIT optimization?', 'Runtime compilation that optimizes hot code paths using observed feedback.'],
      ['Why can engine optimizations be invalidated?', 'Runtime values can violate assumptions collected during earlier execution.'],
      ['What is the interview-safe way to explain engine pipelines?', 'Describe the conceptual parse, compile, execute, optimize path without claiming all engines are identical.']
    ],
    'chapter-02': [
      ['What does `const` prevent?', 'Rebinding the variable identifier to a different value.'],
      ['What does `const` not prevent?', 'Mutation of an object referenced by the binding.'],
      ['Which declarations are block-scoped?', '`let` and `const` are block-scoped.'],
      ['Which declaration is function-scoped?', '`var` is scoped to the nearest function or script context.'],
      ['What is the temporal dead zone?', 'The period where a `let` or `const` binding exists but cannot be accessed before initialization.'],
      ['What does `typeof null` return?', 'It returns `"object"`, a historical JavaScript quirk.'],
      ['Which values are primitive?', 'String, number, boolean, bigint, symbol, undefined, and null.'],
      ['Why are objects called reference values in teaching models?', 'Variables hold references to heap-allocated objects rather than copying the whole object.'],
      ['What does dynamic typing mean?', 'A variable binding can hold values of different types over time unless constrained by code discipline.'],
      ['What is an accidental global?', 'A variable created unintentionally outside the intended scope, usually from missing declaration in sloppy mode.'],
      ['Why prefer `const` by default?', 'It communicates that the binding itself should not be reassigned.'],
      ['When is `let` appropriate?', 'When the binding must be reassigned, such as loop counters or staged normalization.'],
      ['Why should `var` be avoided in modern code?', 'Its function scope and hoisting behavior make code harder to reason about.'],
      ['What makes a value eligible for garbage collection?', 'It is no longer reachable from active roots.'],
      ['Why can closures keep memory alive?', 'A closure can preserve references to outer lexical environments and the objects they reference.'],
      ['What should you validate before storing external JSON?', 'Shape, type, required fields, and allowed value ranges.'],
      ['Why can destructuring still need validation?', 'Destructuring extracts values but does not prove their types.'],
      ['What is the difference between `undefined` and undeclared?', '`undefined` is a value; undeclared means no binding exists in accessible scope.'],
      ['Why is `typeof` useful for guards?', 'It safely checks many primitive types without evaluating constructors.'],
      ['What is a stable object shape?', 'An object with predictable properties that engines can optimize more easily.'],
      ['Why do memory diagrams matter?', 'They clarify the difference between binding names, primitive values, and object references.']
    ],
    'chapter-03': [
      ['What does optional chaining return when a base is nullish?', '`undefined` is returned instead of throwing for that property access.'],
      ['What values trigger nullish coalescing?', 'Only `null` and `undefined` trigger the right-hand fallback.'],
      ['Why is `??` different from `||` for defaults?', '`||` treats all falsy values as missing, while `??` preserves `0`, `false`, and empty strings.'],
      ['What is short-circuit evaluation?', 'Evaluation stops once the final logical result is already determined.'],
      ['Why can assignment expressions be risky?', 'They produce values and side effects, which can reduce readability.'],
      ['What does operator precedence decide?', 'It decides how expressions group when parentheses are absent.'],
      ['When should you add parentheses even if precedence is known?', 'When they make business logic easier to audit.'],
      ['What do bitwise operators do to ordinary numbers?', 'Most bitwise operators convert operands to 32-bit signed integers.'],
      ['What is the conditional operator best for?', 'Small expression-level choices, not complex multi-step branching.'],
      ['Why can `+` be surprising?', 'It performs numeric addition or string concatenation depending on operands.'],
      ['What does `===` avoid?', 'It avoids loose equality coercion.'],
      ['What is compound assignment?', 'An operator that reads, computes, and writes a binding or property in one expression.'],
      ['Why is `user && user.name` less common in modern code?', 'Optional chaining expresses null-safe property access more directly.'],
      ['What is the risk of deeply nested optional chaining?', 'It can hide a missing required dependency that should fail explicitly.'],
      ['Why should production feature gates be explicit?', 'A gate often controls security, rollout, or billing behavior.'],
      ['What does associativity decide?', 'It decides grouping order among operators with the same precedence.'],
      ['Why should expressions avoid hidden mutation?', 'Hidden mutation makes output prediction and testing harder.'],
      ['What is a unary operator?', 'An operator that acts on one operand, such as `!`, `typeof`, or unary `+`.'],
      ['Why is `delete` rarely used on hot objects?', 'It can make object shapes less predictable for engines.'],
      ['What is a practical use of logical AND?', 'Guarding later checks that require earlier values to exist.'],
      ['What is the interview-safe advice for operators?', 'Know precedence, but use parentheses for clarity in production code.']
    ],
    'chapter-04': [
      ['What does explicit conversion mean?', 'Calling a conversion function or parser intentionally, such as `Number(value)`.'],
      ['What does implicit conversion mean?', 'JavaScript converts a value automatically because an operation requires another type.'],
      ['Which values are falsy?', '`false`, `0`, `-0`, `0n`, empty string, `null`, `undefined`, and `NaN`.'],
      ['Why is strict equality preferred?', 'It compares without loose equality coercion.'],
      ['What does `Number("")` return?', 'It returns `0`, which surprises many developers.'],
      ['What does `Boolean("false")` return?', 'It returns `true` because non-empty strings are truthy.'],
      ['Why should environment booleans be parsed explicitly?', 'Environment variables are strings, so `"false"` is truthy unless parsed.'],
      ['What is `NaN` unusual about?', 'It is not equal to itself under `===`.'],
      ['How should you test for `NaN`?', 'Use `Number.isNaN(value)` for precise checks.'],
      ['What does object-to-primitive conversion use?', 'Methods such as `valueOf`, `toString`, or `Symbol.toPrimitive`.'],
      ['Why is `== null` sometimes intentionally used?', 'It matches only `null` or `undefined`, but it should be documented if used.'],
      ['What does `parseInt("08px", 10)` return?', 'It returns `8` because parsing stops at the non-digit after reading digits.'],
      ['Why can `Number("08px")` be safer than `parseInt`?', 'It rejects the whole invalid numeric string by producing `NaN`.'],
      ['What is truthiness useful for?', 'Presence checks when all falsy values are truly invalid.'],
      ['When is truthiness dangerous?', 'When `0`, `false`, or empty string are valid business values.'],
      ['Why do form values need parsing?', 'Form controls typically provide strings even for numeric-looking input.'],
      ['What does `[] == false` demonstrate?', 'Loose equality can coerce arrays through primitive conversion and boolean-to-number conversion.'],
      ['What is a boundary parser?', 'A function that converts and validates external data before internal use.'],
      ['Why should coercion edge cases be learned?', 'They reveal the deterministic rules behind surprising interview prompts.'],
      ['What is the safest API design?', 'Accept clear types internally and convert only at boundaries.'],
      ['What should a coercion interview answer include?', 'The conversion path, the resulting value, and the production lesson.']
    ],
    'chapter-05': [
      ['Why can `length` be misleading for strings?', 'It counts UTF-16 code units, not necessarily user-perceived characters.'],
      ['What are template literals useful for?', 'Interpolation and multi-line strings with clearer formatting.'],
      ['Why normalize user text?', 'Different Unicode representations can look identical but compare differently.'],
      ['What is a regular expression best used for?', 'Pattern matching with clear boundaries and tested complexity.'],
      ['Why can regex be a security concern?', 'Poor patterns can cause catastrophic backtracking on attacker-controlled input.'],
      ['What numeric format does JavaScript `number` use?', 'IEEE 754 double-precision floating point.'],
      ['Why can `0.1 + 0.2` surprise developers?', 'Binary floating point cannot represent many decimal fractions exactly.'],
      ['How should money often be stored?', 'As integer minor units such as cents.'],
      ['When is `BigInt` useful?', 'For integers larger than the safe integer range of `number`.'],
      ['Can `BigInt` and `number` be mixed in arithmetic?', 'No, arithmetic mixing throws unless you convert intentionally.'],
      ['What does `Number.isSafeInteger` check?', 'Whether an integer can be represented precisely as a JavaScript number.'],
      ['What is `Math.random` not suitable for?', 'Cryptographic security.'],
      ['What does a Date store internally?', 'A timestamp value representing milliseconds since the Unix epoch.'],
      ['Why prefer ISO timestamps for logs?', 'They are unambiguous and portable across systems.'],
      ['Why is timezone policy important?', 'Local-time assumptions can corrupt scheduling and reporting behavior.'],
      ['What does `Intl.NumberFormat` provide?', 'Locale-aware number and currency formatting.'],
      ['What does `Intl.DateTimeFormat` provide?', 'Locale-aware date and time formatting.'],
      ['Why validate `Date.parse` output?', 'Invalid dates produce `NaN`, which can poison comparisons.'],
      ['What is a timestamp good for?', 'Ordering and duration math when timezone display is separate.'],
      ['Why should display formatting happen late?', 'Business logic should use canonical values, not localized strings.'],
      ['What should string, number, and date utilities document?', 'Input type, timezone assumptions, precision expectations, and failure behavior.']
    ],
    'chapter-06': [
      ['When is an `if` statement best?', 'When branches express business rules with clear conditions.'],
      ['When is `switch` useful?', 'When dispatching among discrete known cases.'],
      ['Why should `switch` usually have a default?', 'It makes unsupported cases explicit.'],
      ['What is fallthrough?', 'Execution continuing into the next case when `break` or return is absent.'],
      ['When is a ternary appropriate?', 'For a simple expression-level choice.'],
      ['When is a ternary harmful?', 'When nesting or side effects make branches hard to read.'],
      ['What is `for...of` for?', 'Iterating over iterable values such as arrays, strings, maps, and sets.'],
      ['What is `for...in` for?', 'Iterating enumerable property names, usually on objects.'],
      ['Why avoid `for...in` for arrays?', 'It iterates keys, including enumerable inherited names, not values.'],
      ['What does `break` do?', 'It exits the nearest enclosing loop or switch unless a label changes the target.'],
      ['What does `continue` do?', 'It skips to the next loop iteration.'],
      ['Why can labels reduce readability?', 'They create non-local jumps that many developers rarely expect.'],
      ['When are labels defensible?', 'Exiting nested loops deliberately when a simpler extraction is not clearer.'],
      ['Why should long browser loops be avoided?', 'They block rendering and input on the main thread.'],
      ['Why can CPU-heavy Node.js loops be dangerous?', 'They block the event loop and delay unrelated requests.'],
      ['What is a guard clause?', 'An early exit for invalid or completed conditions.'],
      ['Why do guard clauses help?', 'They reduce nesting and make failure paths visible.'],
      ['What is loop invariant work?', 'Work inside a loop that could be computed once outside it.'],
      ['Why is early termination an optimization?', 'It avoids processing data after the answer is already known.'],
      ['What should a control-flow interview answer include?', 'Condition evaluation, branch taken, loop state, and exit condition.'],
      ['What is the safest default for unknown event types?', 'Throw or explicitly reject instead of silently ignoring a corrupt state transition.']
    ]
  };

  const questions = bank[chapter.id];

  const renderedQuestions = questions.map((entry, index) => {
  const distractors = [
    'It is only a formatting preference.',
    'It applies only when code runs in a browser tab.',
    'It is handled by npm instead of the JavaScript runtime.'
  ];

  return `${index + 1}. ${entry[0]}
   - A. ${entry[1]}
   - B. ${distractors[index % distractors.length]}
   - C. ${distractors[(index + 1) % distractors.length]}
   - D. ${distractors[(index + 2) % distractors.length]}

   Answer: A. Explanation: ${entry[1]} This is directly relevant to ${chapter.title} because the topic is about predictable behavior, not memorized trivia.`;
  }).join('\n\n');

  return `# MCQs

${renderedQuestions}`;
}

function revision(chapter) {
  return `# Revision Sheet and Chapter Summary

## Revision Sheet

${chapter.topics.map((topic) => `- ${topic}: know the definition, the internal model, one production use case, and one edge case.`).join('\n')}
- Separate ECMAScript language rules from browser and Node.js host APIs.
- Prefer explicit parsing and validation at system boundaries.
- Use diagrams to explain memory, references, control flow, and execution.
- In interviews, answer with behavior, rule, internal model, and production implication.

## Chapter Summary

${chapter.title} gives you a professional foundation for ${chapter.focus}. The goal is not to memorize isolated facts. The goal is to build a mental model that survives production incidents and interview pressure.

You learned the main rules, how engines and hosts participate, how memory and flow diagrams clarify behavior, how to write production-style examples, and how to discuss trade-offs with interviewer-grade precision.

## References

- ECMAScript Language Specification.
- MDN Web Docs: JavaScript Guide and Reference.
- V8 documentation on parsing, execution, and optimization.
- Node.js documentation for runtime-specific APIs.

## Further Reading

- Volume 2 for closures, prototypes, objects, and advanced runtime behavior.
- Volume 3 for asynchronous JavaScript and event loop internals.
- Volume 5 for interview patterns and whiteboard communication.`;
}

function readme() {
  return `# Volume I: JavaScript Fundamentals

Volume I builds the foundation required for every later volume in *JavaScript Mastery for FAANG Interviews*. It teaches JavaScript as a professional language with specification rules, engine behavior, host environments, production constraints, and interview expectations.

This volume is organized as multi-file chapters so each section can be read independently and maintained cleanly.

## Chapters

${chapters.map((chapter) => `- [${chapter.title}](${chapter.id}/01-introduction.md)`).join('\n')}

## How To Use This Volume

Read each chapter in order if you are new to JavaScript internals. If you are preparing for interviews, read the theory and internals first, then use the interview, exercises, MCQs, and revision sections as active recall material.

## Code Examples

Runnable examples live in \`code/volume-1\`. Each chapter has independent scripts that can be executed with Node.js.

## Build Integration

The Docusaurus sidebar points at these Markdown files. The repository scripts can validate examples, build the website, and generate PDF or EPUB artifacts when the local toolchain is installed.`;
}

function summary() {
  return `# Summary

## Volume I: JavaScript Fundamentals

${chapters.map((chapter) => `### ${chapter.title}

- [Introduction](${link(chapter.id, '01-introduction.md')})
- [Theory](${link(chapter.id, '02-theory.md')})
- [Internal Working](${link(chapter.id, '03-internal-working.md')})
- [Production Examples](${link(chapter.id, '04-production-examples.md')})
- [Interview Perspective](${link(chapter.id, '05-interview-perspective.md')})
- [Exercises and Coding Challenges](${link(chapter.id, '06-exercises-coding-challenges.md')})
- [MCQs](${link(chapter.id, '07-mcqs.md')})
- [Revision Sheet and Chapter Summary](${link(chapter.id, '08-revision-summary.md')})
- [Edge Cases, Debugging, and Failure Modes](${link(chapter.id, '09-edge-cases-debugging.md')})
- [Performance and Security Notes](${link(chapter.id, '10-performance-security.md')})
- [Professional Field Guide](${link(chapter.id, '11-professional-field-guide.md')})`).join('\n\n')}`;
}

function legacyIndex() {
  return `# Volume 1: JavaScript Fundamentals

The canonical Volume 1 entry point is now [README](README.md), with the complete chapter map in [SUMMARY](SUMMARY.md).

Start with [Chapter 1: Introduction to JavaScript](chapter-01/01-introduction.md).`;
}

function sidebar() {
  const chapterItems = chapters.map((chapter) => `        {
          type: 'category',
            label: 'Chapter ${chapter.id.slice(-2)}: ${chapter.title.replace(/^.*?: /, '')}',
            items: [
            'volume-1/${chapter.id}/introduction',
            'volume-1/${chapter.id}/theory',
            'volume-1/${chapter.id}/internal-working',
            'volume-1/${chapter.id}/production-examples',
            'volume-1/${chapter.id}/interview-perspective',
            'volume-1/${chapter.id}/exercises-coding-challenges',
            'volume-1/${chapter.id}/mcqs',
            'volume-1/${chapter.id}/revision-summary',
            'volume-1/${chapter.id}/edge-cases-debugging',
            'volume-1/${chapter.id}/performance-security',
            'volume-1/${chapter.id}/professional-field-guide'
          ]
        }`).join(',\n');

  return `const sidebars = {
  tutorialSidebar: [
    'index',
    'table-of-contents',
    'book-production-standard',
    {
      type: 'category',
      label: 'Volume 1: JavaScript Fundamentals',
      items: [
        'volume-1/README',
        'volume-1/SUMMARY',
${chapterItems}
      ]
    },
    'volume-2/index',
    'volume-3/index',
    'volume-4/index',
    'volume-5/index',
    'volume-6/index'
  ]
};

module.exports = sidebars;
`;
}

function globalToc() {
  return `# Table of Contents

## Volume 1: JavaScript Fundamentals

${chapters.map((chapter, index) => `${index + 1}. ${chapter.title}
   - Introduction
   - Theory
   - Internal Working
   - Production Examples
   - Interview Perspective
   - Exercises and Coding Challenges
   - MCQs
   - Revision Sheet and Chapter Summary
   - Edge Cases, Debugging, and Failure Modes
   - Performance and Security Notes
   - Professional Field Guide`).join('\n')}

## Volume 2: Advanced JavaScript

1. Lexical Scope and Closures
2. \`this\`, Call, Apply, and Bind
3. Prototypes and Inheritance
4. Classes and Object Creation Patterns
5. Descriptors, Immutability, and Proxies
6. Iterators and Generators
7. Functional Programming in JavaScript
8. Memory Management and Garbage Collection
9. V8 Pipeline and Optimization
10. Design Patterns in JavaScript

## Volume 3: Asynchronous JavaScript

1. Host Environments and Scheduling
2. Callbacks and Error-First APIs
3. Promises Internals
4. Async and Await
5. Microtasks and Macrotasks
6. Timers and Scheduling Accuracy
7. Fetch, Streams, and Cancellation
8. Concurrency Control
9. Workers and Parallelism
10. Async Interview Problems

## Volume 4: Browser APIs and DOM

1. Browser Architecture
2. DOM Tree and Node APIs
3. Events and Event Delegation
4. Rendering Pipeline
5. Forms and Validation
6. Storage APIs
7. Networking APIs
8. Web Components
9. Security in the Browser
10. Performance Profiling

## Volume 5: JavaScript Interview Mastery

1. How to Explain JavaScript Internals
2. Coding Interview Patterns
3. Arrays and Strings
4. Hash Maps and Sets
5. Stacks, Queues, and Heaps
6. Linked Lists
7. Trees and Graphs
8. Recursion and Backtracking
9. Dynamic Programming
10. System Design with JavaScript
11. Frontend Machine Coding
12. Behavioral Explanations for Senior Engineers

## Volume 6: Real World Projects

1. Task Manager
2. Chat Application
3. Kanban Board
4. Netflix-Style Media Browser
5. GitHub Dashboard
6. AI Chat Interface
7. Weather App
8. File Explorer
9. Blog CMS
10. Realtime Notification System
11. Testing, Deployment, and Observability
12. Portfolio and Interview Presentation Strategy`;
}

function generate() {
  ensureDir(volumeDir);
  ensureDir(codeDir);

  writeFile(path.join(volumeDir, 'README.md'), readme());
  writeFile(path.join(volumeDir, 'SUMMARY.md'), summary());
  writeFile(path.join(volumeDir, 'preface.md'), `# Preface

This volume is written for engineers who want JavaScript mastery rather than surface familiarity. It assumes curiosity, discipline, and a willingness to trace behavior carefully.

The teaching style is practical: define the rule, explain why it exists, connect it to engine or host behavior, show production code, then rehearse how to communicate the idea in interviews. The same habit helps in code reviews, debugging sessions, and design discussions.

JavaScript has historical quirks, but it is not chaos. Most confusing behavior becomes predictable when you separate values from references, language rules from host APIs, and syntax from runtime execution.

## How To Study This Volume

Do not read this volume like a list of syntax features. Read it like a map of runtime behavior. For each chapter, start with the introduction and theory, then pause before reading the internal-working section. Try to predict what the engine, memory model, or host environment must do for the feature to work. After that, compare your prediction with the diagrams and execution steps.

When you reach a production example, run the corresponding file under \`code/volume-1\`. Change one input at a time. Replace a valid value with \`null\`, \`undefined\`, an empty string, a zero, a negative number, a sparse array, or an object with an unexpected shape. The point is not to break the code for entertainment. The point is to train the instinct that production bugs often begin as ordinary values crossing a boundary without enough ceremony.

For interview preparation, use active recall. Close the book and answer the beginner, intermediate, senior, and FAANG prompts out loud. A strong answer has four parts: the visible behavior, the specification-level rule, the internal model, and the production consequence. If you can explain only the visible behavior, you know the syntax but not the system. If you can explain only the internals, you may sound theoretical. The best interview answers join both.

Use the MCQs as diagnostic tools, not as a memorization contest. If you miss a question, write down the rule in your own words and create a tiny example that demonstrates it. Then add one sentence explaining when that rule matters in a real codebase. This turns trivia into judgment.

Finally, keep a personal revision sheet. For each chapter, record one edge case, one performance note, one security concern, and one phrase you would use on a whiteboard. By the end of Volume I, you should be able to describe JavaScript fundamentals without panic, mysticism, or hand-waving. That is the real target: calm precision under pressure.

## Notation

Code examples use modern JavaScript and strict-mode-friendly habits. Diagrams are Mermaid blocks so they can render in the website and remain readable in plain Markdown. Complexity notes use \`n\` for input size, \`k\` for copied properties, and \`m\` for retained output items. When the text says browser or Node.js, it is naming the host environment; when it says JavaScript or ECMAScript, it is naming the language rules.`);

  for (const chapter of chapters) {
    const chapterDir = path.join(volumeDir, chapter.id);
    writeFile(path.join(chapterDir, '01-introduction.md'), commonIntro(chapter));
    writeFile(path.join(chapterDir, '02-theory.md'), theory(chapter));
    writeFile(path.join(chapterDir, '03-internal-working.md'), internals(chapter));
    writeFile(path.join(chapterDir, '04-production-examples.md'), production(chapter));
    writeFile(path.join(chapterDir, '05-interview-perspective.md'), interview(chapter));
    writeFile(path.join(chapterDir, '06-exercises-coding-challenges.md'), exercises(chapter));
    writeFile(path.join(chapterDir, '07-mcqs.md'), mcqs(chapter));
    writeFile(path.join(chapterDir, '08-revision-summary.md'), revision(chapter));
    writeFile(path.join(chapterDir, '09-edge-cases-debugging.md'), edgeCases(chapter));
    writeFile(path.join(chapterDir, '10-performance-security.md'), performanceSecurity(chapter));
    writeFile(path.join(chapterDir, '11-professional-field-guide.md'), professionalGuide(chapter));

    for (const example of chapter.examples) {
      writeFile(path.join(codeDir, chapter.id, example.name), example.code);
    }
  }

  writeFile(path.join(root, 'sidebars.js'), sidebar());
  writeFile(path.join(root, 'docs', 'table-of-contents.md'), globalToc());
}

generate();
