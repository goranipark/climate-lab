// 가까이 보기: 누른 모형과 주변 물을 크게 보여 주는 작은 창 (design.md 2.4)
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { lab, type ModelId } from '../../../types/data';
import { fill } from '../../../lib/template';
import { modelLabel } from '../labLogic';
import { MODEL_BOX, VIEW_H, VIEW_W } from './geometry';
import { TankSvg } from './TankSvg';

interface Props {
  model: ModelId;
  cups: number;
  onClose: () => void;
}

export function CloseUp({ model, cups, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const b = MODEL_BOX[model];
  const w = VIEW_W / lab.experiment.closeUp.scale;
  const h = (w * 200) / 280;
  // 모형 가운데를 중심으로, 그림 밖으로 나가지 않게 자른다
  const cx = b.cx;
  const cy = (b.top + b.bottom) / 2 + 10;
  const x = Math.min(Math.max(cx - w / 2, 0), VIEW_W - w);
  const y = Math.min(Math.max(cy - h / 2, 0), VIEW_H - h);
  const title = fill(lab.ui.modelButton, { model: modelLabel(model) });

  // Esc나 바깥을 누르면 닫기, 열리면 창에 포커스
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={`closeup ${b.cx < VIEW_W / 2 ? 'closeup-right' : 'closeup-left'}`} role="dialog" aria-label={title} tabIndex={-1}>
      <div className="closeup-head">
        <span className="closeup-title">{title}</span>
        <button type="button" className="icon-btn icon-btn-sm" onClick={onClose} aria-label={lab.experiment.closeUp.closeLabel}>
          <X aria-hidden size={16} />
        </button>
      </div>
      <TankSvg cups={cups} viewBox={`${x} ${y} ${w} ${h}`} title={title} className="closeup-tank" />
    </div>
  );
}
