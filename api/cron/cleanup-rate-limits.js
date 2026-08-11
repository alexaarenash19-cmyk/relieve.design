// Hallazgo (auditoría 10 ago 2026): cleanup_old_rate_limit_hits() (ver
// supabase/migrations/20260725010001_rate_limit_hits.sql) existía en la DB
// pero nada la llamaba nunca — ni un cron de Vercel, ni un workflow de n8n,
// ni pg_cron. Este endpoint + el cron diario en vercel.json es lo que
// finalmente la dispara.
//
// Protegido con CRON_SECRET: Vercel llama sus crons con
// `Authorization: Bearer $CRON_SECRET` (patrón oficial de Vercel) — mismo
// criterio de "si no está configurado, rechazar" que ADMIN_TOKEN en
// lib/adminAuth.js, no un fallback abierto.
import { timingSafeEqual } from 'node:crypto';
import { supabase } from '../../lib/supabase.js';
import { sendError } from '../../lib/errors.js';
import { sendAlert } from '../../lib/alerts.js';

function tokensMatch(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const expected = process.env.CRON_SECRET;

  if (!token || !expected || !tokensMatch(token, expected)) {
    return sendError(res, 401, 'unauthorized', 'Missing or invalid cron secret');
  }

  const { error } = await supabase.rpc('cleanup_old_rate_limit_hits');
  if (error) {
    await sendAlert('cleanup_old_rate_limit_hits failed', error.message);
    return sendError(res, 500, 'cleanup_failed', error.message);
  }

  return res.status(200).json({ ok: true });
}
