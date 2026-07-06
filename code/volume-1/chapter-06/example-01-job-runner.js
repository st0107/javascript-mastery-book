'use strict';

function processJobs(jobs) {
  const processed = [];

  for (const job of jobs) {
    if (job.cancelled) continue;
    if (job.priority === 'fatal') break;

    processed.push({ id: job.id, status: 'processed' });
  }

  return processed;
}

console.log(processJobs([
  { id: 'a', cancelled: false, priority: 'normal' },
  { id: 'b', cancelled: true, priority: 'normal' },
  { id: 'c', cancelled: false, priority: 'fatal' }
]));
