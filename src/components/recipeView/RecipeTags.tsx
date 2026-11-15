import { Link } from 'react-router-dom';
import { MEAL_TAGS } from '@/lib/mealTags';
import { accent35, accentDark } from './tokens';

/**
 * A recipe's tags as links: tapping one opens the library filtered by it. The
 * recipe's type is shown in the header instead, and everything is edited from
 * the Edit panel.
 */
export default function RecipeTags({ tags, size = 'desktop' }: { tags: string[]; size?: 'desktop' | 'mobile' }) {
  const shown = tags.filter((t) => !MEAL_TAGS.includes(t.toLowerCase()));
  if (shown.length === 0) return null;
  const mobile = size === 'mobile';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: mobile ? 16 : 20 }}>
      {shown.map((tag) => (
        <Link
          key={tag}
          to={`/?tag=${encodeURIComponent(tag)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: mobile ? '7px 12px' : '5px 11px',
            border: `1px solid ${accent35}`,
            borderRadius: mobile ? 10 : 8,
            fontSize: mobile ? 14 : 13,
            fontWeight: 500,
            color: accentDark,
          }}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
