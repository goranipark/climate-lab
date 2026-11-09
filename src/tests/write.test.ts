// ⑦ 서술 연습 규칙 테스트: 완성 글, 자기 점검, 가져온 문장 구간
import { writing } from '../types/data';
import { createEmptyRecord, type StudentRecord } from '../types/record';
import { reducer, type Action } from '../store/reducer';
import { composeText, insertAt, selfCheck, updateImports, type Fields } from '../features/write/writeLogic';

const empty: Fields = { life: '', env: '', exp: '', extra: '' };
const run = (r: StudentRecord, ...a: Action[]) => a.reduce(reducer, r);

describe('완성 글', () => {
  it('칸을 문장 틀에 끼우고 끝 마침표는 하나만', () => {
    const t = composeText({ ...empty, life: ' 집을 잃어요. ', env: '갯벌이 줄어요', exp: '섬이 먼저 잠겼다!' });
    expect(t).toBe('기후변화로 해수면이 상승하면 집을 잃어요. 또 갯벌이 줄어요. 그 근거는 섬이 먼저 잠겼다.');
  });

  it('빈 칸은 문장째 빠지고, 더 써 보기는 맨 뒤에 붙는다', () => {
    expect(composeText({ ...empty, env: '갯벌이 줄어요', extra: '폭염이 길어져요' })).toBe('또 갯벌이 줄어요. 그리고 폭염이 길어져요.');
  });
});

describe('자기 점검', () => {
  it('공백 뺀 10자 기준으로 들어 있는지만 본다 (점수 없음)', () => {
    const c = selfCheck({ ...empty, life: '바닷가 사람들이 집을 잃어요', env: '짧다' }, {});
    expect(c.items.map((i) => i.ok)).toEqual([true, false, false]);
    expect(c.allOk).toBe(false);
    expect(Object.keys(c)).not.toContain('score');
  });

  it('가져온 문장이 그대로 남아 있으면 알린다', () => {
    expect(selfCheck(empty, { life: [{ start: 0, end: 3, noteId: 'n' }] }).unchanged).toBe(true);
    expect(selfCheck(empty, { life: [] }).unchanged).toBe(false);
  });

  it('자기 점검 항목은 json의 3개', () => {
    expect(writing.selfCheck.items).toHaveLength(3);
  });
});

describe('가져온 문장 구간', () => {
  it('넣은 자리에 구간이 생기고 앞 글과 띄어 쓴다', () => {
    const r = insertAt('사람들이', [], 4, '집을 잃어요', 'n1');
    expect(r.text).toBe('사람들이 집을 잃어요');
    expect(r.ranges).toEqual([{ start: 5, end: 11, noteId: 'n1' }]);
  });

  it('구간 안 글자를 고치면 그만큼 줄어든다', () => {
    const before = '집을 잃어요';
    const after = '집을 떠나요';
    expect(updateImports([{ start: 0, end: 6, noteId: 'n' }], before, after)).toEqual([
      { start: 0, end: 3, noteId: 'n' },
      { start: 5, end: 6, noteId: 'n' },
    ]);
  });

  it('구간 앞에 글을 쓰면 구간이 뒤로 밀린다', () => {
    expect(updateImports([{ start: 0, end: 3, noteId: 'n' }], 'abc', 'xyabc')).toEqual([{ start: 2, end: 5, noteId: 'n' }]);
  });

  it('구간을 모두 고쳐 쓰면 사라진다', () => {
    expect(updateImports([{ start: 0, end: 3, noteId: 'n' }], 'abc', '내 말로 썼다')).toEqual([]);
  });

  it('기록 동작으로도 같은 규칙이 적용된다', () => {
    let r = createEmptyRecord({ class: 3, number: 1, name: 'K' });
    r = run(r, { type: 'WRITE_INSERT_NOTE', fieldId: 'life', pos: 0, text: '집을 잃어요', noteId: 'n' });
    expect(r.writing.imports.life).toHaveLength(1);
    r = run(r, { type: 'WRITE_SET_FIELD', fieldId: 'life', text: '바닷가 사람들이 살 곳을 잃어요' });
    expect(r.writing.imports.life.every((x) => x.end > x.start)).toBe(true);
    expect(r.writing.fields.life).toBe('바닷가 사람들이 살 곳을 잃어요');
  });
});
