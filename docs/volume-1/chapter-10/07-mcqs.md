# Errors and Debugging: MCQs

Choose one answer and explain its control-flow rule.

## 1. What does new Error("failed") do by itself?

A. It terminates the process
B. It constructs a value without throwing
C. It invokes catch
D. It returns a rejected Promise

**Answer: B.** Throwing is a separate control operation.

## 2. Which values can JavaScript throw?

A. Only Error instances
B. Only objects with message
C. Only strings and errors
D. Any JavaScript value

**Answer: D.** Catch can receive null, undefined, primitives, or objects.

## 3. Can try catch a syntax failure of its own script before that script executes?

A. No, its try block never starts
B. Yes, if finally exists
C. Yes, if variables use let
D. Only in strict mode

**Answer: A.** Parsing must succeed before a handler in that script executes.

## 4. Why can JSON.parse failure be caught?

A. JSON parsing never throws
B. The source parser rewrites try
C. It is an operation in an active call
D. JSON syntax failures are booleans

**Answer: C.** The invalid text is data passed to a running parser.

## 5. What does catch automatically roll back?

A. All assignments
B. All external effects
C. Nothing
D. Only primitive assignments

**Answer: C.** Control flow changes; prior mutations remain unless explicitly reversed.

## 6. What should happen to an unexpected caught failure?

A. Rethrow it
B. Return an empty object
C. Log and report success
D. Convert it to false

**Answer: A.** Recovery must be limited to the documented policy.

## 7. What does cause preserve?

A. Only formatted stack text
B. A cloned request
C. Only the original message
D. The exact supplied original value

**Answer: D.** The cause can be any value, including the original Error object.

## 8. If finally completes normally after a return, what happens?

A. The return is cancelled
B. The pending returned value continues
C. The result is undefined
D. The return expression runs again

**Answer: B.** The return expression was evaluated before finally.

## 9. Why avoid return in finally?

A. It can replace a result or suppress an error
B. It is always invalid syntax
C. It prevents finally execution
D. It creates AggregateError automatically

**Answer: A.** Finally can create a new completion that replaces the pending one.

## 10. If cleanup throws during error propagation, what is the default effect?

A. Cleanup failure is ignored
B. Both failures are automatically collected
C. The cleanup failure replaces the pending failure
D. The original is always placed in cause

**Answer: C.** Preserving both failures requires an explicit policy.

## 11. Why keep a separate operationFailed flag?

A. Errors cannot be stored
B. Thrown values can be falsy or undefined
C. Finally cannot read locals
D. It detects asynchronous rejection

**Answer: B.** Occurrence of failure is separate from the truthiness of its value.

## 12. Does a catch around timer registration catch a later callback throw?

A. Always
B. Only with zero delay
C. Only for arrow callbacks
D. No

**Answer: D.** The callback executes after that protected registration call has returned.

## 13. What does a tagged parse result distinguish?

A. Runtime from operating system
B. All stack formats
C. Only objects from arrays
D. Valid parsed null from invalid syntax

**Answer: D.** The ok tag avoids using null ambiguously for valid data and failure.

## 14. Which test verifies cleanup on operation failure?

A. Print the resource
B. Assert the throw and release-call count
C. Check the helper exists
D. Run only the success path

**Answer: B.** Observe both failure propagation and cleanup effects.

## 15. What helps reproduce a clock-dependent boundary bug?

A. Rewrite everything
B. Add random delays
C. Inject a fixed clock value
D. Ignore every exception

**Answer: C.** Deterministic input makes the hypothesis and regression test repeatable.

## 16. What should be assumed about error.stack?

A. It is diagnostic and runtime-dependent
B. It is a stable wire format
C. It contains only public data
D. It replaces the error message

**Answer: A.** Use stack text for diagnosis, not as an unfiltered public response or portable protocol.
