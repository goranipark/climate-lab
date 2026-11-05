// 실제 그림 파일(Codex 담당)이 들어오기 전에 보여 주는 단순한 기본 그림. 왼쪽 바다, 오른쪽 땅.
export function SceneFallback({ id, title }: { id: string; title: string }) {
  const flat = id === 'tidal-flat';
  return (
    <svg viewBox="0 0 600 340" className="scene-img" role="img" aria-label={title}>
      <title>{title}</title>
      <rect width="600" height="340" fill="var(--c-canvas)" />
      {/* 땅 */}
      <path d="M200 340 L280 220 L600 200 L600 340 Z" fill="var(--c-land)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
      {flat ? (
        // 갯벌: 게와 조개
        <g stroke="var(--c-ink)" strokeWidth="2">
          <ellipse cx="470" cy="236" rx="16" ry="10" fill="var(--c-life)" />
          <ellipse cx="530" cy="250" rx="10" ry="7" fill="var(--c-exp-wash)" />
        </g>
      ) : (
        // 섬마을: 집 두 채와 나무
        <g stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round">
          <rect x="330" y="186" width="44" height="34" fill="var(--c-paper)" />
          <path d="M324 188 L352 160 L380 188 Z" fill="var(--c-life)" />
          <rect x="420" y="180" width="44" height="34" fill="var(--c-paper)" />
          <path d="M414 182 L442 154 L470 182 Z" fill="var(--c-life)" />
          <rect x="520" y="150" width="8" height="54" fill="var(--c-trunk)" />
          <circle cx="524" cy="140" r="22" fill="var(--c-env)" />
        </g>
      )}
      {/* 물: 땅 쪽으로 들어온 바다 */}
      <rect x="0" y="214" width="600" height="126" fill="var(--c-water)" fillOpacity="0.55" />
      <line x1="0" y1="214" x2="600" y2="214" stroke="var(--c-water-line)" strokeWidth="3" />
    </svg>
  );
}
