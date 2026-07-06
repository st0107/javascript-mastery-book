'use strict';

function createInvoiceCalculator({ taxRate, discountRate }) {
  return function calculateInvoiceTotal(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = subtotal * discountRate;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;

    return {
      subtotal,
      discount,
      tax,
      total: taxableAmount + tax
    };
  };
}

const calculateInvoiceTotal = createInvoiceCalculator({
  taxRate: 0.18,
  discountRate: 0.1
});

const invoice = calculateInvoiceTotal([
  { sku: 'BOOK-JS-001', price: 1200, quantity: 1 },
  { sku: 'COURSE-JS-ADV', price: 2400, quantity: 2 }
]);

console.log(invoice);

// Expected output:
// { subtotal: 6000, discount: 600, tax: 972, total: 6372 }
// Complexity: O(n) time, O(1) additional space excluding input and output.

