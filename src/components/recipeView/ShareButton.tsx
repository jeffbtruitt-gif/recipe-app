import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Copy text to the clipboard, with a fallback for browsers/contexts
 *  where the async Clipboard API is missing or blocked. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** "Share" button that copies the current page URL and briefly shows
 *  "Link copied". Used in the recipe page top bar (desktop and phone). */
export default function ShareButton({ style }: { style: CSSProperties }) {
  const [label, setLabel] = useState('Share');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleClick() {
    const ok = await copyText(window.location.href);
    setLabel(ok ? 'Link copied' : 'Copy failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLabel('Share'), 1800);
  }

  return (
    <button onClick={handleClick} title="Copy link to this recipe" aria-live="polite" style={style}>
      {label}
    </button>
  );
}
