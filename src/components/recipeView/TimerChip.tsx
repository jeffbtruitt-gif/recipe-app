import { accent35, accentDark } from './tokens';

export function TimerChip({ label, variant }: { label: string; variant: 'desktop' | 'mobile' }) {
  if (variant === 'desktop') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginTop: 12,
          padding: '7px 12px',
          border: `1px solid ${accent35}`,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: accentDark,
        }}
      >
        {label}
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginTop: 12,
        minHeight: 44,
        padding: '0 14px',
        border: `1px solid ${accent35}`,
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        color: accentDark,
      }}
    >
      {label}
    </div>
  );
}
