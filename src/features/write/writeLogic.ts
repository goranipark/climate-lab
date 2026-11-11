// ⑦ 서술 연습 규칙: 완성 글 만들기, 자기 점검, 가져온 문장 구간 따라가기 (data.md 6장)
import { writing, type WritingField } from '../../types/data';
import type { Note, StudentRecord } from '../../types/record';

export type FieldId = WritingField['id'];
export type Fields = Record<FieldId, string>;
export interface ImportRange {
  start: number;
  end: number;
  noteId: string;
}

const ORDER: FieldId[] = ['life', 'env', 'exp', 'extra'];

/** 칸 글 다듬기: 앞뒤 공백을 지우고 끝의 마침표·느낌표·물음표를 하나 지운다 */
function tidy(text: string): string {
  return text.trim().replace(/[.!?。]$/, '').trim();
}

export interface ComposedPart {
  id: FieldId;
  area: WritingField['area'];
  text: string;
}

/** 인쇄·미리보기용 문장 조각: 영역 라벨과 문장을 함께 돌려준다 */
export function composeParts(fields: Fields): ComposedPart[] {
  return ORDER.flatMap((id) => {
    const t = tidy(fields[id] ?? '');
    if (!t) return [];
    const field = writing.fields.find((f) => f.id === id);
    return [{ id, area: field?.area ?? null, text: writing.compose.sentenceTemplates[id].replace('{text}', t) }];
  });
}

/** 완성 글: 칸마다 문장 틀에 끼우고, 빈 칸은 문장째 뺀다 */
export function composeText(fields: Fields): string {
  return composeParts(fields)
    .map((p) => p.text)
    .join(writing.compose.joiner);
}

/** 공백을 뺀 글자 수 */
export function letterCount(text: string): number {
  return text.replace(/\s/g, '').length;
}

export interface CheckResult {
  items: { id: string; ok: boolean }[];
  allOk: boolean;
  extraOk: boolean;
  unchanged: boolean;
}

/** 자기 점검: 점수 없이 들어 있는지/빠졌는지만 */
export function selfCheck(fields: Fields, imports: Record<string, ImportRange[]>): CheckResult {
  const items = writing.selfCheck.items.map((it) => ({ id: it.id, ok: letterCount(fields[it.fieldId] ?? '') >= it.minLength }));
  const extraMin = writing.selfCheck.items[0]?.minLength ?? 10;
  return {
    items,
    allOk: items.every((i) => i.ok),
    extraOk: letterCount(fields.extra ?? '') >= extraMin,
    unchanged: Object.values(imports).some((list) => list.some((r) => r.end > r.start)),
  };
}

/**
 * 글이 바뀌었을 때 가져온 문장 구간을 따라간다.
 * 바뀐 곳(앞뒤 같은 부분을 뺀 가운데)에 걸친 구간은 그 부분만큼 줄어들고, 뒤쪽 구간은 길이 차이만큼 밀린다.
 */
export function updateImports(ranges: ImportRange[], before: string, after: string): ImportRange[] {
  if (before === after) return ranges;
  let p = 0;
  while (p < before.length && p < after.length && before[p] === after[p]) p++;
  let s = 0;
  while (s < before.length - p && s < after.length - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
  const oldEnd = before.length - s; // 바뀐 곳의 끝 (옛 글 기준)
  const delta = after.length - before.length;
  const out: ImportRange[] = [];
  for (const r of ranges) {
    if (r.end <= p) out.push(r);
    else if (r.start >= oldEnd) out.push({ ...r, start: r.start + delta, end: r.end + delta });
    else {
      // 바뀐 곳에 걸친 구간: 바뀐 곳 앞부분과 뒷부분만 남긴다
      if (r.start < p) out.push({ ...r, start: r.start, end: p });
      if (r.end > oldEnd) out.push({ ...r, start: oldEnd + delta, end: r.end + delta });
    }
  }
  return out.filter((r) => r.end > r.start);
}

/** 글 사이에 문장 넣기: 넣은 자리에 새 구간을 만들고 뒤쪽 구간은 민다 */
export function insertAt(text: string, ranges: ImportRange[], pos: number, insert: string, noteId: string): { text: string; ranges: ImportRange[] } {
  const at = Math.max(0, Math.min(pos, text.length));
  // 앞 글과 붙지 않게 필요하면 띄어쓰기를 넣는다
  const lead = at > 0 && !/\s$/.test(text.slice(0, at)) ? ' ' : '';
  const piece = lead + insert;
  const next = text.slice(0, at) + piece + text.slice(at);
  const shifted = ranges.map((r) => (r.start >= at ? { ...r, start: r.start + piece.length, end: r.end + piece.length } : r));
  return { text: next, ranges: [...shifted, { start: at + lead.length, end: at + piece.length, noteId }].sort((a, b) => a.start - b.start) };
}

/** 노트가 칸에 어울리는지 (추천 점) */
export function suits(note: Note, fieldId: FieldId): boolean {
  const f = writing.fields.find((x) => x.id === fieldId);
  if (!f) return false;
  const byArea = !!note.area && (f.suggestFrom.areas ?? []).includes(note.area);
  const byKind = (f.suggestFrom.kinds ?? []).includes(note.kind);
  return byArea || byKind;
}

/** ③ 정리 문장이 노트에 있는지 */
export function hasLabSummary(r: StudentRecord): boolean {
  return r.notes.some((n) => n.source === 'lab-summary');
}
