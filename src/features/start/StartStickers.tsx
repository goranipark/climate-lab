// 시작 화면 제목 주변의 스티커 4개 (섬·물결·온도계·나뭇잎). 장식이라 화면 읽기에서는 숨긴다.
export function StartStickers() {
  return (
    <div className="stickers" aria-hidden>
      {/* 섬: 모래 언덕 + 야자수 */}
      <svg className="sticker sticker-island" viewBox="0 0 88 88">
        <rect x="2" y="2" width="84" height="84" rx="20" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M10 66 Q44 40 78 66 Z" fill="var(--c-land)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 66 H80" stroke="var(--c-water-line)" strokeWidth="3" strokeLinecap="round" />
        <path d="M46 56 Q48 40 44 28" fill="none" stroke="var(--c-trunk)" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 28 Q34 22 26 28 M44 28 Q54 20 62 26 M44 28 Q40 18 46 12" fill="none" stroke="var(--c-env)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {/* 물결 */}
      <svg className="sticker sticker-wave" viewBox="0 0 88 88">
        <rect x="2" y="2" width="84" height="84" rx="20" fill="var(--c-water)" stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M12 38 q8 -8 16 0 t16 0 t16 0 t16 0" fill="none" stroke="var(--c-paper)" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 56 q8 -8 16 0 t16 0 t16 0 t16 0" fill="none" stroke="var(--c-paper)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {/* 온도계 */}
      <svg className="sticker sticker-thermo" viewBox="0 0 72 88">
        <rect x="2" y="2" width="68" height="84" rx="20" fill="var(--c-life-wash)" stroke="var(--c-ink)" strokeWidth="2" />
        <rect x="29" y="14" width="14" height="44" rx="7" fill="var(--c-paper)" stroke="var(--c-ink)" strokeWidth="2" />
        <circle cx="36" cy="64" r="11" fill="var(--c-life)" stroke="var(--c-ink)" strokeWidth="2" />
        <rect x="33" y="30" width="6" height="30" rx="3" fill="var(--c-life)" />
      </svg>
      {/* 나뭇잎 */}
      <svg className="sticker sticker-leaf" viewBox="0 0 80 80">
        <rect x="2" y="2" width="76" height="76" rx="20" fill="var(--c-env-wash)" stroke="var(--c-ink)" strokeWidth="2" />
        <path d="M20 60 Q18 22 60 18 Q62 58 20 60 Z" fill="var(--c-env)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 58 L52 28" stroke="var(--c-ink)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
