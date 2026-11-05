// ③ 해수면 실험실 기록 동작 (담당: Opus)
import type { ModelId, StateId } from '../../types/data';
import type { RowRecord, StudentRecord } from '../../types/record';

type Lab = StudentRecord['lab'];
type CupKey = '1' | '2' | '3';

export type LabAction =
  | { type: 'LAB_PREDICT_SET_STATE'; model: ModelId; state: StateId }
  | { type: 'LAB_PREDICT_SET_REASON'; text: string }
  | { type: 'LAB_PREDICT_SUBMIT' }
  | { type: 'LAB_OBSERVE_BEFORE' }
  | { type: 'LAB_POUR' }
  | { type: 'LAB_RESET_WATER' }
  | { type: 'LAB_SET_ROW_STATE'; cup: CupKey; model: ModelId; state: StateId }
  | { type: 'LAB_SET_ROW_OBSERVATION'; cup: CupKey; text: string }
  | { type: 'LAB_HINT_SHOWN'; key: string }
  | { type: 'LAB_COMPARE_RESULT'; result: 'same' | 'different' }
  | { type: 'LAB_COMPARE_DIFF'; text: string }
  | { type: 'LAB_CLASSROOM'; patch: Partial<Lab['compare']['classroom']> }
  | { type: 'LAB_REAL_SEEN'; sceneId: string }
  | { type: 'LAB_SUMMARY_SET'; id: 's1' | 's2'; text: string };

/** lab 부분만 바꾸고 바뀐 시각을 남긴다 */
function withLab(state: StudentRecord, lab: Lab): StudentRecord {
  return { ...state, updatedAt: new Date().toISOString(), lab };
}

/** 기록 줄 하나 바꾸기 */
function withRow(state: StudentRecord, cup: CupKey, patch: Partial<RowRecord>): StudentRecord {
  const ex = state.lab.experiment;
  return withLab(state, { ...state.lab, experiment: { ...ex, rows: { ...ex.rows, [cup]: { ...ex.rows[cup], ...patch } } } });
}

export function labReducer(state: StudentRecord, action: LabAction): StudentRecord {
  const lab = state.lab;
  switch (action.type) {
    case 'LAB_PREDICT_SET_STATE':
      // 제출한 예측은 고칠 수 없다
      if (lab.predict.submitted) return state;
      return withLab(state, { ...lab, predict: { ...lab.predict, states: { ...lab.predict.states, [action.model]: action.state } } });

    case 'LAB_PREDICT_SET_REASON':
      if (lab.predict.submitted) return state;
      return withLab(state, { ...lab, predict: { ...lab.predict, reason: action.text } });

    case 'LAB_PREDICT_SUBMIT':
      return withLab(state, { ...lab, predict: { ...lab.predict, submitted: true } });

    case 'LAB_OBSERVE_BEFORE':
      if (lab.experiment.observedBefore) return state;
      return withLab(state, { ...lab, experiment: { ...lab.experiment, observedBefore: true } });

    case 'LAB_POUR':
      // 컵은 3잔까지. 부어도 되는지는 화면(canPour)에서 먼저 확인한다
      if (lab.experiment.cupsPoured >= 3) return state;
      return withLab(state, { ...lab, experiment: { ...lab.experiment, cupsPoured: lab.experiment.cupsPoured + 1 } });

    case 'LAB_RESET_WATER':
      // 물만 비운다. 기록은 그대로 둔다
      return withLab(state, { ...lab, experiment: { ...lab.experiment, cupsPoured: 0 } });

    case 'LAB_SET_ROW_STATE':
      return withRow(state, action.cup, { [action.model]: action.state } as Partial<RowRecord>);

    case 'LAB_SET_ROW_OBSERVATION':
      return withRow(state, action.cup, { observation: action.text });

    case 'LAB_HINT_SHOWN':
      if (lab.experiment.hintsShown.includes(action.key)) return state;
      return withLab(state, { ...lab, experiment: { ...lab.experiment, hintsShown: [...lab.experiment.hintsShown, action.key] } });

    case 'LAB_COMPARE_RESULT':
      return withLab(state, { ...lab, compare: { ...lab.compare, result: action.result } });

    case 'LAB_COMPARE_DIFF':
      return withLab(state, { ...lab, compare: { ...lab.compare, diff: action.text } });

    case 'LAB_CLASSROOM':
      return withLab(state, { ...lab, compare: { ...lab.compare, classroom: { ...lab.compare.classroom, ...action.patch } } });

    case 'LAB_REAL_SEEN':
      if (lab.real.seen.includes(action.sceneId)) return state;
      return withLab(state, { ...lab, real: { seen: [...lab.real.seen, action.sceneId] } });

    case 'LAB_SUMMARY_SET':
      return withLab(state, { ...lab, summary: { ...lab.summary, [action.id]: action.text } });

    default:
      return state;
  }
}
