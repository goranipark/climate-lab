// 5단계 정리: "해수면이 상승하면 ___" 생활·환경 문장 2개를 근거 노트에 담는다
import { Check } from 'lucide-react';
import { config, lab } from '../../../types/data';
import { fill } from '../../../lib/template';
import { useRecord } from '../../../store/RecordContext';
import { useFeedback } from '../../../components/Feedback';
import { AreaTag } from '../../../components/AreaTag';
import { noteId } from '../../../store/reducer';
import { PadletShare } from '../../../components/PadletShare';

export function SummaryStep() {
  const { record, dispatch } = useRecord();
  const { toast } = useFeedback();
  const sum = record.lab.summary;
  const S = lab.summary;
  const ok = S.sentences.every((s) => sum[s.id].trim().length >= S.minLength);
  // 지금 쓴 문장이 노트에 그대로 담겨 있는지
  const saved = S.sentences.every((s) => {
    const n = record.notes.find((x) => x.id === noteId('lab-summary', s.id));
    return n && n.text === fill(S.noteTemplate, { text: sum[s.id].trim() });
  });

  function save() {
    const replaced = record.notes.some((n) => n.source === 'lab-summary');
    for (const s of S.sentences) {
      dispatch({
        type: 'UPSERT_NOTE',
        note: { source: 'lab-summary', sourceRef: s.id, kind: 'experiment', area: s.area, text: fill(S.noteTemplate, { text: sum[s.id].trim() }), myNote: '' },
      });
    }
    toast(replaced ? config.messages.noteReplaced : config.messages.noteAdded);
  }

  return (
    <div className="summary card-box">
      {S.sentences.map((s) => (
        <label key={s.id} className={`summary-field summary-${s.area}`}>
          <span className="summary-head">
            <AreaTag area={s.area} /> <span className="caption">{s.hint}</span>
          </span>
          <span className="summary-line">
            <span className="summary-prefix">{S.prefix}</span>
            <input
              className="input"
              value={sum[s.id]}
              placeholder={s.placeholder}
              onChange={(e) => dispatch({ type: 'LAB_SUMMARY_SET', id: s.id, text: e.target.value })}
            />
          </span>
        </label>
      ))}
      <div className="row-end">
        {saved ? (
          <span className="saved-mark">
            <Check aria-hidden size={18} /> {lab.ui.summarySaved}
          </span>
        ) : null}
        <button type="button" className="btn btn-primary" disabled={!ok || saved} onClick={save}>
          {S.saveLabel}
        </button>
      </div>
      {saved && (
        <>
          {/* 정리 문장 두 개를 우리 반 패들렛 내 번호 칸에 올린다 */}
          <div className="row-end summary-share">
            <PadletShare tag="lab" text={S.sentences.map((x) => fill(S.noteTemplate, { text: sum[x.id].trim() })).join('\n')} />
          </div>
          <p className="closing">{S.closing}</p>
        </>
      )}
    </div>
  );
}
