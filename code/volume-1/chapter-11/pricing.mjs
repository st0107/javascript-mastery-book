export function quoteLine(unitCents, quantity) {
  if (!Number.isInteger(unitCents) || unitCents < 0 || unitCents > 1_000_000) {
    throw new RangeError('unitCents must be an integer from 0 through 1000000');
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000) {
    throw new RangeError('quantity must be an integer from 0 through 1000');
  }
  return { unitCents, quantity, totalCents: unitCents * quantity };
}
// Expected output:
// (none)

// Time O(1); additional space O(1).
