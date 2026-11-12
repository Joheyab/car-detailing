create extension if not exists btree_gist;

create table if not exists public.service_catalog (
  id text primary key,
  name text not null,
  price numeric(8, 2),
  description text not null default '',
  duration_minutes integer check (duration_minutes is null or duration_minutes between 30 and 1440),
  active boolean not null default true,
  sort_order smallint not null default 0
);

insert into public.service_catalog (id, name, price, description, sort_order)
values
  ('basic-detailing', 'Paquete básico detailing', 50, 'Limpieza de plásticos, rines, exterior, aspirado y limpieza de vidrios.', 1),
  ('premium-detailing', 'Paquete premium detailing', 75, 'Paquete básico más cera y pulido de vidrios.', 2),
  ('full-detail', 'Full detail', null, 'Interior, asientos, carpeta, motor, rines y exterior. Solicita cotización.', 3),
  ('car-wash', 'Car wash', 50, 'Lavado exterior, limpieza de llantas, aspirado, limpieza de plásticos y vidrios.', 4),
  ('car-wash-premium', 'Car wash premium', 65, 'Car wash más aplicación de cera, limpieza y pulido de vidrios, y acabado brillante.', 5),
  ('car-wash-wax', 'Car wash básico + cera en carrocería', 80, 'Lavado exterior, limpieza de aros y llantas, cera en carrocería, secado y acabado final.', 6)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  description = excluded.description,
  sort_order = excluded.sort_order;

create table if not exists public.weekly_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  is_open boolean not null default false,
  opens_at time,
  closes_at time,
  constraint weekly_hours_valid_range check (
    (not is_open and opens_at is null and closes_at is null)
    or (is_open and opens_at is not null and closes_at is not null and closes_at > opens_at)
  )
);

insert into public.weekly_hours (weekday, is_open)
select weekday, false from generate_series(0, 6) as weekday
on conflict (weekday) do nothing;

create table if not exists public.booking_admins (
  email text primary key check (email = lower(email))
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 1 and 30),
  vehicle text not null check (char_length(vehicle) between 1 and 100),
  service_location text,
  service_id text not null,
  preferred_date date not null,
  preferred_time time not null,
  start_at timestamptz,
  end_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists service_location text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz;

alter table public.bookings
  drop constraint if exists bookings_service_id_check;

drop policy if exists "Anyone can request a booking" on public.bookings;

update public.bookings
set service_id = case service_id
  when 'essential' then 'car-wash'
  when 'signature' then 'premium-detailing'
  when 'ceramic' then 'full-detail'
  else service_id
end
where service_id in ('essential', 'signature', 'ceramic');

alter table public.bookings
  add constraint bookings_service_id_check
  check (service_id in (
    'basic-detailing',
    'premium-detailing',
    'full-detail',
    'car-wash',
    'car-wash-premium',
    'car-wash-wax'
  ));

alter table public.bookings
  drop constraint if exists bookings_service_id_fkey;

alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id) references public.service_catalog(id);

update public.bookings
set start_at = (preferred_date + preferred_time) at time zone 'America/New_York'
where start_at is null;

update public.bookings
set end_at = start_at + interval '2 hours'
where end_at is null and start_at is not null;

create index if not exists bookings_start_at_idx on public.bookings (start_at);

alter table public.bookings
  drop constraint if exists bookings_one_confirmed_slot;

alter table public.bookings
  drop constraint if exists bookings_preferred_date_preferred_time_key;

drop index if exists public.bookings_one_confirmed_slot;

alter table public.bookings
  drop constraint if exists bookings_single_workspace_exclusion;

alter table public.bookings
  add constraint bookings_single_workspace_exclusion
  exclude using gist (tstzrange(start_at, end_at, '[)') with &&)
  where (status in ('pending', 'confirmed') and start_at is not null and end_at is not null);

create or replace function public.is_booking_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.booking_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_booking_admin() from public, anon;
grant execute on function public.is_booking_admin() to authenticated;

alter table public.booking_admins enable row level security;
alter table public.weekly_hours enable row level security;
alter table public.service_catalog enable row level security;
alter table public.bookings enable row level security;

revoke all on public.booking_admins from anon, authenticated;
grant select on public.booking_admins to authenticated;
drop policy if exists "Admins can verify their own email" on public.booking_admins;
create policy "Admins can verify their own email"
  on public.booking_admins for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke all on public.weekly_hours from anon, authenticated;
grant select, insert, update on public.weekly_hours to authenticated;
drop policy if exists "Admins manage weekly hours" on public.weekly_hours;
create policy "Admins manage weekly hours"
  on public.weekly_hours for all to authenticated
  using (public.is_booking_admin())
  with check (public.is_booking_admin());

revoke all on public.service_catalog from anon, authenticated;
grant select, update on public.service_catalog to authenticated;
drop policy if exists "Admins manage service durations" on public.service_catalog;
create policy "Admins manage service durations"
  on public.service_catalog for all to authenticated
  using (public.is_booking_admin())
  with check (public.is_booking_admin());

revoke all on public.bookings from anon, authenticated;
grant select, update on public.bookings to authenticated;
drop policy if exists "Admins manage bookings" on public.bookings;
create policy "Admins manage bookings"
  on public.bookings for all to authenticated
  using (public.is_booking_admin())
  with check (public.is_booking_admin());

create or replace function public.get_available_slots(p_date date, p_service_id text)
returns table (slot_time time)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_hours public.weekly_hours%rowtype;
  v_duration integer;
  v_interval integer;
begin
  if p_date < (now() at time zone 'America/New_York')::date
    or p_date > (now() at time zone 'America/New_York')::date + 90 then
    return;
  end if;

  select * into v_hours
  from public.weekly_hours
  where weekday = extract(dow from p_date)::smallint;

  if not found or not v_hours.is_open then
    return;
  end if;

  select duration_minutes into v_duration
  from public.service_catalog
  where id = p_service_id and active;

  if not found or v_duration is null then
    return;
  end if;

  v_interval := 30;

  return query
  select candidate::time
  from generate_series(
    (p_date + v_hours.opens_at)::timestamp,
    (p_date + v_hours.closes_at - make_interval(mins => v_duration))::timestamp,
    make_interval(mins => v_interval)
    ) as slots(candidate)
  where not exists (
    select 1
    from public.bookings b
    where b.status in ('pending', 'confirmed')
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(
        (p_date + candidate::time) at time zone 'America/New_York',
        (p_date + candidate::time) at time zone 'America/New_York'
          + make_interval(mins => v_duration),
        '[)'
      )
  )
    and (p_date + candidate::time) at time zone 'America/New_York' > now()
  order by candidate;
end;
$$;

revoke all on function public.get_available_slots(date, text) from public;
grant execute on function public.get_available_slots(date, text) to anon, authenticated;

create or replace function public.request_booking(
  p_customer_name text,
  p_email text,
  p_phone text,
  p_vehicle text,
  p_service_location text,
  p_service_id text,
  p_date date,
  p_time time,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hours public.weekly_hours%rowtype;
  v_duration integer;
  v_start timestamptz;
  v_end timestamptz;
  v_interval integer := 30;
  v_booking_id uuid;
begin
  if char_length(trim(coalesce(p_customer_name, ''))) not between 1 and 100
    or char_length(trim(coalesce(p_email, ''))) not between 3 and 254
    or trim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(trim(coalesce(p_phone, ''))) not between 1 and 30
    or char_length(trim(coalesce(p_vehicle, ''))) not between 1 and 100
    or char_length(trim(coalesce(p_service_location, ''))) not between 1 and 100
    or char_length(coalesce(p_notes, '')) > 1000 then
    raise exception using message = 'invalid_booking_details', errcode = '22023';
  end if;

  if p_date < (now() at time zone 'America/New_York')::date
    or p_date > (now() at time zone 'America/New_York')::date + 90 then
    raise exception using message = 'invalid_booking_date', errcode = '22023';
  end if;

  select * into v_hours
  from public.weekly_hours
  where weekday = extract(dow from p_date)::smallint;

  if not found or not v_hours.is_open then
    raise exception using message = 'business_closed', errcode = '22023';
  end if;

  select duration_minutes into v_duration
  from public.service_catalog
  where id = p_service_id and active;

  if not found or v_duration is null then
    raise exception using message = 'service_not_configured', errcode = '22023';
  end if;

  if (p_date + p_time) at time zone 'America/New_York' <= now()
    or p_time < v_hours.opens_at
    or extract(epoch from p_time)::integer + v_duration * 60
      > extract(epoch from v_hours.closes_at)::integer
    or mod(extract(epoch from (p_time - v_hours.opens_at))::integer, v_interval * 60) <> 0 then
    raise exception using message = 'invalid_booking_time', errcode = '22023';
  end if;

  v_start := (p_date + p_time) at time zone 'America/New_York';
  v_end := v_start + make_interval(mins => v_duration);

  if exists (
    select 1 from public.bookings b
    where b.status in ('pending', 'confirmed')
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(v_start, v_end, '[)')
  ) then
    raise exception using message = 'booking_slot_unavailable', errcode = '23P01';
  end if;

  insert into public.bookings (
    customer_name,
    email,
    phone,
    vehicle,
    service_location,
    service_id,
    preferred_date,
    preferred_time,
    start_at,
    end_at,
    notes,
    status
  ) values (
    trim(p_customer_name),
    lower(trim(p_email)),
    trim(p_phone),
    trim(p_vehicle),
    trim(p_service_location),
    p_service_id,
    p_date,
    p_time,
    v_start,
    v_end,
    nullif(trim(coalesce(p_notes, '')), ''),
    'pending'
  )
  returning id into v_booking_id;

  return v_booking_id;
exception
  when exclusion_violation then
    raise exception using message = 'booking_slot_unavailable', errcode = '23P01';
end;
$$;

revoke all on function public.request_booking(text, text, text, text, text, text, date, time, text) from public;
grant execute on function public.request_booking(text, text, text, text, text, text, date, time, text) to anon, authenticated;

create or replace function public.update_booking_settings(
  p_weekly_hours jsonb,
  p_service_durations jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_day record;
  v_service record;
begin
  if not public.is_booking_admin() then
    raise exception using message = 'admin_required', errcode = '42501';
  end if;

  if jsonb_typeof(p_weekly_hours) <> 'array'
    or jsonb_array_length(p_weekly_hours) <> 7
    or jsonb_typeof(p_service_durations) <> 'array'
    or jsonb_array_length(p_service_durations) <> 6 then
    raise exception using message = 'invalid_booking_settings', errcode = '22023';
  end if;

  for v_day in
    select * from jsonb_to_recordset(p_weekly_hours)
      as day_settings(weekday integer, is_open boolean, opens_at text, closes_at text)
  loop
    if v_day.weekday not between 0 and 6
      or v_day.is_open is null
      or (v_day.is_open and (v_day.opens_at is null or v_day.closes_at is null))
      or (not v_day.is_open and (v_day.opens_at is not null or v_day.closes_at is not null)) then
      raise exception using message = 'invalid_booking_settings', errcode = '22023';
    end if;

    insert into public.weekly_hours (weekday, is_open, opens_at, closes_at)
    values (
      v_day.weekday::smallint,
      v_day.is_open,
      v_day.opens_at::time,
      v_day.closes_at::time
    )
    on conflict (weekday) do update set
      is_open = excluded.is_open,
      opens_at = excluded.opens_at,
      closes_at = excluded.closes_at;
  end loop;

  for v_service in
    select * from jsonb_to_recordset(p_service_durations)
      as service_settings(id text, duration_minutes integer)
  loop
    if v_service.duration_minutes is not null
      and (
        v_service.duration_minutes < 30
        or v_service.duration_minutes > 1440
        or v_service.duration_minutes % 30 <> 0
      ) then
      raise exception using message = 'invalid_booking_settings', errcode = '22023';
    end if;

    update public.service_catalog
    set duration_minutes = v_service.duration_minutes
    where id = v_service.id;

    if not found then
      raise exception using message = 'invalid_booking_settings', errcode = '22023';
    end if;
  end loop;

  if (
    select count(distinct weekday) from jsonb_to_recordset(p_weekly_hours)
      as day_settings(weekday integer)
  ) <> 7 or (
    select count(distinct id) from jsonb_to_recordset(p_service_durations)
      as service_settings(id text)
  ) <> 6 then
    raise exception using message = 'invalid_booking_settings', errcode = '22023';
  end if;
end;
$$;

revoke all on function public.update_booking_settings(jsonb, jsonb) from public, anon;
grant execute on function public.update_booking_settings(jsonb, jsonb) to authenticated;
