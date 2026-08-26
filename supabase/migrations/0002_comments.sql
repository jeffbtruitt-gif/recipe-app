-- Dated cook's-log comments per recipe, separate from the single `notes`
-- field so a recipe can accumulate one entry every time it's made.

create table if not exists recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipe_recipes(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists recipe_comments_recipe_id_idx on recipe_comments(recipe_id, created_at);

alter table recipe_comments enable row level security;

create policy "comments: allow all" on recipe_comments for all using (true) with check (true);
