// 학생 기록 구조 (data.md 7장). localStorage와 내보내기 코드에 이 구조 그대로 들어간다.
import type { Area, ModelId, NoteSourceKey, StateId, TabId } from './data';

export const RECORD_VERSION = 1;

/** 학생 정보. 교사 시연 모드는 class가 'teacher' */
export interface Student {
  class: number | 'teacher';
  number: number;
  name: string;
}

export type LabStepId = 'predict' | 'experiment' | 'compare' | 'real' | 'summary';

export type RowRecord = Record<ModelId, StateId | null> & { observation: string };

/** 근거 노트 항목 */
export interface Note {
  id: string;
  source: NoteSourceKey;
  sourceRef: string;
  kind: 'experiment' | 'card' | 'local';
  area: Area | null;
  text: string;
  myNote: string;
  createdAt: string;
}

export interface StudentRecord {
  v: number;
  student: Student;
  updatedAt: string;
  lastExportedAt: string | null;
  ui: { tab: TabId; labStep: LabStepId };
  lab: {
    predict: { submitted: boolean; states: Record<ModelId, StateId | null>; reason: string };
    experiment: {
      cupsPoured: number;
      observedBefore: boolean;
      rows: Record<'1' | '2' | '3', RowRecord>;
      hintsShown: string[];
    };
    compare: {
      result: 'same' | 'different' | null;
      diff: string;
      classroom: { done: boolean; hasPhoto: boolean; memo: string };
    };
    real: { seen: string[] };
    summary: { s1: string; s2: string };
  };
  cards: {
    flipped: string[];
    myNotes: Record<string, string>;
    localText: string;
  };
  notes: Note[];
  /** 게임 요소: 고른 연구 동료, 이미 알려 준 배지, 이미 본 미션 브리핑 */
  game: {
    avatar: string | null;
    issuedAt: string | null;
    badgesSeen: string[];
    briefed: string[];
  };
  writing: {
    fields: { life: string; env: string; exp: string; extra: string };
    imports: Record<string, { start: number; end: number; noteId: string }[]>;
    lastCheck: string[] | null;
  };
}

/** 빈 기록 줄 */
function emptyRow(): RowRecord {
  return { island: null, house: null, tree: null, observation: '' };
}

/** 새 학생의 빈 기록 만들기 */
export function createEmptyRecord(student: Student, now = new Date().toISOString()): StudentRecord {
  return {
    v: RECORD_VERSION,
    student,
    updatedAt: now,
    lastExportedAt: null,
    ui: { tab: 'lab', labStep: 'predict' },
    lab: {
      predict: { submitted: false, states: { island: null, house: null, tree: null }, reason: '' },
      experiment: { cupsPoured: 0, observedBefore: false, rows: { '1': emptyRow(), '2': emptyRow(), '3': emptyRow() }, hintsShown: [] },
      compare: { result: null, diff: '', classroom: { done: false, hasPhoto: false, memo: '' } },
      real: { seen: [] },
      summary: { s1: '', s2: '' },
    },
    cards: { flipped: [], myNotes: {}, localText: '' },
    notes: [],
    game: { avatar: null, issuedAt: null, badgesSeen: [], briefed: [] },
    writing: { fields: { life: '', env: '', exp: '', extra: '' }, imports: {}, lastCheck: null },
  };
}
