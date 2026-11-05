// ③ 해수면 실험실 기록 동작 (담당: 실험실 화면 구현 담당). M2에서 채운다.
import type { StudentRecord } from '../../types/record';

export type LabAction = { type: 'LAB_RESET_WATER' };

export function labReducer(state: StudentRecord, action: LabAction): StudentRecord {
  switch (action.type) {
    case 'LAB_RESET_WATER':
      // 물만 비운다. 기록은 그대로 둔다
      return { ...state, lab: { ...state.lab, experiment: { ...state.lab.experiment, cupsPoured: 0 } } };
    default:
      return state;
  }
}
