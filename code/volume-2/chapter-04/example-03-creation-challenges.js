'use strict';

const assert = require('node:assert/strict');

// Exercise 1: shared methods, distinct callbacks, and live method lookup.
{
  class LabelFormatter {
    prefix;
    callback = text => this.format(text);

    constructor(prefix) { this.prefix = prefix; }
    format(text) { return `${this.prefix}: ${text}`; }
  }

  const first = new LabelFormatter('Preview');
  const second = new LabelFormatter('Review');
  assert.equal(first.format, second.format);
  assert.notEqual(first.callback, second.callback);
  assert.equal(Object.hasOwn(first, 'format'), false);
  assert.equal(Object.hasOwn(first, 'callback'), true);

  const callback = first.callback;
  const bound = first.format.bind(first);
  first.prefix = 'Ready';
  assert.equal(callback('Chapter 4'), 'Ready: Chapter 4');
  assert.equal(bound('Chapter 4'), 'Ready: Chapter 4');
  const detached = first.format;
  assert.throws(() => detached('Chapter 4'), TypeError);

  first.format = text => `Revised: ${text}`;
  assert.equal(callback('Chapter 4'), 'Revised: Chapter 4');
  assert.equal(bound('Chapter 4'), 'Ready: Chapter 4');
  assert.equal(second.format('Chapter 4'), 'Review: Chapter 4');
  console.log('Exercise 1: method ownership and callback checks passed.');
}

// Exercise 2: initialization order and validation after derived fields exist.
{
  const steps = [];
  class Document {
    category = (steps.push('base field'), 'document');

    constructor(title) {
      steps.push('base body');
      this.title = title;
      this.category = 'assigned-by-base';
    }
  }
  class Workbook extends Document {
    category = (steps.push('derived field'), 'workbook');
    #minimumPages = 1;

    constructor(title, pages) {
      super(title);
      steps.push('derived body');
      this.pages = pages;
      this.#validate();
    }

    #validate() {
      if (!Number.isSafeInteger(this.pages) || this.pages < this.#minimumPages) {
        throw new RangeError('pages must be a positive safe integer.');
      }
    }
  }

  const workbook = new Workbook('JavaScript', 24);
  assert.deepEqual(steps, ['base field', 'base body', 'derived field', 'derived body']);
  assert.equal(workbook.category, 'workbook');
  assert.equal(workbook.title, 'JavaScript');
  assert.equal(workbook.pages, 24);
  for (const invalid of [0, -1, 1.5, '24', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => new Workbook('Invalid', invalid), RangeError);
  }
  // A further subclass's public method cannot replace the private validator.
  class SpecializedWorkbook extends Workbook {
    validate() { throw new Error('This unrelated method must not be called.'); }
  }
  assert.equal(new SpecializedWorkbook('Special', 1).pages, 1);
  console.log('Exercise 2: initialization and validation checks passed.');
}

// Exercise 3: rejected mutations and snapshots cannot change private records.
{
  class RevisionHistory {
    #limit;
    #entries = [];

    constructor(limit) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
        throw new RangeError('limit must be an integer from 1 to 1000.');
      }
      this.#limit = limit;
    }

    append(title) {
      if (typeof title !== 'string') throw new TypeError('title must be a string.');
      const normalized = title.trim();
      if (normalized.length === 0 || normalized.length > 100) {
        throw new RangeError('title must contain 1 to 100 code units after trimming.');
      }
      if (this.#entries.length === this.#limit) throw new RangeError('history is full.');
      const number = this.#entries.length + 1;
      this.#entries.push({ number, title: normalized });
      return number;
    }

    get size() { return this.#entries.length; }
    snapshot() {
      return this.#entries.map(entry => ({ number: entry.number, title: entry.title }));
    }
  }

  for (const limit of [0, 1001, -1, 1.5, '2', NaN]) {
    assert.throws(() => new RevisionHistory(limit), RangeError);
  }
  const history = new RevisionHistory(2);
  assert.equal(history.append('  Draft  '), 1);
  assert.throws(() => history.append(null), TypeError);
  assert.throws(() => history.append('   '), RangeError);
  assert.throws(() => history.append('x'.repeat(101)), RangeError);
  assert.equal(history.size, 1);

  const first = history.snapshot();
  const second = history.snapshot();
  assert.notEqual(first, second);
  assert.notEqual(first[0], second[0]);
  first[0].title = 'Outside edit';
  first.push({ number: 99, title: 'Outside append' });
  assert.deepEqual(history.snapshot(), [{ number: 1, title: 'Draft' }]);
  assert.equal(history.append('x'.repeat(100)), 2);
  assert.throws(() => history.append('Third'), RangeError);
  assert.equal(history.size, 2);
  assert.equal(new RevisionHistory(2).size, 0);
  console.log('Exercise 3: private history and snapshot checks passed.');
}

// Exercise 4: injected stages execute in order and only successful calls count.
{
  function createTextPipeline(normalize, decorate) {
    if (typeof normalize !== 'function' || typeof decorate !== 'function') {
      throw new TypeError('normalize and decorate must be functions.');
    }
    let completed = 0;
    return {
      render(input) {
        if (typeof input !== 'string') throw new TypeError('input must be a string.');
        const normalized = normalize(input);
        if (typeof normalized !== 'string') throw new TypeError('normalize must return a string.');
        const result = decorate(normalized);
        if (typeof result !== 'string') throw new TypeError('decorate must return a string.');
        completed += 1;
        return result;
      },
      stats() { return { completed }; }
    };
  }

  assert.throws(() => createTextPipeline(null, text => text), TypeError);
  assert.throws(() => createTextPipeline(text => text, {}), TypeError);
  const calls = [];
  const pipeline = createTextPipeline(
    text => { calls.push('normalize'); return text.trim(); },
    text => { calls.push('decorate'); return `[${text}]`; }
  );
  const render = pipeline.render;
  const stats = pipeline.stats;
  assert.equal(render('  Chapter 4  '), '[Chapter 4]');
  assert.deepEqual(calls, ['normalize', 'decorate']);
  assert.throws(() => render(42), TypeError);
  assert.equal(calls.length, 2);
  const report = stats();
  report.completed = 100;
  assert.deepEqual(stats(), { completed: 1 });

  let decorated = false;
  const invalidNormalized = createTextPipeline(() => 42, text => {
    decorated = true;
    return text;
  });
  assert.throws(() => invalidNormalized.render('draft'), TypeError);
  assert.equal(decorated, false);
  assert.equal(invalidNormalized.stats().completed, 0);
  const invalidDecorated = createTextPipeline(text => text, () => 42);
  assert.throws(() => invalidDecorated.render('draft'), TypeError);
  assert.equal(invalidDecorated.stats().completed, 0);

  const sentinel = { reason: 'stage failure' };
  const throwsFirst = createTextPipeline(() => { throw sentinel; }, text => text);
  const throwsSecond = createTextPipeline(text => text, () => { throw sentinel; });
  assert.throws(() => throwsFirst.render('draft'), error => error === sentinel);
  assert.throws(() => throwsSecond.render('draft'), error => error === sentinel);
  assert.equal(throwsFirst.stats().completed, 0);
  assert.equal(throwsSecond.stats().completed, 0);
  assert.equal(stats().completed, 1);
  console.log('Exercise 4: composition and failure-accounting checks passed.');
}

// Exercise 5: explicit DTO shape, validated construction, and isolated copies.
{
  class ReaderProfile {
    #id;
    #displayName;

    constructor(id, displayName) {
      if (typeof id !== 'string' || !/^[a-z0-9-]{1,32}$/.test(id)) {
        throw new TypeError('id must contain 1 to 32 lowercase letters, digits, or hyphens.');
      }
      if (typeof displayName !== 'string') throw new TypeError('displayName must be a string.');
      const normalized = displayName.trim();
      if (normalized.length === 0 || normalized.length > 80) {
        throw new RangeError('displayName must contain 1 to 80 code units after trimming.');
      }
      this.#id = id;
      this.#displayName = normalized;
    }

    label() { return `${this.#displayName} (${this.#id})`; }
    toDTO() { return { version: 1, id: this.#id, displayName: this.#displayName }; }
    static fromDTO(dto) {
      if (dto === null || typeof dto !== 'object' || Array.isArray(dto)) {
        throw new TypeError('dto must be a JSON object.');
      }
      const required = ['version', 'id', 'displayName'];
      if (Object.keys(dto).length !== required.length ||
          !required.every(key => Object.hasOwn(dto, key)) || dto.version !== 1) {
        throw new TypeError('dto must contain exactly version 1, id, and displayName.');
      }
      return new ReaderProfile(dto.id, dto.displayName);
    }
  }

  const dto = JSON.parse('{"version":1,"id":"reader-7","displayName":"  Mira  "}');
  const profile = ReaderProfile.fromDTO(dto);
  assert.equal(profile instanceof ReaderProfile, true);
  assert.equal(profile.label(), 'Mira (reader-7)');
  dto.displayName = 'Outside edit';
  const copy = profile.toDTO();
  copy.id = 'changed';
  assert.deepEqual(profile.toDTO(), { version: 1, id: 'reader-7', displayName: 'Mira' });
  assert.notEqual(profile.toDTO(), profile.toDTO());
  const roundTrip = ReaderProfile.fromDTO(JSON.parse(JSON.stringify(profile.toDTO())));
  assert.equal(roundTrip.label(), profile.label());
  assert.notEqual(roundTrip, profile);

  for (const invalid of [null, [], 'reader', {},
    { version: 2, id: 'reader', displayName: 'Mira' },
    { version: 1, id: 'reader', displayName: 'Mira', role: 'admin' },
    JSON.parse('{"version":1,"id":"reader","displayName":"Mira","__proto__":{"admin":true}}')]) {
    assert.throws(() => ReaderProfile.fromDTO(invalid), TypeError);
  }
  for (const id of ['', 'UPPER', 'with space', 'reader-7\n', 'x'.repeat(33), 7]) {
    assert.throws(() => new ReaderProfile(id, 'Mira'), TypeError);
  }
  assert.throws(() => new ReaderProfile('reader', null), TypeError);
  for (const name of ['   ', 'x'.repeat(81)]) {
    assert.throws(() => new ReaderProfile('reader', name), RangeError);
  }
  assert.equal(new ReaderProfile('x'.repeat(32), 'x'.repeat(80)).toDTO().id.length, 32);
  const imitation = Object.create(ReaderProfile.prototype);
  assert.equal(imitation instanceof ReaderProfile, true);
  assert.throws(() => imitation.label(), TypeError);
  console.log('Exercise 5: DTO validation and hydration checks passed.');
}

// Exercise 6: receiver brands, overflow safety, and explicit family ownership.
{
  class TicketSequence {
    static #created = 0;
    #position;

    constructor(start = 0) {
      if (!Number.isSafeInteger(start) || start < 0) {
        throw new RangeError('start must be a non-negative safe integer.');
      }
      this.#position = start;
      TicketSequence.#created += 1;
    }

    next() {
      if (this.#position === Number.MAX_SAFE_INTEGER) {
        throw new RangeError('sequence is exhausted.');
      }
      this.#position += 1;
      return this.#position;
    }

    static createdCount() { return TicketSequence.#created; }
  }

  class PrioritySequence extends TicketSequence {}
  const regular = new TicketSequence(10);
  const priority = new PrioritySequence(100);
  assert.equal(TicketSequence.createdCount(), 2);
  assert.equal(PrioritySequence.createdCount(), 2);
  const detached = regular.next;
  assert.throws(() => detached(), TypeError);
  const next = regular.next.bind(regular);
  assert.equal(next(), 11);
  assert.equal(next(), 12);
  assert.equal(priority.next(), 101);
  const imitation = Object.create(TicketSequence.prototype);
  assert.equal(imitation instanceof TicketSequence, true);
  assert.throws(() => imitation.next(), TypeError);
  assert.throws(() => regular.next.call({}), TypeError);

  for (const start of [-1, 1.5, '0', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => new TicketSequence(start), RangeError);
  }
  assert.equal(TicketSequence.createdCount(), 2);
  const last = new TicketSequence(Number.MAX_SAFE_INTEGER - 1);
  assert.equal(last.next(), Number.MAX_SAFE_INTEGER);
  assert.throws(() => last.next(), RangeError);
  assert.throws(() => last.next(), RangeError);
  assert.equal(PrioritySequence.createdCount(), 3);

  class BrokenSequence extends TicketSequence {
    constructor() { super(); throw new Error('Later construction failed.'); }
  }
  assert.throws(() => new BrokenSequence(), /Later construction failed/);
  assert.equal(TicketSequence.createdCount(), 4);

  class ReceiverDependentCount {
    static #created = 1;
    static count() { return this.#created; }
  }
  class ChildCount extends ReceiverDependentCount {}
  assert.equal(ReceiverDependentCount.count(), 1);
  assert.throws(() => ChildCount.count(), TypeError);
  console.log('Exercise 6: private receiver and static ownership checks passed.');
}

// Expected output:
// Exercise 1: method ownership and callback checks passed.
// Exercise 2: initialization and validation checks passed.
// Exercise 3: private history and snapshot checks passed.
// Exercise 4: composition and failure-accounting checks passed.
// Exercise 5: DTO validation and hydration checks passed.
// Exercise 6: private receiver and static ownership checks passed.

// Complexity: fixed-size checks dominate this demonstration. The history API
// takes O(t) title validation and O(n) time/space for an n-entry snapshot; the
// pipeline adds O(1) bookkeeping to its stages; DTO parsing validates O(k + s)
// keys/text. Callback and numeric operations use O(1) source-level bookkeeping.
