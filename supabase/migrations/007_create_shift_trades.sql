create table shift_trade_offers (
  id                 uuid primary key default gen_random_uuid(),
  shift_id           uuid not null references shifts(id) on delete cascade,
  offered_by         uuid not null references profiles(id),
  reason             text,
  claimed_by         uuid references profiles(id),
  claimed_at         timestamptz,
  status             trade_status not null default 'pending_claim',
  manager_decision_by uuid references profiles(id),
  manager_decision_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_trades_shift on shift_trade_offers(shift_id);
create index idx_trades_status on shift_trade_offers(status);

-- Only one active claim-pending-approval per shift at a time
create unique index idx_trades_single_active_claim
  on shift_trade_offers(shift_id)
  where status = 'claim_pending_approval';
