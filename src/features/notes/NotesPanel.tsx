// 근거 노트 패널: 모든 활동에서 담은 근거가 쌓이는 곳 (concept.md 5.4, design.md 6.2)
import { useState } from 'react';
import { NotebookPen, PanelRightClose, PanelRightOpen, Pencil, X } from 'lucide-react';
import { config, type Area } from '../../types/data';
import type { Note } from '../../types/record';
import { useRecord } from '../../store/RecordContext';
import { noteSummary } from '../../store/selectors';
import { useFeedback } from '../../components/Feedback';
import { AreaTag } from '../../components/AreaTag';

const T = config.ui.notes;
type Filter = 'all' | 'life' | 'env' | 'exp';

/** 노트 항목을 어떤 영역 색으로 보여 줄지: 실험 종류는 영역이 있어도 위에 실험 태그를 함께 */
function displayArea(n: Note): Area {
  if (n.area === 'life' || n.area === 'env' || n.area === 'local') return n.area;
  return 'exp';
}

function matches(n: Note, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'exp') return n.kind === 'experiment';
  if (f === 'life') return n.area === 'life' || n.area === 'local';
  return n.area === 'env';
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  /** 큰 글자 모드에서 펼치면 본문 위에 겹쳐 뜬다 */
  overlay: boolean;
}

export function NotesPanel({ collapsed, onToggle, overlay }: Props) {
  const { record, dispatch, lastAddedNoteId } = useRecord();
  const { confirm } = useFeedback();
  const [filter, setFilter] = useState<Filter>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const sum = noteSummary(record);
  const total = record.notes.length;

  if (collapsed) {
    return (
      <aside className="notes notes-collapsed" aria-label={T.title}>
        <button type="button" className="notes-rail" onClick={onToggle} aria-label={T.expand} title={T.expand}>
          <PanelRightOpen aria-hidden />
          <NotebookPen aria-hidden />
          <span key={lastAddedNoteId ?? 'none'} className={`notes-rail-count ${lastAddedNoteId ? 'flash' : ''}`}>
            {total}
          </span>
        </button>
      </aside>
    );
  }

  const shown = record.notes.filter((n) => matches(n, filter));
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: T.filterAll },
    { id: 'life', label: config.areas.life.label },
    { id: 'env', label: config.areas.env.label },
    { id: 'exp', label: config.areas.exp.label },
  ];

  async function remove(n: Note) {
    if (await confirm(T.removeConfirm)) dispatch({ type: 'REMOVE_NOTE', id: n.id });
  }

  return (
    <aside className={`notes ${overlay ? 'notes-overlay' : ''}`} aria-label={T.title}>
      <div className="notes-head">
        <h2 className="notes-title">
          <NotebookPen aria-hidden size={20} /> {T.title}
        </h2>
        <button type="button" className="icon-btn" onClick={onToggle} aria-label={T.collapse} title={T.collapse}>
          <PanelRightClose aria-hidden />
        </button>
      </div>
      <div className="notes-summary">
        <AreaTag area="life" count={sum.life} />
        <AreaTag area="env" count={sum.env} />
        <AreaTag area="exp" count={sum.exp} />
      </div>
      <div className="notes-filters" role="group">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip ${filter === f.id ? 'chip-on' : ''}`}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="notes-list">
        {shown.length === 0 && <li className="notes-empty">{T.empty}</li>}
        {shown.map((n) => {
          const area = displayArea(n);
          const open = openIds.has(n.id);
          const long = n.text.length > 60;
          return (
            <li key={n.id} className={`note note-${area} ${n.id === lastAddedNoteId ? 'flash' : ''}`}>
              <div className="note-top">
                <AreaTag area={area} />
                <span className="note-src">{T.sources[n.source]}</span>
                <button type="button" className="icon-btn icon-btn-sm" onClick={() => remove(n)} aria-label={T.remove} title={T.remove}>
                  <X aria-hidden size={16} />
                </button>
              </div>
              <p className={`note-text ${open ? '' : 'clamp-3'}`}>{n.text}</p>
              {long && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() =>
                    setOpenIds((s) => {
                      const next = new Set(s);
                      if (next.has(n.id)) next.delete(n.id);
                      else next.add(n.id);
                      return next;
                    })
                  }
                >
                  {open ? T.less : T.more}
                </button>
              )}
              {n.myNote && (
                <p className="note-my">
                  <Pencil aria-hidden size={14} /> {n.myNote}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
