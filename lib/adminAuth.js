import { timingSafeEqual } from 'node:crypto';
import { sendError } from './errors.js';

// Plain !== leaks how many leading characters of the guess matched via
// response timing — cheap to fix, so we do, even though ADMIN_TOKEN's
// length alone makes brute-forcing impractical either way.
function tokensMatch(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function requireAdmin(req, res) {
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const expected = process.env.ADMIN_TOKEN;

  if (!token || !expected || !tokensMatch(token, expected)) {
    sendError(res, 401, 'unauthorized', 'Missing or invalid admin token');
    return false;
  }
  return true;
}
