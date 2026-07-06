'use strict';

function isWithinWindow(nowMs, startIso, durationMs) {
  const startMs = Date.parse(startIso);

  if (Number.isNaN(startMs)) {
    throw new TypeError('Invalid ISO timestamp.');
  }

  return nowMs >= startMs && nowMs < startMs + durationMs;
}

console.log(isWithinWindow(Date.parse('2026-07-06T10:30:00.000Z'), '2026-07-06T10:00:00.000Z', 60 * 60 * 1000));
