// 연구소장 미션: 처음 들어온 단계에서 한 번 보여 주는 브리핑과, 단계 표시줄 옆 한 줄 임무 표시
import { useState } from 'react';
import { Microscope } from 'lucide-react';
import { game, type MissionId } from '../../types/data';
import { fill } from '../../lib/template';
import { Modal } from '../../components/Modal';
import { useRecord } from '../../store/RecordContext';
import './game.css';

/** 연구소장 얼굴 스티커 */
function Director({ size = 3 }: { size?: number }) {
  return (
    <span className="director" style={{ width: `${size}rem`, height: `${size}rem` }} aria-hidden>
      <Microscope size={`${size * 0.55}rem`} strokeWidth={2.2} />
    </span>
  );
}

/** 브리핑 대화상자 내용 */
function BriefingBody({ id, titleId, onStart }: { id: MissionId; titleId: string; onStart: () => void }) {
  const { record } = useRecord();
  const m = game.missions[id];
  return (
    <div className="briefing">
      <div className="briefing-who">
        <Director size={3.5} />
        <span className="briefing-name">{game.directorName}</span>
      </div>
      <p id={titleId} className="briefing-title">
        {m.title}
      </p>
      <p className="briefing-text">{fill(m.text, { name: record.student.name })}</p>
      <div className="row-end">
        <button type="button" className="btn btn-primary" onClick={onStart} autoFocus>
          {game.ui.briefingStart}
        </button>
      </div>
    </div>
  );
}

/** 아직 보지 않은 미션이면 브리핑을 띄운다 */
export function MissionBriefing({ id }: { id: MissionId }) {
  const { record, dispatch } = useRecord();
  if (record.game.briefed.includes(id)) return null;
  const done = () => dispatch({ type: 'GAME_BRIEFED', missionId: id });
  return (
    <Modal onClose={done} labelledBy={`briefing-${id}`} size="small">
      <BriefingBody id={id} titleId={`briefing-${id}`} onStart={done} />
    </Modal>
  );
}

/** 단계 표시줄 옆 한 줄 임무. 누르면 브리핑을 다시 본다 */
export function MissionChip({ id }: { id: MissionId }) {
  const [open, setOpen] = useState(false);
  const m = game.missions[id];
  return (
    <>
      <button type="button" className="mission-chip" onClick={() => setOpen(true)} title={m.title}>
        <Director size={1.75} />
        <span className="mission-label">{game.ui.missionLabel}</span>
        <span className="mission-short">{m.short}</span>
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} labelledBy={`chip-${id}`} size="small">
          <BriefingBody id={id} titleId={`chip-${id}`} onStart={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
