-- Profiles hold the app role for each Supabase Auth account.
-- Accounts are created by admins through the `admin-users` Edge Function, which inserts the profile.
-- An auth account without a profile is not allowed into the app.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in users may read only their own profile. All writes go through the
-- Edge Function using the service role, so there are no insert/update/delete policies.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- The primary admin gets an admin profile automatically when its auth account is created.
create or replace function public.handle_primary_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'pa2@skillizee.io' then
    insert into public.profiles (id, email, role)
    values (new.id, lower(new.email), 'admin')
    on conflict (id) do update set role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_primary_admin on auth.users;
create trigger on_auth_user_created_primary_admin
  after insert on auth.users
  for each row execute function public.handle_primary_admin();

-- In case the primary admin account already exists
insert into public.profiles (id, email, role)
select id, lower(email), 'admin' from auth.users where lower(email) = 'pa2@skillizee.io'
on conflict (id) do update set role = 'admin';
