-- Migration: 002_recipe_write_policy.sql
-- The initial schema only added a SELECT policy on recipes.
-- Authenticated users also need INSERT / UPDATE / DELETE to manage the library.

create policy "Authenticated users can manage recipes"
  on recipes for all to authenticated
  using (true)
  with check (true);
