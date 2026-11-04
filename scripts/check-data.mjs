// 데이터(json) 검사 스크립트 — data.md 10장의 검사 1~6번
// 사용법: npm run check:data
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src', 'data');
const FILES = ['config', 'sources', 'lab', 'cards', 'writing'];

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// 1. json 문법 검사
const data = {};
for (const name of FILES) {
  try {
    data[name] = JSON.parse(readFileSync(join(dataDir, `${name}.json`), 'utf8'));
  } catch (e) {
    fail(`${name}.json 문법 오류: ${e.message}`);
  }
}
if (errors.length) report();

const { config, sources, lab, cards, writing } = data;

// 밑줄(_) 키와 금지어 목록을 뺀 모든 문자열을 [경로, 값]으로 모은다
function collectStrings(obj, path, out) {
  if (typeof obj === 'string') out.push([path, obj]);
  else if (Array.isArray(obj)) obj.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('_') || k === 'bannedWords') continue;
      collectStrings(v, `${path}.${k}`, out);
    }
  }
  return out;
}
const allStrings = FILES.flatMap((name) => collectStrings(data[name], name, []));

// 2. 금지어 검사
const banned = config.bannedWords.words;
for (const [path, s] of allStrings) {
  for (const w of banned) if (s.includes(w)) fail(`금지어 "${w}": ${path} → ${s}`);
}

// 3. cards.json 검사
const sourceIds = new Set(sources.sources.map((s) => s.id));
const life = cards.cards.filter((c) => c.area === 'life').length;
const env = cards.cards.filter((c) => c.area === 'env').length;
if (life !== 5 || env !== 5) fail(`영향 카드는 생활 5장·환경 5장이어야 해요 (지금 생활 ${life}, 환경 ${env})`);
const ids = new Set();
for (const c of [...cards.cards, cards.localCard]) {
  if (ids.has(c.id)) fail(`카드 id 중복: ${c.id}`);
  ids.add(c.id);
  for (const sid of c.sourceIds ?? []) if (!sourceIds.has(sid)) fail(`카드 ${c.id}: 없는 출처 id "${sid}"`);
}
for (const c of cards.cards) {
  for (const key of ['title', 'question', 'what', 'who']) if (!c[key]) fail(`카드 ${c.id}: ${key}가 비어 있어요`);
  if (c.recentExample && !c.recentSourceText) fail(`카드 ${c.id}: 최근 사례(recentExample)를 넣었으면 출처(recentSourceText)도 넣어 주세요`);
  if (c.phenomenon !== null && !(c.phenomenon in config.phenomena)) fail(`카드 ${c.id}: phenomenon은 temperature/precipitation/null 중 하나`);
}
for (const f of lab.facts) for (const sid of f.sourceIds) if (!sourceIds.has(sid)) fail(`수치 ${f.id}: 없는 출처 id "${sid}"`);

// 4. lab.json 수조 단계 검사 (design.md 5.2 표와 같아야 함)
const EXPECTED = [
  { island: 'none', house: 'none', tree: 'none' },
  { island: 'partial', house: 'none', tree: 'none' },
  { island: 'full', house: 'partial', tree: 'none' },
  { island: 'full', house: 'full', tree: 'partial' },
];
const levels = lab.simulation.levels;
if (levels.length !== 4) fail('simulation.levels는 컵 0~3 네 단계여야 해요');
levels.forEach((lv, i) => {
  if (lv.cup !== i) fail(`simulation.levels[${i}].cup은 ${i}이어야 해요`);
  for (const m of ['island', 'house', 'tree']) {
    if (lv.states[m] !== EXPECTED[i]?.[m]) fail(`컵 ${i}잔 ${m} 상태가 design.md 5.2 표와 달라요 (${lv.states[m]} ≠ ${EXPECTED[i]?.[m]})`);
  }
  if (i > 0) {
    if (!(lv.water > levels[i - 1].water)) fail(`컵 ${i}잔 water는 앞 단계보다 커야 해요`);
    if (!(lv.dryLand < levels[i - 1].dryLand)) fail(`컵 ${i}잔 dryLand는 앞 단계보다 작아야 해요`);
  }
});
for (const sc of lab.real.scenes) for (const fid of sc.factIds) if (!lab.facts.some((f) => f.id === fid)) fail(`실제 그림 ${sc.id}: 없는 수치 id "${fid}"`);

// 5. writing.json 검사
const fieldIds = new Set(writing.fields.map((f) => f.id));
if (writing.selfCheck.items.length !== 3) fail('자기 점검 항목은 3개여야 해요');
for (const it of writing.selfCheck.items) if (!fieldIds.has(it.fieldId)) fail(`자기 점검 ${it.id}: 없는 칸 id "${it.fieldId}"`);

// 6. 수치 허용 목록 (data.md 2장 표 + 쪽수·컵 수 같은 화면 숫자)
const ALLOWED = new Set([
  '1991', '2000', '3.80', '2011', '2020', '4.27', '10', '2100', '0.63', '1.01', '2', '1', '1,200', '100', '20',
  '2023', '3', '25', '4', '8', '14', '2022', '3,000', '6', '5', '8.5', '57', '92', '357', '361', '362',
]);
const numberSkip = /(^config\.(storage|student|app)|\.url$)/;
for (const [path, s] of allStrings) {
  if (numberSkip.test(path)) continue;
  for (const n of s.match(/\d+(?:[.,]\d+)*/g) ?? []) {
    if (!ALLOWED.has(n)) warn(`허용 목록에 없는 숫자 "${n}": ${path} → data.md 2장 표에 있는 수치인지 확인`);
  }
}

report();

function report() {
  for (const w of warnings) console.warn(`⚠ ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    console.error(`\n데이터 검사 실패: 오류 ${errors.length}개`);
    process.exit(1);
  }
  console.log(`✓ 데이터 검사 통과 (json ${FILES.length}개${warnings.length ? `, 경고 ${warnings.length}개` : ''})`);
  process.exit(0);
}
