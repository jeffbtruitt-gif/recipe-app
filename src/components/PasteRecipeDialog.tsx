import { useEffect, useRef, useState } from 'react';
import {
  ImportError,
  clearPasscode,
  getSavedPasscode,
  importRecipe,
  photoToImportImage,
  savePasscode,
  type ImportImage,
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
  const [photos, setPhotos] = useState<{ image: ImportImage; preview: string }[]>([]);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 4;
  const canSubmit = !!text.trim() || photos.length > 0;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setReadingPhoto(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const picked = Array.from(files).slice(0, room);
      const added = await Promise.all(
        picked.map(async (f) => {
          const image = await photoToImportImage(f);
          return { image, preview: `data:${image.mediaType};base64,${image.data}` };
        }),
      );
      setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
      if (files.length > room) setError(`Up to ${MAX_PHOTOS} photos per recipe.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that photo.");
    } finally {
      setReadingPhoto(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (libraryRef.current) libraryRef.current.value = '';
    }
  }

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
    if (busy || readingPhoto || !canSubmit) return;
    if (!passcode.trim()) {
      setNeedsPasscode(true);
      setError('Enter the import passcode.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await importRecipe(text, passcode.trim(), photos.map((p) => p.image));
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

  function photoButtonStyle(disabled: boolean): React.CSSProperties {
    return {
      flex: 1,
      minHeight: 44,
      padding: '9px 14px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: 'transparent',
      fontSize: 14,
      fontWeight: 500,
      color: 'rgba(20,22,26,0.7)',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'inherit',
    };
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
            AI Recipe
          </h2>
          <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: ink55 }}>
            Snap a photo of a cookbook page or recipe card, or drop in recipe text or a link. It gets formatted and added as a new entry.
          </p>
        </div>

        <div style={{ padding: '12px 28px 0' }}>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={libraryRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={busy || readingPhoto || photos.length >= MAX_PHOTOS}
              style={photoButtonStyle(busy || readingPhoto || photos.length >= MAX_PHOTOS)}
            >
              📷 Take photo
            </button>
            <button
              type="button"
              onClick={() => libraryRef.current?.click()}
              disabled={busy || readingPhoto || photos.length >= MAX_PHOTOS}
              style={photoButtonStyle(busy || readingPhoto || photos.length >= MAX_PHOTOS)}
            >
              Choose photo
            </button>
          </div>
          {(photos.length > 0 || readingPhoto) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: 76, height: 76 }}>
                  <img
                    src={p.preview}
                    alt={`Recipe photo ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: `1px solid ${border}` }}
                  />
                  {!busy && (
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        border: 'none',
                        background: ink,
                        color: '#FFFFFF',
                        fontSize: 14,
                        lineHeight: '24px',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {readingPhoto && (
                <div style={{ width: 76, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: ink40, border: `1px dashed ${border}`, borderRadius: 8 }}>
                  Loading…
                </div>
              )}
            </div>
          )}
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            rows={photos.length ? 3 : 10}
            aria-label="Recipe text or link"
            placeholder={photos.length ? 'Optional: add a note, e.g. "the chili recipe on the left page"' : 'Paste ingredients and directions, or a link like https://…'}
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
            disabled={busy || readingPhoto || !canSubmit}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: busy ? accentDark : accent,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 500,
              cursor: busy || !canSubmit ? 'default' : 'pointer',
              opacity: !canSubmit && !busy ? 0.5 : 1,
            }}
          >
            {busy ? 'Adding…' : 'Add recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
