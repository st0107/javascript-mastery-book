import { quoteLine } from './pricing.mjs';

export function createReport(write) {
  if (typeof write !== 'function') throw new TypeError('write must be a function');
  return function report(unitCents, quantity) {
    const quote = quoteLine(unitCents, quantity);
    const line = `items=${quote.quantity}; totalCents=${quote.totalCents}`;
    write(line);
    return quote;
  };
}
// Expected output:
// (none)

// Time O(1), excluding the writer; additional space O(1) under the numeric bounds.
