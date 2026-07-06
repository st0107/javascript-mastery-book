'use strict';

function resolveRetryPolicy(config) {
  return {
    retries: config.retries ?? 3,
    timeoutMs: config.timeoutMs ?? 1500,
    enabled: config.enabled ?? true
  };
}

console.log(resolveRetryPolicy({ retries: 0, enabled: false }));
