// 게임 요소 아이콘: 연구 동료·배지를 검은 외곽선 스티커 모양으로 보여 준다
import {
  Award, BadgeCheck, Bird, Camera, ClipboardCheck, Droplets, Eye, FileText, Fish, Globe, Layers, MapPin,
  Microscope, NotebookPen, Rabbit, Search, Snail, Sparkles, Squirrel, Turtle, type LucideIcon,
} from 'lucide-react';
import type { GameColor } from '../../types/data';

const ICONS: Record<string, LucideIcon> = {
  Award, BadgeCheck, Bird, Camera, ClipboardCheck, Droplets, Eye, FileText, Fish, Globe, Layers, MapPin,
  Microscope, NotebookPen, Rabbit, Search, Snail, Sparkles, Squirrel, Turtle,
};

interface Props {
  icon: string;
  color: GameColor | 'ink';
  /** rem 단위 지름 */
  size?: number;
  /** 아직 받지 않은 배지는 회색 */
  locked?: boolean;
  tilt?: number;
  label?: string;
}

export function GameSticker({ icon, color, size = 3, locked = false, tilt = 0, label }: Props) {
  const Icon = ICONS[icon] ?? Award;
  return (
    <span
      className={`sticker-badge sb-${locked ? 'locked' : color}`}
      style={{ width: `${size}rem`, height: `${size}rem`, transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon size={`${size * 0.55}rem`} strokeWidth={2.2} aria-hidden />
    </span>
  );
}
