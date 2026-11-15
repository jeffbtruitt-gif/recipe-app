import { useEffect, useRef, useState } from 'react';
import {
  ImportError,
  clearPasscode,
  getSavedPasscode,
  importRecipe,
  savePasscode,
} from '@/api/importRecipe';
import { accent, accentDark, border, hairline, ink, ink40, ink55, surface, cardShadow, fontFamily } from '@/components/recipeView/tokens';

export default function PasteRecipeDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (recipeId: string) => void;
}) {
  const [text, setText] = useState('');
  const [passcode, setPasscode] = useState(getSavedPasscode);
  const [needsPasscode, setNeedsPasscode] = useState(() => !getSavedPasscode());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !text.trim()) return;
    if (!passcode.trim()) {
      setNeedsPasscode(true);
      setError('Enter the import passcode.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await importRecipe(text, passcode.trim());
      savePasscode(passcode.trim());
      onImported(id);
    } catch (err) {
      if (err instanceof ImportError && err.status === 401) {
        clearPasscode();
        setNeedsPasscode(true);
        setPasscode('');
      }
      setError(err instanceof Error ? err.message : 'Something went wrong importing that recipe.');
      setBusy(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: surface,
    fontSize: 15,
    color: ink,
    fontFamily: 'inherit',
  };

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
        padding: '8vh 20px 20px',
        overflowY: 'auto',
        fontFamily,
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="paste-recipe-title"
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 640, background: surface, boxShadow: cardShadow, color: ink }}
      >
        <div style={{ padding: '24px 28px 8px' }}>
          <h2
            id="paste-recipe-title"
            style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink55 }}
          >
            Paste a recipe
          </h2>
          <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: ink55 }}>
            Drop in the recipe text or a link to a recipe page. It gets formatted and added as a new entry.
          </p>
        </div>

        <div style={{ padding: '12px 28px 0' }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            rows={12}
            aria-label="Recipe text or link"
            placeholder="Paste ingredients and directions, or a link like https://…"
            style={{ ...fieldStyle, padding: '12px 14px', lineHeight: 1.5, resize: 'vertical' }}
          />
          {needsPasscode && (
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={busy}
              aria-label="Import passcode"
              placeholder="Import passcode"
              autoComplete="off"
              style={{ ...fieldStyle, marginTop: 10, height: 42, padding: '0 14px' }}
            />
          )}
          {error && (
            <p role="alert" style={{ margin: '12px 0 0', fontSize: 14, color: '#B42318' }}>
              {error}
            </p>
          )}
          {busy && (
            <p role="status" style={{ margin: '12px 0 0', fontSize: 14, color: ink40 }}>
              Reading the recipe… this usually takes 20–40 seconds.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 28px 24px', borderTop: `1px solid ${hairline}`, marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: 'transparent',
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(20,22,26,0.7)',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: busy ? accentDark : accent,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              cursor: busy || !text.trim() ? 'default' : 'pointer',
              opacity: !text.trim() && !busy ? 0.5 : 1,
            }}
          >
            {busy ? 'Adding…' : 'Add recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
