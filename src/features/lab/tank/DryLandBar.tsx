// "물에 닿지 않는 육지" 막대 (design.md 5.4). 숫자·눈금·% 없음.
import { lab } from '../../../types/data';

export function DryLandBar({ cups }: { cups: number }) {
  const level = lab.simulation.levels[Math.max(0, Math.min(3, cups))];
  return (
    <div className="dryland">
      <span className="dryland-label">{lab.simulation.dryLandLabel}</span>
      <div className="dryland-track" aria-hidden>
        <div className="dryland-fill" style={{ height: `${level.dryLand * 100}%` }} />
      </div>
    </div>
  );
}
