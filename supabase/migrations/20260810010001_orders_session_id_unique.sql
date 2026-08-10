-- Hallazgo #7 (auditoría 10 ago 2026): orders.stripe_session_id had no
-- uniqueness constraint, and api/webhooks/stripe.js used a non-atomic
-- check-then-insert (select existing -> insert if not found). Two
-- concurrent deliveries of the same Stripe event (a normal retry, or two
-- near-simultaneous webhook calls) could both pass the select before
-- either insert landed, producing two orders — and two fabricated/shipped
-- pieces — for a single payment.
--
-- NOTE for Ale before running this in the Supabase SQL editor: if any
-- duplicate stripe_session_id already exists from this exact bug, this
-- ALTER will fail with a unique_violation. Run this check first —
--   select stripe_session_id, count(*) from orders
--   where stripe_session_id is not null
--   group by stripe_session_id having count(*) > 1;
-- — and manually resolve any rows it returns (keep the order with real
-- order_items, cancel/delete the duplicate) before applying the migration.
alter table orders
  add constraint orders_stripe_session_id_unique unique (stripe_session_id);
