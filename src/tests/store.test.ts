// 저장·내보내기·잠금·노트 규칙 테스트 (todo.md M1)
import { createEmptyRecord, type Student } from '../types/record';
import { deleteRecord, loadRecord, saveRecord, studentKey } from '../store/storage';
import { decodeRecord, encodeRecord } from '../store/exportCode';
import { reducer, type NoteInput } from '../store/reducer';
import { collectedCardCounts, hasUnexported, isWriteUnlocked } from '../store/selectors';

const s23: Student = { class: 2, number: 3, name: 'A' };
const s33: Student = { class: 3, number: 3, name: 'B' };
const teacher: Student = { class: 'teacher', number: 0, name: 'T' };

const cardNote = (ref: string, area: 'life' | 'env'): NoteInput => ({
  source: 'card', sourceRef: ref, kind: 'card', area, text: ref, myNote: '',
});

describe('저장 키', () => {
  it('반이 다르면 같은 번호라도 키와 기록이 섞이지 않는다', () => {
    expect(studentKey(s23)).not.toBe(studentKey(s33));
    const a = reducer(createEmptyRecord(s23), { type: 'UPSERT_NOTE', note: cardNote('heat-cold', 'life') });
    saveRecord(a);
    saveRecord(createEmptyRecord(s33));
    expect(loadRecord(s23)?.notes).toHaveLength(1);
    expect(loadRecord(s33)?.notes).toHaveLength(0);
  });

  it('교사 시연 모드는 따로 저장된다', () => {
    expect(studentKey(teacher)).toMatch(/teacher$/);
  });

  it('지우기는 그 학생 기록만 지운다', () => {
    saveRecord(createEmptyRecord(s23));
    saveRecord(createEmptyRecord(s33));
    deleteRecord(s23);
    expect(loadRecord(s23)).toBeNull();
    expect(loadRecord(s33)).not.toBeNull();
  });
});

describe('내보내기 코드', () => {
  it('내보내고 불러오면 같은 기록이 된다', () => {
    let r = createEmptyRecord(s23);
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('glacier', 'env') });
    const code = encodeRecord(r);
    expect(code.startsWith('CL1-')).toBe(true);
    expect(decodeRecord(code)).toEqual(r);
  });

  it('붙여 넣을 때 섞인 공백·줄바꿈은 무시한다', () => {
    const r = createEmptyRecord(s23);
    const code = encodeRecord(r);
    const messy = `  ${code.slice(0, 10)}\n${code.slice(10)}  `;
    expect(decodeRecord(messy)).toEqual(r);
  });

  it('잘못된 코드는 null', () => {
    expect(decodeRecord('hello')).toBeNull();
    expect(decodeRecord('CL1-@@@')).toBeNull();
    expect(decodeRecord('')).toBeNull();
  });
});

describe('근거 노트', () => {
  it('같은 출처에서 다시 담으면 쌓이지 않고 덮어쓴다', () => {
    let r = createEmptyRecord(s23);
    r = reducer(r, { type: 'UPSERT_NOTE', note: { ...cardNote('flood', 'life'), text: 'v1' } });
    r = reducer(r, { type: 'UPSERT_NOTE', note: { ...cardNote('flood', 'life'), text: 'v2' } });
    expect(r.notes).toHaveLength(1);
    expect(r.notes[0].text).toBe('v2');
  });

  it('새로 담은 항목이 맨 위에 온다', () => {
    let r = createEmptyRecord(s23);
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('flood', 'life') });
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('bee', 'env') });
    expect(r.notes[0].sourceRef).toBe('bee');
  });
});

describe('⑦ 잠금 조건', () => {
  it('생활 1 + 환경 1 카드를 담으면 열린다', () => {
    let r = createEmptyRecord(s23);
    expect(isWriteUnlocked(r)).toBe(false);
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('flood', 'life') });
    expect(isWriteUnlocked(r)).toBe(false);
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('bee', 'env') });
    expect(isWriteUnlocked(r)).toBe(true);
  });

  it('태백 카드와 실험 정리 문장은 카드 수에 넣지 않는다', () => {
    let r = createEmptyRecord(s23);
    r = reducer(r, { type: 'UPSERT_NOTE', note: { source: 'local', sourceRef: 'local-taebaek', kind: 'local', area: 'local', text: 'x', myNote: '' } });
    r = reducer(r, { type: 'UPSERT_NOTE', note: { source: 'lab-summary', sourceRef: 's1', kind: 'experiment', area: 'life', text: 'x', myNote: '' } });
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('bee', 'env') });
    expect(collectedCardCounts(r)).toEqual({ life: 0, env: 1 });
    expect(isWriteUnlocked(r)).toBe(false);
  });

  it('카드를 빼면 다시 잠긴다', () => {
    let r = createEmptyRecord(s23);
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('flood', 'life') });
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('bee', 'env') });
    r = reducer(r, { type: 'REMOVE_NOTE', id: 'n_card_bee' });
    expect(isWriteUnlocked(r)).toBe(false);
  });

  it('교사 시연 모드는 처음부터 열려 있다', () => {
    expect(isWriteUnlocked(createEmptyRecord(teacher))).toBe(true);
  });
});

describe('미저장 표시', () => {
  it('내보낸 뒤 바뀐 내용이 있을 때만 표시', () => {
    let r = createEmptyRecord(s23, '2026-11-16T00:00:00.000Z');
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('flood', 'life'), now: '2026-11-16T01:00:00.000Z' });
    expect(hasUnexported(r)).toBe(true);
    r = reducer(r, { type: 'MARK_EXPORTED', now: '2026-11-16T02:00:00.000Z' });
    expect(hasUnexported(r)).toBe(false);
    r = reducer(r, { type: 'UPSERT_NOTE', note: cardNote('bee', 'env'), now: '2026-11-16T03:00:00.000Z' });
    expect(hasUnexported(r)).toBe(true);
  });
});
