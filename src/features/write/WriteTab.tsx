// ⑦ 서술 연습: 왼쪽 내 근거 노트, 오른쪽 서술 틀·자기 점검·인쇄·패들렛 (concept.md 5.3, design.md 2.6·6.3·8)
import { useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check, FileText, Plus, Printer } from 'lucide-react';
import { config, writing } from '../../types/data';
import type { Note } from '../../types/record';
import { fill } from '../../lib/template';
import { useRecord } from '../../store/RecordContext';
import { isTeacher } from '../../store/selectors';
import { AreaTag } from '../../components/AreaTag';
import { useFeedback } from '../../components/Feedback';
import { Modal } from '../../components/Modal';
import { PadletShare } from '../../components/PadletShare';
import { composeParts, composeText, hasLabSummary, selfCheck, suits, type FieldId, type ImportRange } from './writeLogic';
import './write.css';

const U = writing.ui;

/** 노트 항목을 어느 색으로 보여 줄지: 영역이 있으면 영역 색(노트 패널과 같게), 없으면 실험 */
function noteArea(n: Note) {
  return (n.area ?? 'exp') as 'life' | 'env' | 'local' | 'exp';
}

export function WriteTab() {
  const { record, dispatch } = useRecord();
  const { toast } = useFeedback();
  const w = record.writing;
  const [selected, setSelected] = useState<FieldId>('life');
  const [showExtra, setShowExtra] = useState(w.fields.extra.trim().length > 0);
  const [checked, setChecked] = useState(false);
  const [example, setExample] = useState(false);
  // 칸마다 마지막 커서 위치 (노트를 누르면 그 자리에 넣는다)
  const cursor = useRef<Record<string, number>>({});
  const checkRef = useRef<HTMLDivElement>(null);

  const composed = composeText(w.fields);
  const check = selfCheck(w.fields, w.imports);
  const fieldLabel = (id: FieldId) => writing.fields.find((f) => f.id === id)?.label ?? id;

  function insert(n: Note) {
    const cur = w.fields[selected];
    const pos = Math.max(0, Math.min(cursor.current[selected] ?? cur.length, cur.length));
    const lead = pos > 0 && !/\s$/.test(cur.slice(0, pos)) ? 1 : 0;
    dispatch({ type: 'WRITE_INSERT_NOTE', fieldId: selected, pos, text: n.text, noteId: n.id });
    cursor.current[selected] = pos + lead + n.text.length;
    setChecked(false);
  }

  function handlePrint() {
    if (composed.length > 1000) toast(writing.output.printTooLong);
    window.print();
  }

  function runCheck() {
    setChecked(true);
    dispatch({ type: 'WRITE_CHECKED', missing: check.items.filter((i) => !i.ok).map((i) => i.id) });
    // 결과가 글 아래에 있으므로 보이게 스크롤
    window.requestAnimationFrame(() => checkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  // 서술 틀: 고정 문구와 칸을 차례로
  const frame: ReactNode[] = writing.frame.map((part, i) =>
    part.type === 'text' ? (
      <p key={i} className="frame-text">
        {part.text}
      </p>
    ) : (
      <FieldBox
        key={part.fieldId}
        id={part.fieldId}
        selected={selected === part.fieldId}
        onSelect={() => setSelected(part.fieldId)}
        onCursor={(pos) => (cursor.current[part.fieldId] = pos)}
        onChange={() => setChecked(false)}
      />
    ),
  );

  return (
    <section className="write" aria-label={writing.title}>
      {/* 왼쪽: 내 근거 노트 */}
      <aside className="write-notes" aria-label={U.notesTitle}>
        <h2 className="write-notes-title">{U.notesTitle}</h2>
        <p className="caption">{U.notesHint}</p>
        <ul className="write-note-list">
          {record.notes.length === 0 && <li className="caption write-empty">{U.notesEmpty}</li>}
          {record.notes.map((n) => {
            const good = suits(n, selected);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={`write-note note-${noteArea(n)} ${good ? 'is-suggested' : ''}`}
                  onClick={() => insert(n)}
                  aria-label={`${fill(U.insertLabel, { field: fieldLabel(selected) })}: ${n.text}`}
                >
                  <span className="write-note-top">
                    <AreaTag area={noteArea(n)} />
                    {good && (
                      <span className="suggest-dot" title={U.suggestLabel}>
                        <span className="sr-only">{U.suggestLabel}</span>
                      </span>
                    )}
                    <Plus aria-hidden size={16} className="write-note-plus" />
                  </span>
                  <span className="write-note-text">{n.text}</span>
                  {n.myNote && <span className="caption">✎ {n.myNote}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* 오른쪽: 글쓰기 */}
      <div className="write-main">
        <p className="write-guide">{writing.guide}</p>
        {!hasLabSummary(record) && <p className="write-guide write-guide-soft">{writing.noLabNotice}</p>}
        <div className="write-scroll">
          {frame}
          {showExtra ? (
            <FieldBox
              id="extra"
              selected={selected === 'extra'}
              onSelect={() => setSelected('extra')}
              onCursor={(pos) => (cursor.current.extra = pos)}
              onChange={() => setChecked(false)}
            />
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm extra-open"
              onClick={() => {
                setShowExtra(true);
                setSelected('extra');
              }}
            >
              <Plus aria-hidden size={16} /> {U.extraOpen}
            </button>
          )}

          {checked && (
            <div className="check-box" aria-live="polite" ref={checkRef}>
              <p className="check-title">{U.checkTitle}</p>
              {writing.selfCheck.items.map((it) => {
                const ok = check.items.find((x) => x.id === it.id)?.ok;
                return (
                  <p key={it.id} className={`check-line ${ok ? 'is-ok' : 'is-missing'}`}>
                    <span className="check-mark" aria-hidden>
                      {ok ? <Check size={14} /> : <AlertCircle size={14} />}
                    </span>
                    <AreaTag area={it.area} />
                    <span>{ok ? it.okText : it.missingText}</span>
                  </p>
                );
              })}
              {check.allOk && <p className="check-all">{check.extraOk ? writing.selfCheck.allOkWithExtraText : writing.selfCheck.allOkText}</p>}
              {check.unchanged && <p className="check-unchanged">{writing.selfCheck.unchangedImportText}</p>}
              {check.allOk && <p className="closing">{writing.closing}</p>}
            </div>
          )}
        </div>

        <div className="write-actions">
          <button type="button" className="btn btn-primary" onClick={runCheck}>
            <Check aria-hidden size={18} /> {writing.selfCheck.buttonLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handlePrint} disabled={!composed}>
            <Printer aria-hidden size={18} /> {writing.output.printLabel}
          </button>
          {isTeacher(record) && (
            <button type="button" className="btn btn-ghost" onClick={() => setExample(true)}>
              <FileText aria-hidden size={18} /> {U.teacherExample}
            </button>
          )}
          <span className="write-actions-end">
            <PadletShare tag="write" text={composed} size="sm" />
          </span>
        </div>
      </div>

      {example && (
        <Modal onClose={() => setExample(false)} labelledBy="example-title" title={U.exampleTitle}>
          <p className="example-text">{composeText(writing.teacherExample)}</p>
        </Modal>
      )}
      <PrintSheet composed={composed} />
    </section>
  );
}

/** 칸 하나: 가져온 문장을 연노랑 + 점선 밑줄로 보여 주는 겹친 글상자 */
function FieldBox(props: { id: FieldId; selected: boolean; onSelect: () => void; onCursor: (pos: number) => void; onChange: () => void }) {
  const { record, dispatch } = useRecord();
  const f = writing.fields.find((x) => x.id === props.id)!;
  const text = record.writing.fields[props.id];
  const ranges = (record.writing.imports[props.id] ?? []) as ImportRange[];
  const back = useRef<HTMLSpanElement>(null);

  // 뒤쪽 표시층: 가져온 구간만 <mark>로 감싼다
  const parts: ReactNode[] = [];
  let at = 0;
  [...ranges].sort((a, b) => a.start - b.start).forEach((r, i) => {
    if (r.start > at) parts.push(text.slice(at, r.start));
    parts.push(<mark key={i}>{text.slice(Math.max(r.start, at), r.end)}</mark>);
    at = Math.max(at, r.end);
  });
  parts.push(text.slice(at) + '\n');

  const area = f.area ?? 'none';
  return (
    <label className={`field-box fb-${area} ${props.selected ? 'is-selected' : ''}`} onFocus={props.onSelect}>
      <span className="field-box-head">
        {f.area && <AreaTag area={f.area} />}
        <span className="field-box-label">{f.prefix ? `${f.prefix} · ${f.label}` : f.label}</span>
      </span>
      <span className="hl-wrap">
        <span className="hl-back" ref={back} aria-hidden>
          {parts}
        </span>
        <textarea
          className="hl-input"
          value={text}
          placeholder={f.placeholder}
          rows={2}
          onChange={(e) => {
            dispatch({ type: 'WRITE_SET_FIELD', fieldId: props.id, text: e.target.value });
            props.onCursor(e.target.selectionStart);
            props.onChange();
          }}
          onSelect={(e) => props.onCursor(e.currentTarget.selectionStart)}
          onScroll={(e) => {
            if (back.current) back.current.scrollTop = e.currentTarget.scrollTop;
          }}
        />
      </span>
    </label>
  );
}

/** 인쇄용 A4 한 장 (화면에서는 숨김) */
function PrintSheet({ composed }: { composed: string }) {
  const { record } = useRecord();
  const s = record.student;
  const parts = composeParts(record.writing.fields);
  const check = selfCheck(record.writing.fields, record.writing.imports);
  const d = new Date();
  return (
    <div className={`print-sheet ${composed.length > 700 ? 'is-long' : ''}`} aria-hidden>
      <p className="ps-head">{writing.output.printHeader}</p>
      <p className="ps-who">
        {s.class === 'teacher' ? '' : fill(U.nameLine, { class: s.class, number: s.number, name: s.name })}
        <span>
          {U.dateLabel} {d.getFullYear()}. {d.getMonth() + 1}. {d.getDate()}.
        </span>
      </p>
      <p className="ps-text">
        {parts.map((p, i) => (
          <span key={p.id}>
            {i > 0 ? writing.compose.joiner : ''}
            {p.area && <span className="ps-tag">[{config.areas[p.area].label}]</span>}
            {p.text}
          </span>
        ))}
      </p>
      <div className="ps-check">
        <p className="ps-check-title">{U.checkTitle}</p>
        {writing.selfCheck.items.map((it) => (
          <p key={it.id}>
            {check.items.find((x) => x.id === it.id)?.ok ? '☑' : '☐'} [{it.label}]
          </p>
        ))}
      </div>
    </div>
  );
}
