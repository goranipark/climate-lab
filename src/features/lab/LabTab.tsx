// ③ 해수면 실험실 탭: 단계 표시줄 + 지금 단계 화면 (concept.md 5.1)
import { useEffect } from 'react';
import { lab } from '../../types/data';
import type { LabStepId } from '../../types/record';
import { useRecord } from '../../store/RecordContext';
import { Stepper } from './Stepper';
import { isStepUnlocked, STEP_IDS } from './labLogic';
import { PredictStep } from './steps/PredictStep';
import { ExperimentStep } from './steps/ExperimentStep';
import { CompareStep } from './steps/CompareStep';
import { RealStep } from './steps/RealStep';
import { SummaryStep } from './steps/SummaryStep';
import './lab.css';

export function LabTab() {
  const { record, dispatch } = useRecord();
  const saved = record.ui.labStep;
  // 저장된 단계가 잠겨 있으면(기록을 지운 경우 등) 열린 마지막 단계로
  const step: LabStepId = isStepUnlocked(record, saved) ? saved : [...STEP_IDS].reverse().find((s) => isStepUnlocked(record, s)) ?? 'predict';

  useEffect(() => {
    if (step !== saved) dispatch({ type: 'SET_LAB_STEP', step });
  }, [step, saved, dispatch]);

  const go = (s: LabStepId) => dispatch({ type: 'SET_LAB_STEP', step: s });
  const next = () => {
    const i = STEP_IDS.indexOf(step);
    if (i < STEP_IDS.length - 1) go(STEP_IDS[i + 1]);
  };
  const title = lab.steps.find((s) => s.id === step)?.title;

  return (
    <section className="lab" aria-label={title}>
      <Stepper record={record} current={step} onGo={go} />
      <h1 className="sr-only">{title}</h1>
      {step === 'predict' && <PredictStep onNext={next} />}
      {step === 'experiment' && <ExperimentStep onNext={next} />}
      {step === 'compare' && <CompareStep onNext={next} />}
      {step === 'real' && <RealStep onNext={next} />}
      {step === 'summary' && <SummaryStep />}
    </section>
  );
}
