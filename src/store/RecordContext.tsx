// 지금 학생의 기록 상태를 앱 전체에 나눠 주고, 바뀔 때마다 localStorage에 저장한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { config } from '../types/data';
import type { StudentRecord } from '../types/record';
import { useFeedback } from '../components/Feedback';
import { reducer, type Action } from './reducer';
import { saveLastStudent, saveRecord } from './storage';

const SAVE_DELAY_MS = 1000;

interface RecordApi {
  record: StudentRecord;
  dispatch: (action: Action) => void;
  /** 방금 담긴 노트 id (노트 패널 강조용) */
  lastAddedNoteId: string | null;
  /** 지금 기록을 바로 저장 (학생 바꾸기 전 등) */
  flush: () => void;
}

const RecordContext = createContext<RecordApi | null>(null);

export function RecordProvider({ initial, children }: { initial: StudentRecord; children: ReactNode }) {
  const [record, baseDispatch] = useReducer(reducer, initial);
  const [lastAddedNoteId, setLastAdded] = useState<string | null>(null);
  const { toast } = useFeedback();
  const latest = useRef(record);
  const timer = useRef<number>();
  const warnedFull = useRef(false);
  latest.current = record;

  // 저장하고 결과에 따라 안내
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const result = saveRecord(latest.current);
    if (result === 'full' && !warnedFull.current) {
      warnedFull.current = true;
      toast(config.messages.storageFull);
    }
    if (result === 'ok') warnedFull.current = false;
  }, [toast]);

  // 기록이 바뀌면 1초 모았다가 저장
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [record, flush]);

  // 창을 닫거나 다른 탭으로 갈 때 바로 저장
  useEffect(() => {
    saveLastStudent(initial.student);
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      flush();
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [initial.student, flush]);

  const dispatch = useCallback((action: Action) => {
    if (action.type === 'UPSERT_NOTE') {
      setLastAdded(`n_${action.note.source}_${action.note.sourceRef}`);
    }
    baseDispatch(action);
  }, []);

  const value = useMemo(() => ({ record, dispatch, lastAddedNoteId, flush }), [record, dispatch, lastAddedNoteId, flush]);
  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
}

export function useRecord(): RecordApi {
  const ctx = useContext(RecordContext);
  if (!ctx) throw new Error('RecordProvider is required');
  return ctx;
}
