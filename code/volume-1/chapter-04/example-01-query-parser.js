'use strict';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

console.log({
  page: parsePositiveInteger('2', 'page'),
  pageSize: parsePositiveInteger('25', 'pageSize')
});
