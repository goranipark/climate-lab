// 내 연구원증과 배지 케이스: 왼쪽 연구원증 + 고른 배지 설명, 오른쪽 배지 케이스(그림 조각 퍼즐)
import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { game } from '../../types/data';
import { Modal } from '../../components/Modal';
import { useRecord } from '../../store/RecordContext';
import { ResearcherCard } from './ResearcherCard';
import { GameSticker } from './GameIcon';
import { BadgeCase } from './BadgeCase';
import { earnedBadges } from './badges';
import './game.css';

export function ResearcherModal({ onClose }: { onClose: () => void }) {
  const { record } = useRecord();
  const [selected, setSelected] = useState<string | null>(null);
  const earned = new Set(earnedBadges(record));
  const badge = game.badges.find((b) => b.id === selected);

  return (
    <Modal onClose={onClose} labelledBy="researcher-title" title={game.ui.cardTitle} size="wide">
      <div className="researcher">
        <div className="researcher-left">
          <ResearcherCard student={record.student} avatarId={record.game.avatar} issuedAt={record.game.issuedAt} />
          {badge && (
            <div className="badge-detail" aria-live="polite">
              <GameSticker icon={badge.icon} color={badge.color} size={3} locked={!earned.has(badge.id)} tilt={-6} image={badge.image} />
              <div>
                <p className="badge-detail-title">
                  {badge.title}{' '}
                  {earned.has(badge.id) ? <Check aria-hidden size={16} /> : <Lock aria-hidden size={14} />}
                </p>
                <p className="badge-detail-how">
                  <span className="field-label">{game.ui.badgeHow}</span> {badge.how}
                </p>
              </div>
            </div>
          )}
        </div>
        <BadgeCase selected={selected} onSelect={setSelected} />
      </div>
    </Modal>
  );
}
