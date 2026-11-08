// "우리 반 패들렛에 올리기": 글을 복사하고 학생 반의 패들렛을 새 탭으로 연다 (API 키 없음, 학생이 직접 붙여 넣음)
import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { config } from '../types/data';
import { fill } from '../lib/template';
import { useRecord } from '../store/RecordContext';
import { useFeedback } from './Feedback';
import { Modal } from './Modal';

const P = config.padlet;

/** 오늘 날짜를 패들렛 제목 습관(예: 11.17)대로 */
export function padletDate(d = new Date()): string {
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** 패들렛에 붙여 넣을 글 만들기 */
export function padletText(tag: keyof typeof P.tags, text: string, d = new Date()): string {
  return fill(P.copyTemplate, { date: padletDate(d), tag: P.tags[tag], text: text.trim() });
}

interface Props {
  tag: keyof typeof P.tags;
  /** 올릴 글 (비어 있으면 버튼이 꺼진다) */
  text: string;
  size?: 'sm' | 'md';
}

export function PadletShare({ tag, text, size = 'md' }: Props) {
  const { record } = useRecord();
  const { toast } = useFeedback();
  const [fallback, setFallback] = useState<string | null>(null);
  const s = record.student;
  const url = s.class === 'teacher' ? undefined : P.urls[String(s.class)];

  async function share() {
    if (!url) return;
    const body = padletText(tag, text);
    try {
      // 복사를 먼저 끝내야 새 탭으로 넘어가도 클립보드에 글이 남는다
      await navigator.clipboard.writeText(body);
      window.open(url, '_blank', 'noopener');
      toast(fill(P.guide, { number: s.number, date: padletDate() }));
    } catch {
      // 복사 권한이 없으면 글을 직접 보여 주고 고르게 한다
      setFallback(body);
    }
  }

  return (
    <span className="padlet-share">
      {/* 새 탭이 열리면 앱 알림을 못 보므로, 어디에 붙여 넣을지는 누르기 전에 보여 준다 */}
      {/* 작은 버튼은 공간이 좁아 번호를 버튼 이름에 넣는다 */}
      {url && size === 'md' && <span className="caption">{fill(P.hint, { number: s.number })}</span>}
      <button type="button" className={`btn btn-ghost ${size === 'sm' ? 'btn-sm' : ''}`} onClick={share} disabled={!url || !text.trim()}>
        <Copy aria-hidden size={16} /> {size === 'sm' && url ? fill(P.buttonShort, { number: s.number }) : P.button}
      </button>
      {fallback && (
        <Modal onClose={() => setFallback(null)} labelledBy="padlet-fallback" title={P.copyFailTitle}>
          <textarea id="padlet-fallback" className="input" readOnly rows={6} value={fallback} onFocus={(e) => e.target.select()} autoFocus />
          <div className="row-end">
            <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
              {P.openPadlet} <ExternalLink aria-hidden size={16} />
            </a>
          </div>
        </Modal>
      )}
    </span>
  );
}
