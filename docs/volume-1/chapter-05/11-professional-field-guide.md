# Strings, Numbers, and Dates: Professional Field Guide

## Choose the Representation First

| Requirement | Representation and policy |
| --- | --- |
| Opaque external ID | Validated string; preserve digits and case |
| Large integer arithmetic | Bounded BigInt with string serialization |
| Small inventory count | Nonnegative safe Number with checked results |
| Two-decimal price in this chapter | Bounded integer cents plus supported currency |
| User-visible label limit | Grapheme policy plus a separate storage-size limit |
| Exact event instant | Validated UTC timestamp or integer epoch milliseconds |
| Recurring local appointment | Calendar fields, named zone, and ambiguity policy |
| Localized presentation | Explicit Intl formatter; keep source domain data |

## Review a Text Helper

Ask what its unit is and what transformations it promises. Trimming whitespace is often appropriate for a label but not for an opaque token. NFC normalization merges canonical spellings; case conversion can depend on language and does not define a universal identifier policy.

Then examine allocation and limits. Does the helper build all grapheme segments to return a short prefix? That may be fine for a bounded display field, but the limit should be stated.

## Review a Numeric Helper

Write the unit beside every argument: cents, milliseconds, seconds, or item count. Check both accepted inputs and intermediate results. If an operation produces fractions, identify who owns the rounding decision and whether totals must reconcile after allocation.

A display function should not silently become an accounting function. The [money example](04-production-examples.md) supports a narrow, testable contract rather than arbitrary currency precision.

## Review a Time Helper

Specify the accepted text grammar, the date-validity check, the supported range, the source of now, and the interval boundaries. Distinguish an invalid request from a valid instant outside the interval. Keep that distinction in logs and error handling.

Test around midnight and year boundaries without relying on the machine's local zone. A named-zone scheduling feature also needs tests at offset transitions; this chapter's UTC elapsed-window helper does not claim that feature.

## References

- [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String): indexing, immutability, and methods.
- [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter): grapheme boundaries.
- [Number.isSafeInteger](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger): representable integer limits.
- [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt): arithmetic and serialization boundaries.
- [Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse): standard and implementation-dependent parsing behavior.

## Further Reading

Read [String.normalize](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) before designing a Unicode identity policy. Read [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) and [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) when building localized presentation.

Next, [Control Flow](../chapter-06/01-introduction.md) shows how to validate, skip, stop, and accumulate work without losing the domain rules.
