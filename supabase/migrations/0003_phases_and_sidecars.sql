-- Adds phased steps with per-step ingredient sidecars, per the
-- "Recipe View — Phased Steps with Ingredient Sidecars" design handoff.
-- recipe_steps gains phase_id/timer_label/empty_note; a new
-- recipe_step_ingredients table holds each step's sidecar rows.

create table if not exists recipe_phases (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipe_recipes(id) on delete cascade,
  position int not null,
  name text not null,
  meta text
);

create index if not exists recipe_phases_recipe_id_idx on recipe_phases(recipe_id, position);

alter table recipe_steps add column if not exists phase_id uuid references recipe_phases(id) on delete cascade;
alter table recipe_steps add column if not exists timer_label text;
alter table recipe_steps add column if not exists empty_note text;

create index if not exists recipe_steps_phase_id_idx on recipe_steps(phase_id, position);

create table if not exists recipe_step_ingredients (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references recipe_steps(id) on delete cascade,
  position int not null,
  amount text,
  short_name text not null
);

create index if not exists recipe_step_ingredients_step_id_idx on recipe_step_ingredients(step_id, position);

alter table recipe_phases enable row level security;
alter table recipe_step_ingredients enable row level security;

create policy "phases: allow all" on recipe_phases for all using (true) with check (true);
create policy "step ingredients: allow all" on recipe_step_ingredients for all using (true) with check (true);
