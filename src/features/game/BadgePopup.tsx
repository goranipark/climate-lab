// 새 배지 알림: 받은 순간 화면 오른쪽 위에 스티커가 붙었다가 사라진다. 여러 개면 차례로.
import { useEffect, useState } from 'react';
import { game } from '../../types/data';
import { useRecord } from '../../store/RecordContext';
import { GameSticker } from './GameIcon';
import { newBadges } from './badges';
import './game.css';

const SHOW_MS = 3200;

export function BadgePopup() {
  const { record, dispatch } = useRecord();
  const [showing, setShowing] = useState<string | null>(null);
  const pending = newBadges(record);

  // 보여 주는 배지가 없고 새 배지가 있으면 하나 꺼내 보여 주고 "알려 줌"으로 기록
  useEffect(() => {
    if (showing || pending.length === 0) return;
    const id = pending[0];
    setShowing(id);
    dispatch({ type: 'GAME_BADGES_SEEN', ids: [id] });
  }, [showing, pending.join(','), dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showing) return;
    const t = window.setTimeout(() => setShowing(null), SHOW_MS);
    return () => window.clearTimeout(t);
  }, [showing]);

  const badge = game.badges.find((b) => b.id === showing);
  return (
    <div className="badge-pop-zone" aria-live="polite">
      {badge && (
        <div className="badge-pop" key={badge.id}>
          <GameSticker icon={badge.icon} color={badge.color} size={3.25} tilt={-8} />
          <div>
            <p className="badge-pop-label">{game.ui.newBadge}</p>
            <p className="badge-pop-title">{badge.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
