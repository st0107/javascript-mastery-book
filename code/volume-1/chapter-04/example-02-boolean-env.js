'use strict';

function parseBoolean(value, fieldName) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new TypeError(`${fieldName} must be "true" or "false".`);
}

console.log(parseBoolean('false', 'CACHE_ENABLED'));
