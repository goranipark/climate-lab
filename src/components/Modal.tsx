// 공용 대화상자: 검정 40% 덮개 + 가운데 흰 판. Esc나 덮개를 누르면 닫힌다.
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { config } from '../types/data';

interface Props {
  onClose: () => void;
  labelledBy: string;
  title?: string;
  size?: 'small' | 'medium' | 'wide';
  children: ReactNode;
}

export function Modal({ onClose, labelledBy, title, size = 'medium', children }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 열기 전 포커스 위치를 기억했다가 닫을 때 돌려준다
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {title && (
          <div className="modal-head">
            <h2 id={labelledBy} className="modal-title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label={config.ui.common.close}>
              <X aria-hidden />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
