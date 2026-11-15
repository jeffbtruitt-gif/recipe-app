import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeRecipePhoto, setRecipePhoto } from '@/api/photos';
import { accent, accentDark, border, ink42 } from './tokens';

/**
 * Photo actions for the recipe hero. Rendered absolutely inside the (relatively
 * positioned) hero: centered as the placeholder when there's no photo, along the
 * bottom edge when there is one. On a phone, "Take photo" opens the camera.
 */
export default function PhotoControls({
  recipeId,
  imageUrl,
  variant,
}: {
  recipeId: string;
  imageUrl: string | null;
  variant: 'desktop' | 'mobile';
}) {
  const queryClient = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mobile = variant === 'mobile';

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  }

  const upload = useMutation({
    mutationFn: (file: File) => setRecipePhoto(recipeId, file, imageUrl),
    onSuccess: refresh,
    onError: (err) => setError(err instanceof Error ? err.message : "Couldn't save that photo."),
  });
  const remove = useMutation({
    mutationFn: () => removeRecipePhoto(recipeId, imageUrl!),
    onSuccess: refresh,
    onError: (err) => setError(err instanceof Error ? err.message : "Couldn't remove that photo."),
  });
  const busy = upload.isPending || remove.isPending;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    upload.mutate(file);
  }

  const pill = (primary: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mobile ? 44 : undefined,
    padding: mobile ? '0 16px' : '8px 14px',
    borderRadius: mobile ? 10 : 8,
    fontSize: mobile ? 14 : 13,
    fontWeight: 500,
    cursor: busy ? 'default' : 'pointer',
    opacity: busy ? 0.6 : 1,
    border: `1px solid ${primary ? accent : border}`,
    background: primary ? accent : 'rgba(255,255,255,0.94)',
    color: primary ? '#FFFFFF' : accentDark,
  });

  const hasPhoto = !!imageUrl;
  const status = upload.isPending ? 'Saving photo…' : remove.isPending ? 'Removing…' : error;

  return (
    <div
      style={
        hasPhoto
          ? { position: 'absolute', left: 12, right: 12, bottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }
          : { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }
      }
    >
      {!hasPhoto && (
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: ink42,
            background: 'rgba(255,255,255,0.85)',
            padding: '6px 10px',
            borderRadius: 4,
          }}
        >
          no photo yet
        </div>
      )}
      {status && (
        <div
          role={error && !busy ? 'alert' : 'status'}
          style={{
            fontSize: 13,
            color: error && !busy ? '#B42318' : accentDark,
            background: 'rgba(255,255,255,0.94)',
            padding: '4px 10px',
            borderRadius: 6,
          }}
        >
          {status}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: hasPhoto ? 'flex-end' : 'center' }}>
        {mobile && (
          <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()} style={pill(!hasPhoto)}>
            {hasPhoto ? 'Retake photo' : 'Take photo'}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => pickerRef.current?.click()}
          style={pill(!mobile && !hasPhoto)}
        >
          {mobile ? 'Choose photo' : hasPhoto ? 'Change photo' : 'Add photo'}
        </button>
        {hasPhoto && (
          <button type="button" disabled={busy} onClick={() => remove.mutate()} style={pill(false)}>
            Remove
          </button>
        )}
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
      <input ref={pickerRef} type="file" accept="image/*" onChange={onFile} hidden />
    </div>
  );
}
