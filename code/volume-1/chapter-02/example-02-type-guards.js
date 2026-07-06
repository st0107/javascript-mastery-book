'use strict';

function normalizeUser(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('Expected a user object.');
  }

  const { id, email } = input;

  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new TypeError('User id and email must be strings.');
  }

  return { id, email: email.toLowerCase() };
}

console.log(normalizeUser({ id: 'U-1', email: 'LEA@EXAMPLE.COM' }));
