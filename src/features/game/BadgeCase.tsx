// 탐사 배지 케이스: 12칸에 배지를 하나씩 끼우고, 칸마다 그림 조각이 드러난다. 다 모으면 그림이 완성된다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { game } from '../../types/data';
import { useRecord } from '../../store/RecordContext';
import { GameSticker } from './GameIcon';
import { earnedBadges } from './badges';
import { PUZZLE_CELL, PUZZLE_COLS, PUZZLE_H, PuzzleArt } from './PuzzleArt';

const INSERT_GAP_MS = 450;
const INSERT_MS = 700;

/** 그림 한 조각: Codex 그림 파일이 있으면 배경으로 잘라 쓰고, 없으면 기본 그림 SVG를 잘라 쓴다 */
function Piece({ index }: { index: number }) {
  const col = index % PUZZLE_COLS;
  const row = Math.floor(index / PUZZLE_COLS);
  if (game.puzzle.image) {
    const rows = PUZZLE_H / PUZZLE_CELL;
    return (
      <span
        className="piece"
        style={{
          backgroundImage: `url(${game.puzzle.image})`,
          backgroundSize: `${PUZZLE_COLS * 100}% ${rows * 100}%`,
          backgroundPosition: `${(col / (PUZZLE_COLS - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
        }}
      />
    );
  }
  return <PuzzleArt className="piece" viewBox={`${col * PUZZLE_CELL} ${row * PUZZLE_CELL} ${PUZZLE_CELL} ${PUZZLE_CELL}`} />;
}

interface Props {
  /** 고른 칸이 바뀌면 바깥(왼쪽 설명)에 알려 준다 */
  onSelect: (badgeId: string) => void;
  selected: string | null;
}

export function BadgeCase({ onSelect, selected }: Props) {
  const { record, dispatch } = useRecord();
  const earned = useMemo(() => new Set(earnedBadges(record)), [record]);
  const total = game.badges.length;
  // 케이스를 연 순간 기준으로 "이번에 새로 끼울 배지"를 정한다
  const [inserting] = useState<string[]>(() => game.badges.map((b) => b.id).filter((id) => earned.has(id) && !record.game.badgesPlaced.includes(id)));
  const complete = earned.size === total;
  // 이번에 마지막 배지를 끼워 완성하는 순간인지
  const [finishing, setFinishing] = useState(complete && inserting.length > 0);
  const [view, setView] = useState<'picture' | 'badges'>(complete && inserting.length === 0 ? 'picture' : 'badges');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (inserting.length === 0) return;
    const doneAt = 600 + (inserting.length - 1) * INSERT_GAP_MS + INSERT_MS;
    timers.current.push(
      window.setTimeout(() => {
        dispatch({ type: 'GAME_BADGES_PLACED', ids: inserting });
        // 다 모았으면 배지가 물러나며 그림이 완성된다
        if (finishing) {
          setView('picture');
          timers.current.push(window.setTimeout(() => setFinishing(false), 1200));
        }
      }, doneAt),
    );
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const picture = view === 'picture' && complete;

  return (
    <div className="case">
      <div className="case-head">
        <span className="case-latch" aria-hidden />
        <h3 className="case-title">{game.ui.caseTitle}</h3>
        <span className="case-count">
          {earned.size} / {total}
        </span>
      </div>
      <div className="case-body">
        {/* 열 때 젖혀지는 뚜껑 */}
        <div className="case-lid" aria-hidden>
          <span>{game.ui.caseTitle}</span>
        </div>
        <ul className={`case-tray ${picture ? 'is-picture' : ''}`} aria-label={game.ui.caseTitle}>
          {game.badges.map((b, i) => {
            const got = earned.has(b.id);
            const idx = inserting.indexOf(b.id);
            const delay = 600 + idx * INSERT_GAP_MS;
            return (
              <li key={b.id} className="slot-cell">
                <button
                  type="button"
                  className={`slot ${got ? 'slot-on' : 'slot-off'} ${idx >= 0 ? 'slot-insert' : ''} ${selected === b.id ? 'slot-selected' : ''}`}
                  style={{ ['--d' as string]: `${delay}ms` }}
                  aria-label={got ? b.title : `${game.ui.slotEmpty}: ${b.title}`}
                  aria-pressed={selected === b.id}
                  onClick={() => onSelect(b.id)}
                >
                  {got && <Piece index={i} />}
                  {got ? (
                    <span className="slot-badge">
                      <GameSticker icon={b.icon} color={b.color} size={3} tilt={i % 2 ? 6 : -6} image={b.image} />
                    </span>
                  ) : (
                    <span className="slot-empty">
                      <Lock aria-hidden size={18} />
                    </span>
                  )}
                  <span className="slot-name">{b.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {complete ? (
        <div className={`case-complete ${finishing ? 'is-new' : ''}`}>
          <p className="case-complete-title">{game.ui.completeTitle}</p>
          <p className="case-complete-text">{game.ui.completeText}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setView(picture ? 'badges' : 'picture')}>
            {picture ? game.ui.showBadges : game.ui.showPicture}
          </button>
        </div>
      ) : (
        <p className="caption case-guide">
          {game.ui.puzzleGuide} {game.ui.caseHint}
        </p>
      )}
    </div>
  );
}
