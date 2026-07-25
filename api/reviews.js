// Issue #38: GET /api/reviews?place=slug (approved only) and
// POST /api/reviews (multipart: foto + campos) -> 201, approved=false until moderated.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { IncomingForm } from 'formidable';
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';
import { dummyReviewsFor } from '../lib/dummyCatalog.js';

export const config = { api: { bodyParser: false } };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB — reviews are a phone snapshot, not source assets
const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MIME_EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

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
  if (placeError || !placeRow) return res.status(200).json(dummyReviewsFor(place));

  const { data, error } = await supabase
    .from('reviews')
    .select('customer, city, rating, photo_url, comment')
    .eq('place_id', placeRow.id)
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(200).json(dummyReviewsFor(place));
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
  if (photo && !ALLOWED_PHOTO_MIME.has(photo.mimetype)) {
    return sendError(res, 400, 'invalid_photo', 'photo must be JPEG, PNG, WEBP, or GIF');
  }

  const { data: place } = await supabase
    .from('places')
    .select('id')
    .eq('slug', place_slug)
    .maybeSingle();
  if (!place) return sendError(res, 400, 'invalid_place', `Unknown place_slug: ${place_slug}`);

  let photo_url = null;
  if (photo) {
    const buffer = await fs.readFile(photo.filepath);
    // Generated name, not photo.originalFilename — an uploader-controlled
    // filename landing straight in a storage path/public URL is an easy
    // place for path separators or unexpected characters to cause trouble.
    const path = `reviews/${Date.now()}-${crypto.randomUUID()}.${MIME_EXTENSION[photo.mimetype]}`;
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(path, buffer, { contentType: photo.mimetype });
    if (uploadError) return sendError(res, 500, 'upload_error', uploadError.message);
    photo_url = supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  }

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
  if (req.method === 'POST') return handlePost(req, res);
  res.setHeader('Allow', 'GET, POST');
  return sendError(res, 405, 'method_not_allowed', 'Use GET or POST');
}
