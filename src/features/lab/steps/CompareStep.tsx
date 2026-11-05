// 3단계 결과 비교: 내 예측 ↔ 컵 3잔 뒤 내 기록, 같았나요?, 달랐던 점, 다시 보기, 교실 실험(선택)
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Play, Trash2 } from 'lucide-react';
import { config, lab } from '../../../types/data';
import { fill } from '../../../lib/template';
import { shrinkPhoto } from '../../../lib/photo';
import { useRecord } from '../../../store/RecordContext';
import { loadPhoto, removePhoto, savePhoto } from '../../../store/storage';
import { useFeedback } from '../../../components/Feedback';
import { TankSvg } from '../tank/TankSvg';
import { StateIcon } from '../StatePills';
import { MODELS, modelLabel, stateLabel } from '../labLogic';

export function CompareStep({ onNext }: { onNext: () => void }) {
  const { record, dispatch } = useRecord();
  const c = record.lab.compare;
  const pred = record.lab.predict.states;
  const last = record.lab.experiment.rows['3'];

  return (
    <div className="lab-split">
      <div className="lab-left card-box">
        <h2 className="subheading">{lab.compare.title}</h2>
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">{lab.ui.modelCol}</th>
              <th scope="col">{lab.compare.predictLabel}</th>
              <th scope="col">{lab.compare.resultLabel}</th>
              <th scope="col" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => {
              const same = pred[m] !== null && pred[m] === last[m];
              return (
                <tr key={m}>
                  <th scope="row">{modelLabel(m)}</th>
                  <td>{pred[m] ? <><StateIcon state={pred[m]!} /> {stateLabel(pred[m]!)}</> : '–'}</td>
                  <td>{last[m] ? <><StateIcon state={last[m]!} /> {stateLabel(last[m]!)}</> : '–'}</td>
                  <td>
                    {same ? (
                      <span className="mark-same"><Check aria-hidden size={16} /> {lab.ui.sameMark}</span>
                    ) : (
                      <span className="mark-diff"><span className="attn-dot" aria-hidden /> {lab.ui.diffMark}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <fieldset className="choice">
          <legend className="field-label">{lab.compare.question}</legend>
          <div className="choice-row">
            {lab.compare.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`chip chip-lg ${c.result === o.id ? 'chip-on' : ''}`}
                aria-pressed={c.result === o.id}
                onClick={() => dispatch({ type: 'LAB_COMPARE_RESULT', result: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span className="field-label">{lab.compare.diffLabel}</span>
          <input className="input" value={c.diff} placeholder={lab.compare.diffPlaceholder} onChange={(e) => dispatch({ type: 'LAB_COMPARE_DIFF', text: e.target.value })} />
        </label>
        <div className="row-end">
          <button type="button" className="btn btn-primary" disabled={c.result === null} onClick={onNext}>
            {lab.ui.nextStep}
          </button>
        </div>
      </div>
      <div className="lab-right">
        <Replay />
        <Classroom />
      </div>
    </div>
  );
}

/** 다시 보기: 붓기 전 → 3잔까지 1초 간격으로 이어서 보여 준다 */
function Replay() {
  const [cups, setCups] = useState(3);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function play() {
    timers.current.forEach((t) => window.clearTimeout(t));
    setPlaying(true);
    setCups(0);
    timers.current = [1, 2, 3].map((n) => window.setTimeout(() => setCups(n), n * 1200));
    timers.current.push(window.setTimeout(() => setPlaying(false), 3 * 1200 + 400));
  }

  return (
    <div className="replay card-box">
      <TankSvg cups={cups} animate title={fill(lab.ui.replayCup, { cup: cups })} className="tank-small" />
      <button type="button" className="btn btn-ghost btn-sm" onClick={play} disabled={playing}>
        <Play aria-hidden size={16} /> {playing ? fill(lab.ui.replayCup, { cup: cups }) : lab.compare.replayLabel}
      </button>
    </div>
  );
}

/** 교실 실험(선택): 아크릴 상자로도 했다면 사진 1장 + 메모 */
function Classroom() {
  const { record, dispatch } = useRecord();
  const { toast } = useFeedback();
  const cl = record.lab.compare.classroom;
  const T = lab.compare.classroom;
  const [photo, setPhoto] = useState<string | null>(() => (cl.hasPhoto ? loadPhoto(record.student) : null));
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const url = await shrinkPhoto(file);
    const result = savePhoto(record.student, url);
    if (result !== 'ok') return toast(config.messages.storageFull);
    setPhoto(url);
    dispatch({ type: 'LAB_CLASSROOM', patch: { hasPhoto: true } });
  }

  return (
    <div className="classroom card-box">
      <label className="check-line">
        <input type="checkbox" checked={cl.done} onChange={(e) => dispatch({ type: 'LAB_CLASSROOM', patch: { done: e.target.checked } })} />
        {T.checkLabel}
      </label>
      {cl.done && (
        <div className="classroom-body">
          <div className="photo-row">
            {photo ? (
              <img src={photo} alt={T.photoLabel} className="photo-thumb" />
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                <Camera aria-hidden size={16} /> {lab.ui.photoPick}
              </button>
            )}
            {photo && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  removePhoto(record.student);
                  setPhoto(null);
                  dispatch({ type: 'LAB_CLASSROOM', patch: { hasPhoto: false } });
                }}
              >
                <Trash2 aria-hidden size={16} /> {lab.ui.photoRemove}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <p className="caption">{T.photoNotice}</p>
          <label className="field">
            <span className="field-label">{T.memoLabel}</span>
            <input className="input" value={cl.memo} placeholder={T.memoPlaceholder} onChange={(e) => dispatch({ type: 'LAB_CLASSROOM', patch: { memo: e.target.value } })} />
          </label>
        </div>
      )}
    </div>
  );
}
