// localStorage 읽기·쓰기. 반·번호별로 키를 나눠 여러 반이 기기를 돌려 써도 기록이 섞이지 않게 한다.
import { config } from '../types/data';
import type { Student, StudentRecord } from '../types/record';
import { fill } from '../lib/template';
import { migrate } from './migrate';

const S = config.storage;

/** 키 틀에 접두어·반·번호를 채운다 */
function key(template: string, student?: Pick<Student, 'class' | 'number'>): string {
  return fill(template, {
    prefix: S.prefix,
    class: student ? String(student.class) : '',
    number: student ? String(student.number) : '',
  });
}

/** 학생 기록이 저장되는 키. 교사 시연 모드는 따로 */
export function studentKey(student: Pick<Student, 'class' | 'number'>): string {
  if (student.class === 'teacher') return key(S.teacherKey);
  return key(S.studentKey, student);
}

/** 학생 사진이 저장되는 키 */
export function photoKey(student: Pick<Student, 'class' | 'number'>): string {
  if (student.class === 'teacher') return `${key(S.teacherKey)}:photo`;
  return key(S.photoKey, student);
}

/** 저장 실패 종류 */
export type SaveResult = 'ok' | 'full' | 'unavailable';

/** localStorage를 쓸 수 없는 환경(사생활 보호 창 등)에서도 앱이 멈추지 않게 감싼다 */
function safeGet(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}

function safeSet(k: string, v: string): SaveResult {
  try {
    window.localStorage.setItem(k, v);
    return 'ok';
  } catch (e) {
    // 용량 초과(QuotaExceededError)와 그 밖의 실패를 나눈다
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) return 'full';
    return 'unavailable';
  }
}

function safeRemove(k: string): void {
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* 지울 수 없어도 그냥 넘어간다 */
  }
}

/** 학생 기록 불러오기. 없거나 깨졌으면 null */
export function loadRecord(student: Pick<Student, 'class' | 'number'>): StudentRecord | null {
  const raw = safeGet(studentKey(student));
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** 학생 기록 저장하기 */
export function saveRecord(record: StudentRecord): SaveResult {
  return safeSet(studentKey(record.student), JSON.stringify(record));
}

/** 이 기기에서 학생 기록(사진 포함) 지우기 */
export function deleteRecord(student: Pick<Student, 'class' | 'number'>): void {
  safeRemove(studentKey(student));
  safeRemove(photoKey(student));
}

/** 사진 읽기·쓰기 (data URL 문자열) */
export function loadPhoto(student: Pick<Student, 'class' | 'number'>): string | null {
  return safeGet(photoKey(student));
}
export function savePhoto(student: Pick<Student, 'class' | 'number'>, dataUrl: string): SaveResult {
  return safeSet(photoKey(student), dataUrl);
}
export function removePhoto(student: Pick<Student, 'class' | 'number'>): void {
  safeRemove(photoKey(student));
}

/** 이 기기에서 마지막으로 쓴 학생 (시작 화면 미리 채우기) */
export function loadLastStudent(): Student | null {
  const raw = safeGet(key(S.lastKey));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Student;
  } catch {
    return null;
  }
}
export function saveLastStudent(student: Student): void {
  safeSet(key(S.lastKey), JSON.stringify(student));
}

/** 기기 단위 화면 설정 (큰 글자 모드) */
export interface UiPrefs {
  size: 'normal' | 'large';
}
export function loadUiPrefs(): UiPrefs {
  const raw = safeGet(key(S.uiKey));
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<UiPrefs>) : {};
    return { size: parsed.size === 'large' ? 'large' : 'normal' };
  } catch {
    return { size: 'normal' };
  }
}
export function saveUiPrefs(prefs: UiPrefs): void {
  safeSet(key(S.uiKey), JSON.stringify(prefs));
}
