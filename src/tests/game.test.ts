// 게임 요소 테스트: 배지 조건, 알림 기록, 연구원증 발급
import { game } from '../types/data';
import { createEmptyRecord, type StudentRecord } from '../types/record';
import { reducer, type Action } from '../store/reducer';
import { badgesWithoutRule, earnedBadges, newBadges } from '../features/game/badges';

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
