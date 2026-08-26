-- Adds the fields the "Recipe Library" front-page design needs: a
-- persisted favorite flag, a numeric total-time (for filtering/sorting,
-- distinct from the freeform display fields), and a short freeform note
-- ("plus marinating", "4 phases") shown next to the time.

alter table recipe_recipes add column if not exists is_favorite boolean not null default false;
alter table recipe_recipes add column if not exists total_minutes int;
alter table recipe_recipes add column if not exists time_note text;

create index if not exists recipe_recipes_is_favorite_idx on recipe_recipes(is_favorite);
