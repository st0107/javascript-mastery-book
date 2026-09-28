# Strings, Numbers, and Dates: Production Examples

## Bounded Two-Decimal Money Display

**Contract:** accept an integer Number of cents from -1,000,000,000 through +1,000,000,000. Support USD, EUR, GBP, and INR only, all with two fractional digits in this example. Reject fractional, unsafe, nonnumeric, or out-of-range input. Normalize negative zero. Pass an explicit locale; the example uses `en-US`.

This is a display helper. It does not define tax arithmetic, exchange rates, allocation, or support for currencies with other minor-unit scales. The bound keeps conversion to display units comfortably below the precision at which cent differences disappear.

```js
function formatMoneyFromCents(cents, locale = 'en-US', currency = 'USD') {
  const allowed = ['USD', 'EUR', 'GBP', 'INR'];
  if (!Number.isSafeInteger(cents) || Math.abs(cents) > 1000000000) {
    throw new RangeError('Expected integer cents within plus or minus 1,000,000,000.');
  }
  if (typeof locale !== 'string' || !allowed.includes(currency)) {
    throw new TypeError('Expected a locale string and a supported two-decimal currency.');
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((Object.is(cents, -0) ? 0 : cents) / 100);
}

console.log(formatMoneyFromCents(1299));
console.log(formatMoneyFromCents(-105));
console.log(formatMoneyFromCents(-0));
try {
  formatMoneyFromCents(1000000001);
} catch (error) {
  console.log(error.name);
}
// Expected output:
// $12.99
// -$1.05
// $0.00
// RangeError
```

The companion assertion program is `code/volume-1/chapter-05/example-01-money-formatting.js`. It covers both bounds, unsupported currencies, strings, fractions, infinities, and negative zero.

Input validation happens before formatting. `Intl.NumberFormat` may reject a malformed locale with `RangeError`; callers should choose supported product locales instead of passing arbitrary request values. Reuse a formatter for a fixed locale/currency in a repeated-render path, with a bounded cache if options vary.

Work and output size are bounded here. Constructing a formatter has a cost, but claiming a fixed number of machine operations would be misleading because locale processing belongs to the runtime.

## Canonical UTC Access Window

**Contract:** `startIso` is a four-digit-year canonical UTC timestamp with exactly three fractional digits. `nowMs` is a safe integer Number within the Date range. `durationMs` is an integer Number from zero through seven elapsed days. The calculated end must remain representable and within the Date range. The result describes `[start, end)`.

Accepting the clock value as an argument makes tests deterministic and leaves clock acquisition to the caller. Validation errors throw; a valid time outside the window returns false.

```js
function isWithinWindow(nowMs, startIso, durationMs) {
  const dateLimit = 8640000000000000;
  const maxDuration = 7 * 24 * 60 * 60 * 1000;
  const canonicalUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (typeof startIso !== 'string' || !canonicalUtc.test(startIso)) {
    throw new TypeError('Expected YYYY-MM-DDTHH:mm:ss.sssZ.');
  }
  const startMs = Date.parse(startIso);
  if (!Number.isFinite(startMs) || new Date(startMs).toISOString() !== startIso) {
    throw new RangeError('Invalid UTC calendar timestamp.');
  }
  if (!Number.isSafeInteger(nowMs) || Math.abs(nowMs) > dateLimit) {
    throw new RangeError('Expected an integer timestamp within the Date range.');
  }
  if (!Number.isSafeInteger(durationMs) || durationMs < 0 || durationMs > maxDuration) {
    throw new RangeError('Expected an integer duration from zero to seven days.');
  }
  const endMs = startMs + durationMs;
  if (!Number.isSafeInteger(endMs) || Math.abs(endMs) > dateLimit) {
    throw new RangeError('Window end is out of range.');
  }
  return nowMs >= startMs && nowMs < endMs;
}

const start = '2026-07-06T10:00:00.000Z';
const startMs = Date.parse(start);
console.log(isWithinWindow(startMs, start, 3600000));
console.log(isWithinWindow(startMs + 3599999, start, 3600000));
console.log(isWithinWindow(startMs + 3600000, start, 3600000));
console.log(isWithinWindow(startMs, start, 0));
try {
  isWithinWindow(startMs, start, '3600000');
} catch (error) {
  console.log(error.name);
}
// Expected output:
// true
// true
// false
// false
// RangeError
```

The companion `code/volume-1/chapter-05/example-02-date-window.js` also rejects February 30, non-leap February 29, hour 24, missing milliseconds, non-UTC offsets, non-finite clocks, fractional durations, and values beyond the declared limits. Leap-year February 29 is accepted.

Parsing alone can normalize some calendar overflow. The round-trip check compares normalized UTC output with the exact input, so normalization cannot silently change a request. Since the grammar has fixed length, parsing and checking use bounded work and storage.

The four-digit start-year grammar is much narrower than the full Date range. The explicit end check documents a reusable arithmetic invariant; it also prevents a future widening of the grammar from introducing unchecked overflow.

## Operational Boundaries

A scheduled local meeting needs a named zone and calendar policy, not this elapsed-duration helper. An authorization system also needs an authoritative clock and server-side enforcement. Formatting or client-side time checks do not enforce access control.

Return normalized domain values across service boundaries: integer minor units plus a currency identifier, or epoch milliseconds plus a documented meaning. Keep display strings at the presentation boundary.
