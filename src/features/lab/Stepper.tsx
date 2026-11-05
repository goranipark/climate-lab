// ③ 단계 표시줄: 5단계 pill, 지금 단계·끝낸 단계·잠긴 단계 (design.md 2.4)
import { useEffect, useState } from 'react';
import { Check, ChevronRight, Lock } from 'lucide-react';
import { lab } from '../../types/data';
import type { LabStepId, StudentRecord } from '../../types/record';
import { isStepUnlocked, STEP_IDS } from './labLogic';

interface Props {
  record: StudentRecord;
  current: LabStepId;
  onGo: (step: LabStepId) => void;
}

export function Stepper({ record, current, onGo }: Props) {
  const [tip, setTip] = useState<LabStepId | null>(null);
  const currentIdx = STEP_IDS.indexOf(current);

  useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => setTip(null), 3000);
    return () => window.clearTimeout(t);
  }, [tip]);

  return (
    <ol className="stepper">
      {lab.steps.map((s, i) => {
        const unlocked = isStepUnlocked(record, s.id);
        const done = unlocked && i < currentIdx;
        const on = s.id === current;
        return (
          <li key={s.id} className="stepper-item">
            {i > 0 && <ChevronRight aria-hidden size={18} className="stepper-arrow" />}
            <button
              type="button"
              className={`step-pill ${on ? 'step-on' : ''} ${!unlocked ? 'step-locked' : ''}`}
              aria-current={on ? 'step' : undefined}
              aria-disabled={!unlocked || undefined}
              onClick={() => (unlocked ? onGo(s.id) : setTip(s.id))}
            >
              {!unlocked ? <Lock aria-hidden size={14} /> : done ? <Check aria-hidden size={14} /> : <span className="step-num">{i + 1}</span>}
              {s.label}
            </button>
            {tip === s.id && s.id !== 'predict' && (
              <div className="bubble" role="status">
                {lab.ui.stepLocked[s.id]}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
