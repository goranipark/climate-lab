// 상태 고르기 pill 3개 (그대로 / 일부 잠김 / 모두 잠김)
import { lab, type StateId } from '../../types/data';

interface Props {
  value: StateId | null;
  onChange: (s: StateId) => void;
  /** 예측 단계에서는 "~일 것 같다" 문구를 쓴다 */
  predict?: boolean;
  disabled?: boolean;
  label: string;
}

export function StatePills({ value, onChange, predict = false, disabled = false, label }: Props) {
  return (
    <div className="state-pills" role="radiogroup" aria-label={label}>
      {lab.states.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={value === s.id}
          className={`state-pill ${value === s.id ? 'state-pill-on' : ''}`}
          disabled={disabled}
          onClick={() => onChange(s.id)}
        >
          <StateIcon state={s.id} />
          {predict ? s.predictLabel : s.label}
        </button>
      ))}
    </div>
  );
}

/** 잠김 상태 아이콘: ○ 그대로, ◐ 일부, ● 모두 */
export function StateIcon({ state }: { state: StateId }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="state-icon">
      <circle cx="8" cy="8" r="6.5" fill="var(--c-paper)" stroke="currentColor" strokeWidth="1.5" />
      {state === 'partial' && <path d="M1.5 8 A6.5 6.5 0 0 0 14.5 8 Z" fill="var(--c-water)" />}
      {state === 'full' && <circle cx="8" cy="8" r="6.5" fill="var(--c-water)" />}
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
