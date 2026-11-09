// 화면 검사 (npm run test:screen, todo.md M4)
// 1) 지금 소스로 새로 빌드한다 (예전 dist를 검사하지 않게)
// 2) vite preview 서버를 이 스크립트 안에서 띄운다 (Windows에서도 끝나면 서버가 남지 않게)
// 3) 1366×630 기본, 1920×1080 큰 글자 모드에서 시작 화면·③ 5단계·④ 카드·⑦ 서술 연습을 열어
//    세로 스크롤이 없는지 보고 screenshots/에 저장한다 (⑦은 글쓰기 칸 안쪽 스크롤만 허용)
// 4) 서비스 워커가 화면을 맡은 뒤 인터넷을 끊고 새로고침해도 앱이 열리는지 본다
//
// 브라우저는 내려받지 않고 컴퓨터에 깔린 Edge 또는 Chrome을 쓴다.
// 다른 브라우저를 쓰려면: CHROMIUM_PATH=브라우저경로 npm run test:screen
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotDir = join(root, 'screenshots');
const config = JSON.parse(readFileSync(join(root, 'src', 'data', 'config.json'), 'utf8'));
const uiKey = config.storage.uiKey.replace('{prefix}', config.storage.prefix);

const SUITES = [
  { prefix: '1366x630', width: 1366, height: 630, large: false },
  { prefix: '1920x1080-big', width: 1920, height: 1080, large: true },
];
const LAB_STEPS = ['predict', 'experiment', 'compare', 'real', 'summary'];

/** 컴퓨터에 깔린 브라우저를 찾아 연다: CHROMIUM_PATH → Edge → Chrome 순서 */
async function launchBrowser() {
  const tries = process.env.CHROMIUM_PATH
    ? [{ executablePath: process.env.CHROMIUM_PATH }]
    : [{ channel: 'msedge' }, { channel: 'chrome' }];
  for (const opt of tries) {
    try {
      return await chromium.launch({ headless: true, ...opt });
    } catch {
      // 다음 후보 시도
    }
  }
  throw new Error('브라우저를 열지 못했어요. Edge나 Chrome을 설치하거나 CHROMIUM_PATH로 브라우저 경로를 알려 주세요.');
}

/** 문서 전체(시작 화면) 또는 .content(탭 화면)에 세로 스크롤이 생겼는지 */
async function verticalOverflow(page, selector) {
  return page.evaluate((sel) => {
    const el = sel ? document.querySelector(sel) : document.documentElement;
    if (!el) return { missing: true };
    return { over: el.scrollHeight - el.clientHeight, scroll: el.scrollHeight, client: el.clientHeight };
  }, selector);
}

/** 화면 하나: 스크린샷을 찍고 스크롤 여부를 기록 */
async function checkScreen(page, failures, name, selector) {
  await page.waitForTimeout(200);
  const file = `${name}.png`;
  await page.screenshot({ path: join(shotDir, file) });
  const r = await verticalOverflow(page, selector);
  if (r.missing) failures.push(`${name}: ${selector} 요소가 없음`);
  else if (r.over > 1) failures.push(`${name}: 세로 스크롤 ${r.scroll}/${r.client}px`);
  else console.log(`  ✓ ${name} (${r.scroll}/${r.client}px) → screenshots/${file}`);
}

/** 해상도 하나에서 8개 화면 검사 */
async function runSuite(browser, url, suite, failures) {
  const context = await browser.newContext({ viewport: { width: suite.width, height: suite.height } });
  const page = await context.newPage();
  try {
    await page.goto(url);
    await page.evaluate(
      ({ key, large }) => {
        localStorage.clear();
        if (large) localStorage.setItem(key, JSON.stringify({ size: 'large' }));
      },
      { key: uiKey, large: suite.large },
    );
    await page.reload();
    await page.waitForSelector('.start');
    await checkScreen(page, failures, `${suite.prefix}-01-start`, null);

    // 교사 시연 모드: 연구원증·브리핑 없이 들어가고 모든 단계가 열린다
    await page.selectOption('.start select', 'teacher');
    await page.click('.start button[type="submit"]');
    await page.waitForSelector('.content');
    const big = await page.evaluate(() => document.documentElement.dataset.size);
    if (suite.large && big !== 'large') failures.push(`${suite.prefix}: 큰 글자 모드가 켜지지 않음`);

    for (let i = 0; i < LAB_STEPS.length; i += 1) {
      await page.locator('.stepper .step-pill').nth(i).click();
      await checkScreen(page, failures, `${suite.prefix}-02-lab-${i + 1}-${LAB_STEPS[i]}`, '.content');
    }
    await page.locator('.topbar .tabs .tab').nth(1).click();
    await page.waitForSelector('.cards-grid');
    await checkScreen(page, failures, `${suite.prefix}-03-cards`, '.content');
    await page.locator('.topbar .tabs .tab').nth(2).click();
    await page.waitForSelector('.write');
    await checkScreen(page, failures, `${suite.prefix}-04-write`, '.content');
  } finally {
    await context.close();
  }
}

/** 서비스 워커가 화면을 맡은 뒤 인터넷을 끊고 ?class=3 주소로 새로고침해도 앱이 열리는지 */
async function runOffline(browser, url, failures) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 630 } });
  const page = await context.newPage();
  try {
    const classUrl = `${url}?class=3`;
    await page.goto(classUrl);
    await page.evaluate(() => navigator.serviceWorker.ready);
    // 첫 방문 화면은 아직 서비스 워커가 맡지 않을 수 있어 한 번 더 연다
    await page.reload();
    const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
    if (!controlled) {
      failures.push('오프라인: 서비스 워커가 화면을 맡지 않음');
      return;
    }
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('.start', { timeout: 5000 });
    const picked = await page.inputValue('.start select');
    await page.screenshot({ path: join(shotDir, 'offline-start.png') });
    if (picked !== '3') failures.push(`오프라인: ?class=3인데 반 선택이 ${picked}`);
    else console.log('  ✓ 인터넷을 끊고 새로고침해도 시작 화면이 열림(3반 미리 선택) → screenshots/offline-start.png');
  } catch (e) {
    failures.push(`오프라인: ${e.message.split('\n')[0]}`);
  } finally {
    await context.close();
  }
}

async function main() {
  mkdirSync(shotDir, { recursive: true });
  console.log('빌드 중...');
  await build({ root, logLevel: 'warn' });

  const server = await preview({ root, logLevel: 'warn', preview: { host: '127.0.0.1', port: 4173, strictPort: false } });
  const url = server.resolvedUrls.local[0];
  const failures = [];
  try {
    const browser = await launchBrowser();
    try {
      for (const suite of SUITES) {
        console.log(`\n${suite.width}×${suite.height}${suite.large ? ' 큰 글자' : ''}`);
        await runSuite(browser, url, suite, failures);
      }
      console.log('\n오프라인');
      await runOffline(browser, url, failures);
    } finally {
      await browser.close().catch(() => {});
    }
  } finally {
    await new Promise((resolve) => server.httpServer.close(resolve));
  }

  if (failures.length) {
    console.error('\n✗ 화면 검사 실패');
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log('\n✓ 화면 검사 통과');
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
});
