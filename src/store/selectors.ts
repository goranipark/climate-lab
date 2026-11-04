// 기록에서 계산해 내는 값: 노트 개수, 카드 담김 여부, ⑦ 잠금 조건
import { config } from '../types/data';
import type { StudentRecord } from '../types/record';

/** ④에서 담은 카드 수 (생활/환경). ⑦ 잠금 조건에 쓴다 */
export function collectedCardCounts(record: StudentRecord): { life: number; env: number } {
  const counts = { life: 0, env: 0 };
  for (const n of record.notes) {
    if (n.kind !== 'card') continue;
    if (n.area === 'life') counts.life += 1;
    if (n.area === 'env') counts.env += 1;
  }
  if (config.unlock.write.countLocalCard) {
    counts.life += record.notes.filter((n) => n.kind === 'local').length;
  }
  return counts;
}

/** 교사 시연 모드인지 */
export function isTeacher(record: StudentRecord): boolean {
  return record.student.class === 'teacher';
}

/** ⑦ 서술 연습이 열렸는지 */
export function isWriteUnlocked(record: StudentRecord): boolean {
  if (isTeacher(record)) return true;
  const c = collectedCardCounts(record);
  return c.life >= config.unlock.write.lifeCards && c.env >= config.unlock.write.envCards;
}

/** 노트 요약 개수: 생활·환경은 영역, 실험은 종류로 센다 */
export function noteSummary(record: StudentRecord): { life: number; env: number; exp: number } {
  const s = { life: 0, env: 0, exp: 0 };
  for (const n of record.notes) {
    if (n.kind === 'experiment') s.exp += 1;
    else if (n.area === 'life' || n.area === 'local') s.life += 1;
    else if (n.area === 'env') s.env += 1;
  }
  return s;
}

/** 카드가 노트에 담겼는지 */
export function isCardCollected(record: StudentRecord, cardId: string): boolean {
  return record.notes.some((n) => n.source === 'card' && n.sourceRef === cardId);
}

/** 마지막 내보내기 뒤에 바뀐 내용이 있는지 (메뉴의 ● 표시) */
export function hasUnexported(record: StudentRecord): boolean {
  if (!record.lastExportedAt) return record.notes.length > 0 || record.lab.predict.submitted;
  return record.updatedAt > record.lastExportedAt;
}
