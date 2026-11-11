// 영향 카드를 읽고 생활·환경 근거와 우리 지역 관찰을 노트에 담는다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Leaf, MapPin, RotateCw, User, X } from 'lucide-react';
import data from '../../data/cards.json';
import { findSource, type ImpactCard } from '../../types/data';
import { useRecord } from '../../store/RecordContext';
import { noteId } from '../../store/reducer';
import { collectedCardCounts } from '../../store/selectors';
import { fill } from '../../lib/template';
import { PadletShare } from '../../components/PadletShare';
import { MissionChip } from '../game/Mission';
import './cards.css';

type Filter = 'all' | 'life' | 'env' | 'collected';
type LocalCard = Omit<typeof data.localCard, 'area'> & { area: 'local' };
type Card = ImpactCard | LocalCard;
const localCard: LocalCard = { ...data.localCard, area: 'local' };

// 그림 경로가 없으면 영역 아이콘을 보여 주고, 실제 그림은 비율을 유지한다.
function CardImage({ card }: { card: Card }) {
  const Icon = card.area === 'env' ? Leaf : card.area === 'local' ? MapPin : User;
  return <div className="cards-image">{card.image
    ? <img src={card.image} alt={card.imageAlt} />
    : <Icon aria-hidden className="cards-placeholder" />}</div>;
}

// 지역 카드는 생활 카드 수에 더하지 않고 별도 출처로 구분한다.
function sourceOf(card: Card) {
  return card.area === 'local' ? 'local' as const : 'card' as const;
}

// 선택한 카드의 앞뒤 면과 입력을 접근 가능한 모달 안에서 보여 준다.
function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { record, dispatch } = useRecord();
  const dialog = useRef<HTMLDialogElement>(null);
  const [back, setBack] = useState(true);
  const local = card.area === 'local';
  const saved = record.notes.find((n) => n.id === noteId(sourceOf(card), card.id));
  const text = local ? record.cards.localText : record.cards.myNotes[card.id] ?? '';
  const read = record.cards.flipped.includes(card.id);
  const canCollect = read && (!local || text.trim().length >= data.localCard.inputMinLength);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);

  // 뒷면이 표시된 뒤에만 읽음으로 기록한다.
  useEffect(() => {
    if (back) dispatch({ type: 'CARDS_FLIP', cardId: card.id });
  }, [back, card.id, dispatch]);

  // 담은 카드의 한 줄을 고치면 노트에도 같은 내용을 반영한다.
  function changeText(value: string) {
    if (local) dispatch({ type: 'CARDS_SET_LOCAL_TEXT', text: value });
    else dispatch({ type: 'CARDS_SET_MY_NOTE', cardId: card.id, text: value });
    if (saved) {
      if (local && value.trim().length < data.localCard.inputMinLength) {
        dispatch({ type: 'REMOVE_NOTE', id: saved.id });
      } else {
        dispatch({ type: 'UPSERT_NOTE', note: {
          ...saved,
          text: local ? fill(data.localCard.noteTemplate, { text: value.trim() }) : saved.text,
          myNote: local ? '' : value,
        } });
      }
    }
  }

  // 공용 노트 동작으로 담기와 빼기를 처리한다.
  function toggleCollected() {
    if (saved) { dispatch({ type: 'REMOVE_NOTE', id: saved.id }); return; }
    if (!canCollect) return;
    dispatch({ type: 'UPSERT_NOTE', note: {
      source: sourceOf(card), sourceRef: card.id, kind: local ? 'local' : 'card', area: card.area,
      text: card.area === 'local'
        ? fill(data.localCard.noteTemplate, { text: text.trim() })
        : fill(data.noteTemplate, { title: card.title, what: card.what, who: card.who }),
      myNote: local ? '' : text,
    } });
  }

  return <dialog ref={dialog} className={`cards-dialog cards-${card.area}`} aria-labelledby="cards-detail-title"
    onCancel={(e) => { e.preventDefault(); onClose(); }}
    onClick={(e) => { if (e.target === e.currentTarget) {
      const bounds = e.currentTarget.getBoundingClientRect();
      if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose();
    } }}>
    <header className="cards-detail-head">
      <h2 id="cards-detail-title">{card.title}</h2>
      <button type="button" className="icon-btn icon-btn-sm" onClick={onClose} aria-label={data.ui.close}><X aria-hidden /></button>
    </header>
    <div key={String(back)} className="cards-face" data-back={back}>
      {back ? <>
        {card.area === 'local' ? <>
          <p>{card.body}</p><p className="cards-guide">{card.guide}</p>
          <a className="btn btn-ghost btn-sm" href={card.url} target="_blank" rel="noopener noreferrer">{card.linkLabel}<ExternalLink aria-hidden size={16} /></a>
        </> : <>
          {card.phenomenon && <span className="tag">{data.ui[card.phenomenon]}</span>}
          <p><strong>{data.labels.whatLabel} </strong>{card.what}</p>
          <p><strong>{data.labels.whoLabel} </strong>{card.who}</p>
          {card.example && <p className="cards-caption"><strong>{data.labels.exampleLabel} </strong>{card.example}</p>}
          {card.recentExample && card.recentSourceText && <p className="cards-caption"><strong>{data.labels.recentLabel} </strong>{card.recentExample} <span>{card.recentSourceText}</span></p>}
        </>}
        <p className="cards-source">{data.ui.source}: {card.sourceIds.map((id) => findSource(id)?.short ?? id).join(' · ')}</p>
        <label className="field cards-note"><span className="field-label">{local ? data.localCard.inputPrefix : data.labels.myNoteLabel}</span>
          <input className="input" value={text} placeholder={local ? data.localCard.inputPlaceholder : data.labels.myNotePlaceholder} onChange={(e) => changeText(e.target.value)} />
        </label>
      </> : <><button type="button" className="cards-front-flip" onClick={() => setBack(true)} aria-label={data.ui.flip}><CardImage card={card} /></button>
        <p className="cards-question">{'question' in card ? card.question : card.title}</p></>}
    </div>
    <footer className="cards-detail-actions">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBack((v) => !v)}><RotateCw size={16} aria-hidden />{data.ui.flip}</button>
      {/* 교사 요청(11/8): 담은 카드에 내 생각을 썼으면 우리 반 패들렛에 올릴 수 있다 */}
      {back && saved && text.trim() && <PadletShare tag="card" size="sm" text={local ? fill(data.localCard.noteTemplate, { text: text.trim() }) : `${card.title}: ${text.trim()}`} />}
      {back && <button type="button" className="btn btn-primary btn-sm" disabled={!saved && !canCollect} title={!read ? data.labels.readFirst : undefined} onClick={toggleCollected}>{saved ? data.labels.collectedLabel : data.labels.collectLabel}</button>}
    </footer>
  </dialog>;
}

// 필터와 진행 표시는 노트를 기준으로 계산하여 노트 패널과 즉시 맞춘다.
export function CardsTab() {
  const { record } = useRecord();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Card | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const counts = collectedCardCounts(record);
  const allCards: Card[] = [...data.cards as ImpactCard[], localCard];
  const collected = (card: Card) => record.notes.some((n) => n.id === noteId(sourceOf(card), card.id));
  const visible = allCards.filter((card) => filter === 'all' || (filter === 'collected' ? collected(card) : card.area === filter));
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: data.labels.filterAll }, { id: 'life', label: data.ui.life },
    { id: 'env', label: data.ui.env }, { id: 'collected', label: data.labels.filterCollected },
  ];

  return <section className="cards-tab" aria-label={data.ui.title}>
    <div className="cards-toolbar">
      <div className="cards-filters">{filters.map((item) => <button type="button" key={item.id} className={`chip ${filter === item.id ? 'chip-on' : ''}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      <p className="cards-progress" aria-live="polite">{fill(data.labels.progress, counts)}</p>
      <MissionChip id="cards" />
    </div>
    <div className="cards-grid">{visible.map((card) => <article key={card.id} className={`cards-tile cards-${card.area}`}>
      <button type="button" className="cards-open" aria-label={card.title} aria-describedby={`card-band-${card.id} card-q-${card.id}`} aria-haspopup="dialog" onClick={() => setSelected(card)}>
        <span id={`card-band-${card.id}`} className="cards-band">{card.area === 'env' ? <Leaf aria-hidden size={14} /> : card.area === 'local' ? <MapPin aria-hidden size={14} /> : <User aria-hidden size={14} />}{data.ui[card.area]}</span>
        <CardImage card={card} />
        <span id={`card-q-${card.id}`} className="cards-question">{'question' in card ? card.question : card.title}</span>
        {collected(card) && <span className="cards-check" aria-label={data.labels.collectedLabel}><Check aria-hidden /></span>}
        {!record.cards.flipped.includes(card.id) && <span className="cards-unread" role="img" aria-label={data.ui.unread} />}
      </button>
      {card.area === 'local' && <a className="cards-local-link" href={card.url} target="_blank" rel="noopener noreferrer">{card.linkLabel}<ExternalLink size={12} aria-hidden /></a>}
    </article>)}</div>
    {visible.length === 0 && <p className="cards-empty">{data.ui.empty}</p>}
    {counts.life === data.cards.filter((c) => c.area === 'life').length && counts.env === data.cards.filter((c) => c.area === 'env').length && <p className="cards-closing">{data.closing}</p>}
    {selected && <CardDetail card={selected} onClose={close} />}
  </section>;
}
