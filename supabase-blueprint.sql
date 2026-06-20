-- ==========================================
-- SUPABASE MIGRATION & INFRASTRUCTURE BLUEPRINT
-- Project: Rajendra Prasad Government Senior Secondary School (GSSS)
-- ==========================================

-- This blueprint sets up the database schema, role-based access control, Row Level Security (RLS) policies,
-- and automated Storage Buckets configurations for the School Management System.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. ROLE ARCHITECTURE & USER PROFILES
-- ==========================================

-- Profile / User roles table
create table public.user_roles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  role text not null check (role in ('admin', 'staff', 'student')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on user roles
alter table public.user_roles enable row level security;

-- Helper function to check if the current requester is an administrator
-- Created before policies so it can be referenced securely with security definer
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Policies for user roles
create policy "Users can view own role" 
  on public.user_roles for select 
  using (
    auth.uid() = id 
    or public.is_admin()
  );

create policy "Admins can manage roles" 
  on public.user_roles for all 
  using (public.is_admin());

-- Trigger to automatically create a user profile inside public.user_roles on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- All newly self-signed-up users default strictly to 'student'.
  -- Administrative privileges must be assigned manually via database insertion or direct promotion.
  insert into public.user_roles (id, email, role)
  values (
    new.id, 
    new.email, 
    'student'::text
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 2. SCHOOL SETTINGS
-- ==========================================

create table public.school_settings (
  id uuid primary key default uuid_generate_v4(),
  school_name text not null,
  school_motto text not null,
  address text not null,
  phone text not null,
  email text not null,
  logo_url text,
  hero_image_url text,
  footer_subtitle text,
  footer_description text,
  school_affiliation text,
  hero_title text,
  hero_subtitle text,
  hero_description text,
  hero_badge_text text,
  hero_estd_text text,
  hero_dise_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.school_settings enable row level security;

create policy "Allow public read access to school settings"
  on public.school_settings for select using (true);

create policy "Allow admins to insert/update school settings"
  on public.school_settings for all using (public.is_admin());


-- ==========================================
-- 3. HOMEPAGE MODULES
-- ==========================================

create table public.homepage_modules (
  id uuid primary key default uuid_generate_v4(),
  module_type text not null,
  title text not null,
  subtitle text not null,
  description text not null,
  image_url text not null,
  button_text text not null,
  button_url text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  items_json text, -- raw JSON block parameters
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.homepage_modules enable row level security;

create policy "Allow public read access to homepage modules"
  on public.homepage_modules for select using (true);

create policy "Allow admins to manage homepage modules"
  on public.homepage_modules for all using (public.is_admin());


-- ==========================================
-- 4. MEDIA ITEMS
-- ==========================================

create table public.media_items (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  bucket text not null,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'pdf')),
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  size_kb numeric not null default 0
);

alter table public.media_items enable row level security;

create policy "Allow public read access to media items"
  on public.media_items for select using (true);

create policy "Allow admins to manage media items"
  on public.media_items for all using (public.is_admin());


-- ==========================================
-- 5. NOTICES
-- ==========================================

create table public.notices (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  summary text not null,
  content text not null,
  category text not null,
  priority text not null check (priority in ('Critical', 'High', 'Normal')),
  status text not null check (status in ('Draft', 'Published', 'Archived')),
  featured_image text,
  pdf_url text,
  is_pinned boolean not null default false,
  show_on_homepage boolean not null default false,
  publish_date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notices enable row level security;

create policy "Allow public read access to notices"
  on public.notices for select using (status = 'Published' or public.is_admin());

create policy "Allow admins to manage notices"
  on public.notices for all using (public.is_admin());


-- ==========================================
-- 6. FACULTY MEMBERS
-- ==========================================

create table public.faculty (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  photo_url text not null,
  designation text not null,
  department text not null,
  subject text not null,
  qualification text not null,
  experience text not null,
  bio text not null,
  email text,
  phone text,
  joined_date date,
  room_number text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  featured_homepage boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.faculty enable row level security;

create policy "Allow public read access to faculty"
  on public.faculty for select using (is_active = true or public.is_admin());

create policy "Allow admins to manage faculty"
  on public.faculty for all using (public.is_admin());


-- ==========================================
-- 7. TIMETABLE STRUCTURE & ROUTINES
-- ==========================================

-- Shared global timetable timestamp metadata
create table public.timetable_metadata (
  id text primary key default 'global_timestamp',
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert starting/initial value
insert into public.timetable_metadata (id, last_updated) 
values ('global_timestamp', timezone('utc'::text, now()))
on conflict (id) do nothing;

alter table public.timetable_metadata enable row level security;

create policy "Allow public read access to timetable metadata"
  on public.timetable_metadata for select using (true);

create policy "Allow admins to update timetable metadata"
  on public.timetable_metadata for all using (public.is_admin());


-- Classes/Routines master
create table public.routines (
  id uuid primary key default uuid_generate_v4(),
  class_name text not null,
  display_mode text not null default 'online' check (display_mode in ('online', 'pdf')),
  pdf_url text,
  override_active boolean not null default false,
  override_title text,
  override_pdf_url text,
  override_start date,
  override_end date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_class_routine unique (class_name)
);

alter table public.routines enable row level security;

create policy "Allow public read access to routines"
  on public.routines for select using (true);

create policy "Allow admins to manage routines"
  on public.routines for all using (public.is_admin());


-- Routine Slots/Entries
create table public.routine_entries (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day text not null check (day in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period text not null,
  subject text not null,
  teacher text,
  time_range text
);

alter table public.routine_entries enable row level security;

create policy "Allow public read access to routine entries"
  on public.routine_entries for select using (true);

create policy "Allow admins to manage routine entries"
  on public.routine_entries for all using (public.is_admin());


-- Period Master configuration
create table public.period_masters (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  time_range text not null
);

alter table public.period_masters enable row level security;

create policy "Allow public read access to period masters"
  on public.period_masters for select using (true);

create policy "Allow admins to manage period masters"
  on public.period_masters for all using (public.is_admin());


-- Automated global timestamp triggers for timetable-related modifications
create or replace function public.update_timetable_timestamp_trigger()
returns trigger as $$
begin
  update public.timetable_metadata 
  set last_updated = timezone('utc'::text, now())
  where id = 'global_timestamp';
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Create triggers to update timetable metadata whenever a routine, entry, or period changes
create trigger trigger_update_timetable_on_routines
  after insert or update or delete on public.routines
  for each row execute procedure public.update_timetable_timestamp_trigger();

create trigger trigger_update_timetable_on_entries
  after insert or update or delete on public.routine_entries
  for each row execute procedure public.update_timetable_timestamp_trigger();

create trigger trigger_update_timetable_on_periods
  after insert or update or delete on public.period_masters
  for each row execute procedure public.update_timetable_timestamp_trigger();


-- ==========================================
-- 8. EXAM SCHEDULES
-- ==========================================

create table public.exam_schedules (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  display_mode text not null check (display_mode in ('online', 'pdf')),
  pdf_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.exam_schedules enable row level security;

create policy "Allow public read access to exam schedules"
  on public.exam_schedules for select using (is_active = true or public.is_admin());

create policy "Allow admins to manage exam schedules"
  on public.exam_schedules for all using (public.is_admin());


-- Exam Entries
create table public.exam_entries (
  id uuid primary key default uuid_generate_v4(),
  schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  exam_date date not null,
  subject text not null,
  time text not null,
  notes text
);

alter table public.exam_entries enable row level security;

create policy "Allow public read access to exam entries"
  on public.exam_entries for select using (true);

create policy "Allow admins to manage exam entries"
  on public.exam_entries for all using (public.is_admin());


-- ==========================================
-- 9. CALENDAR & SCHOOL EVENTS
-- ==========================================

-- Core Academic Calendar Events
create table public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  event_type text not null check (event_type in ('Holiday', 'Examination', 'Parent Meeting', 'Admission Date', 'School Event')),
  event_date date not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.calendar_events enable row level security;

create policy "Allow public read access to calendar events"
  on public.calendar_events for select using (true);

create policy "Allow admins to manage calendar events"
  on public.calendar_events for all using (public.is_admin());


-- Detailed School Rich Events
create table public.school_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  event_date date not null,
  short_description text not null,
  full_description text not null,
  featured_image text not null,
  venue text not null,
  organizer text not null,
  status text not null check (status in ('Draft', 'Published', 'Archived')),
  featured_homepage boolean not null default false,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.school_events enable row level security;

create policy "Allow public read access to school events"
  on public.school_events for select using (status = 'Published' or public.is_admin());

create policy "Allow admins to manage school events"
  on public.school_events for all using (public.is_admin());


-- Event Photo Gallery / Multi-images
create table public.school_event_images (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.school_events(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0
);

alter table public.school_event_images enable row level security;

create policy "Allow public read to school event images"
  on public.school_event_images for select using (true);

create policy "Allow admins to manage school event images"
  on public.school_event_images for all using (public.is_admin());


-- ==========================================
-- 10. STORAGE BUCKETS SETUP (BYPASS POLICIES FOR ADMINS)
-- ==========================================

-- Populate public storage buckets configuration entries inside Supabase
insert into storage.buckets (id, name, public) 
values ('school-assets', 'school-assets', true)
on conflict (id) do nothing;

-- Set up policies for public read on 'school-assets' storage bucket
create policy "Public can view school assets"
  on storage.objects for select
  using ( bucket_id = 'school-assets' );

-- Set up policy for authenticated administrators to write/update files in the 'school-assets' bucket
create policy "Authenticated admins can manage school assets"
  on storage.objects for all
  using ( 
    bucket_id = 'school-assets' 
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.user_roles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- ==========================================
-- END OF MIGRATION SCRIPT
-- ==========================================
