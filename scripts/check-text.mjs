// 문구 검사 스크립트
// ① 컴포넌트·코드(src/**/*.ts, *.tsx)에 한국어 문구가 직접 들어갔는지 (주석은 제외)
// ② 코드 속 문자열에 금지어가 있는지
// 사용법: npm run check:text
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');
const banned = JSON.parse(readFileSync(join(srcDir, 'data', 'config.json'), 'utf8')).bannedWords.words;

// 검사하지 않는 폴더: 데이터(json)와 테스트
const SKIP_DIRS = new Set(['data', 'tests']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

// 주석을 지운 코드 (문자열 안의 // 는 거의 없으므로 단순 처리)
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

const problems = [];
for (const file of walk(srcDir)) {
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    const where = `${relative(root, file)}:${i + 1}`;
    if (/[가-힣]/.test(line)) problems.push(`한국어 문구 직접 사용 ${where} → json으로 옮겨 주세요: ${line.trim()}`);
    for (const w of banned) if (line.includes(w)) problems.push(`금지어 "${w}" ${where}`);
  });
}

if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\n문구 검사 실패: ${problems.length}개`);
  process.exit(1);
}
console.log('✓ 문구 검사 통과 (코드에 한국어 하드코딩·금지어 없음)');
