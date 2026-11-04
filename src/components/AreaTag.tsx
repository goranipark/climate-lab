// 영역 태그: 생활/환경/실험/우리 지역을 아이콘 + 글자 + 색으로 표시 (색만으로 구분하지 않기)
import { FlaskConical, Leaf, MapPin, User, type LucideIcon } from 'lucide-react';
import { config, type Area } from '../types/data';

const ICONS: Record<string, LucideIcon> = { User, Leaf, FlaskConical, MapPin };

export function AreaIcon({ area, size = 16 }: { area: Area; size?: number }) {
  const Icon = ICONS[config.areas[area].icon] ?? User;
  return <Icon size={size} aria-hidden strokeWidth={2} />;
}

export function AreaTag({ area, count }: { area: Area; count?: number }) {
  return (
    <span className={`tag tag-${area}`}>
      <AreaIcon area={area} size={14} />
      <span>{config.areas[area].label}</span>
      {count !== undefined && <span className="tag-count">{count}</span>}
    </span>
  );
}
