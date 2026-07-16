// Issue #38: GET /api/reviews?place=slug (approved only) and
// POST /api/reviews (multipart: foto + campos) -> 201, approved=false until moderated.
import fs from 'node:fs/promises';
import { IncomingForm } from 'formidable';
import { supabase } from './_lib/supabase.js';
import { sendError } from './_lib/errors.js';

export const config = { api: { bodyParser: false } };

async function parseMultipart(req) {
  const form = new IncomingForm();
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

  const { data: placeRow } = await supabase
    .from('places')
    .select('id')
    .eq('slug', place)
    .maybeSingle();
  if (!placeRow) return res.status(200).json([]);

  const { data, error } = await supabase
    .from('reviews')
    .select('customer, city, rating, photo_url, comment')
    .eq('place_id', placeRow.id)
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) return sendError(res, 500, 'db_error', error.message);
  return res.status(200).json(data);
}

async function handlePost(req, res) {
  const { fields, files } = await parseMultipart(req);
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

  const { data: place } = await supabase
    .from('places')
    .select('id')
    .eq('slug', place_slug)
    .maybeSingle();
  if (!place) return sendError(res, 400, 'invalid_place', `Unknown place_slug: ${place_slug}`);

  let photo_url = null;
  if (photo) {
    const buffer = await fs.readFile(photo.filepath);
    const path = `reviews/${Date.now()}-${photo.originalFilename}`;
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
