// 연구원증 발급 화면: 처음 시작한 학생이 연구 동료를 고르고 연구원증을 받는다
import { useState } from 'react';
import { game } from '../../types/data';
import { useRecord } from '../../store/RecordContext';
import { ResearcherCard } from './ResearcherCard';
import { GameSticker } from './GameIcon';
import './game.css';

export function IssueCard() {
  const { record, dispatch } = useRecord();
  const [avatar, setAvatar] = useState<string>(game.avatars[0].id);

  return (
    <main className="issue">
      <div className="issue-inner">
        <h1 className="heading">{game.ui.issueTitle}</h1>
        <p className="subheading">{game.ui.issueGuide}</p>
        <div className="avatar-grid" role="radiogroup" aria-label={game.ui.issueGuide}>
          {game.avatars.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={avatar === a.id}
              className={`avatar-pick ${avatar === a.id ? 'avatar-on' : ''}`}
              onClick={() => setAvatar(a.id)}
            >
              <GameSticker icon={a.icon} color={a.color} size={3.5} />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <ResearcherCard student={record.student} avatarId={avatar} issuedAt={null} />
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'GAME_ISSUE_CARD', avatar })}>
          {game.ui.issueButton}
        </button>
      </div>
    </main>
  );
}
