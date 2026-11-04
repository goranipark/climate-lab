// 기록 구조 버전 바꾸기. 구조를 바꾸면 RECORD_VERSION을 올리고 여기에 변환을 추가한다.
import { createEmptyRecord, RECORD_VERSION, type StudentRecord } from '../types/record';

/** 객체 b의 값을 기본값 a 위에 깊게 덮어쓴다 (빠진 칸은 기본값으로 채움) */
function deepMerge<T>(a: T, b: unknown): T {
  if (Array.isArray(a)) return (Array.isArray(b) ? b : a) as T;
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return a;
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) {
      out[k] = k in out ? deepMerge(out[k], v) : v;
    }
    return out as T;
  }
  return (b === undefined ? a : b) as T;
}

/** 저장되어 있던 기록을 지금 구조로 바꾼다. 학생 정보가 없으면 오류 */
export function migrate(raw: unknown): StudentRecord {
  if (!raw || typeof raw !== 'object') throw new Error('invalid record');
  const r = raw as Partial<StudentRecord>;
  const s = r.student;
  if (!s || (typeof s.class !== 'number' && s.class !== 'teacher') || typeof s.number !== 'number' || typeof s.name !== 'string') {
    throw new Error('invalid student');
  }
  if (typeof r.v !== 'number' || r.v > RECORD_VERSION) throw new Error('unknown version');
  // v1: 빠진 칸만 기본값으로 채운다
  const merged = deepMerge(createEmptyRecord(s), r);
  merged.v = RECORD_VERSION;
  return merged;
}
