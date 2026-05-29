alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin'));

update public.profiles
   set role = 'admin'
 where lower(email) = 'zerolabsaipublisher@gmail.com';

insert into public.profiles (id, email, role)
select users.id, users.email, 'admin'
  from auth.users as users
 where lower(users.email) = 'zerolabsaipublisher@gmail.com'
on conflict (id) do update
set email = excluded.email,
    role = 'admin';
