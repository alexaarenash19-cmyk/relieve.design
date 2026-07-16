import { sendError } from './errors.js';

export function requireAdmin(req, res) {
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    sendError(res, 401, 'unauthorized', 'Missing or invalid admin token');
    return false;
  }
  return true;
}
