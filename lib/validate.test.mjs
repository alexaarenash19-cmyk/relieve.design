// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #11.
// Run: node lib/validate.test.mjs
import assert from 'node:assert';
import { validateEmail } from './validate.js';

// Valid.
assert.strictEqual(validateEmail('a@b.co'), true);
assert.strictEqual(validateEmail('nombre.apellido@relieve.design'), true);

// Invalid — exactly the shapes email.includes('@') used to let through.
assert.strictEqual(validateEmail('@'), false);
assert.strictEqual(validateEmail('a@'), false);
assert.strictEqual(validateEmail('@@@'), false);
assert.strictEqual(validateEmail('@b.co'), false);
assert.strictEqual(validateEmail('a@b'), false, 'no domain suffix');
assert.strictEqual(validateEmail(''), false);
assert.strictEqual(validateEmail(undefined), false);
assert.strictEqual(validateEmail(null), false);
assert.strictEqual(validateEmail(123), false, 'non-string');
assert.strictEqual(validateEmail('a b@c.co'), false, 'whitespace not allowed');

// 254-char RFC 5321 practical max.
const longLocal = 'a'.repeat(250);
assert.strictEqual(validateEmail(`${longLocal}@b.co`), false, 'over 254 chars total');

console.log('validate.test.mjs: all assertions passed');
