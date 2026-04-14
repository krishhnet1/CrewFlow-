create or replace function current_profile()
returns profiles language sql stable as $$
  select * from profiles where id = auth.uid() limit 1;
$$;

create or replace function current_org_id()
returns uuid language sql stable as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function is_owner_or_manager()
returns boolean language sql stable as $$
  select role in ('owner','manager') from profiles where id = auth.uid();
$$;

create or replace function is_owner()
returns boolean language sql stable as $$
  select role = 'owner' from profiles where id = auth.uid();
$$;
