// ③ 해수면 실험실의 규칙: 단계 잠금, 기록 줄 완성, 컵을 부어도 되는지, 안내 문구 고르기
import { lab, type ModelId, type StateId } from '../../types/data';
import type { LabStepId, RowRecord, StudentRecord } from '../../types/record';
import { isTeacher } from '../../store/selectors';
import { fill } from '../../lib/template';

export const MODELS: ModelId[] = lab.models.map((m) => m.id);
export const STEP_IDS: LabStepId[] = lab.steps.map((s) => s.id);

/** 모형 이름 */
export function modelLabel(id: ModelId): string {
  return lab.models.find((m) => m.id === id)?.label ?? id;
}

/** 상태 이름 */
export function stateLabel(id: StateId): string {
  return lab.states.find((s) => s.id === id)?.label ?? id;
}

/** 컵 n잔일 때 디지털 수조의 실제 상태 */
export function truthAt(cups: number): Record<ModelId, StateId> {
  return lab.simulation.levels[Math.max(0, Math.min(3, cups))].states;
}

/** 기록 줄이 다 채워졌는지: 모형 3개 상태 + 이때 본 것 */
export function isRowComplete(row: RowRecord): boolean {
  return MODELS.every((m) => row[m] !== null) && row.observation.trim().length > 0;
}

/** 세 줄이 모두 채워졌는지 */
export function allRowsComplete(r: StudentRecord): boolean {
  return (['1', '2', '3'] as const).every((k) => isRowComplete(r.lab.experiment.rows[k]));
}

/** 단계가 열렸는지 (concept.md 5.1 표) */
export function isStepUnlocked(r: StudentRecord, step: LabStepId): boolean {
  if (isTeacher(r)) return true;
  switch (step) {
    case 'predict':
      return true;
    case 'experiment':
      return r.lab.predict.submitted;
    case 'compare':
      return r.lab.predict.submitted && allRowsComplete(r);
    case 'real':
      return isStepUnlocked(r, 'compare') && r.lab.compare.result !== null;
    case 'summary':
      return isStepUnlocked(r, 'real') && lab.real.scenes.every((s) => r.lab.real.seen.includes(s.id));
  }
}

/** 지금 컵을 부을 수 있는지: 붓기 전 관찰을 했고, 지금 잔의 기록이 채워져 있어야 한다 */
export function canPour(r: StudentRecord): boolean {
  const ex = r.lab.experiment;
  if (ex.cupsPoured >= 3) return false;
  if (isTeacher(r)) return true;
  if (!ex.observedBefore) return false;
  if (ex.cupsPoured === 0) return true;
  return isRowComplete(ex.rows[String(ex.cupsPoured) as '1' | '2' | '3']);
}

/** 컵이 잠긴 이유가 "기록을 먼저 채워야 해서"인지 */
export function pourBlockedByRecord(r: StudentRecord): boolean {
  const ex = r.lab.experiment;
  return ex.observedBefore && ex.cupsPoured > 0 && ex.cupsPoured < 3 && !canPour(r);
}

/** 실험대 위 안내 줄 문구 */
export function experimentGuide(r: StudentRecord): string {
  const ex = r.lab.experiment;
  const g = lab.experiment.guide;
  if (!ex.observedBefore && !isTeacher(r)) return g.observeBefore;
  if (ex.cupsPoured === 0) return g.pour;
  const row = ex.rows[String(ex.cupsPoured) as '1' | '2' | '3'];
  if (!isRowComplete(row)) {
    const started = MODELS.some((m) => row[m] !== null);
    return started ? fill(g.record, { cup: ex.cupsPoured }) : g.observe;
  }
  if (ex.cupsPoured >= 3) return allRowsComplete(r) ? g.done : g.observe;
  return g.pour;
}

/** 기록이 디지털 수조와 다른 모형 목록 (정답을 알려 주지 않고 "다시 살펴볼까요?"만 띄우는 데 쓴다) */
export function mismatchedModels(row: RowRecord, cup: number): ModelId[] {
  const truth = truthAt(cup);
  return MODELS.filter((m) => row[m] !== null && row[m] !== truth[m]);
}

/** 컵 수가 바뀔 때 상태가 바뀐 모형들 */
export function changedModels(fromCups: number, toCups: number): { model: ModelId; state: StateId }[] {
  const a = truthAt(fromCups);
  const b = truthAt(toCups);
  return MODELS.filter((m) => a[m] !== b[m]).map((m) => ({ model: m, state: b[m] }));
}
