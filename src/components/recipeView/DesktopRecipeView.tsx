import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '@/types/recipe';
import type { DerivedHeader } from './deriveHeader';
import { splitNotes } from './deriveHeader';
import { StepNumberBadge } from './StepNumberBadge';
import { TimerChip } from './TimerChip';
import { StepText, NoteText } from './StepText';
import RecipeComments from '@/components/RecipeComments';
import {
  ink,
  ink40,
  ink42,
  ink45,
  ink55,
  ink70,
  hairline,
  hairlineLight,
  rule,
  ink12,
  border,
  accent,
  surface,
  surfaceSunken,
  page,
  cardShadow,
  fontFamily,
  heroPlaceholderBg,
  DEFAULT_EMPTY_SIDECAR_NOTE,
} from './tokens';

const capsHeading: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: 0,
  color: ink55,
};

export default function DesktopRecipeView({
  recipe,
  derived,
  done,
  onToggleStep,
}: {
  recipe: Recipe;
  derived: DerivedHeader;
  done: Record<string, boolean>;
  onToggleStep: (id: string) => void;
}) {
  const [shareLabel, setShareLabel] = useState('Share');
  const notes = splitNotes(recipe.notes);
  const stats = [
    recipe.prepTime && ['Prep', recipe.prepTime],
    recipe.cookTime && ['Cook', recipe.cookTime],
    recipe.totalTime && ['Total', recipe.totalTime],
    recipe.servings && ['Serves', recipe.servings],
  ].filter(Boolean) as [string, string][];

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Copied!');
      setTimeout(() => setShareLabel('Share'), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  let stepCounter = 0;

  return (
    <div style={{ minHeight: '100%', background: page, fontFamily, color: ink, padding: '0 0 80px' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${hairline}`,
          position: 'sticky',
          top: 0,
          zIndex: 6,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '14px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: ink45, minWidth: 0 }}>
            <Link to="/" style={{ color: ink45 }}>
              Recipes
            </Link>
            <span style={{ color: 'rgba(20,22,26,0.25)' }}>/</span>
            <span>{derived.category}</span>
            <span style={{ color: 'rgba(20,22,26,0.25)' }}>/</span>
            <span
              style={{
                color: ink,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {recipe.title}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '9px 14px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                fontSize: 14,
                fontWeight: 500,
                color: ink70,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Print
            </button>
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '9px 14px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                fontSize: 14,
                fontWeight: 500,
                color: ink70,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {shareLabel}
            </button>
            <button
              title="Cook mode is not built yet"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '9px 16px',
                borderRadius: 8,
                background: accent,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cook mode
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ background: surface, boxShadow: cardShadow, marginTop: 28 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(260px,460px)',
              borderBottom: `1px solid ${hairline}`,
            }}
          >
            <div style={{ padding: '44px 44px 36px' }}>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: ink42,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {derived.eyebrow}
              </div>
              <h1
                style={{
                  fontWeight: 700,
                  fontSize: 44,
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  margin: '0 0 18px',
                  maxWidth: '16ch',
                }}
              >
                {recipe.title}
              </h1>
              {recipe.description && (
                <p
                  style={{
                    margin: '0 0 30px',
                    fontSize: 17,
                    lineHeight: 1.5,
                    color: ink55,
                    maxWidth: '52ch',
                  }}
                >
                  {recipe.description}
                </p>
              )}
              {stats.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(78px, 1fr))',
                    gap: '20px 32px',
                    paddingTop: 24,
                    borderTop: `1px solid ${rule}`,
                  }}
                >
                  {stats.map(([label, value]) => (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: ink42,
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
              {derived.provenance && (
                <div style={{ marginTop: 22, fontSize: 13, color: ink45 }}>{derived.provenance}</div>
              )}
            </div>
            <div
              style={{
                background: recipe.imageUrl ? undefined : heroPlaceholderBg,
                borderLeft: `1px solid ${hairline}`,
                minHeight: 300,
              }}
            >
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', minHeight: 300, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
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
                </div>
              )}
            </div>
          </div>

          {recipe.ingredients.length > 0 && (
            <div style={{ padding: '32px 44px 34px', borderBottom: `1px solid ${hairline}` }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <h2 style={capsHeading}>Everything you need</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 13, color: ink40 }}>
                    {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0 40px',
                }}
              >
                {recipe.ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '84px 1fr',
                      gap: 12,
                      padding: '8px 0',
                      borderBottom: `1px solid ${hairlineLight}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 15 }}>
                      {ing.amount}
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.42 }}>{ing.item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              padding: '26px 44px 14px',
            }}
          >
            <h2 style={capsHeading}>Directions</h2>
            <div style={{ fontSize: 13, color: ink40 }}>click a step to check it off</div>
          </div>

          {recipe.phases.map((phase, phaseIndex) => (
            <div key={phase.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '12px 44px',
                  background: accent,
                  color: '#FFFFFF',
                  position: 'sticky',
                  top: 66,
                  zIndex: 4,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Phase {phaseIndex + 1} — {phase.name}
                </div>
                {phase.meta && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>{phase.meta}</div>}
              </div>

              {phase.steps.map((step) => {
                stepCounter += 1;
                const isDone = !!done[step.id];
                return (
                  <div
                    key={step.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isDone}
                    aria-label={`Step ${stepCounter}${isDone ? ', completed' : ''}`}
                    onClick={() => onToggleStep(step.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleStep(step.id);
                      }
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '212px 1fr',
                      borderBottom: `1px solid ${hairline}`,
                      cursor: 'pointer',
                    }}
                  >
                    {step.sidecar.length > 0 ? (
                      <div
                        style={{
                          background: surfaceSunken,
                          padding: '22px 24px',
                          borderRight: `1px solid ${hairline}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 9,
                          fontSize: 14,
                          lineHeight: 1.35,
                          opacity: isDone ? 0.4 : 1,
                          transition: 'opacity .18s ease',
                        }}
                      >
                        {step.sidecar.map((si) => (
                          <div key={si.id}>
                            {si.amount && (
                              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                {si.amount}{' '}
                              </span>
                            )}
                            {si.shortName}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          background: surfaceSunken,
                          padding: '22px 24px',
                          borderRight: `1px solid ${hairline}`,
                          fontSize: 14,
                          lineHeight: 1.35,
                          color: ink40,
                          opacity: isDone ? 0.4 : 1,
                          transition: 'opacity .18s ease',
                        }}
                      >
                        {step.emptyNote || DEFAULT_EMPTY_SIDECAR_NOTE}
                      </div>
                    )}
                    <div
                      style={{
                        padding: '22px 26px',
                        display: 'grid',
                        gridTemplateColumns: '34px 1fr',
                        gap: 18,
                        alignItems: 'start',
                      }}
                    >
                      <StepNumberBadge number={stepCounter} done={isDone} size={34} fontSize={14} />
                      <div style={{ opacity: isDone ? 0.38 : 1, transition: 'opacity .18s ease' }}>
                        <StepText text={step.instruction} style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '62ch' }} />
                        {step.timerLabel && <TimerChip label={step.timerLabel} variant="desktop" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {notes.length > 0 && (
            <div style={{ padding: '34px 44px 44px' }}>
              <h2 style={{ ...capsHeading, marginBottom: 16 }}>Notes</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                {notes.map((note, i) => (
                  <NoteText
                    key={i}
                    text={note}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: ink70,
                      borderTop: `2px solid ${ink12}`,
                      paddingTop: 12,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <RecipeComments recipeId={recipe.id} padding="34px 44px 44px" />
        </div>
      </div>
    </div>
  );
}
