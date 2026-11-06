# AGENTS.md — 기후변화 탐사 연구소 작업 규칙

이 저장소에서 일하는 모든 AI 담당(Claude Opus, GPT 6.1, Codex)과 사람이 따르는 규칙이다. 작업을 시작하기 전에 이 파일과 `todo.md`를 먼저 읽는다.

## 1. 역할 분담 (2026-11-05 결정)

| 담당 | 맡는 일 | 맡지 않는 일 |
| --- | --- | --- |
| **Claude Opus** (기본 코딩·조율) | 공용 코드(타입·저장소·App·스타일 토큰·json 구조), ③ 해수면 실험실(M2), ⑦ 서술 연습(M5), 브랜치 합치기, 문서 고치기 | 정지 그림 파일 그리기 |
| **GPT 6.1** (병행 코딩) | ④ 영향 탐사 카드(M3), 배포 도구(M4: 화면 검사·QR·오프라인), 다른 담당 코드 검토 | 공용 파일 구조 바꾸기(필요하면 PR에 요청으로 적기) |
| **Codex** (그림·애셋) | `docs/asset-requests.md`의 정지 그림 SVG, 앱 아이콘, 그림을 json `image` 칸에 연결 | 화면 코드(`src/**/*.tsx`) 고치기 |
| **교사** | 확인·결정, 교실 리허설, `main` 합치기 승인 | — |

- 코딩 담당 두 명은 **서로의 PR을 검토**한다(Opus 작업 → GPT 검토, GPT 작업 → Opus 검토).
- 움직이는 그림(수조·컵·가까이 보기)은 상태와 맞물려야 하므로 **코드 담당이 SVG 컴포넌트로** 만든다. Codex는 정지 그림만 맡는다.

## 2. 파일 담당 (같은 파일을 동시에 고치지 않기)

| 경로 | 담당 | 다른 담당이 고쳐야 할 때 |
| --- | --- | --- |
| `src/types/`, `src/store/*.ts`(slices 제외), `src/App.tsx`, `src/components/`, `src/styles/tokens.css`·`base.css`·`app.css`, `src/data/config.json` | Opus | PR 설명에 "공용 파일 변경 요청"으로 적고 Opus가 반영 |
| `src/features/lab/`, `src/store/slices/lab.ts`, `src/data/lab.json`(문구) | Opus | — |
| `src/features/write/`, `src/store/slices/write.ts`, `src/data/writing.json`(문구) | Opus | — |
| `src/features/game/`, `src/store/slices/game.ts`, `src/data/game.json` (게임 요소: 연구원증·미션·배지) | Opus | 배지 조건이 카드 기록에 기대면 PR에 적기 |
| `src/features/cards/`, `src/store/slices/cards.ts`, `src/data/cards.json`(문구) | GPT 6.1 | `image` 칸은 Codex도 고칠 수 있음 |
| `scripts/screen-check.mjs`, `scripts/make-qr.mjs`, `vercel.json`, PWA 설정 | GPT 6.1 | `vite.config.ts`를 고치면 PR에 적기 |
| `public/images/**` | Codex | — |
| `src/data/*.json`의 `image` 칸 | Codex | — |
| `*.md` 기획 문서 | Opus (교사 결정 반영) | 고칠 내용을 PR에 적기 |

- 화면별 기록 동작은 `src/store/slices/<화면>.ts`에만 추가한다. 동작 이름 앞머리는 `LAB_`, `CARDS_`, `WRITE_`.
- 각 탭 화면의 진입점은 `src/features/<화면>/<Lab|Cards|Write>Tab.tsx` 하나이고, `App.tsx`는 이것만 부른다.
- 화면 전용 스타일은 `src/features/<화면>/<화면>.css`에 두고 진입점에서 `import`한다. 공용 클래스(`.btn`, `.tag`, `.panel` 등)는 `app.css` 것을 쓴다.

## 3. 브랜치와 PR

| 담당 | 브랜치 이름 | 예 |
| --- | --- | --- |
| Opus | `build/<마일스톤>-<내용>` | `build/m2-lab` |
| GPT 6.1 | `gpt/<마일스톤>-<내용>` | `gpt/m3-cards` |
| Codex | `assets/<묶음>` | `assets/scenes`, `assets/cards` |

1. 항상 최신 `main`에서 브랜치를 만든다.
2. 작업이 끝나면 `npm run check`가 통과한 상태로 PR을 연다. PR 설명에 ① 한 일 ② 확인한 것(스크린샷 1366×630) ③ 공용 파일 변경 요청을 적는다.
3. 다른 코딩 담당이 검토하고, 교사가 승인하면 `main`에 합친다.
4. `main`에 합치면 Vercel이 자동으로 배포한다(M4 이후). 그래서 **수업 중(11/16~20)에는 수업 시간 밖에서만 합친다.**

## 4. 모든 코드에 지키는 규칙

1. 서버·DB·API 키 없음. 정적 파일만. 외부로 나가는 것은 태백 카드 링크(새 탭) 하나뿐.
2. 저장은 localStorage + 내보내기/불러오기 코드(data.md 7장).
3. 화면 문구는 전부 `src/data/*.json`에서 가져온다. `src/**/*.tsx`에 한국어 문구를 쓰면 `npm run check:text`가 실패한다.
4. 과학적 원인(온실효과 등)을 다루지 않는다. 금지어 검사를 통과해야 한다.
5. 나라 이름을 답으로 요구하는 퀴즈·선택지·빈칸을 만들지 않는다.
6. 점수·등급을 화면에 보여 주지 않는다.
7. **코드 주석은 한국어.** 함수·컴포넌트 위에 무엇을 하는지 한 줄. 변수·함수 이름은 영어.
8. 디자인 값은 `src/styles/tokens.css` 변수만 쓴다. 크기는 rem. 화면 틀(버튼·탭·패널)은 납작하게(그림자·그라데이션 없음). **입체 표현(그라데이션·그림자·반사광)은 수조·배지·배지 케이스·그림에만** 쓴다(11/6 결정, design.md 3.6).
9. 크롬북 1366×630에서 세로 스크롤 없이 보여야 한다(⑦ 글쓰기 칸 내부 스크롤만 예외).

## 5. 그림(애셋) 규칙 — Codex

- 주문서: `docs/asset-requests.md`. 주문서에 없는 그림은 만들지 않는다.
- **11/6부터 그림은 3D 렌더링 느낌 이미지로 바꾼다.** 원본은 교사가 ChatGPT로 만들고(`docs/image-prompts.md`), Codex는 크기 정리·WebP 변환·json 연결을 맡는다. 지금 SVG는 새 그림이 올 때까지 쓰는 임시판이다.
- 파일 위치·이름·크기(viewBox)는 주문서 그대로. SVG 안에 글자·숫자·눈금을 넣지 않는다(라벨은 앱이 그 위에 얹는다).
- 그림을 넣은 뒤 해당 json의 `image` 칸에 경로를 적고 `npm run check`를 돌린다.

## 6. 확인 명령

```bash
npm run check
```

데이터 검사 → 문구 검사 → 테스트 → 빌드를 차례로 한다. 화면 확인은 `npm run dev` 후 1366×630 창에서 본다.

## 7. 참고 문서

| 문서 | 내용 |
| --- | --- |
| `concept.md` | 화면 흐름과 기능 (무엇을) |
| `design.md` | 레이아웃·색·그림 규칙 (어떻게 보이게) |
| `data.md` + `src/data/*.json` | 문구·수치·기록 구조 |
| `todo.md` | 구현 순서와 담당, 일정 |
| `docs/asset-requests.md` | 그림 주문서 |
