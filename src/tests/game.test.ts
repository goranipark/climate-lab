// 게임 요소 테스트: 배지 조건, 알림 기록, 연구원증 발급
import { game } from '../types/data';
import { createEmptyRecord, type StudentRecord } from '../types/record';
import { reducer, type Action } from '../store/reducer';
import { badgesWithoutRule, earnedBadges, isPuzzleComplete, newBadges, unplacedBadges } from '../features/game/badges';

const run = (r: StudentRecord, ...a: Action[]) => a.reduce(reducer, r);
const kid = () => createEmptyRecord({ class: 3, number: 12, name: 'K' });

describe('탐사 배지', () => {
  it('game.json의 모든 배지에 조건이 있다', () => {
    expect(badgesWithoutRule()).toEqual([]);
  });

  it('처음에는 배지가 없다', () => {
    expect(earnedBadges(kid())).toEqual([]);
  });

  it('예측 제출, 붓기 전 관찰, 첫 붓기에 배지를 준다', () => {
    const r = run(kid(), { type: 'LAB_PREDICT_SUBMIT' }, { type: 'LAB_OBSERVE_BEFORE' }, { type: 'LAB_POUR' });
    expect(earnedBadges(r)).toEqual(['predictor', 'observer', 'first-pour']);
  });

  it('"다시 보는 눈"은 안내를 본 칸을 수조와 같게 고쳤을 때만 준다 (틀린 것을 벌주지 않음)', () => {
    let r = run(kid(), { type: 'LAB_SET_ROW_STATE', cup: '1', model: 'house', state: 'partial' }, { type: 'LAB_HINT_SHOWN', key: '1:house' });
    expect(earnedBadges(r)).not.toContain('second-look');
    r = run(r, { type: 'LAB_SET_ROW_STATE', cup: '1', model: 'house', state: 'none' });
    expect(earnedBadges(r)).toContain('second-look');
  });

  it('생활·환경 카드를 하나씩 담으면 "생활·환경 탐사"', () => {
    const note = (ref: string, area: 'life' | 'env'): Action => ({ type: 'UPSERT_NOTE', note: { source: 'card', sourceRef: ref, kind: 'card', area, text: ref, myNote: '' } });
    const r = run(kid(), note('flood', 'life'), note('bee', 'env'));
    expect(earnedBadges(r)).toContain('both-sides');
  });

  it('알려 준 배지는 다시 알리지 않는다', () => {
    let r = run(kid(), { type: 'LAB_PREDICT_SUBMIT' });
    expect(newBadges(r)).toEqual(['predictor']);
    r = run(r, { type: 'GAME_BADGES_SEEN', ids: ['predictor'] });
    expect(newBadges(r)).toEqual([]);
  });
});

describe('연구원증과 미션', () => {
  it('연구원증 발급일은 처음 한 번만 정해지고, 동료는 바꿀 수 있다', () => {
    let r = run(kid(), { type: 'GAME_ISSUE_CARD', avatar: 'fish', now: '2026-11-16T00:00:00.000Z' });
    r = run(r, { type: 'GAME_ISSUE_CARD', avatar: 'bird', now: '2026-11-17T00:00:00.000Z' });
    expect(r.game.avatar).toBe('bird');
    expect(r.game.issuedAt).toBe('2026-11-16T00:00:00.000Z');
  });

  it('브리핑은 한 번 본 뒤 다시 기록되지 않는다', () => {
    const r = run(kid(), { type: 'GAME_BRIEFED', missionId: 'cards' }, { type: 'GAME_BRIEFED', missionId: 'cards' });
    expect(r.game.briefed).toEqual(['cards']);
  });

  it('배지·캐릭터·미션 문구가 json에 모두 있다', () => {
    expect(game.badges.length).toBeGreaterThan(0);
    expect(game.avatars).toHaveLength(6);
  });
});

describe('배지 케이스와 완성 그림', () => {
  /** 모든 배지 조건을 채운 기록 */
  function allDone(): StudentRecord {
    let r = kid();
    const note = (source: 'card' | 'local' | 'lab-summary', ref: string, area: 'life' | 'env' | 'local'): Action => ({
      type: 'UPSERT_NOTE', note: { source, sourceRef: ref, kind: source === 'lab-summary' ? 'experiment' : source, area, text: ref, myNote: '' },
    });
    r = run(r, { type: 'LAB_PREDICT_SUBMIT' }, { type: 'LAB_OBSERVE_BEFORE' }, { type: 'LAB_POUR' });
    r = run(r, { type: 'LAB_SET_ROW_STATE', cup: '1', model: 'house', state: 'none' }, { type: 'LAB_HINT_SHOWN', key: '1:house' });
    for (const cup of ['1', '2', '3'] as const) {
      const t = { '1': ['partial', 'none', 'none'], '2': ['full', 'partial', 'none'], '3': ['full', 'full', 'partial'] }[cup];
      r = run(r,
        { type: 'LAB_SET_ROW_STATE', cup, model: 'island', state: t[0] as never },
        { type: 'LAB_SET_ROW_STATE', cup, model: 'house', state: t[1] as never },
        { type: 'LAB_SET_ROW_STATE', cup, model: 'tree', state: t[2] as never },
        { type: 'LAB_SET_ROW_OBSERVATION', cup, text: 'x' });
    }
    r = run(r, { type: 'LAB_COMPARE_DIFF', text: 'x' });
    for (const s of ['tuvalu', 'maldives', 'tidal-flat']) r = run(r, { type: 'LAB_REAL_SEEN', sceneId: s });
    r = run(r, note('lab-summary', 's1', 'life'), note('lab-summary', 's2', 'env'), note('card', 'flood', 'life'), note('card', 'bee', 'env'), note('local', 'local-taebaek', 'local'), note('card', 'glacier', 'env'));
    for (const id of ['heat-cold', 'wildfire', 'typhoon', 'flood', 'food', 'tidal-flat', 'sea-forest', 'glacier', 'bee', 'mangrove']) r = run(r, { type: 'CARDS_FLIP', cardId: id });
    return r;
  }

  it('모든 학생이 배지 12개를 다 모을 수 있다 (선택 활동 없이)', () => {
    expect(earnedBadges(allDone())).toHaveLength(game.badges.length);
    expect(isPuzzleComplete(allDone())).toBe(true);
  });

  it('케이스에 넣은 배지는 다시 넣는 움직임을 보여 주지 않는다', () => {
    let r = run(kid(), { type: 'LAB_PREDICT_SUBMIT' });
    expect(unplacedBadges(r)).toEqual(['predictor']);
    r = run(r, { type: 'GAME_BADGES_PLACED', ids: ['predictor'] });
    expect(unplacedBadges(r)).toEqual([]);
  });
});
