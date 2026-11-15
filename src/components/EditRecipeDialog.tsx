import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRecipes, normalizeTag, setTags } from '@/api/recipes';
import type { Recipe } from '@/types/recipe';
import { MEAL_TAGS, capitalize } from '@/lib/mealTags';
import {
  accent,
  accent35,
  accentDark,
  border,
  cardShadow,
  fontFamily,
  hairline,
  ink,
  ink40,
  ink55,
  surface,
} from '@/components/recipeView/tokens';

/**
 * The single place to edit a recipe's details. It works on a draft and saves
 * everything at once. To add another editable thing later: add a draft field,
 * a <Section>, and include it in `save`.
 */
export default function EditRecipeDialog({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const queryClient = useQueryClient();

  const initialType = recipe.tags.map((t) => t.toLowerCase()).find((t) => MEAL_TAGS.includes(t)) ?? null;
  const initialTags = recipe.tags.filter((t) => !MEAL_TAGS.includes(t.toLowerCase()));

  const [type, setType] = useState<string | null>(initialType);
  const [tags, setDraftTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState('');

  const { data: recipes } = useQuery({ queryKey: ['recipes'], queryFn: listRecipes });
  const suggestions = [...new Set((recipes ?? []).flatMap((r) => r.tags))]
    .filter((t) => !MEAL_TAGS.includes(t.toLowerCase()) && !tags.includes(t))
    .sort();

  const save = useMutation({
    mutationFn: (next: { type: string | null; tags: string[] }) =>
      setTags(recipe.id, [...(next.type ? [next.type] : []), ...next.tags]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipe', recipe.id] });
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      onClose();
    },
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !save.isPending) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save.isPending, onClose]);

  function addTag() {
    const tag = normalizeTag(draft);
    setDraft('');
    if (!tag) return;
    // Typing a type name (e.g. "dinner") sets the type rather than adding a tag.
    if (MEAL_TAGS.includes(tag)) setType(tag);
    else if (!tags.includes(tag)) setDraftTags((prev) => [...prev, tag]);
  }

  const chip = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    padding: '0 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${on ? accent : accent35}`,
    background: on ? accent : 'transparent',
    color: on ? '#FFFFFF' : accentDark,
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        background: 'rgba(20,22,26,0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '6vh 14px 20px',
        overflowY: 'auto',
        fontFamily,
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-recipe-title"
        onSubmit={(e) => {
          e.preventDefault();
          // A tag typed but not yet added still counts.
          const pending = normalizeTag(draft);
          let nextType = type;
          let nextTags = tags;
          if (pending) {
            if (MEAL_TAGS.includes(pending)) nextType = pending;
            else if (!tags.includes(pending)) nextTags = [...tags, pending];
          }
          save.mutate({ type: nextType, tags: nextTags });
        }}
        style={{ width: '100%', maxWidth: 560, background: surface, boxShadow: cardShadow, color: ink }}
      >
        <div style={{ padding: '22px 24px 4px' }}>
          <h2
            id="edit-recipe-title"
            style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink55 }}
          >
            Edit recipe
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{recipe.title}</p>
        </div>

        <Section title="Type">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MEAL_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(type === t ? null : t)}
                style={chip(type === t)}
              >
                {capitalize(t)}
              </button>
            ))}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: ink40 }}>
            Used for the category label and the library's Type filter.
          </p>
        </Section>

        <Section title="Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((tag) => (
              <span key={tag} style={{ ...chip(false), cursor: 'default', paddingRight: 8 }}>
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => setDraftTags((prev) => prev.filter((t) => t !== tag))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 6px', color: accentDark }}
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length === 0 && <span style={{ fontSize: 14, color: ink40 }}>No tags yet</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              list="edit-tag-suggestions"
              placeholder="Add a tag…"
              aria-label="Add a tag"
              autoCapitalize="none"
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                padding: '0 12px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                fontSize: 16,
                color: ink,
                fontFamily: 'inherit',
              }}
            />
            <datalist id="edit-tag-suggestions">
              {suggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={addTag}
              disabled={!draft.trim()}
              style={{
                padding: '0 16px',
                height: 44,
                borderRadius: 8,
                border: `1px solid ${accent35}`,
                background: 'transparent',
                color: accentDark,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: draft.trim() ? 1 : 0.5,
              }}
            >
              Add
            </button>
          </div>
        </Section>

        {save.isError && (
          <p role="alert" style={{ margin: '0', padding: '0 24px 12px', fontSize: 14, color: '#B42318' }}>
            Couldn't save. Try again.
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '16px 24px 22px',
            borderTop: `1px solid ${hairline}`,
          }}
        >
          <Link to={`/recipes/${recipe.id}/edit`} style={{ fontSize: 14, fontWeight: 500, color: accentDark }}>
            Edit ingredients &amp; steps →
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              style={{
                padding: '0 16px',
                minHeight: 44,
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: 'transparent',
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(20,22,26,0.7)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              style={{
                padding: '0 18px',
                minHeight: 44,
                borderRadius: 8,
                border: 'none',
                background: accent,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: save.isPending ? 0.7 : 1,
              }}
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 24px 20px', borderBottom: `1px solid ${hairline}` }}>
      <h3
        style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink55 }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
