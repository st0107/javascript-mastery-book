'use strict';

{
  const assert = require('node:assert/strict');
  function chunk(values, size) {
    if (!Array.isArray(values)) throw new TypeError('values must be an array');
    if (values.length > 10000 || !Number.isInteger(size) || size < 1 || size > 1000) {
      throw new RangeError('invalid length or chunk size');
    }
    for (let index = 0; index < values.length; index += 1) {
      if (!Object.hasOwn(values, index)) throw new TypeError('values must be dense');
    }
    const chunks = [];
    for (let start = 0; start < values.length; start += size) {
      chunks.push(values.slice(start, start + size));
    }
    return chunks;
  }
  const object = { id: 'a' };
  const input = [object, 2, 3, 4, 5];
  const result = chunk(input, 2);
  assert.deepEqual(result, [[object, 2], [3, 4], [5]]);
  assert.notEqual(result[0], input);
  assert.equal(result[0][0], object);
  assert.equal(input.length, 5);
  assert.deepEqual(chunk([], 2), []);
  assert.throws(() => chunk(new Array(1), 2), TypeError);
  assert.throws(() => chunk(input, 0), RangeError);
  console.log(result.map(part => part.length).join(','));
  
  // Expected output:
  // 2,2,1
  
  // O(n) time and O(n) copied element slots, plus chunk-array overhead.
  
}

{
  const assert = require('node:assert/strict');
  function uniqueIds(values) {
    if (!Array.isArray(values)) throw new TypeError('ids must be an array');
    if (values.length > 1000) throw new RangeError('too many ids');
    const seen = new Set();
    for (let index = 0; index < values.length; index += 1) {
      if (!Object.hasOwn(values, index)) throw new TypeError('ids must be dense');
      const id = values[index];
      if (typeof id !== 'string' || id.length < 1 || id.length > 64) {
        throw new TypeError('invalid id');
      }
      seen.add(id);
    }
    return [...seen];
  }
  const input = ['b', 'a', 'b', 'A'];
  assert.deepEqual(uniqueIds(input), ['b', 'a', 'A']);
  assert.deepEqual(input, ['b', 'a', 'b', 'A']);
  assert.deepEqual(uniqueIds([]), []);
  assert.throws(() => uniqueIds(['a', 1]), TypeError);
  assert.throws(() => uniqueIds(new Array(1)), TypeError);
  console.log(uniqueIds(input).join(','));
  
  // Expected output:
  // b,a,A
  
  // Expected O(n) time under conventional Set lookup costs; O(u) unique-ID storage.
  
}

{
  const assert = require('node:assert/strict');
  function countLabels(labels) {
    if (!Array.isArray(labels)) throw new TypeError('labels must be an array');
    if (labels.length > 1000) throw new RangeError('too many labels');
    const counts = new Map();
    for (let index = 0; index < labels.length; index += 1) {
      if (!Object.hasOwn(labels, index)) throw new TypeError('labels must be dense');
      const label = labels[index];
      if (typeof label !== 'string' || label.length < 1 || label.length > 40) {
        throw new TypeError('invalid label');
      }
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return counts;
  }
  const counts = countLabels(['open', '__proto__', 'open']);
  assert.equal(counts.get('open'), 2);
  assert.equal(counts.get('__proto__'), 1);
  assert.deepEqual([...counts.keys()], ['open', '__proto__']);
  assert.equal(countLabels([]).size, 0);
  assert.throws(() => countLabels(['']), TypeError);
  console.log(JSON.stringify([...counts]));
  
  // Expected output:
  // [["open",2],["__proto__",1]]
  
  // Expected O(n) time with conventional Map lookup costs; O(u) distinct-key storage.
  
}

{
  const assert = require('node:assert/strict');
  function orderTasks(tasks) {
    if (!Array.isArray(tasks)) throw new TypeError('tasks must be an array');
    if (tasks.length > 1000) throw new RangeError('too many tasks');
    for (let index = 0; index < tasks.length; index += 1) {
      if (!Object.hasOwn(tasks, index)) throw new TypeError('tasks must be dense');
      const task = tasks[index];
      if (task === null || typeof task !== 'object' || Array.isArray(task) ||
          !Number.isInteger(task.priority) || task.priority < 0 || task.priority > 5) {
        throw new TypeError('invalid task priority');
      }
    }
    return tasks.toSorted((a, b) => b.priority - a.priority);
  }
  const input = [
    { id: 'a', priority: 2 }, { id: 'b', priority: 5 }, { id: 'c', priority: 2 }
  ];
  const sorted = orderTasks(input);
  assert.deepEqual(sorted.map(task => task.id), ['b', 'a', 'c']);
  assert.deepEqual(input.map(task => task.id), ['a', 'b', 'c']);
  assert.equal(sorted[0], input[1]);
  assert.notEqual(sorted, input);
  assert.deepEqual(orderTasks([]), []);
  assert.throws(() => orderTasks([{ priority: NaN }]), TypeError);
  console.log(sorted.map(task => task.id).join(','));
  
  // Expected output:
  // b,a,c
  
  // O(n) validation plus sort cost S(n); O(n) output slots plus sort workspace.
  
}

{
  const assert = require('node:assert/strict');
  function partitionReadings(values) {
    if (!Array.isArray(values)) throw new TypeError('values must be an array');
    if (values.length > 1000) throw new RangeError('too many readings');
    for (let index = 0; index < values.length; index += 1) {
      if (!Object.hasOwn(values, index)) throw new TypeError('values must be dense');
    }
    return values.reduce((result, value, index) => {
      if (Number.isFinite(value) && Math.abs(value) <= 1000000) result.accepted.push(value);
      else result.rejectedIndices.push(index);
      return result;
    }, { accepted: [], rejectedIndices: [] });
  }
  const input = [3, '4', NaN, -2, 1000001, null];
  assert.deepEqual(partitionReadings(input), {
    accepted: [3, -2], rejectedIndices: [1, 2, 4, 5]
  });
  assert.deepEqual(partitionReadings([]), { accepted: [], rejectedIndices: [] });
  assert.throws(() => partitionReadings(new Array(1)), TypeError);
  assert.equal(input[1], '4');
  console.log(JSON.stringify(partitionReadings(input)));
  
  // Expected output:
  // {"accepted":[3,-2],"rejectedIndices":[1,2,4,5]}
  
  // O(n) time and O(n) output storage.
  
}

{
  const assert = require('node:assert/strict');
  function resolveProducts(catalog, requested) {
    function requireDense(values) {
      if (!Array.isArray(values)) throw new TypeError('array required');
      if (values.length > 1000) throw new RangeError('too many items');
      for (let index = 0; index < values.length; index += 1) {
        if (!Object.hasOwn(values, index)) throw new TypeError('dense array required');
      }
    }
    function validSku(sku) {
      return typeof sku === 'string' && sku.length >= 1 && sku.length <= 40;
    }
    requireDense(catalog);
    requireDense(requested);
    const prices = new Map();
    for (const row of catalog) {
      if (row === null || typeof row !== 'object' || Array.isArray(row) ||
          !validSku(row.sku) || !Number.isInteger(row.priceCents) ||
          row.priceCents < 0 || row.priceCents > 1000000) throw new TypeError('invalid product');
      if (prices.has(row.sku)) throw new RangeError('duplicate catalog sku');
      prices.set(row.sku, row.priceCents);
    }
    return requested.map(sku => {
      if (!validSku(sku)) throw new TypeError('invalid requested sku');
      if (!prices.has(sku)) throw new RangeError('unknown sku');
      return { sku, priceCents: prices.get(sku) };
    });
  }
  const catalog = [{ sku: 'a', priceCents: 0 }, { sku: 'b', priceCents: 250 }];
  const output = resolveProducts(catalog, ['b', 'a', 'b']);
  assert.deepEqual(output.map(row => row.priceCents), [250, 0, 250]);
  assert.notEqual(output[0], output[2]);
  output[0].priceCents = 1;
  assert.equal(catalog[1].priceCents, 250);
  assert.equal(output[2].priceCents, 250);
  assert.throws(() => resolveProducts(catalog, ['missing']), RangeError);
  assert.throws(() => resolveProducts([catalog[0], catalog[0]], []), RangeError);
  assert.throws(() => resolveProducts(catalog, new Array(1)), TypeError);
  console.log(JSON.stringify(resolveProducts(catalog, ['b', 'a'])));
  
  // Expected output:
  // [{"sku":"b","priceCents":250},{"sku":"a","priceCents":0}]
  
  // Expected O(c + r) time with conventional Map lookup costs.
  // O(c + r) storage for the index and fresh result records.
  
}
