import { timingSafeEqual } from 'node:crypto';
import { sendError } from './errors.js';
import { checkRateLimit } from './rateLimit.js';

// Plain !== leaks how many leading characters of the guess matched via
// response timing — cheap to fix, so we do, even though ADMIN_TOKEN's
// length alone makes brute-forcing impractical either way.
function tokensMatch(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Now async: gates on a rate-limit check before the token comparison, so a
// brute-force attempt burns through its request budget instead of getting
// unlimited guesses. Every caller already does
// `if (!(await requireAdmin(req, res))) return;`-shaped guarding via
// `if (!requireAdmin(req, res)) return;` — needs an `await` added at each
// call site alongside this change.
export async function requireAdmin(req, res) {
  const allowed = await checkRateLimit(req, res, { key: 'admin-auth', limit: 20, windowMs: 60_000 });
  if (!allowed) return false; // checkRateLimit already sent the 429

  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const expected = process.env.ADMIN_TOKEN;

  if (!token || !expected || !tokensMatch(token, expected)) {
    sendError(res, 401, 'unauthorized', 'Missing or invalid admin token');
    return false;
  }
  return true;
}
