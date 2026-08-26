-- Recipe app schema. Tables are prefixed recipe_ because they live in a
-- shared Supabase project alongside other personal apps.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists recipe_recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  description text,
  servings text,
  prep_time text,
  cook_time text,
  total_time text,
  image_url text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipe_recipes(id) on delete cascade,
  position int not null,
  group_label text,
  amount text,
  item text not null
);

create table if not exists recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipe_recipes(id) on delete cascade,
  position int not null,
  instruction text not null
);

create index if not exists recipe_ingredients_recipe_id_idx on recipe_ingredients(recipe_id, position);
create index if not exists recipe_steps_recipe_id_idx on recipe_steps(recipe_id, position);
create index if not exists recipe_recipes_tags_idx on recipe_recipes using gin(tags);
create index if not exists recipe_recipes_title_trgm_idx on recipe_recipes using gin(title gin_trgm_ops);

create or replace function recipe_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipe_recipes_set_updated_at on recipe_recipes;
create trigger recipe_recipes_set_updated_at
  before update on recipe_recipes
  for each row execute function recipe_set_updated_at();

alter table recipe_recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps enable row level security;

create policy "recipes: allow all" on recipe_recipes for all using (true) with check (true);
create policy "ingredients: allow all" on recipe_ingredients for all using (true) with check (true);
create policy "steps: allow all" on recipe_steps for all using (true) with check (true);
