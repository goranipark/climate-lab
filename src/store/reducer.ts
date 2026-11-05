// 학생 기록을 바꾸는 동작 모음. 기록은 이 reducer로만 바꾼다.
// 공용 동작(노트·탭·내보내기)은 여기, 화면별 동작은 slices/ 파일로 나눠 담당끼리 같은 파일을 고치지 않게 한다.
import type { TabId } from '../types/data';
import type { LabStepId, Note, StudentRecord } from '../types/record';
import { cardsReducer, type CardsAction } from './slices/cards';
import { labReducer, type LabAction } from './slices/lab';
import { writeReducer, type WriteAction } from './slices/write';

/** 노트 id는 출처+출처 위치로 정해서, 같은 곳에서 다시 담으면 덮어쓰게 한다 */
export function noteId(source: Note['source'], sourceRef: string): string {
  return `n_${source}_${sourceRef}`;
}

export type NoteInput = Omit<Note, 'id' | 'createdAt'>;

export type CoreAction =
  | { type: 'REPLACE'; record: StudentRecord }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_LAB_STEP'; step: LabStepId }
  | { type: 'UPSERT_NOTE'; note: NoteInput; now?: string }
  | { type: 'REMOVE_NOTE'; id: string }
  | { type: 'MARK_EXPORTED'; now?: string };

export type Action = CoreAction | LabAction | CardsAction | WriteAction;

/** 내용이 바뀐 시각을 기록한다 (화면 위치 같은 ui 변화는 제외) */
function touch(r: StudentRecord, now = new Date().toISOString()): StudentRecord {
  return { ...r, updatedAt: now };
}

export function reducer(state: StudentRecord, action: Action): StudentRecord {
  // 화면별 동작은 이름 앞머리로 나눠 보낸다
  if (action.type.startsWith('LAB_')) return labReducer(state, action as LabAction);
  if (action.type.startsWith('CARDS_')) return cardsReducer(state, action as CardsAction);
  if (action.type.startsWith('WRITE_')) return writeReducer(state, action as WriteAction);
  return coreReducer(state, action as CoreAction);
}

function coreReducer(state: StudentRecord, action: CoreAction): StudentRecord {
  switch (action.type) {
    case 'REPLACE':
      return action.record;

    case 'SET_TAB':
      return { ...state, ui: { ...state.ui, tab: action.tab } };

    case 'SET_LAB_STEP':
      return { ...state, ui: { ...state.ui, labStep: action.step } };

    case 'UPSERT_NOTE': {
      const now = action.now ?? new Date().toISOString();
      const id = noteId(action.note.source, action.note.sourceRef);
      const note: Note = { ...action.note, id, createdAt: now };
      // 같은 id가 있으면 빼고 맨 앞(최신)에 다시 넣는다
      const rest = state.notes.filter((n) => n.id !== id);
      return touch({ ...state, notes: [note, ...rest] }, now);
    }

    case 'REMOVE_NOTE':
      return touch({ ...state, notes: state.notes.filter((n) => n.id !== action.id) });

    case 'MARK_EXPORTED': {
      const now = action.now ?? new Date().toISOString();
      return { ...state, lastExportedAt: now, updatedAt: state.updatedAt > now ? state.updatedAt : now };
    }

    default:
      return state;
  }
}
