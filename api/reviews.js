// Issue #38: GET /api/reviews?place=slug (approved only) and
// POST /api/reviews (multipart: foto + campos) -> 201, approved=false until moderated.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { IncomingForm } from 'formidable';
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';
import { dummyReviewsFor } from '../lib/dummyCatalog.js';
import { checkRateLimit } from '../lib/rateLimit.js';

export const config = { api: { bodyParser: false } };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB — reviews are a phone snapshot, not source assets
const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MIME_EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #8 — customer/city/
// comment no tenían tope de longitud server-side. Números de referencia
// del propio reporte, no confirmados por Ale — ajustar si define algo
// distinto (mismo criterio que FREE_TEXT_LIMITS en api/checkout.js).
const FIELD_LIMITS = { customer: 80, city: 80, comment: 1000 };

// photo.mimetype below is whatever Content-Type the client's multipart
// request declared — formidable trusts it, it doesn't inspect the file.
// Anyone can label arbitrary bytes "image/jpeg". This checks the real file
// signature instead, so the declared mimetype is only ever a hint, not the
// thing that decides what gets stored. No dependency: four fixed magic
// numbers don't need a library.
function detectImageMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

async function parseMultipart(req) {
  // maxFileSize/maxFiles were unset before — a public, unauthenticated
  // upload endpoint with no limit accepts formidable's default (a few GB),
  // which is a storage-cost/DoS lever for anyone who finds the endpoint.
  const form = new IncomingForm({ maxFileSize: MAX_PHOTO_BYTES, maxFiles: 1 });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function handleGet(req, res) {
  // Hallazgo (auditoría 10 ago 2026): a diferencia de getPlaces
  // (api/catalog.js), este GET no tenía rate limit ni Cache-Control —
  // límite más generoso que el POST de abajo porque es solo lectura de
  // datos ya públicos, no un límite de seguridad como el de moderación.
  if (!(await checkRateLimit(req, res, { key: 'reviews-get', limit: 30, windowMs: 60_000 }))) return;

  const { place } = req.query;
  if (!place) {
    return sendError(res, 400, 'invalid_request', 'place query param is required');
  }

  const { data: placeRow, error: placeError } = await supabase
    .from('places')
    .select('id')
    .eq('slug', place)
    .maybeSingle();
  // Unreachable, or a dummy-catalog slug with no real DB row — fall back to
  // placeholder reviews (empty for a genuinely unknown/real slug).
  if (placeError || !placeRow) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(dummyReviewsFor(place));
  }

  const { data, error } = await supabase
    .from('reviews')
    // id added (audit 10 ago 2026) — Reviews.jsx was forced into
    // `customer + índice` as a React key with no real id available,
    // risking wrong reconciliation whenever two approved reviews share a
    // customer name.
    .select('id, customer, city, rating, photo_url, comment')
    .eq('place_id', placeRow.id)
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(dummyReviewsFor(place));
  }
  // Same policy as getPlaces (api/catalog.js): public, revalidated hourly.
  // A brand-new approved review can take up to an hour to show up for a
  // cached visitor — acceptable for reviews, same tradeoff already made
  // for the catalog itself.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json(data);
}

async function handlePost(req, res) {
  let fields, files;
  try {
    ({ fields, files } = await parseMultipart(req));
  } catch (err) {
    return sendError(res, 400, 'invalid_request', err.message);
  }
  const one = (v) => (Array.isArray(v) ? v[0] : v);

  const place_slug = one(fields.place_slug);
  const customer = one(fields.customer);
  const city = one(fields.city);
  const rating = Number(one(fields.rating));
  const comment = one(fields.comment);
  const photo = one(files.photo);

  if (!place_slug || !rating) {
    return sendError(res, 400, 'invalid_request', 'place_slug and rating are required');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return sendError(res, 400, 'invalid_rating', 'rating must be an integer from 1 to 5');
  }
  // Brief Rayo X (jul 2026) sección 8 — formato de reseña obligatorio:
  // nombre real (o nombre + inicial), ciudad, y foto de la pieza instalada.
  // Nunca solo estrellas + texto genérico.
  if (!customer || !city) {
    return sendError(res, 400, 'invalid_request', 'customer and city are required');
  }
  if (customer.length > FIELD_LIMITS.customer) {
    return sendError(res, 400, 'invalid_request', `customer exceeds ${FIELD_LIMITS.customer} characters`);
  }
  if (city.length > FIELD_LIMITS.city) {
    return sendError(res, 400, 'invalid_request', `city exceeds ${FIELD_LIMITS.city} characters`);
  }
  if (comment && comment.length > FIELD_LIMITS.comment) {
    return sendError(res, 400, 'invalid_request', `comment exceeds ${FIELD_LIMITS.comment} characters`);
  }
  if (!photo) {
    return sendError(res, 400, 'invalid_request', 'photo is required — no se aceptan reseñas sin foto de la pieza instalada');
  }
  if (!ALLOWED_PHOTO_MIME.has(photo.mimetype)) {
    return sendError(res, 400, 'invalid_photo', 'photo must be JPEG, PNG, WEBP, or GIF');
  }

  const photoBuffer = await fs.readFile(photo.filepath);
  const realMime = detectImageMime(photoBuffer);
  if (!realMime) {
    return sendError(res, 400, 'invalid_photo', 'photo content is not a recognizable JPEG, PNG, WEBP, or GIF');
  }

  const { data: place } = await supabase
    .from('places')
    .select('id')
    .eq('slug', place_slug)
    .maybeSingle();
  if (!place) return sendError(res, 400, 'invalid_place', `Unknown place_slug: ${place_slug}`);

  // Generated name, not photo.originalFilename — an uploader-controlled
  // filename landing straight in a storage path/public URL is an easy
  // place for path separators or unexpected characters to cause trouble.
  // Extension/contentType come from the verified realMime, not the
  // client-declared photo.mimetype, so a mislabeled-but-real image still
  // gets stored correctly and a spoofed one never reaches this line at all.
  const path = `reviews/${Date.now()}-${crypto.randomUUID()}.${MIME_EXTENSION[realMime]}`;
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(path, photoBuffer, { contentType: realMime });
  if (uploadError) return sendError(res, 500, 'upload_error', uploadError.message);
  const photo_url = supabase.storage.from('images').getPublicUrl(path).data.publicUrl;

  const { error } = await supabase.from('reviews').insert({
    place_id: place.id,
    customer,
    city,
    rating,
    comment,
    photo_url,
    approved: false,
  });

  if (error) return sendError(res, 500, 'db_error', error.message);
  return res.status(201).json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') {
    if (!(await checkRateLimit(req, res, { key: 'reviews-post', limit: 5, windowMs: 60_000 }))) return;
    return handlePost(req, res);
  }
  res.setHeader('Allow', 'GET, POST');
  return sendError(res, 405, 'method_not_allowed', 'Use GET or POST');
}
