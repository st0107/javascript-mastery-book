# Strings, Numbers, and Dates: Performance and Security

## Bound Input Before Expensive Work

Normalize, segment, or match only text that fits a documented input-size limit. Grapheme segmentation may produce many segments; collecting them with `Array.from` also allocates an array. If only a prefix is required, a loop can stop after the necessary cluster count.

Avoid assuming that string concatenation, slicing, or normalization has one universal allocation strategy. Engines can share or flatten storage. Measure the complete workload and retained objects, especially when keeping a tiny substring of a very large input.

## Reuse Formatters Deliberately

Repeatedly creating an `Intl.NumberFormat` or `Intl.DateTimeFormat` for unchanged options adds work. Construct one formatter per fixed configuration. If configuration comes from requests, bound the supported locale/currency combinations before caching; an unbounded cache is a memory-growth policy.

Keep formatting outside calculation loops when the result is only displayed once. Do not optimize away validation at an external boundary because a microbenchmark measures it.

## Regex Resource Limits

A pattern with nested overlapping repetition can require excessive backtracking for a near-match. Prefer a simple bounded grammar when the domain permits one, cap input length, and test long failing inputs. A safe result for a short example does not establish a worst-case runtime guarantee.

Do not construct an executable pattern directly from arbitrary user text unless the product intentionally accepts regex syntax and supplies resource controls. Plain-text search often needs a string method instead.

## Numeric Integrity

A malformed numeric value can be a correctness or authorization bug: infinity may bypass a range assumption, an unsafe integer may merge distinct IDs, and string concatenation may extend an expiry window. Validate type, syntax where applicable, finite/safe range, units, and computed results.

BigInt permits large values but computation and memory grow with digit count. Length limits belong before conversion. Native BigInt operations should not be assumed constant-time for secret-dependent cryptographic work. See [BigInt cryptography notes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#cryptography).

## Text Safety Is Contextual

Normalization is not sanitization. Template interpolation is not HTML escaping. A valid identifier grammar does not make text safe for every output context. Use the destination's safe API: text content for ordinary DOM text and parameters for database values.

A normalized label may still contain visually confusing characters. Decide whether labels are display names, trusted IDs, or credentials before applying a policy. Never silently transform a password or signature through a convenience text-cleaning helper.

## Clock and Calendar Costs

Reading a wall clock is not a reliable way to benchmark short operations: clock adjustments can change it. Use the runtime's monotonic performance clock for elapsed measurements. For business expiry, use the authoritative system clock with an explicit service policy.

UTC arithmetic avoids host-zone dependence for elapsed windows. It does not implement local recurring schedules, business days, or holiday calendars. Choose the representation from the requirement before optimizing it.
