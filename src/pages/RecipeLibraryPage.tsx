import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PasteRecipeDialog from '@/components/PasteRecipeDialog';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRecipes, setFavorite } from '@/api/recipes';
import type { Recipe } from '@/types/recipe';
import { MEAL_TAGS, capitalize } from '@/lib/mealTags';
import icon from '@/assets/icon.png';
import {
  ink,
  ink40,
  ink42,
  ink45,
  ink55,
  hairline,
  hairlineLight,
  border,
  accent,
  accentDark,
  accent35,
  accent30,
  surface,
  surfaceSunken,
  page,
  cardShadow,
  fontFamily,
  heroPlaceholderBg,
} from '@/components/recipeView/tokens';

type TimeFilter = 'any' | '30' | '60';
type SortKey = 'recent' | 'az' | 'quick';

function getMeal(recipe: Recipe): string | null {
  const tag = recipe.tags.find((t) => MEAL_TAGS.includes(t.toLowerCase()));
  return tag ? capitalize(tag) : null;
}

function formatMinutes(mins: number | null): string {
  if (mins == null) return '—';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

interface Filters {
  q: string;
  meals: string[];
  tags: string[];
  time: TimeFilter;
}

function matchesFilters(recipe: Recipe, f: Filters): boolean {
  const q = f.q.trim().toLowerCase();
  if (q) {
    const meal = getMeal(recipe) ?? '';
    const haystack = [recipe.title, recipe.description ?? '', ...recipe.tags, meal].join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.meals.length) {
    const meal = getMeal(recipe);
    if (!meal || !f.meals.includes(meal)) return false;
  }
  if (f.tags.length) {
    const lower = recipe.tags.map((t) => t.toLowerCase());
    if (!f.tags.every((t) => lower.includes(t.toLowerCase()))) return false;
  }
  if (f.time !== 'any') {
    const max = f.time === '30' ? 30 : 60;
    if (recipe.totalMinutes == null || recipe.totalMinutes > max) return false;
  }
  return true;
}

function pillStyle(on: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 11px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${on ? accent : accent35}`,
    background: on ? accent : 'transparent',
    color: on ? '#FFFFFF' : accentDark,
    transition: 'background .18s ease, color .18s ease, border-color .18s ease',
  };
}

const capsHeading: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: 0,
  color: ink55,
};

export default function RecipeLibraryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDesktop = useIsDesktop(900);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [meals, setMeals] = useState<string[]>([]);
  // Tags on a recipe link here as /?tag=<name>, so start with those selected.
  const [tags, setTags] = useState<string[]>(() => searchParams.getAll('tag'));
  const [time, setTime] = useState<TimeFilter>('any');
  const [sort, setSort] = useState<SortKey>('recent');

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: listRecipes,
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setFavorite(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  });

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function toggleMeal(meal: string) {
    setMeals((prev) => (prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]));
  }

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const r of recipes ?? []) {
      for (const t of r.tags) {
        if (!MEAL_TAGS.includes(t.toLowerCase())) set.add(t);
      }
    }
    return [...set].sort();
  }, [recipes]);

  const favorites = useMemo(() => (recipes ?? []).filter((r) => r.isFavorite), [recipes]);

  const mealCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const meal of MEAL_TAGS.map(capitalize)) {
      counts[meal] = (recipes ?? []).filter(
        (r) => getMeal(r) === meal && matchesFilters(r, { q: query, meals: [], tags, time }),
      ).length;
    }
    return counts;
  }, [recipes, query, tags, time]);

  const results = useMemo(() => {
    const filtered = (recipes ?? []).filter((r) => matchesFilters(r, { q: query, meals, tags, time }));
    const sorted = [...filtered];
    if (sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'quick') {
      sorted.sort((a, b) => {
        if (a.totalMinutes == null) return 1;
        if (b.totalMinutes == null) return -1;
        return a.totalMinutes - b.totalMinutes;
      });
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [recipes, query, meals, tags, time, sort]);

  const anyFilter = !!(query || meals.length || tags.length || time !== 'any');
  function clearFilters() {
    setQuery('');
    setMeals([]);
    setTags([]);
    setTime('any');
  }

  const total = recipes?.length ?? 0;
  const activeFilterCount = meals.length + tags.length + (time !== 'any' ? 1 : 0);
  const thumb = isDesktop ? 84 : 64;

  return (
    <div style={{ minHeight: '100%', background: page, fontFamily, color: ink, padding: '0 0 80px' }}>
      {pasteOpen && (
        <PasteRecipeDialog
          onClose={() => setPasteOpen(false)}
          onImported={async (id) => {
            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            navigate(`/recipes/${id}`);
          }}
        />
      )}
      <div
        style={{
          background: '#F7F7F8',
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
            padding: isDesktop ? '10px 40px' : '8px 16px 10px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isDesktop ? 24 : 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 14 : 10 }}>
            <img src={icon} alt="" style={{ height: isDesktop ? 48 : 40, width: isDesktop ? 48 : 40 }} />
            <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Thaw and Order</span>
            {isDesktop && (
              <>
                <span style={{ color: 'rgba(20,22,26,0.25)' }}>/</span>
                <span style={{ fontSize: 14, color: ink45 }}>All recipes</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flex: isDesktop ? undefined : '1 1 100%' }}>
            <button
              onClick={() => setPasteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: isDesktop ? undefined : 1,
                minHeight: isDesktop ? undefined : 44,
                padding: '9px 14px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(20,22,26,0.7)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Paste a recipe
            </button>
            <Link
              to="/recipes/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: isDesktop ? undefined : 1,
                minHeight: isDesktop ? undefined : 44,
                padding: '9px 16px',
                borderRadius: 8,
                background: accent,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Add recipe
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: isDesktop ? '0 40px' : '0 12px' }}>
        <div
          style={{
            marginTop: isDesktop ? 28 : 12,
            display: 'grid',
            gridTemplateColumns: isDesktop ? '272px minmax(0,1fr)' : 'minmax(0,1fr)',
            gap: isDesktop ? 24 : 12,
            alignItems: 'start',
          }}
        >
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 48,
                padding: '0 16px',
                border: 'none',
                background: surface,
                boxShadow: cardShadow,
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                color: ink,
                cursor: 'pointer',
              }}
            >
              <span>
                Filters{activeFilterCount > 0 ? ` · ${activeFilterCount} on` : ''}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: accentDark }}>{filtersOpen ? 'Hide' : 'Show'}</span>
            </button>
          )}
          {/* Filter rail */}
          {(isDesktop || filtersOpen) && (
          <div
            style={{
              background: surface,
              boxShadow: cardShadow,
              position: isDesktop ? 'sticky' : 'static',
              top: 94,
              maxHeight: isDesktop ? 'calc(100vh - 118px)' : undefined,
              overflowY: isDesktop ? 'auto' : undefined,
            }}
          >
            <div style={{ padding: '22px 24px 20px', borderBottom: `1px solid ${hairline}` }}>
              <div
                style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}
              >
                <h2 style={capsHeading}>Favorites</h2>
                <div style={{ fontSize: 13, color: ink40, fontVariantNumeric: 'tabular-nums' }}>
                  {favorites.length}
                </div>
              </div>
              <div style={{ background: surfaceSunken, borderLeft: `3px solid ${accent30}`, padding: '6px 14px 8px' }}>
                {favorites.map((r, i) => (
                  <Link
                    key={r.id}
                    to={`/recipes/${r.id}`}
                    style={{
                      display: 'block',
                      padding: '8px 0',
                      borderBottom: i === favorites.length - 1 ? undefined : `1px solid ${hairlineLight}`,
                      color: ink,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: ink45, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                      {formatMinutes(r.totalMinutes)}
                      {r.timeNote ? ` · ${r.timeNote}` : ''}
                    </div>
                  </Link>
                ))}
                {favorites.length === 0 && (
                  <div style={{ fontSize: 14, lineHeight: 1.4, color: ink45, padding: '8px 0' }}>
                    Nothing pinned yet. Star a recipe to keep it here.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '22px 24px 20px', borderBottom: `1px solid ${hairline}` }}>
              <h2 style={{ ...capsHeading, marginBottom: 10 }}>Meal</h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {MEAL_TAGS.map(capitalize).map((meal) => {
                  const on = meals.includes(meal);
                  const count = mealCounts[meal] ?? 0;
                  return (
                    <div
                      key={meal}
                      onClick={() => toggleMeal(meal)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: `1px solid ${hairlineLight}`,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: on ? 600 : 400,
                        color: on ? accentDark : ink,
                        opacity: count === 0 && !on ? 0.4 : 1,
                        transition: 'color .18s ease',
                      }}
                    >
                      <span>{meal}</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontVariantNumeric: 'tabular-nums',
                          color: on ? 'rgba(31,78,121,0.7)' : ink40,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '22px 24px 20px', borderBottom: `1px solid ${hairline}` }}>
              <h2 style={{ ...capsHeading, marginBottom: 12 }}>Time</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {(
                  [
                    ['any', 'Any'],
                    ['30', 'Under 30'],
                    ['60', 'Under 60'],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => setTime(key)}
                    style={{ ...pillStyle(time === key), flex: 1, justifyContent: 'center', padding: '7px 4px' }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: allTags.length ? '22px 24px 24px' : '22px 24px' }}>
              <h2 style={{ ...capsHeading, marginBottom: 12 }}>Tags</h2>
              {allTags.length === 0 ? (
                <p style={{ fontSize: 13, color: ink40, margin: 0 }}>No tags yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allTags.map((tag) => (
                    <div key={tag} onClick={() => toggleTag(tag)} style={pillStyle(tags.includes(tag))}>
                      {tag}
                    </div>
                  ))}
                </div>
              )}
              {anyFilter && (
                <div
                  onClick={clearFilters}
                  style={{
                    marginTop: 18,
                    fontSize: 14,
                    fontWeight: 500,
                    color: accentDark,
                    cursor: 'pointer',
                    display: 'inline-block',
                  }}
                >
                  Clear all filters
                </div>
              )}
            </div>
          </div>
          )}

          {/* Results */}
          <div style={{ background: surface, boxShadow: cardShadow }}>
            <div style={{ padding: isDesktop ? '24px 32px 22px' : '16px 16px 14px', borderBottom: `1px solid ${hairline}` }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recipes, ingredients, tags…"
                aria-label="Search recipes"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 48,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: surface,
                  fontSize: 16,
                  color: ink,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: isDesktop ? 20 : 8,
                padding: isDesktop ? '20px 32px 12px' : '16px 16px 10px',
              }}
            >
              <h2 style={capsHeading}>
                {results.length === total ? `${total} recipe${total === 1 ? '' : 's'}` : `${results.length} of ${total} recipes`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, color: ink40 }}>Sort</span>
                {(
                  [
                    ['recent', 'Recent'],
                    ['az', 'A–Z'],
                    ['quick', 'Quickest'],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => setSort(key)}
                    style={{
                      fontSize: 13,
                      cursor: 'pointer',
                      paddingBottom: 2,
                      fontWeight: sort === key ? 600 : 400,
                      color: sort === key ? accentDark : ink45,
                      borderBottom: `1.5px solid ${sort === key ? accent : 'transparent'}`,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {isLoading && <p style={{ padding: '20px 32px', color: ink45 }}>Loading…</p>}
              {error && <p style={{ padding: '20px 32px', color: '#B42318' }}>Couldn't load recipes.</p>}
              {results.map((r) => {
                const meal = getMeal(r);
                const chips = r.tags.filter((t) => !MEAL_TAGS.includes(t.toLowerCase()));
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isDesktop ? '84px minmax(0,1fr) 120px 36px' : '64px minmax(0,1fr) 36px',
                      gap: isDesktop ? 22 : 14,
                      alignItems: 'start',
                      padding: isDesktop ? '20px 32px 22px' : '16px 16px 18px',
                      borderTop: `1px solid ${hairline}`,
                    }}
                  >
                    <div
                      style={{
                        width: thumb,
                        height: thumb,
                        background: r.imageUrl ? undefined : heroPlaceholderBg,
                      }}
                    >
                      {r.imageUrl && (
                        <img src={r.imageUrl} alt="" style={{ width: thumb, height: thumb, objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={`/recipes/${r.id}`}
                        style={{
                          display: 'block',
                          fontSize: isDesktop ? 19 : 17,
                          fontWeight: 600,
                          lineHeight: 1.28,
                          letterSpacing: '-0.015em',
                          color: ink,
                        }}
                      >
                        {r.title}
                      </Link>
                      {!isDesktop && (
                        <div style={{ marginTop: 4, fontSize: 13, color: ink45, fontVariantNumeric: 'tabular-nums' }}>
                          {[meal, formatMinutes(r.totalMinutes), r.timeNote].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {r.description && (
                        <p
                          style={{
                            margin: '7px 0 0',
                            fontSize: isDesktop ? 15 : 14,
                            lineHeight: 1.5,
                            color: ink55,
                            maxWidth: '62ch',
                          }}
                        >
                          {r.description}
                        </p>
                      )}
                      {chips.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {chips.map((tag) => (
                            <div key={tag} onClick={() => toggleTag(tag)} style={pillStyle(tags.includes(tag))}>
                              {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isDesktop && (
                    <div style={{ textAlign: 'right' }}>
                      {meal && (
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
                          {meal}
                        </div>
                      )}
                      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMinutes(r.totalMinutes)}
                      </div>
                      {r.timeNote && <div style={{ fontSize: 12.5, color: ink42, marginTop: 3 }}>{r.timeNote}</div>}
                    </div>
                    )}
                    <button
                      onClick={() => favoriteMutation.mutate({ id: r.id, value: !r.isFavorite })}
                      aria-pressed={r.isFavorite}
                      aria-label={r.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill={r.isFavorite ? accent : 'none'}
                        stroke={r.isFavorite ? accent : 'rgba(20,22,26,0.28)'}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3.2l2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 16.8 6.5 19.9l1.3-6.1L3.2 9.6l6.2-.7z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {!isLoading && results.length === 0 && (
              <div style={{ borderTop: `1px solid ${hairline}`, padding: '56px 32px 60px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 8 }}>
                  {total === 0 ? 'No recipes yet' : 'Nothing matches yet'}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.5, color: ink55, maxWidth: '44ch', margin: '0 auto 20px' }}>
                  {total === 0
                    ? 'Add your first recipe to get started.'
                    : 'Try a looser search, or drop a filter or two.'}
                </div>
                {total === 0 ? (
                  <Link
                    to="/recipes/new"
                    style={{
                      display: 'inline-flex',
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: accent,
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Add recipe
                  </Link>
                ) : (
                  <button
                    onClick={clearFilters}
                    style={{
                      display: 'inline-flex',
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
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
