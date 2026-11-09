// 2단계 디지털 실험: 붓기 전 관찰 → 컵 붓기 → 가까이 보고 관찰 → 이번 잔 기록 → 3잔까지 (concept.md 5.1)
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { AlertCircle, Lock, NotebookPen, RotateCcw } from 'lucide-react';
import { config, lab, type ModelId } from '../../../types/data';
import { fill } from '../../../lib/template';
import { useRecord } from '../../../store/RecordContext';
import { useFeedback } from '../../../components/Feedback';
import { TankSvg, type TankSticker } from '../tank/TankSvg';
import { DryLandBar } from '../tank/DryLandBar';
import { CloseUp } from '../tank/CloseUp';
import { StateIcon, StatePills } from '../StatePills';
import { VIEW_H, waterY } from '../tank/geometry';
import {
  allRowsComplete,
  canPour,
  changedModels,
  experimentGuide,
  isRowComplete,
  mismatchedModels,
  MODELS,
  modelLabel,
  pourBlockedByRecord,
  stateLabel,
} from '../labLogic';

type CupKey = '1' | '2' | '3';
type Phase = 'idle' | 'tilt' | 'return';

/** 움직임을 줄이는 설정인지 */
function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ExperimentStep({ onNext }: { onNext: () => void }) {
  const { record, dispatch } = useRecord();
  const { confirm, toast } = useFeedback();
  const ex = record.lab.experiment;
  const cups = ex.cupsPoured;

  const [phase, setPhase] = useState<Phase>('idle');
  const [stickers, setStickers] = useState<TankSticker[]>([]);
  const [closeModel, setCloseModel] = useState<ModelId | null>(null);
  const [editCup, setEditCup] = useState<CupKey | null>(null);
  const [announce, setAnnounce] = useState('');
  const [drag, setDrag] = useState<{ dx: number; dy: number; over: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tankRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const timers = useRef<number[]>([]);
  // 붓기 시작할 때의 잔 수 (물줄기 끝 높이를 붓기 전 물 표면에 고정)
  const pourFrom = useRef<number | null>(null);

  const pourable = canPour(record) && phase === 'idle';
  const blockedByRecord = pourBlockedByRecord(record);
  // 지금 기록할 잔: 고치려고 고른 잔이 있으면 그 잔, 아니면 마지막으로 부은 잔
  const activeCup: CupKey | null = editCup ?? (cups > 0 ? (String(cups) as CupKey) : null);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // 컵 붓기: 기울임 → 물줄기 + 수위 상승 → 제자리 → 바뀐 모형 라벨 (design.md 5.3)
  function pour() {
    if (!pourable) return;
    const from = cups;
    const to = cups + 1;
    const finish = () => {
      const changes = changedModels(from, to);
      setStickers(changes);
      setEditCup(null);
      setAnnounce(
        fill(lab.simulation.liveTemplate, {
          cup: to,
          changes: changes.map((c) => `${modelLabel(c.model)} ${stateLabel(c.state)}`).join(', '),
        }),
      );
    };
    setStickers([]);
    if (reducedMotion()) {
      dispatch({ type: 'LAB_POUR' });
      finish();
      return;
    }
    pourFrom.current = from;
    setPhase('tilt');
    timers.current.push(
      window.setTimeout(() => dispatch({ type: 'LAB_POUR' }), 400),
      window.setTimeout(() => setPhase('return'), 1600),
      window.setTimeout(() => {
        pourFrom.current = null;
        setPhase('idle');
        finish();
      }, 2000),
    );
  }

  async function resetWater() {
    if (!(await confirm(lab.experiment.resetConfirm))) return;
    setStickers([]);
    setEditCup(null);
    dispatch({ type: 'LAB_RESET_WATER' });
  }

  // 모형 누르기 → 가까이 보기 (붓기 전 관찰도 여기서 기록)
  function openCloseUp(m: ModelId) {
    if (!ex.observedBefore) dispatch({ type: 'LAB_OBSERVE_BEFORE' });
    setCloseModel(m);
  }

  // 컵 끌어다 놓기 (마우스·터치·펜 공통)
  function onCupDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!pourable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, moved: false };
  }
  function onCupMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const s = dragStart.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) s.moved = true;
    const r = tankRef.current?.getBoundingClientRect();
    const over = !!r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    if (s.moved) setDrag({ dx, dy, over });
  }
  function onCupUp() {
    const s = dragStart.current;
    dragStart.current = null;
    const wasOver = drag?.over;
    setDrag(null);
    // 수조 위에 놓았거나, 끌지 않고 눌렀으면 붓는다
    if (!s || !s.moved || wasOver) pour();
  }

  // 수조 그림 크기에 맞춘 물줄기 길이 (컵 입구 → 붓기 전 물 표면). 물이 차오르면 끝이 물에 잠긴다
  const stageH = tankRef.current?.clientHeight ?? 283;
  const surfacePx = (waterY(Math.min(3, pourFrom.current ?? cups)) / VIEW_H) * stageH;

  return (
    <div className="exp">
      <div className="exp-bench">
        <p className="lab-guide" aria-live="polite">
          {experimentGuide(record)}
        </p>
        <div className="exp-stage" ref={stageRef}>
          <div className="exp-tank" ref={tankRef}>
            <TankSvg
              cups={cups}
              animate
              onModel={openCloseUp}
              stickers={stickers}
              dropActive={!!drag?.over}
              title={lab.ui.tankLabel}
              className="tank-main"
            />
            {/* 컵: 바다 쪽 위에 놓여 있다 */}
            <button
              type="button"
              className={`cup cup-${phase} ${!pourable && phase === 'idle' ? 'cup-locked' : ''} ${drag ? 'cup-dragging' : ''}`}
              style={drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
              aria-label={lab.ui.cupLabel}
              aria-disabled={!pourable || undefined}
              title={blockedByRecord ? lab.experiment.pourLocked : lab.ui.cupLabel}
              onPointerDown={onCupDown}
              onPointerMove={onCupMove}
              onPointerUp={onCupUp}
              onPointerCancel={() => {
                dragStart.current = null;
                setDrag(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pour();
                }
              }}
            >
              <CupSvg level={phase === 'idle' ? 1 : phase === 'tilt' ? 0.4 : 0} />
              {!pourable && phase === 'idle' && cups < 3 && <Lock aria-hidden size={18} className="cup-lock" />}
            </button>
            {phase === 'tilt' && <PourStream surfacePx={surfacePx} />}
            {drag && <span className={`drop-hint ${drag.over ? 'drop-hint-on' : ''}`}>{lab.experiment.dropHint}</span>}
            {closeModel && <CloseUp model={closeModel} cups={cups} onClose={() => setCloseModel(null)} />}
          </div>
          <DryLandBar cups={cups} />
        </div>
        <p className="speech">{lab.simulation.levels[cups].bubble}</p>
        <div className="exp-actions">
          <button type="button" className="btn btn-primary" onClick={pour} disabled={!pourable} title={blockedByRecord ? lab.experiment.pourLocked : undefined}>
            {lab.experiment.pourLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetWater} disabled={cups === 0 || phase !== 'idle'}>
            <RotateCcw aria-hidden size={18} /> {lab.experiment.resetLabel}
          </button>
          {blockedByRecord && <span className="caption">{lab.experiment.pourLocked}</span>}
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>

      <div className="exp-record card-box">
        {activeCup ? (
          <RowEditor cup={activeCup} onCloseUp={openCloseUp} onCollected={() => toast(config.messages.noteAdded)} />
        ) : (
          <p className="record-waiting">{lab.ui.recordWaiting}</p>
        )}
        <PastRows current={activeCup} onPick={(c) => setEditCup(c === String(cups) ? null : c)} />
        <div className="row-end exp-finish">
          <button type="button" className="btn btn-primary" disabled={!allRowsComplete(record)} onClick={onNext}>
            {lab.experiment.finishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 한 잔의 기록 카드: 모형 3개 상태 + 이때 본 것 + 근거로 담기 */
function RowEditor({ cup, onCloseUp, onCollected }: { cup: CupKey; onCloseUp: (m: ModelId) => void; onCollected: () => void }) {
  const { record, dispatch } = useRecord();
  const row = record.lab.experiment.rows[cup];
  const mismatched = mismatchedModels(row, Number(cup));

  // "다시 살펴볼까요?"를 띄운 칸을 기록 (교사가 나중에 관찰 어려움을 볼 수 있게)
  useEffect(() => {
    for (const m of mismatched) dispatch({ type: 'LAB_HINT_SHOWN', key: `${cup}:${m}` });
  }, [mismatched.join(','), cup, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const obs = row.observation.trim();
  return (
    <div className="row-editor">
      <h2 className="subheading">{fill(lab.ui.recordTitle, { cup })}</h2>
      {MODELS.map((m) => (
        <div key={m} className="model-row">
          <span className="model-name">{modelLabel(m)}</span>
          <StatePills
            label={modelLabel(m)}
            value={row[m]}
            onChange={(state) => dispatch({ type: 'LAB_SET_ROW_STATE', cup, model: m, state })}
          />
          {mismatched.includes(m) && (
            <button type="button" className="hint-btn" onClick={() => onCloseUp(m)}>
              <AlertCircle aria-hidden size={16} /> {lab.experiment.mismatchHint}
            </button>
          )}
        </div>
      ))}
      <label className="field">
        <span className="field-label">{lab.experiment.observationLabel}</span>
        <div className="obs-row">
          <input
            className="input"
            value={row.observation}
            placeholder={lab.experiment.observationPlaceholder}
            onChange={(e) => dispatch({ type: 'LAB_SET_ROW_OBSERVATION', cup, text: e.target.value })}
          />
          <button
            type="button"
            className="icon-btn icon-btn-outline"
            disabled={!obs}
            aria-label={lab.ui.collectRow}
            title={lab.ui.collectRow}
            onClick={() => {
              dispatch({
                type: 'UPSERT_NOTE',
                note: {
                  source: 'lab-record',
                  sourceRef: cup,
                  kind: 'experiment',
                  area: null,
                  text: fill(lab.experiment.noteTemplate, { cup, observation: obs }),
                  myNote: '',
                },
              });
              onCollected();
            }}
          >
            <NotebookPen aria-hidden size={18} />
          </button>
        </div>
      </label>
    </div>
  );
}

/** 지난 잔 요약: 아이콘으로 접어 두고, 누르면 그 잔을 고칠 수 있다 */
function PastRows({ current, onPick }: { current: CupKey | null; onPick: (cup: CupKey) => void }) {
  const { record } = useRecord();
  const rows = (['1', '2', '3'] as const).filter((k) => k !== current && (isRowComplete(record.lab.experiment.rows[k]) || Number(k) <= record.lab.experiment.cupsPoured));
  if (rows.length === 0) return null;
  return (
    <div className="past-rows">
      <span className="field-label">{lab.ui.pastRecords}</span>
      {rows.map((k) => {
        const r = record.lab.experiment.rows[k];
        return (
          <button key={k} type="button" className="past-row" onClick={() => onPick(k)}>
            <span className="past-cup">{lab.experiment.rows[Number(k) - 1].label}</span>
            {MODELS.map((m) => (
              <span key={m} className="past-cell">
                {modelLabel(m)} {r[m] ? <StateIcon state={r[m]!} /> : '–'}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}

/** 기울인 컵 입구의 자리(rem, 수조 왼쪽 위 기준). lab.css의 .cup 위치·.cup-tilt와 맞춘 값 */
const LIP_REM = { x: 9.75, y: 2.4 };

/** 물줄기: 컵 입구에서 앞으로 휘어 나온 뒤 물 표면까지 떨어지고, 끝에서 물이 튄다 */
function PourStream({ surfacePx }: { surfacePx: number }) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const h = Math.max(rem, surfacePx - LIP_REM.y * rem);
  const out = 0.7 * rem; // 입구에서 앞으로 나가는 거리
  const w = 0.5 * rem; // 물줄기 굵기
  const dash = 0.9 * rem;
  const path = `M0 0 C${out * 0.6} ${-0.15 * rem} ${out} ${0.25 * rem} ${out} ${1.2 * rem} L${out} ${h}`;
  return (
    <svg className="stream" width={out + rem} height={h + rem} viewBox={`0 0 ${out + rem} ${h + rem}`} aria-hidden>
      <path className="stream-body" d={path} strokeWidth={w} />
      <path
        className="stream-flow"
        d={path}
        strokeWidth={w * 0.3}
        strokeDasharray={`${dash * 0.2} ${dash * 0.8}`}
        style={{ '--dash': `${dash}px` } as CSSProperties}
      />
      <ellipse className="stream-splash" cx={out} cy={h} rx={0.55 * rem} ry={0.18 * rem} />
    </svg>
  );
}

/** 컵 그림: 유리컵 느낌(반사광·두께). level은 컵 안 물의 양(0~1) */
function CupSvg({ level }: { level: number }) {
  // 3D 컵 그림이 있으면 그림으로 (기울기 움직임은 버튼이 맡는다)
  if (lab.art.cup) return <img src={lab.art.cup} alt="" aria-hidden className="cup-img" draggable={false} style={{ opacity: level > 0 ? 1 : 0.85 }} />;
  const top = 22 + (1 - level) * 52;
  const inset = (y: number) => (y - 10) * 0.085;
  return (
    <svg viewBox="0 0 72 88" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="cup-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#e3f1fb" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c3dcef" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="cup-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ccbff" />
          <stop offset="1" stopColor="#1d6fd6" />
        </linearGradient>
      </defs>
      <ellipse cx="36" cy="83" rx="22" ry="3.5" fill="#1f2a44" opacity="0.2" />
      <path d="M10 10 L62 10 L56 80 L16 80 Z" fill="url(#cup-glass)" stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" />
      {level > 0 && <path d={`M${10 + inset(top)} ${top} L${62 - inset(top)} ${top} L56 80 L16 80 Z`} fill="url(#cup-water)" opacity="0.9" />}
      {level > 0 && <ellipse cx="36" cy={top} rx={26 - inset(top)} ry="2.5" fill="#d8eeff" opacity="0.8" />}
      <ellipse cx="36" cy="10" rx="26" ry="3" fill="none" stroke="#1f2a44" strokeWidth="2" />
      <path d="M17 16 L21 72" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <path d="M10 10 L62 10 L56 80 L16 80 Z" fill="none" stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

