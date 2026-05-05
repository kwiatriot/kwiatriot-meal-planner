-- ─────────────────────────────────────────────────────────────
-- Kwiatriot Meal Planner — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─────────────────────
-- RECIPES
-- ─────────────────────
create table recipes (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  type          text not null check (type in ('lunch', 'dinner', 'snack')),
  description   text,
  ingredients   jsonb not null default '[]',
  instructions  text,
  nutrition     jsonb,
  prep_time_min int,
  cook_time_min int,
  servings      int default 2,
  drive_doc_id  text,
  tags          text[] default '{}',
  is_favorite   boolean default false,
  created_at    timestamptz default now()
);

-- ─────────────────────
-- MEAL PLANS
-- ─────────────────────
create table meal_plans (
  id               uuid primary key default uuid_generate_v4(),
  week_start_date  date not null unique,   -- always a Monday
  status           text not null default 'draft' check (status in ('draft', 'locked')),
  created_at       timestamptz default now()
);

-- ─────────────────────
-- MEAL SELECTIONS
-- ─────────────────────
create table meal_selections (
  id            uuid primary key default uuid_generate_v4(),
  meal_plan_id  uuid not null references meal_plans(id) on delete cascade,
  recipe_id     uuid not null references recipes(id) on delete cascade,
  meal_type     text not null check (meal_type in ('lunch', 'dinner', 'snack')),
  day_of_week   text not null check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday')),
  created_at    timestamptz default now(),
  unique (meal_plan_id, meal_type, day_of_week)
);

-- ─────────────────────
-- SHOPPING ITEMS
-- ─────────────────────
create table shopping_items (
  id            uuid primary key default uuid_generate_v4(),
  meal_plan_id  uuid not null references meal_plans(id) on delete cascade,
  ingredient    text not null,
  quantity      numeric,
  unit          text,
  category      text not null check (category in ('produce','proteins','dairy','grains','pantry','frozen','other')),
  checked       boolean default false,
  created_at    timestamptz default now()
);

-- ─────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────
-- Enable RLS on all tables (Supabase best practice)
alter table recipes         enable row level security;
alter table meal_plans      enable row level security;
alter table meal_selections enable row level security;
alter table shopping_items  enable row level security;

-- Allow authenticated users full access (2-person household, no per-user isolation needed)
create policy "Authenticated users can read recipes"
  on recipes for select to authenticated using (true);

create policy "Authenticated users can manage meal plans"
  on meal_plans for all to authenticated using (true);

create policy "Authenticated users can manage meal selections"
  on meal_selections for all to authenticated using (true);

create policy "Authenticated users can manage shopping items"
  on shopping_items for all to authenticated using (true);

-- ─────────────────────
-- INDEXES
-- ─────────────────────
create index on meal_plans (week_start_date);
create index on meal_selections (meal_plan_id);
create index on shopping_items (meal_plan_id);
create index on recipes (type);
