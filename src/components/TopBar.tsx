// 상단 바: 로고·앱 이름 / 탭 3개 / 학생 정보·큰 글자·메뉴 (design.md 2.2)
import { useEffect, useRef, useState } from 'react';
import { Award, Lock, Menu as MenuIcon, Type } from 'lucide-react';
import { config, type TabId } from '../types/data';
import { fill } from '../lib/template';
import { useRecord } from '../store/RecordContext';
import { hasUnexported, isTeacher, isWriteUnlocked } from '../store/selectors';
import { game } from '../types/data';
import { GameSticker } from '../features/game/GameIcon';
import { earnedBadges } from '../features/game/badges';

const TABS: TabId[] = ['lab', 'cards', 'write'];
const U = config.ui;

export type MenuAction = 'export' | 'import' | 'switch' | 'delete';

interface Props {
  tab: TabId;
  onTab: (tab: TabId) => void;
  large: boolean;
  onToggleLarge: () => void;
  onMenu: (action: MenuAction) => void;
  onResearcher: () => void;
}

export function TopBar({ tab, onTab, large, onToggleLarge, onMenu, onResearcher }: Props) {
  const { record } = useRecord();
  const [lockTip, setLockTip] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const writeOpen = isWriteUnlocked(record);
  const unsaved = hasUnexported(record);
  const s = record.student;

  // 잠긴 탭 안내 말풍선은 3초 뒤 닫힘
  useEffect(() => {
    if (!lockTip) return;
    const t = window.setTimeout(() => setLockTip(false), 3000);
    return () => window.clearTimeout(t);
  }, [lockTip]);

  // 메뉴 바깥을 누르면 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function pick(action: MenuAction) {
    setMenuOpen(false);
    onMenu(action);
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="15" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="1.5" />
            <path d="M5 19 q3.5 -4 7 0 t7 0 t7 0" fill="none" stroke="var(--c-water)" strokeWidth="3" strokeLinecap="round" />
            <path d="M11 15 Q16 7 21 15 Z" fill="var(--c-land)" stroke="var(--c-ink)" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="brand-name">{config.app.name}</span>
      </div>

      <nav className="tabs" aria-label={config.app.name}>
        {TABS.map((t) => {
          const locked = t === 'write' && !writeOpen;
          return (
            <div key={t} className="tab-wrap">
              <button
                type="button"
                className={`tab ${tab === t ? 'tab-on' : ''} ${locked ? 'tab-locked' : ''}`}
                aria-current={tab === t ? 'page' : undefined}
                aria-disabled={locked || undefined}
                onClick={() => (locked ? setLockTip(true) : onTab(t))}
              >
                {locked && <Lock aria-hidden size={16} />}
                {U.tabs[t]}
              </button>
              {locked && lockTip && (
                <div className="bubble" role="status">
                  {config.unlock.write.lockedMessage}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="topbar-right">
        {isTeacher(record) ? (
          <span className="student-chip">{U.topbar.teacher}</span>
        ) : (
          <button type="button" className="researcher-btn" onClick={onResearcher} title={game.ui.openCard} aria-label={game.ui.openCard}>
            <ResearcherAvatar avatarId={record.game.avatar} />
            {fill(U.topbar.student, { class: s.class, number: s.number, name: s.name })}
            <span className="researcher-count">
              <Award aria-hidden size={14} /> {earnedBadges(record).length}
            </span>
          </button>
        )}
        <button
          type="button"
          className={`btn btn-ghost btn-sm ${large ? 'btn-on' : ''}`}
          aria-pressed={large}
          onClick={onToggleLarge}
        >
          <Type aria-hidden size={18} /> {U.topbar.bigText}
        </button>
        <div className="menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="icon-btn icon-btn-outline"
            aria-label={U.topbar.menu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MenuIcon aria-hidden />
            {unsaved && <span className="dot" title={U.menu.unsaved} />}
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button type="button" role="menuitem" onClick={() => pick('export')}>
                {U.menu.export}
                {unsaved && <span className="dot dot-inline" aria-label={U.menu.unsaved} />}
              </button>
              <button type="button" role="menuitem" onClick={() => pick('import')}>
                {U.menu.import}
              </button>
              <button type="button" role="menuitem" onClick={() => pick('switch')}>
                {U.menu.switch}
              </button>
              <button type="button" role="menuitem" className="menu-danger" onClick={() => pick('delete')}>
                {U.menu.delete}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** 상단 바의 작은 연구 동료 스티커 */
function ResearcherAvatar({ avatarId }: { avatarId: string | null }) {
  const a = game.avatars.find((x) => x.id === avatarId) ?? game.avatars[0];
  return <GameSticker icon={a.icon} color={a.color} size={1.75} />;
}
