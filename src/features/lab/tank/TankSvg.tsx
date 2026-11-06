// 옆에서 본 디지털 수조 그림 (design.md 5.2). 11/6 결정으로 입체감(그라데이션·반사광·그림자)을 넣었다.
// 눈금·숫자는 그리지 않는다. 좌표는 geometry.ts와 같아서 잠김 상태 계산은 그대로다.
import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { lab, type ModelId, type StateId } from '../../../types/data';
import { fill } from '../../../lib/template';
import { BOX, groundY, MODEL_BOX, SLOPE, VIEW_H, VIEW_W, waterYAt } from './geometry';
import { modelLabel } from '../labLogic';

/** 자갈 알갱이 위치 (매번 같은 모양이 나오도록 고정된 값으로 만든다) */
const DOTS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 190; i++) {
    const x = BOX.x + 6 + rand() * (BOX.w - 12);
    const yTop = Math.min(groundY(x), 300) + 5;
    const y = yTop + rand() * (BOX.bottom - yTop - 3);
    if (y < BOX.bottom - 3) out.push([x, y, 1.8 + rand() * 2.6]);
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
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const surface = waterYAt(cups);
  const landPath = `M${BOX.x} ${SLOPE.y1} L${SLOPE.x1} ${SLOPE.y1} L${SLOPE.x2} ${SLOPE.y2} L${BOX.x + BOX.w} ${SLOPE.y2} L${BOX.x + BOX.w} ${BOX.bottom} L${BOX.x} ${BOX.bottom} Z`;

  // 모형을 감싸는 누를 수 있는 묶음
  const modelGroup = (mid: ModelId, children: ReactNode) => {
    const b = MODEL_BOX[mid];
    if (!onModel) return <g key={mid}>{children}</g>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onModel(mid);
      }
    };
    return (
      <g
        key={mid}
        className="tank-model"
        role="button"
        tabIndex={0}
        aria-label={fill(lab.ui.modelButton, { model: modelLabel(mid) })}
        onClick={() => onModel(mid)}
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
        <clipPath id={id('clip')}>
          <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx="8" />
        </clipPath>
        {/* 상자 안 공기: 위는 밝고 아래로 갈수록 살짝 푸르게 */}
        <linearGradient id={id('air')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfeff" />
          <stop offset="1" stopColor="#e2f0fa" />
        </linearGradient>
        {/* 자갈: 위는 햇빛을 받아 밝고 아래는 어둡게 */}
        <linearGradient id={id('land')} x1="0" y1="140" x2="0" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4e6bf" />
          <stop offset="0.55" stopColor="#dcc28a" />
          <stop offset="1" stopColor="#b79558" />
        </linearGradient>
        <radialGradient id={id('island')} cx="0.42" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#f7ebc8" />
          <stop offset="0.6" stopColor="#ddc38b" />
          <stop offset="1" stopColor="#b48f50" />
        </radialGradient>
        {/* 물: 수면은 밝은 하늘색, 깊어질수록 짙은 파랑 (물 묶음 안 좌표 기준) */}
        <linearGradient id={id('water')} x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8ccbff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#4da2ff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#1d5fbf" stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9e1ea" />
        </linearGradient>
        <linearGradient id={id('roof')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a52" />
          <stop offset="1" stopColor="#d63c00" />
        </linearGradient>
        <radialGradient id={id('leaf')} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#a8f5cf" />
          <stop offset="0.55" stopColor="#55db9c" />
          <stop offset="1" stopColor="#24995f" />
        </radialGradient>
        <linearGradient id={id('trunk')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b07a42" />
          <stop offset="1" stopColor="#6b431d" />
        </linearGradient>
        <linearGradient id={id('pad')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe0b6" />
          <stop offset="1" stopColor="#c6a466" />
        </linearGradient>
        {/* 모형 아래 부드러운 그림자 */}
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="2" dy="3" stdDeviation="2.2" floodColor="#1f2a44" floodOpacity="0.28" />
        </filter>
        <filter id={id('blur')} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* 책상 위 그림자 */}
      <ellipse cx={VIEW_W / 2} cy={BOX.bottom + 9} rx={BOX.w / 2 + 4} ry="7" fill="#1f2a44" opacity="0.22" filter={url('blur')} />

      {/* 아크릴 상자 안쪽 */}
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx="8" fill={url('air')} />

      <g clipPath={url('clip')}>
        {/* 자갈(육지) */}
        <path d={landPath} fill={url('land')} stroke="#5c4422" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 경사면 윗선의 밝은 띠 */}
        <path d={`M${SLOPE.x1} ${SLOPE.y1 - 1} L${SLOPE.x2} ${SLOPE.y2 - 1} L${BOX.x + BOX.w} ${SLOPE.y2 - 1}`} fill="none" stroke="#fff6dc" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        {DOTS.map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={i % 4 === 0 ? '#8f7140' : '#a98b55'} />
            <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.4} fill="#f3e3b8" opacity="0.7" />
          </g>
        ))}

        {/* 섬: 바다에 쌓은 자갈 언덕 */}
        {modelGroup(
          'island',
          <g filter={url('soft')}>
            <path d="M50 300 Q112 100 175 300 Z" fill={url('island')} stroke="#5c4422" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M84 236 Q100 200 122 196" fill="none" stroke="#fff6dc" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            <circle cx="96" cy="262" r="3" fill="#a98b55" />
            <circle cx="126" cy="244" r="3" fill="#a98b55" />
            <circle cx="140" cy="274" r="3.4" fill="#8f7140" />
            <circle cx="108" cy="226" r="2.4" fill="#a98b55" />
          </g>,
        )}

        {/* 집: 경사면 중간 */}
        {modelGroup(
          'house',
          <g filter={url('soft')} strokeLinejoin="round">
            <rect x="346" y="210" width="52" height="16" rx="2" fill={url('pad')} stroke="#5c4422" strokeWidth="1.5" />
            <rect x="352" y="178" width="40" height="32" fill={url('wall')} stroke="#37475e" strokeWidth="1.5" />
            <path d="M344 180 L372 150 L400 180 Z" fill={url('roof')} stroke="#7a2600" strokeWidth="1.5" />
            <path d="M350 177 L372 154" stroke="#ffc2a3" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <rect x="366" y="192" width="12" height="18" rx="1.5" fill="#1d6fd6" stroke="#0e3b78" strokeWidth="1.2" />
            <rect x="356" y="186" width="7" height="7" fill="#bfe0ff" stroke="#37475e" strokeWidth="1" />
          </g>,
        )}

        {/* 나무: 경사면 높은 쪽 */}
        {modelGroup(
          'tree',
          <g filter={url('soft')}>
            <rect x="474" y="110" width="9" height="51" rx="2" fill={url('trunk')} stroke="#4a2e12" strokeWidth="1.2" />
            <circle cx="478" cy="94" r="30" fill={url('leaf')} stroke="#1b7048" strokeWidth="1.5" />
            <circle cx="490" cy="104" r="14" fill="#2fae74" opacity="0.35" />
            <ellipse cx="466" cy="82" rx="9" ry="6" fill="#e6fff2" opacity="0.75" />
          </g>,
        )}

        {/* 물: 모형 앞에 반투명으로 그려 잠긴 부분이 비쳐 보이게 */}
        <g className={animate ? 'tank-water tank-water-anim' : 'tank-water'} style={{ transform: `translateY(${surface}px)` }}>
          <rect x={BOX.x} y={0} width={BOX.w} height={VIEW_H} fill={url('water')} />
          {/* 수면: 밝은 띠와 잔물결 반사 */}
          <rect x={BOX.x} y={0} width={BOX.w} height="7" fill="#d8eeff" opacity="0.55" />
          <line x1={BOX.x} y1={0} x2={BOX.x + BOX.w} y2={0} stroke="#1d6fd6" strokeWidth="2.5" />
          <g fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.65">
            <path d="M70 16 q12 -5 24 0" />
            <path d="M230 24 q14 -5 28 0" />
            <path d="M420 14 q12 -5 24 0" />
          </g>
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
          <g key={s.model} className="tank-sticker" transform={`rotate(-3 ${x + w / 2} ${y + 15})`} filter={url('soft')}>
            <rect x={x} y={y} width={w} height={30} rx="15" fill="var(--c-attn)" stroke="var(--c-ink)" strokeWidth="2" />
            <text x={x + w / 2} y={y + 20} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--c-ink)">
              {text}
            </text>
          </g>
        );
      })}

      {/* 아크릴 상자: 두께감 있는 테두리 + 유리 반사광 */}
      <rect x={BOX.x - 3} y={BOX.y - 3} width={BOX.w + 6} height={BOX.h + 6} rx="11" fill="none" stroke="#cfe6f6" strokeWidth="6" opacity="0.8" />
      <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx="8" fill="none" stroke={dropActive ? 'var(--c-ink)' : '#1f2a44'} strokeWidth={dropActive ? 6 : 2.5} />
      <g fill="#ffffff" opacity="0.55" pointerEvents="none">
        <path d={`M${BOX.x + 10} ${BOX.y + 8} L${BOX.x + 26} ${BOX.y + 8} L${BOX.x + 12} ${BOX.bottom - 10} L${BOX.x + 6} ${BOX.bottom - 10} Z`} />
        <path d={`M${BOX.x + 34} ${BOX.y + 8} L${BOX.x + 40} ${BOX.y + 8} L${BOX.x + 22} ${BOX.bottom - 10} L${BOX.x + 18} ${BOX.bottom - 10} Z`} opacity="0.6" />
        <rect x={BOX.x + 60} y={BOX.y + 4} width={BOX.w - 120} height="5" rx="2.5" opacity="0.7" />
      </g>
    </svg>
  );
}
