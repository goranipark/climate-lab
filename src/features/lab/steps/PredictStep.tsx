// 1단계 예측: 물을 붓기 전 수조를 보고 섬·집·나무가 어떻게 될지 고른다. 제출하면 잠긴다.
import { lab } from '../../../types/data';
import { useRecord } from '../../../store/RecordContext';
import { TankSvg } from '../tank/TankSvg';
import { StatePills } from '../StatePills';
import { MODELS, modelLabel } from '../labLogic';

export function PredictStep({ onNext }: { onNext: () => void }) {
  const { record, dispatch } = useRecord();
  const p = record.lab.predict;
  const ready = MODELS.every((m) => p.states[m] !== null) && p.reason.trim().length >= lab.predict.reasonMinLength;

  return (
    <div className="lab-split">
      <div className="lab-left">
        <p className="lab-notice">{lab.notice}</p>
        <TankSvg cups={0} title={lab.ui.tankLabel} className="tank-main" />
      </div>
      <div className="lab-right card-box predict-card">
        <h2 className="subheading">{lab.predict.question}</h2>
        <div className={`predict-rows ${p.submitted ? 'is-locked' : ''}`}>
          {MODELS.map((m) => (
            <div key={m} className="model-row">
              <span className="model-name">{modelLabel(m)}</span>
              <StatePills
                predict
                label={modelLabel(m)}
                value={p.states[m]}
                disabled={p.submitted}
                onChange={(state) => dispatch({ type: 'LAB_PREDICT_SET_STATE', model: m, state })}
              />
            </div>
          ))}
          <label className="field">
            <span className="field-label">{lab.predict.reasonLabel}</span>
            <input
              className="input"
              value={p.reason}
              placeholder={lab.predict.reasonPlaceholder}
              disabled={p.submitted}
              onChange={(e) => dispatch({ type: 'LAB_PREDICT_SET_REASON', text: e.target.value })}
            />
          </label>
        </div>
        {p.submitted ? (
          <>
            <p className="info-line">{lab.ui.predictDone} {lab.predict.lockedNotice}</p>
            <div className="row-end">
              <button type="button" className="btn btn-primary" onClick={onNext}>
                {lab.ui.nextStep}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="caption">{lab.predict.lockedNotice}</p>
            <div className="row-end">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!ready}
                onClick={() => {
                  dispatch({ type: 'LAB_PREDICT_SUBMIT' });
                  onNext();
                }}
              >
                {lab.predict.submitLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
