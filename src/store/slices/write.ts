// ⑦ 서술 연습 기록 동작 (담당: Opus): 칸 글, 가져온 문장 구간, 마지막 점검
import type { StudentRecord } from '../../types/record';
import { insertAt, updateImports, type FieldId } from '../../features/write/writeLogic';

export type WriteAction =
  | { type: 'WRITE_SET_FIELD'; fieldId: FieldId; text: string }
  | { type: 'WRITE_INSERT_NOTE'; fieldId: FieldId; pos: number; text: string; noteId: string }
  | { type: 'WRITE_CHECKED'; missing: string[] };

/** writing 부분만 바꾸고 바뀐 시각을 남긴다 */
function withWriting(state: StudentRecord, writing: StudentRecord['writing']): StudentRecord {
  return { ...state, updatedAt: new Date().toISOString(), writing };
}

export function writeReducer(state: StudentRecord, action: WriteAction): StudentRecord {
  const w = state.writing;
  switch (action.type) {
    case 'WRITE_SET_FIELD': {
      // 글을 고치면 가져온 문장 구간도 따라 줄어들거나 밀린다
      const before = w.fields[action.fieldId];
      const ranges = updateImports(w.imports[action.fieldId] ?? [], before, action.text);
      return withWriting(state, { ...w, fields: { ...w.fields, [action.fieldId]: action.text }, imports: { ...w.imports, [action.fieldId]: ranges } });
    }
    case 'WRITE_INSERT_NOTE': {
      const r = insertAt(w.fields[action.fieldId], w.imports[action.fieldId] ?? [], action.pos, action.text, action.noteId);
      return withWriting(state, { ...w, fields: { ...w.fields, [action.fieldId]: r.text }, imports: { ...w.imports, [action.fieldId]: r.ranges } });
    }
    case 'WRITE_CHECKED':
      return { ...state, writing: { ...w, lastCheck: action.missing } };
    default:
      return state;
  }
}
