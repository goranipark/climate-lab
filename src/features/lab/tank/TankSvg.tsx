// 옆에서 본 디지털 수조 그림 (design.md 5.2). 눈금·숫자는 그리지 않는다.
import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { lab, type ModelId, type StateId } from '../../../types/data';
import { fill } from '../../../lib/template';
import { BOX, groundY, MODEL_BOX, SLOPE, VIEW_H, VIEW_W, waterYAt } from './geometry';
import { modelLabel } from '../labLogic';

/** 자갈 알갱이 점 위치 (매번 같은 모양이 나오도록 고정된 값으로 만든다) */
const DOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 140; i++) {
    const x = BOX.x + 6 + rand() * (BOX.w - 12);
    const yTop = Math.min(groundY(x), 300) + 6;
    const y = yTop + rand() * (BOX.bottom - yTop - 4);
    if (y < BOX.bottom - 3) out.push([x, y]);
  }
  return out;
})();

export interface TankSticker {
  model: ModelId;
  state: StateId;
}

interface Props {
  /** 부은 컵 수 (움직임 중에는 소수도 가능) */
  cups: number;
  /** 물 높이가 바뀔 때 움직일지 */
  animate?: boolean;
  /** 모형을 누를 수 있게 할 때 */
  onModel?: (model: ModelId) => void;
  /** 확대해서 볼 때 viewBox */
  viewBox?: string;
  /** 바뀐 모형 옆에 붙는 노랑 라벨 */
  stickers?: TankSticker[];
  /** 컵을 끌고 있을 때 수조 테두리 강조 */
  dropActive?: boolean;
  /** 화면 읽기용 설명 */
  title: string;
  className?: string;
}

export function TankSvg({ cups, animate = false, onModel, viewBox, stickers = [], dropActive = false, title, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const clipId = `tank-clip-${uid}`;
  const surface = waterYAt(cups);
  const landPath = `M${BOX.x} ${SLOPE.y1} L${SLOPE.x1} ${SLOPE.y1} L${SLOPE.x2} ${SLOPE.y2} L${BOX.x + BOX.w} ${SLOPE.y2} L${BOX.x + BOX.w} ${BOX.bottom} L${BOX.x} ${BOX.bottom} Z`;

  // 모형을 감싸는 누를 수 있는 묶음
  const modelGroup = (id: ModelId, children: ReactNode) => {
    const b = MODEL_BOX[id];
    if (!onModel) return <g key={id}>{children}</g>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onModel(id);
      }
    };
    return (
      <g
        key={id}
        className="tank-model"
        role="button"
        tabIndex={0}
        aria-label={fill(lab.ui.modelButton, { model: modelLabel(id) })}
        onClick={() => onModel(id)}
        onKeyDown={onKey}
      >
        <rect className="tank-hit" x={b.left - 8} y={b.top - 8} width={b.right - b.left + 16} height={b.bottom - b.top + 24} rx="10" />
        {children}
      </g>
    );
  };

  return (
    <svg className={`tank ${className ?? ''}`} viewBox={viewBox ?? `0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <clipPath id={clipId}>
          <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx="8" />
        </clipPath>
      </defs>

      {/* 아크릴 상자 안쪽 */}
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx="8" fill="var(--c-acrylic)" />

      <g clipPath={`url(#${clipId})`}>
        {/* 자갈(육지) */}
        <path d={landPath} fill="var(--c-land)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
        {DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 2.2} fill="var(--c-land-dot)" />
        ))}

        {/* 섬: 바다에 쌓은 자갈 언덕 */}
        {modelGroup(
          'island',
          <g>
            <path d="M50 300 Q112 100 175 300 Z" fill="var(--c-land)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="96" cy="262" r="2.6" fill="var(--c-land-dot)" />
            <circle cx="122" cy="240" r="2.6" fill="var(--c-land-dot)" />
            <circle cx="138" cy="272" r="2.6" fill="var(--c-land-dot)" />
            <circle cx="108" cy="222" r="2.2" fill="var(--c-land-dot)" />
          </g>,
        )}

        {/* 집: 경사면 중간 */}
        {modelGroup(
          'house',
          <g strokeLinejoin="round">
            <rect x="346" y="210" width="52" height="16" fill="var(--c-land)" stroke="var(--c-ink)" strokeWidth="2" />
            <rect x="352" y="178" width="40" height="32" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
            <path d="M344 180 L372 150 L400 180 Z" fill="var(--c-life)" stroke="var(--c-ink)" strokeWidth="2" />
            <rect x="366" y="192" width="12" height="18" fill="var(--c-water-line)" stroke="var(--c-ink)" strokeWidth="1.5" />
          </g>,
        )}

        {/* 나무: 경사면 높은 쪽 */}
        {modelGroup(
          'tree',
          <g>
            <rect x="474" y="110" width="9" height="51" fill="var(--c-trunk)" stroke="var(--c-ink)" strokeWidth="2" />
            <circle cx="478" cy="94" r="30" fill="var(--c-env)" stroke="var(--c-ink)" strokeWidth="2" />
            <circle cx="466" cy="86" r="6" fill="var(--c-env-wash)" />
          </g>,
        )}

        {/* 물: 모형 앞에 반투명으로 그려 잠긴 부분이 비쳐 보이게 */}
        <g className={animate ? 'tank-water tank-water-anim' : 'tank-water'} style={{ transform: `translateY(${surface}px)` }}>
          <rect x={BOX.x} y={0} width={BOX.w} height={VIEW_H} fill="var(--c-water)" fillOpacity="0.55" />
          <line x1={BOX.x} y1={0} x2={BOX.x + BOX.w} y2={0} stroke="var(--c-water-line)" strokeWidth="3" />
        </g>
      </g>

      {/* 바뀐 모형 옆 노랑 라벨 */}
      {stickers.map((s) => {
        const b = MODEL_BOX[s.model];
        const text = lab.simulation.changeSticker[s.state as 'partial' | 'full'];
        if (!text) return null;
        const w = text.length * 15 + 24;
        const x = Math.min(Math.max(b.cx - w / 2, BOX.x + 4), BOX.x + BOX.w - w - 4);
        const y = Math.max(b.top - 44, BOX.y + 6);
        return (
          <g key={s.model} className="tank-sticker" transform={`rotate(-3 ${x + w / 2} ${y + 15})`}>
            <rect x={x} y={y} width={w} height={30} rx="15" fill="var(--c-attn)" stroke="var(--c-ink)" strokeWidth="2" />
            <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--c-ink)">
              {text}
            </text>
          </g>
        );
      })}

      {/* 아크릴 상자 테두리와 반짝임 */}
      <rect
        x={BOX.x}
        y={BOX.y}
        width={BOX.w}
        height={BOX.h}
        rx="8"
        fill="none"
        stroke="var(--c-ink)"
        strokeWidth={dropActive ? 6 : 3}
      />
      <path d="M36 34 L60 34 M36 44 L48 44" stroke="var(--c-paper)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
