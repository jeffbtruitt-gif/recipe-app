import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addComment, deleteComment, listComments } from '@/api/comments';
import { accent, accentDark, hairline, ink, ink40, ink45, ink55, ink70, surfaceSunken } from '@/components/recipeView/tokens';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const capsHeading: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: 0,
  color: ink55,
};

export default function RecipeComments({
  recipeId,
  padding,
}: {
  recipeId: string;
  padding: string;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['recipe-comments', recipeId],
    queryFn: () => listComments(recipeId),
  });

  const addMutation = useMutation({
    mutationFn: () => addComment(recipeId, draft),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['recipe-comments', recipeId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipe-comments', recipeId] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || addMutation.isPending) return;
    addMutation.mutate();
  }

  return (
    <section style={{ padding, borderTop: `1px solid ${hairline}` }}>
      <h2 style={capsHeading}>Cook's Log</h2>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: ink40 }}>
        Jot down how it went each time you make this — every entry is dated automatically.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14 }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Made this tonight — used less cayenne, still plenty spicy…"
          style={{
            flex: 1,
            borderRadius: 8,
            border: `1px solid ${hairline}`,
            padding: '8px 12px',
            fontSize: 14,
            color: ink,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || addMutation.isPending}
          style={{
            borderRadius: 8,
            background: accent,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            padding: '9px 16px',
            border: 'none',
            cursor: draft.trim() ? 'pointer' : 'default',
            opacity: !draft.trim() || addMutation.isPending ? 0.5 : 1,
          }}
        >
          {addMutation.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && <p style={{ fontSize: 13, color: ink40 }}>Loading…</p>}
        {!isLoading && comments && comments.length === 0 && (
          <p style={{ fontSize: 13, color: ink40 }}>No entries yet.</p>
        )}
        {comments?.map((comment) => (
          <div
            key={comment.id}
            style={{
              display: 'flex',
              gap: 12,
              borderRadius: 8,
              background: surfaceSunken,
              padding: 12,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, color: ink45 }}>{formatDate(comment.createdAt)}</p>
              <p style={{ margin: '3px 0 0', fontSize: 14, color: ink70, whiteSpace: 'pre-wrap' }}>{comment.body}</p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(comment.id)}
              aria-label="Delete entry"
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: ink40,
                fontSize: 16,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = accentDark)}
              onMouseLeave={(e) => (e.currentTarget.style.color = ink40)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
