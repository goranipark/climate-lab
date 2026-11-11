// 4단계 모형 → 실제: 수조(모형)와 실제 그림 3장(상상해 본 모습)을 오가며 본다 (design.md 5.5)
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { findSource, lab } from '../../../types/data';
import { useRecord } from '../../../store/RecordContext';
import { AreaIcon } from '../../../components/AreaTag';
import { TankSvg } from '../tank/TankSvg';
import { SceneFallback } from './SceneFallback';

export function RealStep({ onNext }: { onNext: () => void }) {
  const { record, dispatch } = useRecord();
  const [mode, setMode] = useState<'model' | 'real'>('real');
  const [idx, setIdx] = useState(0);
  // 터치·전자칠판에서도 출처 상세를 볼 수 있도록 누른 출처를 기록
  const [openSource, setOpenSource] = useState<{ key: string; detail: string } | null>(null);
  const scenes = lab.real.scenes;
  const scene = scenes[idx];
  const allSeen = scenes.every((s) => record.lab.real.seen.includes(s.id));

  // 실제 그림을 화면에 띄우면 "본 그림"으로 기록
  useEffect(() => {
    setOpenSource(null);
    if (mode === 'real') dispatch({ type: 'LAB_REAL_SEEN', sceneId: scene.id });
  }, [mode, scene.id, dispatch]);

  const facts = [...scene.factIds, ...lab.real.commonFactIds]
    .map((id) => lab.facts.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => !!f);

  return (
    <div className="lab-split">
      <div className="lab-left">
        <div className="toggle" role="group">
          {(['model', 'real'] as const).map((m) => (
            <button key={m} type="button" className={`chip chip-lg ${mode === m ? 'chip-on' : ''}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {lab.real.toggle[m]}
            </button>
          ))}
        </div>
        <div className="scene-frame">
          {mode === 'model' ? (
            <TankSvg cups={3} title={lab.ui.tankLabel} className="tank-main" />
          ) : (
            <>
              {scene.image ? (
                <img src={scene.image} alt={scene.imageAlt} className="scene-img" />
              ) : (
                <SceneFallback id={scene.id} title={scene.imageAlt} />
              )}
              <span className="imagined-label">{lab.real.imageLabel}</span>
            </>
          )}
        </div>
        {mode === 'real' && (
          <div className="pager">
            <button type="button" className="icon-btn icon-btn-outline icon-btn-sm" aria-label={lab.ui.prevScene} disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              <ChevronLeft aria-hidden size={18} />
            </button>
            {scenes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`pager-dot ${i === idx ? 'pager-dot-on' : ''} ${record.lab.real.seen.includes(s.id) ? 'pager-dot-seen' : ''}`}
                aria-label={s.title}
                aria-current={i === idx || undefined}
                onClick={() => setIdx(i)}
              />
            ))}
            <button type="button" className="icon-btn icon-btn-outline icon-btn-sm" aria-label={lab.ui.nextScene} disabled={idx === scenes.length - 1} onClick={() => setIdx(idx + 1)}>
              <ChevronRight aria-hidden size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="lab-right">
        <div className="card-box scene-card">
          <h2 className="subheading">{scene.title}</h2>
          <p className="scene-line">
            <FlaskConical aria-hidden size={18} />
            <span>
              <strong>{lab.real.whatLabel}</strong> {scene.what}
            </span>
          </p>
          <p className="scene-line">
            <AreaIcon area={scene.whoArea} size={18} />
            <span>
              <strong>{lab.real.whoLabel}</strong> {scene.who}
            </span>
          </p>
        </div>
        <div className="facts">
          <span className="field-label">{lab.ui.factsTitle}</span>
          {openSource && (
            <p className="source-pop" role="status">
              {openSource.detail}
            </p>
          )}
          {facts.map((f) => (
            <p key={f.id} className="fact">
              {f.text}{' '}
              {f.sourceIds.map((sid) => {
                const src = findSource(sid);
                const key = `${f.id}:${sid}`;
                const isOpen = openSource?.key === key;
                return src ? (
                  <button
                    key={sid}
                    type="button"
                    className="source"
                    title={src.detail}
                    aria-expanded={isOpen}
                    onClick={() => setOpenSource(isOpen ? null : { key, detail: src.detail })}
                  >
                    {src.short}
                  </button>
                ) : null;
              })}
            </p>
          ))}
        </div>
        <div className="row-end">
          <button type="button" className="btn btn-primary" disabled={!allSeen && record.student.class !== 'teacher'} onClick={onNext}>
            {lab.ui.nextStep}
          </button>
        </div>
      </div>
    </div>
  );
}
