-- Migration: 004_meal_selections_recipe_restrict.sql
--
-- The initial schema declared meal_selections.recipe_id with ON DELETE CASCADE,
-- meaning deleting a recipe silently wipes any meal selections that reference it.
-- That's surprising behaviour for a planning app — we'd rather get a clear error
-- ("this recipe is in a planned meal, un-select it first") than silently lose data.
--
-- This migration switches the FK to ON DELETE RESTRICT so the DB rejects the
-- DELETE and the application can surface a clean user-facing message.
--
-- Apply via: Supabase SQL Editor → run this file.

ALTER TABLE meal_selections
  DROP CONSTRAINT meal_selections_recipe_id_fkey,
  ADD CONSTRAINT meal_selections_recipe_id_fkey
    FOREIGN KEY (recipe_id)
    REFERENCES recipes(id)
    ON DELETE RESTRICT;
