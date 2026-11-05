// 디지털 수조 그림의 좌표 (design.md 5.2). viewBox 600×340 기준.
// 모형의 "물에 닿기 시작하는 높이(bottom)"와 "꼭대기(top)"로 잠김 상태를 계산하며,
// 이 계산 결과는 lab.json simulation.levels의 상태와 같아야 한다 (테스트로 확인).
import { lab, type ModelId, type StateId } from '../../../types/data';

export const VIEW_W = 600;
export const VIEW_H = 340;

/** 아크릴 상자 안쪽 */
export const BOX = { x: 20, y: 20, w: 560, h: 300, bottom: 320 };

/** 자갈 경사면: 바다 쪽 끝(왼쪽 아래)에서 육지 꼭대기(오른쪽 위)로 */
export const SLOPE = { x1: 180, y1: 300, x2: 520, y2: 140 };

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

/** 모형 위치: cx = 가운데 x, bottom = 물에 닿기 시작하는 y, top = 꼭대기 y */
export const MODEL_BOX: Record<ModelId, { cx: number; bottom: number; top: number; left: number; right: number }> = {
  // 섬: 바다에 쌓은 자갈 언덕. 처음 바다(L0) 위로 드러난 부분이 기준
  island: { cx: 112, bottom: 284, top: 200, left: 50, right: 175 },
  // 집: 경사면 중간. 바닥은 L1~L2 사이, 지붕은 L2~L3 사이
  house: { cx: 372, bottom: 210, top: 150, left: 346, right: 398 },
  // 나무: 경사면 높은 쪽. 밑동은 L2~L3 사이, 꼭대기는 L3보다 위
  tree: { cx: 478, bottom: 160, top: 64, left: 452, right: 504 },
};

/** 물 높이로 모형의 잠김 상태 계산 */
export function stateFromWater(model: ModelId, surfaceY: number): StateId {
  const b = MODEL_BOX[model];
  if (surfaceY >= b.bottom) return 'none';
  if (surfaceY <= b.top) return 'full';
  return 'partial';
}
