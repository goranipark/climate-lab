// 주소의 해시(#/lab 등)로 탭을 고른다. 새로고침해도 같은 탭이 열린다.
import { useCallback, useEffect, useState } from 'react';
import type { TabId } from '../types/data';

const TABS: TabId[] = ['lab', 'cards', 'write'];

/** 해시에서 탭 읽기. 없거나 모르는 값이면 null */
export function readHash(): TabId | null {
  const m = window.location.hash.match(/^#\/(\w+)/);
  const tab = m?.[1] as TabId | undefined;
  return tab && TABS.includes(tab) ? tab : null;
}

export function useHashTab(fallback: TabId): [TabId, (tab: TabId) => void] {
  const [tab, setTabState] = useState<TabId>(() => readHash() ?? fallback);

  useEffect(() => {
    if (!readHash()) window.history.replaceState(null, '', `#/${tab}`);
    const onHash = () => setTabState(readHash() ?? fallback);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // 처음 한 번만 연결
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = useCallback((next: TabId) => {
    window.location.hash = `/${next}`;
    setTabState(next);
  }, []);

  return [tab, setTab];
}

/** 주소의 ?class=3 값 (반별 QR로 들어왔을 때 반 미리 고르기) */
export function readClassParam(): number | null {
  const v = new URLSearchParams(window.location.search).get('class');
  const n = v ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}
