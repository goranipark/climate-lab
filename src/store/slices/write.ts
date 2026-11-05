// ⑦ 서술 연습 기록 동작 (담당: 서술 연습 화면 구현 담당). M5에서 채운다.
import type { StudentRecord } from '../../types/record';

export type WriteAction = { type: 'WRITE_SET_FIELD'; fieldId: 'life' | 'env' | 'exp' | 'extra'; text: string };

export function writeReducer(state: StudentRecord, action: WriteAction): StudentRecord {
  switch (action.type) {
    case 'WRITE_SET_FIELD':
      return {
        ...state,
        updatedAt: new Date().toISOString(),
        writing: { ...state.writing, fields: { ...state.writing.fields, [action.fieldId]: action.text } },
      };
    default:
      return state;
  }
}
