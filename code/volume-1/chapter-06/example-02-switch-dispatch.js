'use strict';

function reduceOrderState(state, event) {
  switch (event.type) {
    case 'PAID':
      return { ...state, paid: true };
    case 'SHIPPED':
      return { ...state, shipped: true };
    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}

console.log(reduceOrderState({ paid: false, shipped: false }, { type: 'PAID' }));
