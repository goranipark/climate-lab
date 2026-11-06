// 완성 그림 "되살아난 바다" 기본판 (Codex 그림이 오기 전). viewBox 600×450, 4열×3줄로 잘라 배지 칸마다 한 조각.
// 칸 배치: 1줄 하늘(해·구름·새), 2줄 바닷가(갯벌 게·배·섬마을), 3줄 바닷속(바다 숲·바다거북·물고기·조개)
export const PUZZLE_W = 600;
export const PUZZLE_H = 450;
export const PUZZLE_COLS = 4;
export const PUZZLE_CELL = 150;

interface Props {
  /** 잘라 볼 영역. 없으면 그림 전체 */
  viewBox?: string;
  title?: string;
  className?: string;
}

export function PuzzleArt({ viewBox, title, className }: Props) {
  const S = { stroke: 'var(--c-ink)', strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <svg
      viewBox={viewBox ?? `0 0 ${PUZZLE_W} ${PUZZLE_H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {/* 하늘 */}
      <rect width={PUZZLE_W} height={PUZZLE_H} fill="var(--c-canvas)" />
      {/* 해 */}
      <circle cx="75" cy="72" r="36" fill="var(--c-attn)" {...S} />
      <g {...S} fill="none">
        <path d="M75 20 V8 M75 136 V124 M23 72 H11 M139 72 H127 M38 35 L30 27 M120 117 L112 109 M38 109 L30 117 M120 27 L112 35" />
      </g>
      {/* 구름 */}
      <path d="M190 78 Q192 52 220 56 Q232 36 256 50 Q282 46 282 72 Q296 80 284 92 L196 92 Q178 88 190 78 Z" fill="var(--c-paper)" {...S} />
      <path d="M362 56 Q366 36 388 40 Q402 24 422 36 Q446 34 444 56 Q456 64 446 74 L370 74 Q352 70 362 56 Z" fill="var(--c-paper)" {...S} />
      {/* 새 */}
      <g fill="none" {...S}>
        <path d="M318 112 q10 -10 20 0 q10 -10 20 0" />
        <path d="M486 70 q8 -8 16 0 q8 -8 16 0" />
        <path d="M528 104 q7 -7 14 0 q7 -7 14 0" />
      </g>

      {/* 바다 */}
      <rect x="0" y="200" width={PUZZLE_W} height="250" fill="var(--c-water)" />
      <path d="M0 200 H600" stroke="var(--c-water-line)" strokeWidth="4" />
      <g fill="none" stroke="var(--c-paper)" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M190 232 q10 -6 20 0 t20 0" />
        <path d="M300 262 q10 -6 20 0 t20 0" />
        <path d="M120 290 q10 -6 20 0 t20 0" />
      </g>

      {/* 섬마을 */}
      <path d="M340 214 Q392 150 470 152 Q540 140 600 150 L600 226 Q470 236 340 214 Z" fill="var(--c-land)" {...S} />
      <g {...S}>
        <rect x="430" y="140" width="9" height="40" fill="var(--c-trunk)" />
        <circle cx="434" cy="128" r="22" fill="var(--c-env)" />
        <rect x="574" y="128" width="9" height="40" fill="var(--c-trunk)" />
        <circle cx="578" cy="116" r="20" fill="var(--c-env)" />
        <rect x="468" y="166" width="42" height="34" fill="var(--c-paper)" />
        <path d="M460 168 L489 140 L518 168 Z" fill="var(--c-life)" />
        <rect x="484" y="182" width="10" height="18" fill="var(--c-water-line)" />
        <rect x="524" y="160" width="38" height="32" fill="var(--c-paper)" />
        <path d="M516 162 L543 136 L570 162 Z" fill="var(--c-life)" />
        <rect x="390" y="176" width="26" height="24" fill="var(--c-paper)" />
        <path d="M384 178 L403 160 L422 178 Z" fill="var(--c-life)" />
      </g>

      {/* 갯벌과 게 */}
      <path d="M0 214 Q70 206 150 238 Q152 268 120 292 Q60 300 0 296 Z" fill="var(--c-land)" {...S} />
      <g fill="var(--c-land-dot)">
        <circle cx="30" cy="236" r="3" />
        <circle cx="96" cy="262" r="3" />
        <circle cx="128" cy="250" r="2.5" />
        <circle cx="20" cy="276" r="2.5" />
      </g>
      <g {...S}>
        <path d="M46 262 L34 250 M48 252 L40 240 M94 262 L106 250 M92 252 L100 240" fill="none" />
        <ellipse cx="70" cy="266" rx="26" ry="15" fill="var(--c-life)" />
        <circle cx="62" cy="250" r="4" fill="var(--c-paper)" />
        <circle cx="78" cy="250" r="4" fill="var(--c-paper)" />
        <path d="M50 278 L42 288 M90 278 L98 288" fill="none" />
      </g>
      <path d="M118 278 q8 -12 16 0 Z" fill="var(--c-exp-wash)" {...S} />

      {/* 배 */}
      <g {...S}>
        <path d="M200 206 L290 206 L276 228 L214 228 Z" fill="var(--c-life)" />
        <path d="M246 206 V150" fill="none" />
        <path d="M248 154 L284 198 L248 198 Z" fill="var(--c-paper)" />
        <path d="M244 162 L214 198 L244 198 Z" fill="var(--c-attn)" />
      </g>

      {/* 바다 바닥 */}
      <path d="M0 428 Q150 404 300 426 T600 418 L600 450 L0 450 Z" fill="var(--c-land)" {...S} />

      {/* 바다 숲(해조류) */}
      <g fill="none" stroke="var(--c-env)" strokeWidth="9" strokeLinecap="round">
        <path d="M34 432 Q20 400 38 372 Q54 346 36 318" />
        <path d="M76 428 Q92 396 72 368 Q56 342 76 312" />
        <path d="M116 430 Q102 404 118 378 Q132 356 118 336" />
      </g>
      <g fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinecap="round">
        <path d="M34 432 Q20 400 38 372 Q54 346 36 318" opacity="0.35" />
        <path d="M76 428 Q92 396 72 368 Q56 342 76 312" opacity="0.35" />
      </g>

      {/* 바다거북 */}
      <g {...S}>
        <ellipse cx="190" cy="372" rx="16" ry="8" fill="var(--c-env)" transform="rotate(-30 190 372)" />
        <ellipse cx="190" cy="404" rx="16" ry="8" fill="var(--c-env)" transform="rotate(30 190 404)" />
        <ellipse cx="262" cy="370" rx="12" ry="6" fill="var(--c-env)" transform="rotate(30 262 370)" />
        <ellipse cx="262" cy="404" rx="12" ry="6" fill="var(--c-env)" transform="rotate(-30 262 404)" />
        <circle cx="282" cy="386" r="13" fill="var(--c-env)" />
        <ellipse cx="228" cy="388" rx="40" ry="26" fill="var(--c-trunk)" />
        <path d="M206 378 L228 368 L250 378 L250 398 L228 408 L206 398 Z" fill="none" />
        <circle cx="286" cy="382" r="2.5" fill="var(--c-ink)" />
      </g>

      {/* 물고기 */}
      <g {...S}>
        <path d="M334 332 L318 318 L318 346 Z" fill="var(--c-life)" />
        <ellipse cx="360" cy="332" rx="28" ry="16" fill="var(--c-life)" />
        <circle cx="374" cy="328" r="3" fill="var(--c-ink)" />
        <path d="M394 392 L380 380 L380 404 Z" fill="var(--c-attn)" />
        <ellipse cx="416" cy="392" rx="24" ry="13" fill="var(--c-attn)" />
        <circle cx="428" cy="388" r="2.5" fill="var(--c-ink)" />
      </g>

      {/* 물고기 떼와 조개 */}
      <g {...S}>
        {[
          [486, 320],
          [530, 340],
          [500, 360],
          [548, 306],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <path d={`M${x - 14} ${y} L${x - 24} ${y - 8} L${x - 24} ${y + 8} Z`} fill="var(--c-paper)" />
            <ellipse cx={x} cy={y} rx="14" ry="8" fill="var(--c-paper)" />
          </g>
        ))}
        <path d="M500 424 Q520 396 540 424 Z" fill="var(--c-exp-wash)" />
        <path d="M508 422 L516 404 M520 422 V400 M532 422 L524 404" fill="none" strokeWidth="1.5" />
        <circle cx="570" cy="416" r="9" fill="var(--c-life-wash)" />
      </g>
    </svg>
  );
}
