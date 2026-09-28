# Control Flow: Revision and Summary

## Revision Sheet

| Construct | Rule to remember |
| --- | --- |
| `if / else` | Evaluate a condition and execute only its selected branch |
| Conditional operator | Select one expression value |
| `switch` | Strictly match cases; statements fall through without an exit |
| Case with declarations | Use braces when an independent lexical scope is needed |
| `for` | Initialize, test, body, update, test again |
| `while` | Test before each body execution |
| `do...while` | Run the body once before the first test |
| `for...of` | Consume iterable values |
| `for...in` | Enumerate enumerable string keys, including inherited keys |
| `Object.keys` | Produce own enumerable string keys |
| `break` | Exit the nearest loop or switch |
| `continue` | Move to the next iteration; classic for still runs its update |
| `return` | Exit the current function |
| Labeled break | Exit the named enclosing statement |
| Invariant | A statement that remains true at a chosen loop boundary |
| Termination argument | A bounded measure moves toward completion |

## One-Minute Explanation

"I choose a branch structure that makes the policy order visible. I validate a record before reading fields, distinguish skip from stop, and state which condition has precedence. For loops, I identify the visited unit, the progress step, the exit, and the ownership of output records. I use values iteration for arrays and deliberate own-key enumeration for records."

## Trace Checklist

For any loop, answer:

1. Can the body run zero times?
2. What happens after continue?
3. What does break exit here?
4. Which state changes on every non-exiting path?
5. Can the traversed collection change?
6. What has been accumulated before the current iteration?
7. What happens at the first invalid, fatal, or boundary record?

## Summary

Control flow translates a policy into an execution path. Different loops have different test and update schedules; exits have different targets. Correct code needs both a valid result and an argument that processing ends.

The batch example skips invalid records, prioritizes valid fatal markers over cancellation, and creates separate output records. The order dispatcher enforces payment before shipping. Neither claims external processing or retries.

Review the [exercises](06-exercises-coding-challenges.md) and [MCQs](07-mcqs.md). Continue to [Functions and Callbacks](../chapter-07/01-introduction.md).
