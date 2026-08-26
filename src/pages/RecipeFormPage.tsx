import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createRecipe, getRecipe, updateRecipe } from '@/api/recipes';
import { emptyRecipeInput, type RecipeInput } from '@/types/recipe';

const inputClass =
  'w-full rounded-lg border border-clay/20 bg-white px-3 py-2 text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-clay/40';
const labelClass = 'block text-sm font-medium text-ink/70 mb-1';

type Phase = RecipeInput['phases'][number];
type PhaseStep = Phase['steps'][number];

export default function RecipeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<RecipeInput>(emptyRecipeInput);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    getRecipe(id)
      .then((r) => {
        setForm({
          title: r.title,
          sourceUrl: r.sourceUrl ?? '',
          description: r.description ?? '',
          servings: r.servings ?? '',
          prepTime: r.prepTime ?? '',
          cookTime: r.cookTime ?? '',
          totalTime: r.totalTime ?? '',
          imageUrl: r.imageUrl ?? '',
          tags: r.tags,
          notes: r.notes ?? '',
          totalMinutes: r.totalMinutes != null ? String(r.totalMinutes) : '',
          timeNote: r.timeNote ?? '',
          ingredients: r.ingredients.length
            ? r.ingredients.map((i) => ({
                groupLabel: i.groupLabel ?? '',
                amount: i.amount ?? '',
                item: i.item,
              }))
            : emptyRecipeInput.ingredients,
          phases: r.phases.length
            ? r.phases.map((p) => ({
                name: p.name,
                meta: p.meta ?? '',
                steps: p.steps.map((s) => ({
                  instruction: s.instruction,
                  timerLabel: s.timerLabel ?? '',
                  emptyNote: s.emptyNote ?? '',
                  sidecar: s.sidecar.length
                    ? s.sidecar.map((si) => ({ amount: si.amount ?? '', shortName: si.shortName }))
                    : [{ amount: '', shortName: '' }],
                })),
              }))
            : emptyRecipeInput.phases,
        });
      })
      .finally(() => setLoading(false));
  }, [mode, id]);

  function updateIngredient(index: number, patch: Partial<RecipeInput['ingredients'][number]>) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
    }));
  }

  function updatePhases(mutate: (phases: Phase[]) => Phase[]) {
    setForm((f) => ({ ...f, phases: mutate(f.phases) }));
  }

  function updatePhase(phaseIndex: number, patch: Partial<Pick<Phase, 'name' | 'meta'>>) {
    updatePhases((phases) => phases.map((p, i) => (i === phaseIndex ? { ...p, ...patch } : p)));
  }

  function addPhase() {
    updatePhases((phases) => [
      ...phases,
      { name: '', meta: '', steps: [{ instruction: '', timerLabel: '', emptyNote: '', sidecar: [] }] },
    ]);
  }

  function removePhase(phaseIndex: number) {
    updatePhases((phases) => phases.filter((_, i) => i !== phaseIndex));
  }

  function updateStep(phaseIndex: number, stepIndex: number, patch: Partial<Pick<PhaseStep, 'instruction' | 'timerLabel' | 'emptyNote'>>) {
    updatePhases((phases) =>
      phases.map((p, i) =>
        i !== phaseIndex
          ? p
          : { ...p, steps: p.steps.map((s, j) => (j === stepIndex ? { ...s, ...patch } : s)) },
      ),
    );
  }

  function addStep(phaseIndex: number) {
    updatePhases((phases) =>
      phases.map((p, i) =>
        i !== phaseIndex
          ? p
          : { ...p, steps: [...p.steps, { instruction: '', timerLabel: '', emptyNote: '', sidecar: [] }] },
      ),
    );
  }

  function removeStep(phaseIndex: number, stepIndex: number) {
    updatePhases((phases) =>
      phases.map((p, i) => (i !== phaseIndex ? p : { ...p, steps: p.steps.filter((_, j) => j !== stepIndex) })),
    );
  }

  function updateSidecar(
    phaseIndex: number,
    stepIndex: number,
    sidecarIndex: number,
    patch: Partial<PhaseStep['sidecar'][number]>,
  ) {
    updatePhases((phases) =>
      phases.map((p, i) =>
        i !== phaseIndex
          ? p
          : {
              ...p,
              steps: p.steps.map((s, j) =>
                j !== stepIndex
                  ? s
                  : { ...s, sidecar: s.sidecar.map((si, k) => (k === sidecarIndex ? { ...si, ...patch } : si)) },
              ),
            },
      ),
    );
  }

  function addSidecar(phaseIndex: number, stepIndex: number) {
    updatePhases((phases) =>
      phases.map((p, i) =>
        i !== phaseIndex
          ? p
          : {
              ...p,
              steps: p.steps.map((s, j) =>
                j !== stepIndex ? s : { ...s, sidecar: [...s.sidecar, { amount: '', shortName: '' }] },
              ),
            },
      ),
    );
  }

  function removeSidecar(phaseIndex: number, stepIndex: number, sidecarIndex: number) {
    updatePhases((phases) =>
      phases.map((p, i) =>
        i !== phaseIndex
          ? p
          : {
              ...p,
              steps: p.steps.map((s, j) =>
                j !== stepIndex ? s : { ...s, sidecar: s.sidecar.filter((_, k) => k !== sidecarIndex) },
              ),
            },
      ),
    );
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrorMsg('Title is required.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      let recipeId = id;
      if (mode === 'create') {
        recipeId = await createRecipe(form);
      } else if (id) {
        await updateRecipe(id, form);
      }
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      if (recipeId) await queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      navigate(recipeId ? `/recipes/${recipeId}` : '/');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong saving the recipe.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink/50">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h1 className="font-serif text-2xl text-ink">
        {mode === 'create' ? 'Add a Recipe' : 'Edit Recipe'}
      </h1>

      {errorMsg && <p className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{errorMsg}</p>}

      <section className="space-y-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Grandma's Chocolate Chip Cookies"
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>Source URL</label>
          <input
            className={inputClass}
            value={form.sourceUrl}
            onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className={labelClass}>Image URL</label>
          <input
            className={inputClass}
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ['servings', 'Servings'],
              ['prepTime', 'Prep Time'],
              ['cookTime', 'Cook Time'],
              ['totalTime', 'Total Time'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input
                className={inputClass}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Total Minutes</label>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.totalMinutes}
              onChange={(e) => setForm((f) => ({ ...f, totalMinutes: e.target.value }))}
              placeholder="40"
            />
            <p className="mt-1 text-xs text-ink/50">Drives the library page's time filter and sort — separate from the descriptive time fields above.</p>
          </div>
          <div>
            <label className={labelClass}>Time Note</label>
            <input
              className={inputClass}
              value={form.timeNote}
              onChange={(e) => setForm((f) => ({ ...f, timeNote: e.target.value }))}
              placeholder="plus marinating"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs rounded-full bg-clay/10 text-clayDark px-2.5 py-1 flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                  className="text-clayDark/60 hover:text-clayDark"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            className={inputClass}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="dinner, weeknight, pasta… (Enter to add)"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-clayDark">Everything You Need</h2>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                ingredients: [...f.ingredients, { groupLabel: '', amount: '', item: '' }],
              }))
            }
            className="text-sm text-clay hover:underline"
          >
            + Add ingredient
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          The full ingredient list shown at the top of the recipe. Group is optional and doesn't need to
          match how ingredients are split up in the steps below.
        </p>
        <div className="mt-3 space-y-2">
          {form.ingredients.map((ing, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
              <input
                className={inputClass}
                placeholder="Group (optional)"
                value={ing.groupLabel}
                onChange={(e) => updateIngredient(index, { groupLabel: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Amount"
                value={ing.amount}
                onChange={(e) => updateIngredient(index, { amount: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Ingredient"
                value={ing.item}
                onChange={(e) => updateIngredient(index, { item: e.target.value })}
              />
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    ingredients: f.ingredients.filter((_, i) => i !== index),
                  }))
                }
                className="text-ink/40 hover:text-red-600 px-2"
                aria-label="Remove ingredient"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-clayDark">Directions</h2>
          <button type="button" onClick={addPhase} className="text-sm text-clay hover:underline">
            + Add phase
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Group steps into phases (Prep / Stovetop / Oven / Finish…). Each step gets its own sidecar —
          only the ingredients it actually uses, with their amounts. Leave a step's sidecar empty if it
          doesn't use anything new.
        </p>

        <div className="mt-4 space-y-6">
          {form.phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="rounded-lg border border-clay/20 p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    className={inputClass}
                    placeholder="Phase name (e.g. Prep)"
                    value={phase.name}
                    onChange={(e) => updatePhase(phaseIndex, { name: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Meta (e.g. 15 min · cutting board)"
                    value={phase.meta}
                    onChange={(e) => updatePhase(phaseIndex, { meta: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePhase(phaseIndex)}
                  className="text-ink/40 hover:text-red-600 px-2 py-2"
                  aria-label="Remove phase"
                >
                  ×
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {phase.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="rounded-md bg-clay/5 p-3">
                    <div className="flex items-start gap-2">
                      <textarea
                        className={inputClass}
                        rows={2}
                        placeholder="Step instruction — use **text** for emphasis"
                        value={step.instruction}
                        onChange={(e) => updateStep(phaseIndex, stepIndex, { instruction: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => removeStep(phaseIndex, stepIndex)}
                        className="text-ink/40 hover:text-red-600 px-2 py-2"
                        aria-label="Remove step"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      className={`${inputClass} mt-2`}
                      placeholder="Timer chip label, optional (e.g. Rest 15 min)"
                      value={step.timerLabel}
                      onChange={(e) => updateStep(phaseIndex, stepIndex, { timerLabel: e.target.value })}
                    />

                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink/60">Sidecar (this step's ingredients)</span>
                        <button
                          type="button"
                          onClick={() => addSidecar(phaseIndex, stepIndex)}
                          className="text-xs text-clay hover:underline"
                        >
                          + Add ingredient
                        </button>
                      </div>
                      {step.sidecar.length === 0 ? (
                        <input
                          className={`${inputClass} mt-1 text-xs`}
                          placeholder='Optional override for "nothing new" text'
                          value={step.emptyNote}
                          onChange={(e) => updateStep(phaseIndex, stepIndex, { emptyNote: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 space-y-1.5">
                          {step.sidecar.map((si, sidecarIndex) => (
                            <div key={sidecarIndex} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                              <input
                                className={inputClass}
                                placeholder="Amount"
                                value={si.amount}
                                onChange={(e) =>
                                  updateSidecar(phaseIndex, stepIndex, sidecarIndex, { amount: e.target.value })
                                }
                              />
                              <input
                                className={inputClass}
                                placeholder="Short name (e.g. chicken thighs)"
                                value={si.shortName}
                                onChange={(e) =>
                                  updateSidecar(phaseIndex, stepIndex, sidecarIndex, { shortName: e.target.value })
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeSidecar(phaseIndex, stepIndex, sidecarIndex)}
                                className="text-ink/40 hover:text-red-600 px-2"
                                aria-label="Remove sidecar ingredient"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addStep(phaseIndex)}
                  className="text-sm text-clay hover:underline"
                >
                  + Add step to this phase
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <label className={labelClass}>Notes</label>
        <p className="text-xs text-ink/50 mb-1">One note per line — each becomes its own card.</p>
        <textarea
          className={inputClass}
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder={'A 12-inch pan matters...\nNo fennel: one large sliced onion plus **½ tsp fennel seed** gets close.'}
        />
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-clay px-6 py-2.5 text-cream font-medium hover:bg-clayDark disabled:opacity-50"
        >
          {saving ? 'Saving…' : mode === 'create' ? 'Save Recipe' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-clay/30 px-6 py-2.5 text-clayDark hover:bg-clay/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
