// 내보내기/불러오기 코드: 기록 JSON(사진 제외)을 압축해 "CL1-…" 텍스트로 바꾼다
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { config } from '../types/data';
import type { StudentRecord } from '../types/record';
import { migrate } from './migrate';

const PREFIX = config.storage.exportCodePrefix;

/** 기록 → 코드 */
export function encodeRecord(record: StudentRecord): string {
  return PREFIX + compressToEncodedURIComponent(JSON.stringify(record));
}

/** 코드 → 기록. 잘못된 코드면 null */
export function decodeRecord(code: string): StudentRecord | null {
  // 패들렛에서 복사할 때 섞인 공백·줄바꿈을 지운다
  const cleaned = code.replace(/\s+/g, '');
  if (!cleaned.startsWith(PREFIX)) return null;
  try {
    const json = decompressFromEncodedURIComponent(cleaned.slice(PREFIX.length));
    if (!json) return null;
    return migrate(JSON.parse(json));
  } catch {
    return null;
  }
}
