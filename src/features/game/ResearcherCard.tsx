// 연구원증 카드: 연구 동료 스티커, 이름, 반·번호, 발급일, 연구소장 서명 (발급 화면과 배지 보기에서 함께 쓴다)
import { game } from '../../types/data';
import type { Student } from '../../types/record';
import { fill } from '../../lib/template';
import { GameSticker } from './GameIcon';

interface Props {
  student: Student;
  avatarId: string | null;
  issuedAt: string | null;
}

/** 날짜를 "2026. 11. 16." 꼴로 */
function formatDate(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function ResearcherCard({ student, avatarId, issuedAt }: Props) {
  const avatar = game.avatars.find((a) => a.id === avatarId) ?? game.avatars[0];
  return (
    <div className="id-card">
      <div className="id-band">{game.ui.cardTitle}</div>
      <div className="id-body">
        <GameSticker icon={avatar.icon} color={avatar.color} size={4.5} tilt={-6} label={avatar.label} />
        <div className="id-info">
          <span className="id-name">{student.name}</span>
          <span className="id-class">{fill(game.ui.classLabel, { class: student.class, number: student.number })}</span>
          <span className="caption">
            {game.ui.issuedLabel} {formatDate(issuedAt)}
          </span>
        </div>
      </div>
      <div className="id-sign">
        <span className="caption">{game.ui.signLabel}</span>
        <span className="id-director">{game.directorName}</span>
      </div>
    </div>
  );
}
