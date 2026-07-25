-- Supports the order-shipped n8n workflow: a cron-poll pattern consistent
-- with review_coupon_sent_at / abandoned_email_sent (this repo has no
-- webhook hook on admin status changes, only on Stripe's
-- checkout.session.completed, so "status just became shipped" has no other
-- event to hang off of). Additive only.

alter table orders add column shipped_tracking_email_sent_at timestamptz;

create index orders_shipped_email_query_idx on orders (status, shipped_tracking_email_sent_at);
