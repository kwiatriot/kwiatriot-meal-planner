-- ─────────────────────────────────────────────────────────────
-- Kwiatriot Meal Planner — Shopping items: check-off + manual additions + expanded categories
-- Migration: 005_shopping_items_manual.sql
-- ─────────────────────────────────────────────────────────────

-- Re-add checked column (was dropped in 003; needed for check-off feature)
ALTER TABLE shopping_items ADD COLUMN checked BOOLEAN NOT NULL DEFAULT false;

-- Mark user-added one-off items so they can be distinguished from recipe-generated ones
ALTER TABLE shopping_items ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT false;

-- Expand category constraint to cover household / personal care items
ALTER TABLE shopping_items DROP CONSTRAINT shopping_items_category_check;

ALTER TABLE shopping_items
  ADD CONSTRAINT shopping_items_category_check
  CHECK (category IN (
    'produce', 'meat_seafood', 'dairy_eggs', 'pantry', 'frozen', 'bakery',
    'beverages', 'canned_jarred', 'snacks', 'condiments', 'cleaning',
    'personal_care', 'other'
  ));

-- UPDATE policy needed for toggleShoppingItem (checked state sync)
CREATE POLICY "Authenticated users can update shopping items"
  ON shopping_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
