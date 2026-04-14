-- organizations
create policy org_read on organizations for select using (id = current_org_id());
create policy org_update on organizations for update using (id = current_org_id() and is_owner());

-- profiles
create policy profiles_read on profiles for select using (organization_id = current_org_id());
create policy profiles_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_write_admin on profiles for all
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());

-- locations
create policy locations_read on locations for select using (organization_id = current_org_id());
create policy locations_write on locations for all
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());

-- areas
create policy areas_read on areas for select
  using (exists (select 1 from locations l where l.id = areas.location_id and l.organization_id = current_org_id()));
create policy areas_write on areas for all
  using (exists (select 1 from locations l where l.id = areas.location_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from locations l where l.id = areas.location_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- area_task_templates
create policy tasktmpl_read on area_task_templates for select
  using (exists (select 1 from areas a join locations l on l.id = a.location_id where a.id = area_task_templates.area_id and l.organization_id = current_org_id()));
create policy tasktmpl_write on area_task_templates for all
  using (exists (select 1 from areas a join locations l on l.id = a.location_id where a.id = area_task_templates.area_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from areas a join locations l on l.id = a.location_id where a.id = area_task_templates.area_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- shifts
create policy shifts_read on shifts for select using (
  exists (select 1 from locations l where l.id = shifts.location_id and l.organization_id = current_org_id())
  and (is_owner_or_manager() or employee_id = auth.uid() or status in ('published','offered'))
);
create policy shifts_write on shifts for all
  using (exists (select 1 from locations l where l.id = shifts.location_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from locations l where l.id = shifts.location_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- shift_trade_offers
create policy trades_read on shift_trade_offers for select
  using (exists (select 1 from shifts s join locations l on l.id = s.location_id where s.id = shift_trade_offers.shift_id and l.organization_id = current_org_id()));
create policy trades_write_self on shift_trade_offers for insert
  with check (offered_by = auth.uid());
create policy trades_update on shift_trade_offers for update
  using (
    exists (select 1 from shifts s join locations l on l.id = s.location_id where s.id = shift_trade_offers.shift_id and l.organization_id = current_org_id())
    and (is_owner_or_manager() or claimed_by = auth.uid() or offered_by = auth.uid())
  );

-- timesheets
create policy ts_read on timesheets for select
  using (organization_id = current_org_id() and (employee_id = auth.uid() or is_owner_or_manager()));
create policy ts_insert_self on timesheets for insert
  with check (organization_id = current_org_id() and employee_id = auth.uid());
create policy ts_update_manager on timesheets for update
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());
create policy ts_update_self_open on timesheets for update
  using (employee_id = auth.uid() and clock_out_at is null)
  with check (employee_id = auth.uid());

-- task_completions
create policy tc_rw on task_completions for all
  using (exists (select 1 from timesheets t where t.id = task_completions.timesheet_id
                   and t.organization_id = current_org_id()
                   and (t.employee_id = auth.uid() or is_owner_or_manager())))
  with check (exists (select 1 from timesheets t where t.id = task_completions.timesheet_id
                        and t.organization_id = current_org_id()
                        and (t.employee_id = auth.uid() or is_owner_or_manager())));

-- audit log (read-only for managers)
create policy audit_read on timesheet_audit_log for select
  using (exists (select 1 from timesheets t where t.id = timesheet_audit_log.timesheet_id and t.organization_id = current_org_id()) and is_owner_or_manager());

-- messages
create policy messages_read on messages for select
  using (exists (select 1 from locations l where l.id = messages.location_id and l.organization_id = current_org_id()));
create policy messages_write on messages for all
  using (exists (select 1 from locations l where l.id = messages.location_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from locations l where l.id = messages.location_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- reactions
create policy reactions_rw on message_reactions for all
  using (profile_id = auth.uid()
         and exists (select 1 from messages m join locations l on l.id = m.location_id where m.id = message_reactions.message_id and l.organization_id = current_org_id()))
  with check (profile_id = auth.uid());

-- holidays
create policy holidays_read on holidays for select using (organization_id = current_org_id());
create policy holidays_write on holidays for all
  using (organization_id = current_org_id() and is_owner())
  with check (organization_id = current_org_id() and is_owner());

-- payroll_exports
create policy payroll_rw on payroll_exports for all
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());

-- push_notification_log
create policy push_read_self on push_notification_log for select using (profile_id = auth.uid() or is_owner_or_manager());
