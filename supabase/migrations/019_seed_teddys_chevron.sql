-- Seed Teddy's Chevron — ONLY for development. Do not run in production.
-- Assumes auth.users row for rajeev has been created via Supabase dashboard.
-- Replace '<rajeev-auth-uid>' with the real UID before running.

do $$
declare
  v_org_id      uuid := '00000000-0000-0000-0000-000000000001';
  v_loc_id      uuid := '00000000-0000-0000-0000-000000000010';
  v_rajeev_uid  uuid := '<rajeev-auth-uid>';
  v_cashier_id  uuid;
  v_manager_id  uuid;
  v_stocker_id  uuid;
  v_overnight_id uuid;
begin
  insert into organizations (id, name, owner_user_id)
    values (v_org_id, 'Teddy''s Chevron', v_rajeev_uid)
    on conflict (id) do nothing;

  insert into profiles (id, organization_id, first_name, last_name, email, role, rate_weekday, rate_saturday, rate_sunday, rate_public_holiday)
    values (v_rajeev_uid, v_org_id, 'Rajeev', 'Paudel', 'rajeev@crewflow.dev', 'owner', 0, 0, 0, 0)
    on conflict (id) do nothing;

  insert into locations (id, organization_id, name, address, timezone)
    values (v_loc_id, v_org_id, 'Plum Grove', '7940 Plum Grove Rd, Plum Grove, TX 77327', 'America/Chicago')
    on conflict (id) do nothing;

  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'Cashier',         '#FF6B2C', 1) returning id into v_cashier_id;
  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'Manager',         '#3B82F6', 2) returning id into v_manager_id;
  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'STOCKER',         '#10B981', 3) returning id into v_stocker_id;
  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'Overnight Shift', '#8B5CF6', 4) returning id into v_overnight_id;

  insert into area_task_templates (area_id, title, sort_order) values
    (v_stocker_id, 'Refilled ice machine', 1),
    (v_stocker_id, 'Restocked coolers', 2),
    (v_stocker_id, 'Checked expiration dates', 3),
    (v_stocker_id, 'Swept floor', 4),
    (v_stocker_id, 'Emptied trash', 5);

  insert into holidays (organization_id, name, observed_date) values
    (v_org_id, 'New Year''s Day', '2026-01-01'),
    (v_org_id, 'Memorial Day',   '2026-05-25'),
    (v_org_id, 'Independence Day','2026-07-04'),
    (v_org_id, 'Labor Day',      '2026-09-07'),
    (v_org_id, 'Thanksgiving',   '2026-11-26'),
    (v_org_id, 'Christmas Day',  '2026-12-25')
  on conflict do nothing;
end $$;
