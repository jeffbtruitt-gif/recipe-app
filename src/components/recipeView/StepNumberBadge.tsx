import { accent, badgeIdle } from './tokens';

export function StepNumberBadge({
  number,
  done,
  size,
  fontSize,
}: {
  number: number;
  done: boolean;
  size: number;
  fontSize: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        border: `1.5px solid ${done ? accent : badgeIdle}`,
        background: done ? accent : 'transparent',
        color: done ? '#FFFFFF' : accent,
        transition: 'background .18s ease, color .18s ease, border-color .18s ease',
      }}
    >
      {number}
    </div>
  );
}
