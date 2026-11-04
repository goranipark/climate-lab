// 시작 화면: 반·번호·이름 입력 또는 내 기록 코드로 이어 쓰기 (concept.md 4.2, design.md 2.3)
import { useState, type FormEvent } from 'react';
import { config } from '../../types/data';
import { createEmptyRecord, type Student, type StudentRecord } from '../../types/record';
import { fill } from '../../lib/template';
import { readClassParam } from '../../lib/hashRoute';
import { loadLastStudent, loadRecord, saveRecord } from '../../store/storage';
import { decodeRecord } from '../../store/exportCode';
import { useFeedback } from '../../components/Feedback';
import { StartStickers } from './StartStickers';

const T = config.ui.start;
const S = config.student;
const TEACHER = 'teacher';

interface Props {
  onStart: (record: StudentRecord) => void;
}

export function StartScreen({ onStart }: Props) {
  const { confirm } = useFeedback();
  const last = loadLastStudent();
  const qrClass = readClassParam();
  // QR로 들어온 반이 있으면 그 반을, 아니면 이 기기에서 마지막으로 쓴 학생을 미리 채운다
  const prefill = qrClass && qrClass <= S.classCount ? { class: qrClass, number: undefined, name: '' } : last;

  const [classValue, setClassValue] = useState<string>(prefill ? String(prefill.class) : '');
  const [numberValue, setNumberValue] = useState<string>(prefill?.number ? String(prefill.number) : '');
  const [nameValue, setNameValue] = useState<string>(prefill?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [code, setCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const isTeacher = classValue === TEACHER;

  // 입력 검사 후 시작
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!classValue) return setError(T.errors.class);
    let student: Student;
    if (isTeacher) {
      student = { class: TEACHER, number: 0, name: config.ui.topbar.teacher };
    } else {
      const num = Number(numberValue);
      if (!Number.isInteger(num) || num < 1 || num > S.maxNumber) return setError(fill(T.errors.number, { max: S.maxNumber }));
      const name = nameValue.trim();
      if (name.length < S.nameMinLength || name.length > S.nameMaxLength) {
        return setError(fill(T.errors.name, { min: S.nameMinLength, max: S.nameMaxLength }));
      }
      student = { class: Number(classValue), number: num, name };
    }
    setError(null);

    const existing = loadRecord(student);
    if (existing) {
      // 같은 반·번호에 다른 이름의 기록이 있으면 이어 쓸지 묻는다
      if (!isTeacher && existing.student.name !== student.name) {
        const ok = await confirm(fill(config.messages.existingRecord, { class: student.class, number: student.number }));
        if (!ok) return;
      }
      onStart(existing);
      return;
    }
    onStart(createEmptyRecord(student));
  }

  // 코드로 불러오기
  async function handleImport() {
    const rec = decodeRecord(code);
    if (!rec) return setImportError(config.messages.importError);
    setImportError(null);
    const s = rec.student;
    const ok = await confirm(fill(config.messages.importConfirm, { class: s.class, number: s.number, name: s.name }));
    if (!ok) return;
    saveRecord(rec);
    onStart(rec);
  }

  return (
    <main className="start">
      <StartStickers />
      <div className="start-inner">
        <h1 className="start-title">{config.app.name}</h1>
        <p className="start-sub">{config.app.unit}</p>

        <form className="start-card" onSubmit={handleSubmit} noValidate>
          <div className="start-fields">
            <label className="field">
              <span className="field-label">{T.classLabel}</span>
              <select value={classValue} onChange={(e) => setClassValue(e.target.value)} className="input">
                <option value="">{T.classPlaceholder}</option>
                {Array.from({ length: S.classCount }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    {fill(T.classOption, { class: c })}
                  </option>
                ))}
                {S.teacherOption.enabled && <option value={TEACHER}>{S.teacherOption.label}</option>}
              </select>
            </label>
            {!isTeacher && (
              <>
                <label className="field field-number">
                  <span className="field-label">{T.numberLabel}</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={numberValue}
                    onChange={(e) => setNumberValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  />
                </label>
                <label className="field field-grow">
                  <span className="field-label">{T.nameLabel}</span>
                  <input
                    className="input"
                    value={nameValue}
                    placeholder={T.namePlaceholder}
                    maxLength={S.nameMaxLength}
                    onChange={(e) => setNameValue(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            {T.startButton}
          </button>
          <button type="button" className="btn btn-ghost btn-block" aria-expanded={showImport} onClick={() => setShowImport((v) => !v)}>
            {T.importToggle}
          </button>
          {showImport && (
            <div className="start-import">
              <textarea
                className="input code-input"
                value={code}
                placeholder={config.ui.import.placeholder}
                onChange={(e) => setCode(e.target.value)}
                rows={3}
              />
              {importError && (
                <p className="form-error" role="alert">
                  {importError}
                </p>
              )}
              <button type="button" className="btn btn-ghost" onClick={handleImport} disabled={!code.trim()}>
                {config.ui.import.button}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
