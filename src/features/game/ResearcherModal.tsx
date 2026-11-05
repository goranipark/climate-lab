// 내 연구원증과 배지 보기: 받은 배지는 색 스티커, 아직 받지 않은 배지는 회색과 받는 방법
import { game } from '../../types/data';
import { fill } from '../../lib/template';
import { Modal } from '../../components/Modal';
import { useRecord } from '../../store/RecordContext';
import { ResearcherCard } from './ResearcherCard';
import { GameSticker } from './GameIcon';
import { earnedBadges } from './badges';
import './game.css';

export function ResearcherModal({ onClose }: { onClose: () => void }) {
  const { record } = useRecord();
  const earned = new Set(earnedBadges(record));
  return (
    <Modal onClose={onClose} labelledBy="researcher-title" title={game.ui.cardTitle} size="wide">
      <div className="researcher">
        <ResearcherCard student={record.student} avatarId={record.game.avatar} issuedAt={record.game.issuedAt} />
        <div className="badge-section">
          <h3 className="badge-head">
            {game.ui.badgesTitle} <span className="caption">{fill(game.ui.badgeCount, { count: earned.size })}</span>
          </h3>
          <ul className="badge-grid">
            {game.badges.map((b, i) => {
              const got = earned.has(b.id);
              return (
                <li key={b.id} className={`badge-item ${got ? '' : 'badge-off'}`}>
                  <GameSticker icon={b.icon} color={b.color} size={2.75} locked={!got} tilt={got ? (i % 2 ? 5 : -5) : 0} />
                  <span className="badge-title">{b.title}</span>
                  {!got && (
                    <span className="badge-how">
                      <span className="sr-only">{game.ui.badgeLocked}. {game.ui.badgeHow}: </span>
                      {b.how}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
