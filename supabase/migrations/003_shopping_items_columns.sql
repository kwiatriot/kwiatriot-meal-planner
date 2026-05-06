-- ─────────────────────────────────────────────────────────────
-- Kwiatriot Meal Planner — Reshape shopping_items for aggregated grocery lists
-- Migration: 003_shopping_items_columns.sql
-- ─────────────────────────────────────────────────────────────

-- Drop the catch-all policy; we'll add scoped ones below
drop policy if exists "Authenticated users can manage shopping items" on shopping_items;

-- Rename ingredient → ingredient_name (canonical, lowercased aggregated name)
alter table shopping_items rename column ingredient to ingredient_name;

-- Drop checked — check-off state is deferred to a later session
alter table shopping_items drop column if exists checked;

-- Add sort_order for stable display ordering (category order, then alpha)
alter table shopping_items add column sort_order int;

-- Drop the old category check constraint (categories have changed)
alter table shopping_items drop constraint if exists shopping_items_category_check;

-- New category enum aligned with the AI categorization prompt
alter table shopping_items
  add constraint shopping_items_category_check
  check (category in ('produce','meat_seafood','dairy_eggs','pantry','frozen','bakery','beverages','other'));

-- Unique constraint so aggregation is enforced at the DB level
-- (meal_plan_id, ingredient_name, unit) must be unique — prevents double-inserts
alter table shopping_items
  add constraint shopping_items_meal_plan_ingredient_unit_key
  unique (meal_plan_id, ingredient_name, unit);

-- Scoped RLS policies (SELECT / INSERT / DELETE — no UPDATE needed this session)
create policy "Authenticated users can select shopping items"
  on shopping_items for select to authenticated using (true);

create policy "Authenticated users can insert shopping items"
  on shopping_items for insert to authenticated with check (true);

create policy "Authenticated users can delete shopping items"
  on shopping_items for delete to authenticated using (true);
