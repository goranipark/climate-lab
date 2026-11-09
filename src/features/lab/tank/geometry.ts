// 디지털 수조 그림의 좌표 (design.md 5.2). viewBox 600×340 기준.
// 모형의 "물에 닿기 시작하는 높이(bottom)"와 "꼭대기(top)"로 잠김 상태를 계산하며,
// 이 계산 결과는 lab.json simulation.levels의 상태와 같아야 한다 (테스트로 확인).
import { lab, type ModelId, type StateId } from '../../../types/data';

export const VIEW_W = 600;
export const VIEW_H = 340;

/** 아크릴 상자 안쪽 */
export const BOX = { x: 20, y: 20, w: 560, h: 300, bottom: 320 };

/**
 * 3D 수조 그림(public/images/lab/tank.webp) 놓는 자리.
 * 원본 1536×1024에서 상자 안쪽이 x 42~1494, y 165~892이므로, 이 부분이 BOX에 겹치도록 늘려 놓는다.
 */
const ART_SRC = { w: 1536, h: 1024, x0: 42, x1: 1494, y0: 165, y1: 892 };
const ART_SX = BOX.w / (ART_SRC.x1 - ART_SRC.x0);
const ART_SY = BOX.h / (ART_SRC.y1 - ART_SRC.y0);
export const ART_RECT = {
  x: BOX.x - ART_SRC.x0 * ART_SX,
  y: BOX.y - ART_SRC.y0 * ART_SY,
  w: ART_SRC.w * ART_SX,
  h: ART_SRC.h * ART_SY,
};

/** 자갈 경사면: 바다 쪽 끝(왼쪽 아래)에서 육지 꼭대기(오른쪽 위)로 (3D 그림에서 잰 값) */
export const SLOPE = { x1: 192, y1: 286, x2: 482, y2: 149 };

/** 경사면 위 x에서의 땅 높이(y) */
export function groundY(x: number): number {
  if (x <= SLOPE.x1) return SLOPE.y1;
  if (x >= SLOPE.x2) return SLOPE.y2;
  return SLOPE.y1 + ((x - SLOPE.x1) * (SLOPE.y2 - SLOPE.y1)) / (SLOPE.x2 - SLOPE.x1);
}

/** 컵 n잔일 때 물 표면 y */
export function waterY(cups: number): number {
  const level = lab.simulation.levels[Math.max(0, Math.min(3, Math.round(cups)))];
  return BOX.bottom - level.water * BOX.h;
}

/** 소수 잔 수(움직임 중간)에서의 물 표면 y */
export function waterYAt(cups: number): number {
  const lo = Math.floor(cups);
  const hi = Math.min(3, lo + 1);
  const t = cups - lo;
  return waterY(lo) + (waterY(hi) - waterY(lo)) * t;
}

/**
 * 모형 위치: cx = 가운데 x, bottom = 물에 닿기 시작하는 y, top = 꼭대기 y.
 * 3D 수조 그림에서 잰 값(11/9). 수위(lab.json levels)는 L0 0.10 → y290, L1 0.27 → y239, L2 0.44 → y188, L3 0.61 → y137.
 */
export const MODEL_BOX: Record<ModelId, { cx: number; bottom: number; top: number; left: number; right: number }> = {
  // 섬: 바다에 쌓은 자갈 언덕. 처음 바다(L0)에 닿는 높이가 기준, 꼭대기는 L1~L2 사이
  island: { cx: 105, bottom: 284, top: 193, left: 21, right: 189 },
  // 집: 경사면 중간. 받침 바닥은 L1~L2 사이, 지붕은 L2~L3 사이
  house: { cx: 351, bottom: 236, top: 150, left: 311, right: 391 },
  // 나무: 경사면 높은 쪽. 밑동은 L2~L3 사이, 꼭대기는 L3보다 위
  tree: { cx: 469, bottom: 164, top: 55, left: 424, right: 514 },
};

/** 물 높이로 모형의 잠김 상태 계산 */
export function stateFromWater(model: ModelId, surfaceY: number): StateId {
  const b = MODEL_BOX[model];
  if (surfaceY >= b.bottom) return 'none';
  if (surfaceY <= b.top) return 'full';
  return 'partial';
}
