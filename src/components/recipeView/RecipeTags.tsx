import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRecipes, normalizeTag, setTags } from '@/api/recipes';
import { accent, accent35, accentDark, border, ink, ink40 } from './tokens';

/**
 * A recipe's tags. Tapping one opens the library filtered by it; "Edit tags"
 * switches to add/remove mode. Existing tags from other recipes are offered as suggestions.
 */
export default function RecipeTags({
  recipeId,
  tags,
  size = 'desktop',
}: {
  recipeId: string;
  tags: string[];
  size?: 'desktop' | 'mobile';
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mobile = size === 'mobile';

  const { data: recipes } = useQuery({ queryKey: ['recipes'], queryFn: listRecipes });
  const suggestions = [...new Set((recipes ?? []).flatMap((r) => r.tags))]
    .filter((t) => !tags.includes(t))
    .sort();

  const save = useMutation({
    mutationFn: (next: string[]) => setTags(recipeId, next),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: () => setError("Couldn't save tags. Try again."),
  });

  function addTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = normalizeTag(draft);
    setDraft('');
    if (!tag || tags.includes(tag)) return;
    save.mutate([...tags, tag]);
  }

  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: mobile ? '7px 12px' : '5px 11px',
    border: `1px solid ${accent35}`,
    borderRadius: mobile ? 10 : 8,
    fontSize: mobile ? 14 : 13,
    fontWeight: 500,
    color: accentDark,
    background: 'transparent',
  };

  return (
    <div style={{ marginTop: mobile ? 16 : 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {tags.map((tag) =>
          editing ? (
            <span key={tag} style={chip}>
              {tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                disabled={save.isPending}
                onClick={() => save.mutate(tags.filter((t) => t !== tag))}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: mobile ? '0 2px' : 0,
                  minWidth: mobile ? 24 : undefined,
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  color: accentDark,
                }}
              >
                ×
              </button>
            </span>
          ) : (
            <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} style={chip}>
              {tag}
            </Link>
          ),
        )}
        {tags.length === 0 && !editing && <span style={{ fontSize: 13, color: ink40 }}>No tags yet</span>}
        <button
          type="button"
          onClick={() => {
            setEditing((v) => !v);
            setError(null);
          }}
          style={{
            border: 'none',
            background: 'none',
            padding: mobile ? '10px 4px' : '4px',
            fontSize: mobile ? 14 : 13,
            fontWeight: 500,
            color: accentDark,
            cursor: 'pointer',
          }}
        >
          {editing ? 'Done' : 'Edit tags'}
        </button>
      </div>

      {editing && (
        <form onSubmit={addTag} style={{ display: 'flex', gap: 8, marginTop: 10, maxWidth: 360 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            list={`tag-suggestions-${recipeId}`}
            placeholder="Add a tag…"
            aria-label="Add a tag"
            autoCapitalize="none"
            style={{
              flex: 1,
              minWidth: 0,
              height: mobile ? 44 : 36,
              padding: '0 12px',
              borderRadius: 8,
              border: `1px solid ${border}`,
              fontSize: mobile ? 16 : 14,
              color: ink,
              fontFamily: 'inherit',
            }}
          />
          <datalist id={`tag-suggestions-${recipeId}`}>
            {suggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <button
            type="submit"
            disabled={save.isPending || !draft.trim()}
            style={{
              padding: '0 16px',
              height: mobile ? 44 : 36,
              borderRadius: 8,
              border: 'none',
              background: accent,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              opacity: !draft.trim() ? 0.5 : 1,
            }}
          >
            Add
          </button>
        </form>
      )}
      {error && (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: '#B42318' }}>
          {error}
        </p>
      )}
    </div>
  );
}
