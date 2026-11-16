# Thaw and Order

A personal recipe tracker. React + Vite + TypeScript + Tailwind, data in
Supabase (project `kdelwwnpuuvgnamumhec`, tables prefixed `recipe_`). Live at
https://jeffbtruitt-gif.github.io/recipe-app/, deployed via GitHub Actions
(`.github/workflows/deploy.yml`) on every push to `main` in
https://github.com/jeffbtruitt-gif/recipe-app.

The repo, package name, live URL path, and `recipe_`-prefixed Supabase
tables are all still named "recipe-app"/"recipe" — only the in-app display
name changed to "Thaw and Order" (title bar, header, top bar). Don't rename
the technical identifiers to match unless asked; the live URL in particular
would break any existing links/bookmarks if it moved.

**Adding a recipe needs no git action.** Recipe content is data in Supabase,
not code in the repo — inserting a recipe (via the Supabase MCP tools or the
app's own form) makes it live on the deployed site immediately, the same way
it's immediately visible locally. Only *app code* changes (editing files
under `src/`, config, etc.) need a commit + push to reach the live site.

The **home page** (`/`, `RecipeLibraryPage.tsx`) and the **recipe detail
page** (`/recipes/:id`) are a custom design system — pixel-specced handoffs
("Recipe Library" and "Recipe View — Phased Steps with Ingredient
Sidecars") — distinct from the rest of the app's warm clay/cream Tailwind
theme. Both render full-bleed outside the normal app header (see `App.tsx`),
using shared inline-style design tokens in
`src/components/recipeView/tokens.ts` (ink/navy palette, Inter Tight). The
detail page has desktop (≥900px) and mobile (<900px) variants
(`DesktopRecipeView.tsx` / `MobileRecipeView.tsx`) sharing one data-fetch,
switched by `useIsDesktop`. The library page also switches at 900px, but its
phone layout is **not from a design handoff** — it's a pragmatic adaptation
(single column, collapsible "Filters" bar, meal/time under the title) so the
page is usable on a phone; replace it if a real mobile design arrives. The **add/edit form**
(`/recipes/new`, `/recipes/:id/edit`) still uses the original clay-themed
layout — it hasn't been redesigned, so don't restyle it to match unless
asked.

## Adding a recipe from a link (the main Claude workflow)

When Jeff gives you a URL and asks you to add it as a recipe, fetch the page
and transcribe it into this **exact, fixed format** every time — consistency
is what makes the recipe box usable, both for skimming and for the detail
page's phase/sidecar rendering.

1. **Ingredients go at the top** (`recipe_ingredients`), as a flat or grouped
   list of `amount + item` pairs (e.g. amount `"2 cups"`, item `"flour"`).
   `group_label` is optional here and purely organizational for the
   "Everything you need" list — it does **not** need to match how ingredients
   are split across steps. Normalize units the way the source states them;
   don't convert or round.

2. **Split directions into phases** (`recipe_phases`), the natural cooking
   stages — e.g. Marinate / Dredge & Fry / Sauce & Serve, or Prep / Stovetop
   / Oven / Finish. Every recipe needs at least one phase. Give each phase a
   short `name` and an optional `meta` string like `"15 min · cutting
   board"` or `"400°F, uncovered"`.

3. **Every step gets a sidecar** (`recipe_step_ingredients`): only the
   ingredients *that specific step* uses, each as its own `amount` +
   `short_name` row (short_name is a terse form, e.g. `"chicken thighs"` not
   the full ingredient-list phrasing). This is what replaced the old
   "restate every ingredient in prose" convention — the sidecar *is* the
   inline ingredient callout now, so step text should read naturally and
   only needs to restate a **specific** amount when it's genuinely useful for
   following along (e.g. "cook 8 to 10 minutes"), not as a rule for every
   ingredient mention. If a step doesn't use anything new (e.g. "transfer to
   the oven"), leave its sidecar empty — it renders as a muted "nothing new"
   line. Override that fallback text per-step with `empty_note` when a more
   specific line reads better (e.g. "Nothing new — just get the smoker
   going.").
   - `**text**` inside `instruction` renders as bold (no color change) — use
     it sparingly for a genuinely load-bearing number or doneness cue (a
     target temperature, a time range), matching the source's own emphasis.
   - `timer_label` is optional freeform text for a timer chip (e.g. `"Rest 15
     min"`, `"Start 9 min"`). It's a static label, not a running timer — only
     add one where a step has a clear duration worth calling out.
   - Step `position` is continuous across the whole recipe (1, 2, 3…), not
     restarted per phase.

4. Capture what the source gives you for `servings`, `prep_time`, `cook_time`,
   `total_time`, `description`, and `source_url` (the link Jeff gave you).
   Leave a field blank/null if the source doesn't specify it — don't guess.
   The detail page derives its provenance line ("Adapted from X · last cooked
   Y") from `source_url`'s hostname and the most recent Cook's Log entry —
   nothing extra to author there. Also set `total_minutes` (an integer,
   e.g. `40`) — convert the total time to minutes even though you already
   have a freeform `total_time` string; the library page's time filter and
   "Quickest" sort depend on this number, and a recipe without it won't show
   under "Under 30"/"Under 60". Put any qualifier that doesn't belong in a
   plain number (`"plus marinating"`, `"plus overnight"`) in `time_note`.

5. Set exactly one **type** tag from this fixed set — `breakfast` | `lunch` |
   `dinner` | `snack` | `dessert` | `drink` (the list lives in
   `src/lib/mealTags.ts`; cocktails/smoothies are `drink`). The library's
   Type filter uses it, and the detail page's breadcrumb/eyebrow category
   comes from it (falls back to "Recipe" if none is set, which looks like a
   mistake — always set one). Add **no other tags** by default — Jeff found
   auto-added tags noisy and adds his own; the first non-type tag, if he has
   one, becomes the eyebrow's descriptor (e.g. "Dinner · One Pan").

6. Skip fluff from the source (life stories, ads, SEO padding). If the source
   has genuinely useful tips (substitutions, storage, make-ahead), put them
   in `notes` — **one tip per line**, since the detail page splits `notes` on
   newlines into separate cards. Use `**text**` inside a note to highlight a
   specific measurement the way the sidecar does for steps.

### How to insert it

Use the Supabase MCP tools against project `kdelwwnpuuvgnamumhec`. Order:
`recipe_recipes` → get `id` → `recipe_ingredients` (position starting at 0) →
for each phase, `recipe_phases` (position starting at 0) → get its `id` →
for each step in that phase, `recipe_steps` (`phase_id` set, `position`
continuous across the whole recipe, starting at 0) → get its `id` →
`recipe_step_ingredients` for that step (position starting at 0). Example:

```sql
with r as (
  insert into recipe_recipes (title, source_url, description, servings, prep_time, cook_time, total_time, total_minutes, tags)
  values ('Weeknight Chicken Piccata', 'https://example.com/recipe', 'Bright, lemony, done in 30 minutes.', '4', '10 minutes', '20 minutes', '30 minutes', 30, array['dinner','italian','weeknight'])
  returning id
), ing as (
  insert into recipe_ingredients (recipe_id, position, group_label, amount, item)
  select id, 0, null, '1 lb', 'chicken breast, thinly sliced' from r
  union all
  select id, 1, null, '1/2 cup', 'all-purpose flour' from r
  -- ...continue for every ingredient
), phase1 as (
  insert into recipe_phases (recipe_id, position, name, meta)
  select id, 0, 'Stovetop', '15 min · 12-inch skillet' from r
  returning id
), step1 as (
  insert into recipe_steps (recipe_id, phase_id, position, instruction, timer_label)
  select r.id, phase1.id, 0, 'Dredge the chicken in flour and cook until golden, **4 to 5 minutes** per side.', 'Start 9 min'
  from r, phase1
  returning id
)
insert into recipe_step_ingredients (step_id, position, amount, short_name)
select step1.id, 0, '1 lb', 'chicken breast' from step1
union all
select step1.id, 1, '1/2 cup', 'flour' from step1;
-- ...continue for the rest of this step, then the next phase/step/sidecar
```

Or use the app itself — `npm run dev` and the "Add Recipe" form — which has a
full phase/step/sidecar editor for one-off manual entry.

## The Recipe Library (home page)

`/` is a filterable browse page: a sticky left rail (Favorites, Meal, Time,
Tags) plus a search + sort results list, all client-side over
`listRecipes()`. Things worth knowing when touching it or adding recipes:

- **Favorites** (`is_favorite`) persist server-side (a real column, toggled
  by the star button), not per-session — unlike the detail page's step
  "done" state.
- **Time filtering/sorting** uses `total_minutes` (integer), which is
  separate from the freeform `total_time` display text used on the detail
  page's stat row. Always set `total_minutes` when adding a recipe, or it
  silently fails every "Under 30"/"Under 60" filter and sorts last under
  "Quickest" — set `time_note` for a short freeform aside (`"plus
  marinating"`, `"plus overnight"`) shown next to the time.
- **Meal** (for the rail's counts and filter) is derived from the same fixed
  meal-tag convention as the detail page's eyebrow — one recipe, one meal.
- **Tags** shown in the rail are derived dynamically from whatever non-meal
  tags exist across all recipes (not a hardcoded list) — add whatever tags
  make sense per recipe; new tags automatically appear as filter pills.
- Tag AND-logic: selecting multiple tags in the rail narrows (a recipe must
  have *all* of them), unlike Meal, which is OR (union) across the selected
  options.
- "AI Recipe" in the top bar opens `PasteRecipeDialog` — see below.

## Tags and photos (on the recipe page)

- **One Edit panel**: the **Edit** button (recipe page top bar, desktop and
  phone) opens `EditRecipeDialog`, the single place to change a recipe's
  details. It edits a draft and saves everything in one go. Today it has a
  **Type** section (single-select) and a **Tags** section, plus a link to the
  full ingredients/steps form (`/recipes/:id/edit`). To add another editable
  field, add a draft value, a `<Section>`, and include it in the save call.
- **Type** is stored as a normal tag (at most one of `MEAL_TAGS`), so saving
  replaces the old type. Typing a type name into the tag box sets the type.
- **Tags**: `RecipeTags` under the header shows non-type tags as links to
  `/?tag=<name>`, which opens the library with that tag pre-selected (names
  are lowercased/trimmed via `normalizeTag`). Tags created on any recipe
  automatically become filter pills in the library rail.
- **Photos**: `PhotoControls` lives in the hero. On a phone it offers "Take
  photo" (file input with `capture="environment"` → camera) and "Choose
  photo"; on desktop, "Add/Change photo". The image is shrunk client-side to
  1200px JPEG (`src/lib/resizeImage.ts`), uploaded to the public
  `recipe-images` Storage bucket under a unique `<recipeId>-<timestamp>.jpg`
  path, saved as `image_url`, and the previous upload is deleted. The same
  `image_url` is the library thumbnail. The bucket allows anonymous
  upload/delete (same open posture as the tables).

## Paste-a-recipe import

The dialog ("AI Recipe") sends pasted text, a recipe URL, and/or up to 4
photos ("Take photo" opens the phone camera; "Choose photo" picks from the
library — for a cookbook page, recipe card, handwritten note, or screenshot)
to the `parse-recipe` Supabase Edge Function. Photos are shrunk client-side to 1800px JPEG
(`photoToImportImage`) and sent base64 as `images: [{data, mediaType}]`; any
text sent alongside photos is treated as a note, not a URL to fetch. The
photos are only read, not saved — they don't become the recipe's image. The function lives in
`supabase/functions/parse-recipe/index.ts` (deployed with `verify_jwt=false`).
It fetches the page if given a URL, asks
Claude (forced `save_recipe` tool call) to produce our standard structure,
and returns it; the client (`src/api/importRecipe.ts`) maps it to
`RecipeInput`, saves it with `createRecipe`, and opens the new recipe. The
format rules in the function's `SYSTEM_PROMPT` mirror the "Adding a recipe
from a link" rules above — **if you change one, change the other** and
redeploy the function.

- Two Supabase secrets must be set (Dashboard → Edge Functions → Secrets):
  `ANTHROPIC_API_KEY` and `PARSE_PASSCODE`. Without them the function
  returns 503 "not set up yet".
- The site is public, so the passcode is the only thing stopping strangers
  from spending API credits. The dialog asks for it once and remembers it in
  `localStorage`.
- Imported recipes still need a human glance: the model infers phases,
  sidecars, and tags, and leaves times blank when the source doesn't give
  them. Edit via the recipe's Edit page.

## Schema

- `recipe_recipes` — title, source_url, description, servings, prep_time,
  cook_time, total_time, image_url, tags[], notes (newline-separated tips),
  is_favorite, total_minutes, time_note
- `recipe_ingredients` — recipe_id, position, group_label, amount, item (the
  flat "Everything you need" list)
- `recipe_phases` — recipe_id, position, name, meta
- `recipe_steps` — recipe_id, phase_id, position (continuous across phases),
  instruction (`**bold**` supported), timer_label, empty_note
- `recipe_step_ingredients` — step_id, position, amount, short_name (a
  step's sidecar; empty for a step that uses nothing new)
- `recipe_comments` — recipe_id, body, created_at. Dated "Cook's Log" entries
  a user adds each time they make the recipe, shown at the bottom of the
  detail page with an inline add form. Also feeds the provenance line's
  "last cooked" date (most recent entry).

RLS is enabled with permissive "allow all" policies (personal single-user
app, no auth) — matches the pattern used by other personal apps in the same
Supabase project (e.g. `peakweek_*` tables).

## Commands

```bash
npm install
npm run dev      # http://localhost:5174
npm run build     # typecheck + build
```

`.env.local` must have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see
`.env.local.example`).
