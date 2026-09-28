# Professional Field Guide

## Case Study: Export Works in a Page but Fails in a Worker

A report calculator queries the document for a status label before returning its result. A team moves the calculation into a worker to keep the page responsive. The first report now fails before calculation begins because the worker has no page document.

The repair separates responsibilities. The calculator receives parsed data and returns a report value. A page adapter reads form controls and updates status. A worker adapter receives messages and posts results. The language-level rule has no reason to discover a DOM or infer its host from global names.

Verify the calculation with plain inputs, the page adapter with a document-capable test environment, and the worker adapter with its message contract. A passing calculator test alone does not verify either host integration.

## Case Study: Checkout Rejects an Unexpected Amount

A server accepts integer cents, but a form submits the string `"2599"`. Silently widening the shared validator to convert any input would also accept representations the API never promised, such as whitespace or booleans under some conversions. Define the form parser's decimal grammar and bounds, then pass a Number to the shared validator. The server applies its own request contract and price verification.

Record the accepted representation, minimum, maximum, error category, and the component that owns authorization. Boundary tests should include the maximum plus one and malformed text, not just a typical purchase.

## Choosing Where Code Belongs

| Responsibility | Good home | Reason |
| --- | --- | --- |
| Validate integer-cent amount | Shared domain function | Same rule can run in multiple hosts. |
| Read an input element | Page adapter | Depends on a particular document. |
| Write a report file | Explicit storage adapter | Permission and failure belong to the operation. |
| Verify cart ownership | Authoritative server service | Client behavior is controlled by the user. |
| Decide runtime support | Deployment policy and target tests | A proposal stage is insufficient evidence. |

## A Review Conversation

Ask what happens before the calculation, what it guarantees, and what can fail after it returns. A successful amount check does not imply that a writer succeeded. A successful write does not prove that the amount was authorized. Keeping these claims separate produces useful result types and logs.

When a bug appears, reproduce it in the intended execution mode using the smallest real input. State the violated contract in an assertion. Place the repair in the layer that owns that contract so the next person can understand the fix.

## Readiness Check

Explain why `Array.isArray` is portable while a page DOM is not; trace a function call; distinguish a callable capability from permission; name an input that violates the checkout range; and explain why the server validates independently. Then continue to [Variables and Data Types](../chapter-02/01-introduction.md).
