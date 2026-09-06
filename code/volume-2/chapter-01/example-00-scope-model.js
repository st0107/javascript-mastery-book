'use strict';

// Independent examples from the introduction, theory, and internal-working sections.
// Run from the repository root: node code/volume-2/chapter-01/example-00-scope-model.js
// Each block has its own local names. Expected output appears beside each demo.
// The batch and progress operations use O(1) state; callback collection uses O(n) state.
const assert = require('node:assert/strict');

// 01-introduction.md, example 1
{
  function createRequestLabel(requestId) {
    return function label(event) {
      return `${requestId}: ${event}`;
    };
  }

  const checkout = createRequestLabel('request-17');
  const refund = createRequestLabel('request-42');

  console.log(checkout('validated'));
  console.log(refund('started'));
  console.log(checkout('charged'));
  // Expected output:
  // request-17: validated
  // request-42: started
  // request-17: charged

  assert.equal(checkout('retry'), 'request-17: retry');
  assert.equal(refund('retry'), 'request-42: retry');
}

// 02-theory.md, example 2
{
  function createCurrencyReader() {
    const currency = 'INR';
    return () => currency;
  }

  function renderInAnotherScope(readCurrency) {
    const currency = 'USD';
    return `${currency} / ${readCurrency()}`;
  }

  const readCurrency = createCurrencyReader();
  console.log(renderInAnotherScope(readCurrency));
  // Expected output: USD / INR

  assert.equal(readCurrency(), 'INR');
}

// 02-theory.md, example 3
{
  function inspectBatch() {
    const status = 'pending';
    if (true) {
      const status = 'ready';
      var processed = 3;
      console.log(status);
    }
    console.log(status, processed);
  }

  inspectBatch();
  // Expected output:
  // ready
  // pending 3
}

// 02-theory.md, example 4
{
  function createProgress() {
    let completed = 0;
    return {
      advance() {
        completed += 1;
        return completed;
      },
      read() {
        return completed;
      }
    };
  }

  const importA = createProgress();
  const importB = createProgress();

  console.log(importA.advance());
  console.log(importA.advance());
  console.log(importA.read(), importB.read());
  console.log(importB.advance());
  // Expected output:
  // 1
  // 2
  // 2 0
  // 1

  assert.equal(importA.read(), 2);
  assert.equal(importB.read(), 1);
  assert.equal(createProgress().read(), 0);
}

// 02-theory.md, example 5
{
  function prepareReport() {
    let status = 'queued';
    const initialMessage = `Initially ${status}`;
    const report = () => `${initialMessage}; now ${status}`;

    status = 'complete';
    return report;
  }

  console.log(prepareReport()());
  // Expected output: Initially queued; now complete

  assert.equal(prepareReport()(), 'Initially queued; now complete');
}

// 02-theory.md, example 6
{
  function createRouteReaders(config) {
    const initialRoute = config.route;
    return {
      current: () => config.route,
      initial: () => initialRoute
    };
  }

  const config = { route: '/checkout' };
  const readers = createRouteReaders(config);
  config.route = '/refund';

  console.log(readers.current(), readers.initial());
  // Expected output: /refund /checkout

  assert.equal(readers.current(), '/refund');
  assert.equal(readers.initial(), '/checkout');
}

// 02-theory.md, example 7
{
  function demonstrateInitialization() {
    const readLimit = () => limit;
    try {
      console.log(readLimit());
    } catch (error) {
      console.log(error.name);
    }
    let limit = 5;
    console.log(readLimit());
  }

  demonstrateInitialization();
  // Expected output:
  // ReferenceError
  // 5
}

// 02-theory.md, example 8
{
  function collectCallbacks() {
    const shared = [];
    for (var index = 0; index < 3; index += 1) {
      shared.push(() => index);
    }

    const separate = [];
    for (let index = 0; index < 3; index += 1) {
      separate.push(() => index);
    }

    console.log(shared.map(read => read()).join(', '));
    console.log(separate.map(read => read()).join(', '));
  }

  collectCallbacks();
  // Expected output:
  // 3, 3, 3
  // 0, 1, 2
}

// 03-internal-working.md, example 9
{
  function createBatchTotal(initial) {
    let total = initial;

    return function add(amount) {
      total += amount;
      return total;
    };
  }

  const addToBatch = createBatchTotal(100);
  console.log(addToBatch(25));
  console.log(addToBatch(10));
  // Expected output:
  // 125
  // 135

  assert.equal(addToBatch(0), 135);
  assert.equal(createBatchTotal(0)(4), 4);
}

console.log('Scope model checks passed.');
// Expected final line: Scope model checks passed.
