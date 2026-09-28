# Control Flow: MCQs

Choose one answer and identify the execution rule that supports it.

## 1. When an if condition is false, which branch executes?

A. Both branches, with the result discarded
B. Neither branch even if else exists
C. Only the selected else branch, if present
D. The branch with fewer statements

**Answer: C.** Only the chosen branch executes; an absent else means no branch body runs.

## 2. Which construct naturally selects a short expression value?

A. The conditional operator
B. A for...in loop
C. A switch case label
D. A labeled block

**Answer: A.** The conditional operator yields one of two expression results. A branch statement is better for a multi-step action.

## 3. How does switch compare its discriminant with a case value?

A. Object.is matching
B. Loose equality with coercion
C. String conversion for every case
D. Strict-equality matching

**Answer: D.** A Number 1 does not match string "1"; NaN also does not match NaN as a case value.

## 4. What happens after a matched case body without break, return, or throw?

A. The switch restarts
B. Execution continues through following statements
C. Only matching later cases execute
D. The engine inserts an implicit break

**Answer: B.** Fallthrough follows statements regardless of later labels.

## 5. How often can a do...while body run if its condition is initially false?

A. Zero times
B. It throws before running
C. Until the condition becomes true
D. Once

**Answer: D.** The first test follows the first body execution.

## 6. In a classic for loop, where does continue transfer control?

A. Immediately after the loop
B. Back to initialization
C. To the update expression and then the test
D. To the start of the body without a test

**Answer: C.** The update still runs; initialization happens only once.

## 7. What does continue do in a while loop?

A. Proceed to the next condition test
B. Run every skipped statement first
C. Increment every numeric variable
D. Exit the function

**Answer: A.** An update skipped in the body is not automatic, which can prevent progress.

## 8. What does for...of over an ordinary array provide?

A. Enumerable property names
B. Element values through its iterator
C. Only own non-index properties
D. Every inherited value

**Answer: B.** Array value iteration follows the iterator, not property enumeration.

## 9. Which keys does for...in include?

A. Only own symbol keys
B. Enumerable string keys, including inherited ones
C. Only numeric indices as Numbers
D. All properties, including non-enumerable ones

**Answer: B.** Use Object.keys when own enumerable string keys are intended.

## 10. What is the ordinary array value iterator result for a hole?

A. It stops the loop
B. It throws ReferenceError
C. It skips the index without yielding
D. It yields undefined

**Answer: D.** A hole differs from an absent iteration step for ordinary array value iteration.

## 11. A break inside a switch inside a loop exits what?

A. The function
B. The outer loop
C. The switch
D. Both switch and loop

**Answer: C.** Unlabeled break targets the nearest enclosing switch or loop.

## 12. What can continue label target?

A. An enclosing labeled loop
B. Any enclosing function
C. Any earlier source line
D. Any labeled block

**Answer: A.** Continue must select an iteration target; it is not a general goto.

## 13. Does const job in for...of freeze each job object?

A. Yes, including nested data
B. Only when the input array is const
C. No; it prevents binding reassignment within that iteration
D. Only if the loop has no continue

**Answer: C.** Binding immutability and object mutability are separate.

## 14. Why test a record that is both valid-fatal and cancelled?

A. To prove it is an array
B. To verify which policy has precedence
C. To ensure all branches execute twice
D. To test numeric overflow

**Answer: B.** Separate cancellation and fatal tests do not expose an ordering bug when both conditions hold.

## 15. Which is a loop invariant for the validated job batch?

A. Output contains only accepted records from the visited prefix
B. The loop will always visit every input
C. The current job can never be invalid
D. The output shares every input object

**Answer: A.** The invariant remains true after append, skip, and exit paths; fatal records can shorten traversal.

## 16. What establishes termination for an unchanged finite indexed scan?

A. Using const for the array binding
B. Writing the loop in a single line
C. Adding a console log inside the loop
D. A bounded index advances toward length on each continuing path

**Answer: D.** Progress and a bound form the argument. Syntax style alone does not ensure termination.
