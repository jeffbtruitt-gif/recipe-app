import type { CSSProperties, ReactNode } from 'react';
import { accentDark } from './tokens';

/** Turns **bold** markers into <strong>, optionally colored (used for note callouts). */
export function renderEmphasis(text: string, color?: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ fontWeight: 600, color }}>
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function StepText({ text, style }: { text: string; style: CSSProperties }) {
  return <p style={{ margin: 0, ...style }}>{renderEmphasis(text)}</p>;
}

export function NoteText({ text, style }: { text: string; style: CSSProperties }) {
  return <div style={style}>{renderEmphasis(text, accentDark)}</div>;
}
