// 토스트(잠깐 뜨는 알림)와 확인창. 어디서든 useFeedback()으로 부른다.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { config } from '../types/data';
import { Modal } from './Modal';

interface ConfirmRequest {
  message: string;
  resolve: (ok: boolean) => void;
}

interface FeedbackApi {
  toast: (message: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const timer = useRef<number>();

  // 토스트는 한 번에 하나, 3초 뒤 사라짐
  const toast = useCallback((message: string) => {
    window.clearTimeout(timer.current);
    setToastMsg(message);
    timer.current = window.setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const confirm = useCallback(
    (message: string) => new Promise<boolean>((resolve) => setRequest({ message, resolve })),
    [],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 확인창 답하기
  const answer = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      {request && (
        <Modal onClose={() => answer(false)} labelledBy="confirm-msg" size="small">
          <p id="confirm-msg" className="confirm-msg">{request.message}</p>
          <div className="row-end">
            <button type="button" className="btn btn-ghost" onClick={() => answer(false)}>
              {config.ui.common.cancel}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => answer(true)} autoFocus>
              {config.ui.common.confirm}
            </button>
          </div>
        </Modal>
      )}
      <div className="toast-zone" aria-live="polite">
        {toastMsg && <div className="toast">{toastMsg}</div>}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('FeedbackProvider is required');
  return ctx;
}
