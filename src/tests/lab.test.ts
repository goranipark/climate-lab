// ③ 해수면 실험실 규칙 테스트 (todo.md M2)
import { lab } from '../types/data';
import { createEmptyRecord, type Student, type StudentRecord } from '../types/record';
import { reducer, type Action } from '../store/reducer';
import { MODEL_BOX, stateFromWater, waterY } from '../features/lab/tank/geometry';
import { canPour, changedModels, isStepUnlocked, mismatchedModels, MODELS, pourBlockedByRecord } from '../features/lab/labLogic';

const kid: Student = { class: 3, number: 12, name: 'K' };
const run = (r: StudentRecord, ...actions: Action[]) => actions.reduce(reducer, r);

/** 한 잔의 기록을 수조와 같게 채운다 */
function fillRow(r: StudentRecord, cup: '1' | '2' | '3'): StudentRecord {
  const truth = lab.simulation.levels[Number(cup)].states;
  return run(
    r,
    ...MODELS.map((m) => ({ type: 'LAB_SET_ROW_STATE', cup, model: m, state: truth[m] }) as Action),
    { type: 'LAB_SET_ROW_OBSERVATION', cup, text: 'x' },
  );
}

describe('수조 그림과 데이터', () => {
  it('모형 배치로 계산한 잠김 상태가 lab.json의 단계별 상태와 같다', () => {
    lab.simulation.levels.forEach((lv) => {
      for (const m of MODELS) expect(stateFromWater(m, waterY(lv.cup))).toBe(lv.states[m]);
    });
  });

  it('물은 컵을 부을수록 높아진다', () => {
    for (let c = 1; c <= 3; c++) expect(waterY(c)).toBeLessThan(waterY(c - 1));
  });

  it('모형은 섬 → 집 → 나무 순서로 높은 곳에 있다', () => {
    expect(MODEL_BOX.island.top).toBeGreaterThan(MODEL_BOX.house.top);
    expect(MODEL_BOX.house.top).toBeGreaterThan(MODEL_BOX.tree.top);
  });
});

describe('단계 잠금', () => {
  it('예측을 제출하기 전에는 디지털 실험이 잠겨 있다', () => {
    let r = createEmptyRecord(kid);
    expect(isStepUnlocked(r, 'experiment')).toBe(false);
    r = run(r, { type: 'LAB_PREDICT_SUBMIT' });
    expect(isStepUnlocked(r, 'experiment')).toBe(true);
  });

  it('제출한 예측은 고칠 수 없다', () => {
    let r = run(createEmptyRecord(kid), { type: 'LAB_PREDICT_SET_STATE', model: 'island', state: 'partial' }, { type: 'LAB_PREDICT_SUBMIT' });
    r = run(r, { type: 'LAB_PREDICT_SET_STATE', model: 'island', state: 'full' });
    expect(r.lab.predict.states.island).toBe('partial');
  });

  it('세 줄을 다 기록해야 결과 비교가, 답해야 실제 그림이, 3장을 다 봐야 정리가 열린다', () => {
    let r = run(createEmptyRecord(kid), { type: 'LAB_PREDICT_SUBMIT' });
    r = fillRow(fillRow(r, '1'), '2');
    expect(isStepUnlocked(r, 'compare')).toBe(false);
    r = fillRow(r, '3');
    expect(isStepUnlocked(r, 'compare')).toBe(true);
    expect(isStepUnlocked(r, 'real')).toBe(false);
    r = run(r, { type: 'LAB_COMPARE_RESULT', result: 'same' });
    expect(isStepUnlocked(r, 'real')).toBe(true);
    r = run(r, { type: 'LAB_REAL_SEEN', sceneId: 'tuvalu' }, { type: 'LAB_REAL_SEEN', sceneId: 'maldives' });
    expect(isStepUnlocked(r, 'summary')).toBe(false);
    r = run(r, { type: 'LAB_REAL_SEEN', sceneId: 'tidal-flat' });
    expect(isStepUnlocked(r, 'summary')).toBe(true);
  });

  it('교사 시연 모드는 모든 단계가 열려 있다', () => {
    const r = createEmptyRecord({ class: 'teacher', number: 0, name: 'T' });
    expect(isStepUnlocked(r, 'summary')).toBe(true);
    expect(canPour(r)).toBe(true);
  });
});

describe('컵 붓기', () => {
  it('붓기 전에 가까이 보기를 해야 컵이 열린다', () => {
    let r = run(createEmptyRecord(kid), { type: 'LAB_PREDICT_SUBMIT' });
    expect(canPour(r)).toBe(false);
    r = run(r, { type: 'LAB_OBSERVE_BEFORE' });
    expect(canPour(r)).toBe(true);
  });

  it('이번 잔 기록을 채우기 전에는 다음 컵을 부을 수 없다', () => {
    let r = run(createEmptyRecord(kid), { type: 'LAB_PREDICT_SUBMIT' }, { type: 'LAB_OBSERVE_BEFORE' }, { type: 'LAB_POUR' });
    expect(canPour(r)).toBe(false);
    expect(pourBlockedByRecord(r)).toBe(true);
    r = fillRow(r, '1');
    expect(canPour(r)).toBe(true);
  });

  it('3잔까지만 부을 수 있다', () => {
    let r = run(createEmptyRecord(kid), { type: 'LAB_OBSERVE_BEFORE' });
    for (const c of ['1', '2', '3'] as const) r = fillRow(run(r, { type: 'LAB_POUR' }), c);
    r = run(r, { type: 'LAB_POUR' });
    expect(r.lab.experiment.cupsPoured).toBe(3);
    expect(canPour(r)).toBe(false);
  });

  it('물을 비워도 기록은 남고, 이미 기록한 잔은 다시 부을 수 있다', () => {
    let r = run(createEmptyRecord(kid), { type: 'LAB_OBSERVE_BEFORE' }, { type: 'LAB_POUR' });
    r = fillRow(r, '1');
    r = run(r, { type: 'LAB_POUR' }, { type: 'LAB_RESET_WATER' });
    expect(r.lab.experiment.cupsPoured).toBe(0);
    expect(r.lab.experiment.rows['1'].observation).toBe('x');
    r = run(r, { type: 'LAB_POUR' });
    expect(canPour(r)).toBe(true);
  });

  it('컵 2잔을 부으면 섬은 모두, 집은 일부 잠긴 것으로 바뀐다', () => {
    expect(changedModels(1, 2)).toEqual([
      { model: 'island', state: 'full' },
      { model: 'house', state: 'partial' },
    ]);
  });
});

describe('관찰 확인', () => {
  it('수조와 다르게 고른 모형만 알려 준다 (정답은 알려 주지 않음)', () => {
    let r = createEmptyRecord(kid);
    r = run(r, { type: 'LAB_SET_ROW_STATE', cup: '1', model: 'island', state: 'partial' }, { type: 'LAB_SET_ROW_STATE', cup: '1', model: 'house', state: 'partial' });
    expect(mismatchedModels(r.lab.experiment.rows['1'], 1)).toEqual(['house']);
  });
});
