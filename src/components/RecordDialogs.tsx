// 메뉴의 "내 기록 내보내기 / 불러오기" 대화상자 (concept.md 6.2)
import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { config } from '../types/data';
import type { StudentRecord } from '../types/record';
import { fill } from '../lib/template';
import { encodeRecord, decodeRecord } from '../store/exportCode';
import { useRecord } from '../store/RecordContext';
import { Modal } from './Modal';
import { useFeedback } from './Feedback';

/** 내보내기: 코드를 보여 주고 복사 */
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const { record, dispatch } = useRecord();
  const { toast } = useFeedback();
  const code = useMemo(() => encodeRecord(record), [record]);

  // 코드를 보여 준 순간을 "내보낸 시각"으로 기록
  useEffect(() => {
    dispatch({ type: 'MARK_EXPORTED' });
    // 열릴 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast(config.ui.export.copied);
    } catch {
      // 복사 권한이 없으면 글자를 모두 선택해 둔다
      (document.getElementById('export-code') as HTMLTextAreaElement | null)?.select();
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="export-title" title={config.ui.export.title}>
      <p className="modal-text">{config.messages.exportGuide}</p>
      <textarea id="export-code" className="input code-input" readOnly value={code} rows={5} onFocus={(e) => e.target.select()} />
      <p className="caption">{config.messages.exportPhotoNotice}</p>
      <div className="row-end">
        <button type="button" className="btn btn-primary" onClick={copy}>
          <Copy aria-hidden size={18} /> {config.ui.export.copy}
        </button>
      </div>
    </Modal>
  );
}

/** 불러오기: 코드를 붙여 넣어 기록 바꾸기 */
export function ImportDialog({ onClose, onLoaded }: { onClose: () => void; onLoaded: (r: StudentRecord) => void }) {
  const { confirm } = useFeedback();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const rec = decodeRecord(code);
    if (!rec) return setError(config.messages.importError);
    const s = rec.student;
    if (!(await confirm(fill(config.messages.importConfirm, { class: s.class, number: s.number, name: s.name })))) return;
    onLoaded(rec);
  }

  return (
    <Modal onClose={onClose} labelledBy="import-title" title={config.ui.import.title}>
      <textarea
        className="input code-input"
        value={code}
        placeholder={config.ui.import.placeholder}
        onChange={(e) => setCode(e.target.value)}
        rows={5}
        autoFocus
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="row-end">
        <button type="button" className="btn btn-primary" onClick={load} disabled={!code.trim()}>
          {config.ui.import.button}
        </button>
      </div>
    </Modal>
  );
}
