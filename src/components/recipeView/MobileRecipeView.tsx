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
  ink72,
  ink12,
  hairline,
  hairlineLight,
  rule,
  accent,
  accent30,
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

export default function MobileRecipeView({
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
  const notes = splitNotes(recipe.notes);
  const stats: [string, string][] = [
    recipe.totalTime && ['Total', recipe.totalTime],
    ['Phases', String(derived.phaseCount)],
    recipe.servings && ['Serves', recipe.servings],
  ].filter(Boolean) as [string, string][];

  let stepCounter = 0;

  return (
    <div
      style={{
        minHeight: '100%',
        background: page,
        display: 'flex',
        justifyContent: 'center',
        fontFamily,
        color: ink,
        padding: '0 0 64px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560, background: surface, boxShadow: cardShadow }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderBottom: `1px solid ${hairline}`,
            position: 'sticky',
            top: 0,
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(8px)',
            zIndex: 6,
          }}
        >
          <div
            style={{
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: ink45,
              fontWeight: 500,
            }}
          >
            {derived.category}
          </div>
        </div>

        <div style={{ padding: '34px 24px 26px' }}>
          <h1
            style={{
              fontWeight: 700,
              fontSize: 34,
              lineHeight: 1.14,
              letterSpacing: '-0.03em',
              margin: '0 0 14px',
            }}
          >
            {recipe.title}
          </h1>
          {recipe.description && (
            <p style={{ margin: '0 0 22px', fontSize: 16, lineHeight: 1.5, color: ink55 }}>{recipe.description}</p>
          )}

          {stats.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                background: rule,
                borderTop: `1px solid ${rule}`,
                borderBottom: `1px solid ${rule}`,
              }}
            >
              {stats.map(([label, value]) => (
                <div key={label} style={{ background: surface, padding: '14px 4px 15px' }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: ink42,
                      fontWeight: 600,
                      marginBottom: 5,
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
            <div style={{ marginTop: 14, fontSize: 13, color: ink45 }}>{derived.provenance}</div>
          )}
        </div>

        <div
          style={{
            height: 220,
            background: recipe.imageUrl ? undefined : heroPlaceholderBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: `1px solid ${hairline}`,
            borderBottom: `1px solid ${hairline}`,
          }}
        >
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
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
        </div>

        {recipe.ingredients.length > 0 && (
          <div style={{ padding: '30px 24px 26px', borderBottom: `1px solid ${hairline}` }}>
            <div
              style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}
            >
              <h2 style={capsHeading}>Everything you need</h2>
              <div style={{ fontSize: 13, color: ink40 }}>
                {recipe.ingredients.length} item{recipe.ingredients.length === 1 ? '' : 's'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={ing.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '104px 1fr',
                    gap: 14,
                    padding: '9px 0',
                    borderBottom: i === recipe.ingredients.length - 1 ? undefined : `1px solid ${hairlineLight}`,
                  }}
                >
                  <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: 16 }}>
                    {ing.amount}
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.45 }}>{ing.item}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '24px 24px 12px' }}
        >
          <h2 style={capsHeading}>Directions</h2>
          <div style={{ fontSize: 13, color: ink40 }}>tap a step to check it off</div>
        </div>

        {recipe.phases.map((phase, phaseIndex) => (
          <div key={phase.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 24px',
                background: accent,
                color: '#FFFFFF',
                position: 'sticky',
                top: 73,
                zIndex: 4,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Phase {phaseIndex + 1} — {phase.name}
              </div>
              {phase.meta && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', textAlign: 'right' }}>{phase.meta}</div>
              )}
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
                  style={{ padding: '20px 24px 22px', borderBottom: `1px solid ${hairline}`, cursor: 'pointer' }}
                >
                  {step.sidecar.length > 0 ? (
                    <div
                      style={{
                        background: surfaceSunken,
                        borderLeft: `3px solid ${accent30}`,
                        padding: '13px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 14,
                        opacity: isDone ? 0.4 : 1,
                        transition: 'opacity .18s ease',
                      }}
                    >
                      {step.sidecar.map((si) => (
                        <div
                          key={si.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '88px 1fr',
                            gap: 12,
                            fontSize: 15,
                            lineHeight: 1.35,
                          }}
                        >
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{si.amount}</span>
                          <span>{si.shortName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: surfaceSunken,
                        borderLeft: `3px solid ${ink12}`,
                        padding: '13px 16px',
                        marginBottom: 14,
                        fontSize: 15,
                        lineHeight: 1.35,
                        color: ink45,
                        opacity: isDone ? 0.4 : 1,
                        transition: 'opacity .18s ease',
                      }}
                    >
                      {step.emptyNote || DEFAULT_EMPTY_SIDECAR_NOTE}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 16, alignItems: 'start' }}>
                    <StepNumberBadge number={stepCounter} done={isDone} size={36} fontSize={15} />
                    <div style={{ opacity: isDone ? 0.38 : 1, transition: 'opacity .18s ease' }}>
                      <StepText text={step.instruction} style={{ fontSize: 17, lineHeight: 1.6 }} />
                      {step.timerLabel && <TimerChip label={step.timerLabel} variant="mobile" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {notes.length > 0 && (
          <div style={{ padding: '26px 24px 34px' }}>
            <h2 style={{ ...capsHeading, marginBottom: 14 }}>Notes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map((note, i) => (
                <NoteText key={i} text={note} style={{ fontSize: 16, lineHeight: 1.55, color: ink72 }} />
              ))}
            </div>
          </div>
        )}

        <RecipeComments recipeId={recipe.id} padding="26px 24px 34px" />
      </div>
    </div>
  );
}
