'use strict';

const assert = require('node:assert/strict');

async function runEdgeCases() {
  // Each block is independent: its names and state belong to that block.
  {
    function createProgress() {
      let completed = 0;
      const initialMessage = `Completed ${completed}`;
      return {
        finishOne() { completed += 1; },
        readCount() { return completed; },
        readInitialMessage() { return initialMessage; },
        readCurrentMessage() { return `Completed ${completed}`; }
      };
    }

    const progress = createProgress();
    progress.finishOne();
    const values = [
      progress.readCount(), progress.readInitialMessage(), progress.readCurrentMessage()
    ];
    assert.deepEqual(values, [1, 'Completed 0', 'Completed 1']);
    values.forEach(value => console.log(value));
  }

  {
    function inspectInitialization() {
      const readStatus = () => status;
      assert.throws(readStatus, ReferenceError);
      try {
        readStatus();
      } catch (error) {
        console.log(error.name);
      }
      let status = 'ready';
      return readStatus;
    }

    const readStatus = inspectInitialization();
    assert.equal(readStatus(), 'ready');
    console.log(readStatus());
  }

  {
    const sharedTask = { status: 'queued' };
    const callbacks = [];
    for (let index = 0; index < 2; index += 1) {
      const task = sharedTask;
      callbacks.push(() => `${index}:${task.status}`);
    }
    assert.deepEqual(callbacks.map(callback => callback()), ['0:queued', '1:queued']);
    sharedTask.status = 'done';
    const values = callbacks.map(callback => callback());
    assert.deepEqual(values, ['0:done', '1:done']);
    console.log(values.join(', '));
    // For n callbacks: O(n) construction and invocation time; O(n) storage.
  }

  {
    function createPreferences() {
      const preferences = { theme: 'light' };
      return { read() { return preferences; } };
    }
    const api = createPreferences();
    const exposed = api.read();
    exposed.theme = 'dark';
    assert.equal(api.read(), exposed);
    assert.equal(api.read().theme, 'dark');
    assert.equal(Object.hasOwn(api, 'preferences'), false);
    console.log(api.read().theme);
    console.log(Object.hasOwn(api, 'preferences'));
  }

  {
    // Optional async preview: both calls read before either await resumes.
    let completed = 0;
    async function finishTask() {
      const before = completed;
      await Promise.resolve();
      completed = before + 1;
    }
    await Promise.all([finishTask(), finishTask()]);
    assert.equal(completed, 1);
    console.log(completed);

    // The corrected counter reads and writes with no await between the steps.
    let correctedCompleted = 0;
    async function finishWithoutStaleRead() {
      await Promise.resolve();
      correctedCompleted += 1;
    }
    await Promise.all([finishWithoutStaleRead(), finishWithoutStaleRead()]);
    assert.equal(correctedCompleted, 2);
  }

  console.log('edge case assertions passed');
}

if (require.main === module) {
  runEdgeCases().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
module.exports = { runEdgeCases };

// Expected output:
// 1
// Completed 0
// Completed 1
// ReferenceError
// ready
// 0:done, 1:done
// dark
// false
// 1
// edge case assertions passed
