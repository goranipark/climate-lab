// 반별 QR 만들기 (npm run qr, todo.md M4)
// 사용법: npm run qr                        → 기본 배포 주소로
//         npm run qr -- https://다른주소/     → 그 주소로
// 결과: qr/1반.png ~ qr/N반.png (주소?class=n) + 교실에 붙일 A4 한 장 qr/index.html (qr/는 git에 올리지 않음)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const DEFAULT_URL = 'https://goranipark.github.io/climate-lab/';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qr');
const config = JSON.parse(readFileSync(join(root, 'src', 'data', 'config.json'), 'utf8'));
const classCount = config.student.classCount;

/** 주소를 검사하고 끝에 /가 없으면 붙인다 (하위 경로 /climate-lab/ 유지) */
function baseUrl(arg) {
  let u;
  try {
    u = new URL(arg ?? DEFAULT_URL);
  } catch {
    console.error(`✗ 주소가 올바르지 않아요: ${arg}`);
    process.exit(1);
  }
  if (!/^https?:$/.test(u.protocol)) {
    console.error('✗ http:// 또는 https:// 주소를 넣어 주세요.');
    process.exit(1);
  }
  u.search = '';
  u.hash = '';
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u;
}

/** n반 주소: 배포주소?class=n */
function classUrl(base, n) {
  const u = new URL(base);
  u.searchParams.set('class', String(n));
  return u.toString();
}

/** 인쇄 시트 글자에 넣을 때 깨지지 않게 */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function main() {
  const base = baseUrl(process.argv[2]);
  mkdirSync(outDir, { recursive: true });

  const items = [];
  for (let n = 1; n <= classCount; n += 1) {
    const url = classUrl(base, n);
    const file = `${n}반.png`;
    // 교실 뒤에서도 찍히게 크게(900px), 오류 보정은 중간(M)
    await QRCode.toFile(join(outDir, file), url, { width: 900, margin: 2, errorCorrectionLevel: 'M' });
    items.push({ n, url, file, short: url.replace(/^https?:\/\//, '') });
    console.log(`✓ qr/${file}  ${url}`);
  }

  // A4 한 장: 2열 × 3행 (반이 6개보다 많으면 다음 장으로 넘어간다)
  const cards = items
    .map(
      (it) => `<figure class="card">
  <img src="${encodeURIComponent(it.file)}" alt="${it.n}반 QR">
  <figcaption><strong>${it.n}반</strong><span>${esc(it.short)}</span></figcaption>
</figure>`,
    )
    .join('\n');
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${esc(config.app.name)} 반별 QR</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Pretendard, "Malgun Gothic", sans-serif; color: #1f2a44; }
  h1 { font-size: 16pt; text-align: center; margin: 0 0 6mm; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
  .card { margin: 0; border: 0.4mm solid #1f2a44; border-radius: 4mm; padding: 4mm; text-align: center; break-inside: avoid; }
  .card img { width: 62mm; height: 62mm; display: block; margin: 0 auto; }
  figcaption strong { display: block; font-size: 22pt; margin-top: 2mm; }
  figcaption span { font-size: 9pt; word-break: break-all; }
</style>
</head>
<body>
<h1>${esc(config.app.name)}</h1>
<div class="grid">
${cards}
</div>
</body>
</html>
`;
  writeFileSync(join(outDir, 'index.html'), html);
  console.log('✓ qr/index.html (A4 인쇄용, 브라우저에서 열어 인쇄)');
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
});
