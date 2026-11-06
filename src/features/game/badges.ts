// 탐사 배지 조건: 기록에서 바로 계산한다(따로 저장하지 않음). 정답이 아니라 탐구 과정에 준다.
import { cards, game, lab } from '../../types/data';
import type { StudentRecord } from '../../types/record';
import { allRowsComplete, truthAt } from '../lab/labLogic';
import { collectedCardCounts } from '../../store/selectors';
import type { ModelId } from '../../types/data';

type Rule = (r: StudentRecord) => boolean;

const RULES: Record<string, Rule> = {
  predictor: (r) => r.lab.predict.submitted,
  observer: (r) => r.lab.experiment.observedBefore,
  'first-pour': (r) => r.lab.experiment.cupsPoured > 0 || r.lab.experiment.rows['1'].island !== null,
  // "다시 살펴볼까요?"를 본 칸을 다시 관찰해 수조와 같게 고쳤을 때
  'second-look': (r) =>
    r.lab.experiment.hintsShown.some((key) => {
      const [cup, model] = key.split(':') as ['1' | '2' | '3', ModelId];
      return r.lab.experiment.rows[cup]?.[model] === truthAt(Number(cup))[model];
    }),
  recorder: (r) => allRowsComplete(r),
  comparer: (r) => r.lab.compare.diff.trim().length > 0,
  explorer: (r) => lab.real.scenes.every((s) => r.lab.real.seen.includes(s.id)),
  reporter: (r) => r.notes.filter((n) => n.source === 'lab-summary').length >= 2,
  'both-sides': (r) => {
    const c = collectedCardCounts(r);
    return c.life >= 1 && c.env >= 1;
  },
  'card-reader': (r) => cards.cards.every((c) => r.cards.flipped.includes(c.id)),
  local: (r) => r.notes.some((n) => n.source === 'local'),
  collector: (r) => r.notes.length >= 6,
};

/** 지금 기록으로 받은 배지 id 목록 (game.json 순서대로) */
export function earnedBadges(r: StudentRecord): string[] {
  return game.badges.filter((b) => RULES[b.id]?.(r)).map((b) => b.id);
}

/** 받았지만 아직 알려 주지 않은 배지 */
export function newBadges(r: StudentRecord): string[] {
  return earnedBadges(r).filter((id) => !r.game.badgesSeen.includes(id));
}

/** 조건 함수가 없는 배지 id (데이터 검사·테스트용) */
export function badgesWithoutRule(): string[] {
  return game.badges.filter((b) => !RULES[b.id]).map((b) => b.id);
}

/** 배지를 모두 모아 그림이 완성됐는지 */
export function isPuzzleComplete(r: StudentRecord): boolean {
  return earnedBadges(r).length === game.badges.length;
}

/** 받았지만 아직 케이스에 넣는 모습을 보여 주지 않은 배지 */
export function unplacedBadges(r: StudentRecord): string[] {
  return earnedBadges(r).filter((id) => !r.game.badgesPlaced.includes(id));
}
