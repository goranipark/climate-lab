# todo.md — 기후변화 탐사 연구소 구현 순서

> 근거 문서: concept.md(기능) · design.md(화면) · data.md + `src/data/*.json`(내용)
> 이 문서의 범위: React(Vite) 정적 사이트 구현 순서, 로컬 실행용 setup 스크립트, Vercel 배포
> 작성일: 2026-11-04 · 4~5차시(모형실험): **11/16~20 주**

---

## 0. 일정 (11/16 수업에서 거꾸로 계산)

4~5차시가 11월 16일 주라서 plan.md의 "11/20 1차 배포"로는 늦다. **③ + ④ + 근거 노트를 11/12(목)까지 먼저 배포**하고, ⑦은 수업을 마친 뒤에 만든다.

| 날짜 | 할 일 | 마일스톤 | 담당 |
| --- | --- | --- | --- |
| 11/5(목) | 프로젝트 준비·공통 뼈대 완료, 역할 분담 정리 | M0·M1 ✓ | Opus |
| 11/6(금)~11/10(화) | ③ 해수면 실험실 | M2 | Opus |
| 11/6(금)~11/10(화) | ④ 영향 탐사 카드 (병행) | M3 | GPT 6.1 |
| 11/6(금)~11/10(화) | 실제 그림 3장(11/9까지), 카드 그림 11장(11/10까지), 아이콘 | 애셋 A·B·C | Codex |
| 11/11(수) | 서로 검토, `main` 합치기, 배포 도구(화면 검사·QR·오프라인) | M4 준비 | GPT 6.1 (도구), Opus (합치기) |
| **11/12(목)** | **1차 배포** (③④ + 노트 + 저장) | M4 | Opus + 교사 승인 |
| 11/13(금) | 교사 크롬북·전자칠판 리허설, 반별 QR 출력, 급한 수정 | M4 | 교사, Opus |
| **11/16~20** | **4~5차시 수업** (실사용 = 시범 사용). 수업 중 나온 문제 기록 | — | 교사 |
| 11/23(월)~11/26(목) | ⑦ 서술 연습 / 수업 피드백 반영 | M5 | Opus / GPT 6.1 |
| **11/27(금)** | **2차 배포** (⑦ + 인쇄) | M6 | Opus + 교사 승인 |
| 12월 1주 | ⑦ 서술 연습 차시 | — | 교사 |
| 12월 2주 | 서·논술형 평가 → 여유가 있으면 2차 제작 탭(①②⑤⑥) | M7 | 나눠서 |

> 역할 분담과 파일 담당은 `AGENTS.md`, 그림 주문은 `docs/asset-requests.md`.
>
> 11/12까지 ③④를 다 못 끝낼 때의 우선순위: ③(1·2·3·5단계) → 근거 노트 → 내보내기/불러오기 → ④ → ③ 4단계(실제 그림). ③ 4단계 그림은 처음에는 단순한 그림으로 배포하고 나중에 다듬어도 된다.

## 1. 구현 규칙 (모든 작업 공통)

1. **서버·DB·API 키 없음.** 정적 파일만 만든다. `fetch`로 외부 API를 부르지 않는다. 외부로 나가는 것은 태백 카드의 링크(새 탭) 하나뿐이다.
2. **저장은 localStorage**, 기기 이동은 내보내기/불러오기 코드(data.md 7장).
3. **화면 문구는 전부 `src/data/*.json`에서 가져온다.** 컴포넌트에 한국어 문구를 직접 쓰지 않는다(버튼 이름 포함). 없는 문구가 필요하면 json에 추가하고 data.md도 고친다.
4. **과학적 원인(온실효과 등)은 다루지 않는다.** 금지어 검사(`npm run check:data`, `npm run check:text`)가 통과해야 한다.
5. **나라 이름을 답으로 요구하는 퀴즈·선택지·빈칸을 만들지 않는다.**
6. **점수·등급을 화면에 보여 주지 않는다.**
7. **코드 주석은 한국어로 쓴다.** 함수·컴포넌트 위에 "무엇을 하는지" 한 줄 주석을 단다. 변수·함수 이름은 영어.
8. 디자인 수치는 design.md 10장의 CSS 토큰만 쓴다. 그림자·그라데이션 금지. 크기는 rem.
9. 마일스톤 하나를 끝낼 때마다 `npm run check`(데이터 검사 + 금지어 + 타입 + 테스트 + 빌드)가 통과해야 한다.
10. 마일스톤마다 커밋을 나누고, 커밋 메시지는 한국어로 "M2: 디지털 실험 컵 붓기" 형식.

## 2. 기술 구성

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 빌드 | Vite 5 + React 18 + TypeScript | plan.md 결정. TypeScript는 json 구조 실수를 빌드 때 잡기 위해 |
| 상태 | React Context + `useReducer` | 라이브러리 없이. 학생 기록 하나가 상태의 전부 |
| 화면 이동 | 해시(`#/lab`, `#/cards`, `#/write`) 직접 처리 | 라우터 라이브러리 불필요, 정적 배포에서 새로고침 문제 없음 |
| 스타일 | 일반 CSS + CSS 변수(design.md 10장) | 빌드 설정 최소화. `src/styles/`의 tokens·base·app.css + 기능별 css |
| 아이콘 | `lucide-react` | design.md 6.5 |
| 글꼴 | `pretendard` npm 패키지(가변 글꼴 woff2를 번들에 포함) | 외부 글꼴 서버 호출 없음 |
| 압축 | `lz-string` | 내보내기 코드(data.md 7장) |
| 끌어다 놓기 | 직접 구현(Pointer Events) | 컵 하나만 끌면 되므로 라이브러리 불필요. 마우스·터치·펜 공통 |
| 오프라인 | `vite-plugin-pwa` (generateSW, 정적 파일 미리 저장) | 첫 접속 뒤 네트워크가 끊겨도 동작 |
| 테스트 | `vitest` + `@testing-library/react`, 화면 검사는 `playwright` | 규칙(잠금·저장·완성 글)과 1366×630 한 화면 검사 |
| QR | `qrcode` (개발용 스크립트에서만) | 반별 접속 QR 이미지 만들기 |
| Node | 20 LTS 이상 | Vercel 기본값과 맞춤 |

## 3. 폴더 구조

```
climate-lab/
├─ concept.md  design.md  data.md  todo.md     # 기획 문서
├─ setup.sh  setup.bat                         # 로컬 실행 스크립트 (5장)
├─ index.html                                  # <html lang="ko">
├─ package.json  tsconfig.json  vite.config.ts  vercel.json
├─ public/
│  ├─ images/                                  # 교사가 바꿔 넣는 그림 (data.md 8장)
│  └─ icon-192.png  icon-512.png               # PWA 아이콘
├─ scripts/
│  ├─ check-data.mjs                           # data.md 10장 검사
│  ├─ check-text.mjs                           # src 안 한국어 하드코딩·금지어 검사
│  └─ make-qr.mjs                              # 반별 QR PNG 만들기
├─ src/
│  ├─ main.tsx  App.tsx
│  ├─ data/                                    # json 5개 (완성됨)
│  ├─ types/data.ts                            # json 구조 타입
│  ├─ types/record.ts                          # 학생 기록 타입 (data.md 7장)
│  ├─ styles/tokens.css  base.css  print.css
│  ├─ store/
│  │  ├─ RecordContext.tsx                     # 학생 기록 상태 + 저장
│  │  ├─ reducer.ts                            # 기록 바꾸는 동작 모음
│  │  ├─ storage.ts                            # localStorage 읽기/쓰기, 용량 초과 처리
│  │  ├─ exportCode.ts                         # 내보내기/불러오기 코드
│  │  ├─ selectors.ts                          # 잠금 조건, 노트 개수 계산
│  │  └─ migrate.ts                            # 기록 버전 바꾸기
│  ├─ lib/
│  │  ├─ template.ts                           # "{class}반" 같은 자리 채우기
│  │  ├─ compose.ts                            # ⑦ 완성 글 만들기
│  │  ├─ photo.ts                              # 사진 줄이기(긴 변 800px JPEG)
│  │  └─ hashRoute.ts
│  ├─ components/                              # 공용: TopBar, Tabs, Button, Pill, AreaTag, Toast, Modal, Stepper …
│  ├─ features/
│  │  ├─ start/                                # 시작 화면
│  │  ├─ notes/                                # 근거 노트 패널
│  │  ├─ lab/                                  # ③ 해수면 실험실
│  │  │  ├─ tank/                              # 수조 SVG, 컵, 가까이 보기, 육지 막대
│  │  │  ├─ scenes/                            # 실제 그림 3장 SVG
│  │  │  └─ steps/                             # Predict, Experiment, Compare, Real, Summary
│  │  ├─ cards/                                # ④ 영향 탐사 카드 (+ illustrations/)
│  │  └─ write/                                # ⑦ 서술 연습
│  └─ tests/
└─ qr/                                         # make-qr 결과 (배포에는 포함 안 함)
```

## 4. 구현 순서

각 항목의 괄호는 참고할 문서 위치다. 체크박스는 구현하면서 끝낼 때마다 표시한다.

### M0. 프로젝트 준비 (11/5)

- [x] Vite React TS 프로젝트 만들기, 위 폴더 구조로 정리, `index.html`에 `lang="ko"`, 제목 "기후변화 탐사 연구소"
- [x] 패키지 설치: `react react-dom lucide-react lz-string pretendard` / 개발용 `typescript vite @vitejs/plugin-react vitest @testing-library/react @testing-library/jest-dom jsdom qrcode` (`vite-plugin-pwa`는 M4에서 추가, Playwright는 개발 컴퓨터에 설치된 것을 씀)
- [x] `package.json` 스크립트

  | 이름 | 하는 일 |
  | --- | --- |
  | `dev` | `vite --host` (같은 와이파이의 크롬북에서 접속 확인용) |
  | `build` | `tsc --noEmit && vite build` |
  | `preview` | `vite preview --host` |
  | `check:data` | `node scripts/check-data.mjs` |
  | `check:text` | `node scripts/check-text.mjs` |
  | `test` | `vitest run` |
  | `test:screen` | `node scripts/screen-check.mjs` (M4) |
  | `qr` | `node scripts/make-qr.mjs` |
  | `check` | `check:data` → `check:text` → `test` → `build` 차례로 |

- [x] `src/types/data.ts`: json 5개의 타입 정의, json을 `import`해서 타입을 맞춘다(구조가 어긋나면 빌드 실패)
- [x] `scripts/check-data.mjs`: data.md 10장 1~6번 검사 그대로
- [x] `scripts/check-text.mjs`: ① `src/**/*.tsx`에서 json을 거치지 않은 한글 문자열 찾기(주석 제외) ② 금지어가 `src` 전체 문자열에 있는지 검사
- [x] `src/styles/tokens.css`(design.md 10장 그대로), `base.css`(Pretendard 불러오기, `word-break: keep-all`, 바탕 `--c-canvas`)
- [x] `setup.sh` 동작 확인(5장) — `setup.bat`은 윈도우에서 첫 실행 때 확인

완료 기준: `./setup.sh`로 빈 화면이 뜨고 `npm run check` 통과.

### M1. 공통 뼈대 (11/5~11/7) — concept.md 4·6·7장, design.md 2.2·2.3·6.2·7장

- [x] `types/record.ts`: data.md 7장 학생 기록 구조
- [x] `storage.ts`: 반·번호별 키(`config.storage`), 저장은 입력 뒤 1초 모아서(debounce), 용량 초과 시 `messages.storageFull` 안내
- [x] `RecordContext` + `reducer`: 기록 바꾸는 동작을 모두 reducer 동작으로(예: `PREDICT_SUBMIT`, `POUR_CUP`, `SET_ROW_STATE`, `ADD_NOTE`, `REMOVE_NOTE` …)
- [x] 시작 화면: 반(1~`classCount` + 교사)·번호·이름, 같은 반·번호 기록 확인창, 마지막 학생 미리 채우기
  - [x] 주소에 `?class=3`이 있으면 반을 미리 골라 둔다(반별 QR용)
- [x] 상단 바: 로고·앱 이름, 탭 3개(pill, 잠금 상태), 학생 정보, `가+` 큰 글자 토글, 메뉴
- [x] 해시 이동: `#/lab` `#/cards` `#/write`, 마지막 탭·단계 다시 열기
- [x] 탭 잠금(`selectors.ts`): ⑦ = `kind:"card"` 노트 중 life ≥1, env ≥1. 잠긴 탭 누르면 말풍선. 교사 모드는 모두 열림
- [x] 근거 노트 패널: 요약 개수, 필터, 항목(영역 색·태그·출처·빼기), 접기/펴기, 새 항목 강조, 같은 `source+sourceRef`는 덮어쓰기
- [x] 메뉴: 내보내기(코드 + 복사 + 사진 안내, 미저장 점 ●), 불러오기(확인창·오류), 학생 바꾸기, 이 기기에서 지우기(2번 확인)
- [x] `exportCode.ts`: `CL1-` + `lz-string` 압축, 사진 제외, 버전 확인
- [x] 큰 글자 모드: `html[data-size="large"]`, 기기 단위 저장(`uiKey`), 큰 글자 모드에서 노트 기본 접힘
- [x] 토스트, 안내 줄, 확인창 공용 컴포넌트
- [x] 테스트: 저장 키 분리(2반 3번 / 3반 3번), 내보내기→불러오기 왕복, 잠금 조건, 노트 덮어쓰기

완료 기준: 학생 두 명을 번갈아 시작해도 기록이 섞이지 않고, 내보내기 코드로 다른 브라우저에서 같은 상태가 복원된다.

### M2. ③ 해수면 실험실 (11/6~11/10) · 담당 Opus — concept.md 5.1, design.md 2.4·5장, data.md 4장

수조부터 만들고 단계를 붙인다. 2단계 디지털 실험이 이 앱의 핵심 화면이다.

- [ ] **수조 SVG 컴포넌트** (`tank/Tank.tsx`): viewBox 600×340, 상자·자갈 경사면·섬·집·나무·물(design.md 5.2 표 배치). `cups`(0~3)를 받아 `simulation.levels[cups].water`로 수위를 그린다. 물은 모형 앞에 반투명으로
  - [ ] 모형 배치 높이로 계산한 잠김 상태가 `simulation.levels[].states`와 같은지 테스트(그림과 데이터가 어긋나지 않게)
  - [ ] 눈금·숫자가 그림에 없다
- [ ] 육지 막대(`DryLandBar`): `dryLand` 비율, 숫자 없음, 수위와 같은 1.2초
- [ ] 컵(`Cup`): 끌어다 놓기(Pointer Events, 수조 위에서 놓으면 붓기, 끄는 동안 수조 테두리 강조) + `컵 붓기` 버튼 + 키보드. 잠금 상태(회색·자물쇠·`pourLocked` 툴팁)
- [ ] 붓기 움직임(design.md 5.3): 기울임 → 물줄기 + 수위 상승 → 제자리 → 바뀐 모형 라벨. `prefers-reduced-motion` 처리. `aria-live`로 `liveTemplate` 읽기
- [ ] 가까이 보기(`CloseUp`): 모형 누르면 2.5배 확대 창, 바깥 누르기/Esc 닫기, 키보드로도 열기
- [ ] 단계 표시줄(Stepper): 5단계, 잠금 조건(concept.md 5.1 표)
- [ ] 1단계 예측: 물 붓기 전 수조 + 모형별 3택 + 까닭(5자 이상) → 제출 후 잠금
- [ ] 2단계 디지털 실험:
  - [ ] 안내 줄이 순서에 따라 바뀜(`experiment.guide`)
  - [ ] 붓기 전 가까이 보기 1번 이상 해야 컵 활성화
  - [ ] 이번 잔 기록 카드(상태 pill 3×3 + 이때 본 것) / 지난 잔 요약 접기·펼치기
  - [ ] 이번 잔 줄을 다 채워야 다음 컵 활성화
  - [ ] 고른 상태 ≠ 수조 상태면 "다시 살펴볼까요?" + 가까이 보기 연결. 틀림 표시 없음, 그대로 두면 저장
  - [ ] `처음부터 다시 하기`(물만 비움, 확인창). 이미 기록한 잔은 기록 없이 다시 부을 수 있음
  - [ ] 줄마다 `근거로 담기` → 노트(`lab-record`)
  - [ ] 말풍선 질문(`levels[].bubble`)
- [ ] 3단계 결과 비교: 예측 ↔ 3잔 뒤 기록 표(같으면 ✓, 다르면 노랑 점), 같았나요?(필수), 달랐던 점, `다시 보기` 자동 재생, 교실 실험(선택: 사진 1장 `lib/photo.ts` + 메모, 사진은 별도 키)
- [ ] 4단계 모형 → 실제: `모형 | 실제` 토글, 그림 3장(**Codex 파일**, 묶음 A. 들어오기 전에는 기본 그림) + "상상해 본 모습" 라벨 고정, 두 줄 카드, 수치 상자 + 출처 말풍선. 3장 모두 보면 5단계 열림
- [ ] 5단계 정리: "해수면이 상승하면" + 입력 2개(10자 이상) → 노트 담기(덮어쓰기), 마무리 문구
- [ ] 테스트: 예측 전 2단계 잠김, 기록 전 다음 컵 잠김, 3잔 기록 전 3단계 잠김, 노트 덮어쓰기

완료 기준: 크롬북 크기(1366×630)에서 스크롤 없이 5단계를 끝까지 할 수 있고, 터치·마우스·키보드로 모두 컵을 부을 수 있다.

### M3. ④ 영향 탐사 카드 (11/6~11/10) · 담당 GPT 6.1 (그림은 Codex) — concept.md 5.2, design.md 2.5·5.6·6.1, data.md 5장

- [ ] 카드 그림: **Codex가 파일로** 만든다(`docs/asset-requests.md` 묶음 B). 화면은 `image`가 빈칸일 때 보여 줄 단순한 기본 그림(영역 아이콘 크게)부터 만들고, 파일이 들어오면 `<img>`로 바꿔 보여 준다
- [ ] 필터줄(전체/생활/환경/담은 카드) + 진행 표시(`labels.progress`)
- [ ] 6열 × 2줄 격자, 생활 → 환경 → 태백 순서, 안 읽은 카드 노랑 점
- [ ] 크게 보기 + 뒤집기(가운데 480×440으로 커지며 rotateY, 덮개, 닫기, reduced-motion이면 겹쳐 바뀌기)
- [ ] 뒷면: 무슨 일/누가 피해/예시/최근 사례(둘 다 있을 때)/출처/내 말로 한 줄/`근거로 담기`↔`담았어요 ✓`
- [ ] 뒷면을 본 카드만 담기 가능(`cards.flipped`)
- [ ] 현상 태그: `phenomenon`이 있을 때만 "기온 변화"/"강수량 변화"
- [ ] 태백 카드: 점선 외곽선, 링크 새 탭(`rel="noopener"`), "우리 지역은 ___" 5자 이상 → 노트(`local`), 잠금 조건에 안 셈
- [ ] ⑦이 처음 열리는 순간 토스트(`unlockedToast`). 노트에서 빼서 다시 잠기면 ⑦에 `relockedNotice`
- [ ] 테스트: 생활 1 + 환경 1 담으면 ⑦ 열림, 태백 카드만으로는 안 열림, 카드 빼면 체크 풀림

완료 기준: 카드 10장 + 태백 카드가 1366×630에 한 화면으로 보이고, 담기·빼기가 노트와 맞물려 동작한다.

### M4. 1차 배포 + 리허설 (11/11~11/13) · 도구 GPT 6.1, 배포 Opus — 6장, concept.md 9장

- [ ] `vite-plugin-pwa` 설정(정적 파일 미리 저장, 자동 업데이트). 업데이트가 있으면 다음 접속에서 반영
- [ ] `vercel.json` 작성(6.3), Vercel 배포(6장)
- [ ] `scripts/screen-check.mjs`: Playwright로 1366×630에서 ③ 각 단계·④ 화면을 열어 세로 스크롤이 없는지 확인하고 스크린샷 저장. 1920×1080 + 큰 글자 모드도 같은 검사
- [ ] `scripts/make-qr.mjs`: 배포 주소 + `?class=1~N` QR PNG를 `qr/`에 만들기 (`npm run qr -- https://배포주소`)
- [ ] concept.md 9장 완료 기준 중 ③④·저장 항목 직접 확인
- [ ] **교사 리허설(11/13)**: 실제 크롬북 1대 + 전자칠판에서
  - [ ] QR로 접속 → 시작 → ③ 5단계 끝까지 → ④ 카드 2장 담기 → 내보내기 코드 패들렛에 붙이기
  - [ ] 다른 크롬북에서 그 코드로 불러오기
  - [ ] 학교 와이파이에서 기후정보포털 링크가 열리는지(concept.md Q4)
  - [ ] 인터넷을 끊고 새로고침해도 앱이 열리는지
- [ ] 리허설에서 나온 문제를 아래 9장 "수업 피드백"에 적기

### M5. ⑦ 서술 연습 (11/23~11/26) · 담당 Opus — concept.md 5.3, design.md 2.6·6.3·8장, data.md 6장

- [ ] 왼쪽 노트(340) + 오른쪽 글쓰기(634) 배치, 공용 노트 패널 숨김
- [ ] 서술 틀(`frame`) 고정 문구 + 칸 4개(영역색 테두리), 고른 칸 강조 + 추천 노트 점(`suggestFrom`)
- [ ] 노트 항목 누르면 고른 칸의 커서 위치에 문장 넣기
- [ ] 가져온 문장 표시(연노랑 + 점선 밑줄): textarea 뒤에 같은 글을 그리는 표시층(backdrop)을 겹치는 방식. 글자를 고치면 그 구간 표시가 줄어들거나 사라짐(`writing.imports`)
- [ ] 자기 점검(`selfCheck`): 공백 뺀 10자 기준, 빠진 항목만 문구, 모두 있으면 `allOkText`/`allOkWithExtraText`, 안 고친 문장 남으면 `unchangedImportText`. 점수 없음
- [ ] `lib/compose.ts`: data.md 6.1 완성 글 규칙 + 테스트(마침표 중복, 빈 칸 빼기)
- [ ] `print.css`: A4 세로 1장(design.md 8장), 넘치면 11pt, 그래도 넘치면 안내
- [ ] 글 복사(`copyTemplate`), 복사 토스트
- [ ] 교사 모드에서만 `예시 글 보기`(`teacherExample`)
- [ ] ③ 정리 문장이 없으면 안내 줄(`noLabNotice`)
- [ ] 테스트: 완성 글, 점검 결과, 다시 잠긴 상태에서 쓴 글 유지

### M6. 2차 배포 (11/27) · 담당 Opus

- [ ] 4~5차시 수업 피드백 반영분 + ⑦ 배포
- [ ] 이전 기록(11/16 주에 저장된 기록)이 그대로 열리는지 확인. 기록 구조를 바꿨다면 `migrate.ts`에 변환 추가
- [ ] 인쇄 리허설: 학교 프린터로 A4 1장
- [ ] concept.md 9장 완료 기준 전체 확인

### M7. 여유가 있을 때 (12월 2주 이후)

- [ ] plan.md 2차 제작 탭: ⑤ 대응 방법 + 7일 실천표 → ⑥ 말판 퀴즈 → ① 소식 카드 → ② 장소별 행동 찾기 (평가 뒤 단원 마무리에 쓰는 순서)
- [ ] 새 탭마다 concept/design/data 문서를 먼저 보충한 뒤 구현

## 5. 로컬 실행 (setup 스크립트)

선생님 컴퓨터에서 앱을 띄워 보는 방법이다. 프로젝트 맨 위 폴더에 `setup.sh`(맥·리눅스·크롬북 리눅스)와 `setup.bat`(윈도우)이 있다. M0에서 `package.json`이 만들어진 뒤부터 동작한다.

### 5.1 처음 한 번: Node.js 설치

<https://nodejs.org> 에서 **LTS(20 이상)** 를 내려받아 설치한다. 설치 뒤 터미널(윈도우는 명령 프롬프트)에서 확인:

```bash
node -v
```

### 5.2 실행

맥·리눅스:

```bash
./setup.sh
```

윈도우(폴더에서 `setup.bat` 더블클릭 또는):

```bash
setup.bat
```

스크립트가 하는 일: ① Node 버전 확인 ② 패키지 설치(`npm ci`, 잠금 파일이 없으면 `npm install`) ③ 데이터 검사(`npm run check:data`) ④ 개발 서버 실행. 브라우저에서 <http://localhost:5173> 이 열린다.

배포본과 똑같이 빌드해서 보고 싶을 때:

```bash
./setup.sh preview
```

json을 고친 뒤 데이터만 검사할 때:

```bash
npm run check:data
```

> `dev`와 `preview`는 `--host`로 실행되므로, 같은 와이파이의 크롬북에서 화면에 표시되는 `Network:` 주소로 접속해 볼 수 있다. 학교 와이파이에서 기기끼리 접속이 막혀 있으면 이 방법은 안 되고, Vercel 배포본으로 확인한다.

## 6. 배포 (Vercel)

서버 없는 정적 사이트라 Vercel 무료(Hobby) 요금제로 충분하다. 빌드 결과물(`dist/`)만 올라간다.

### 6.1 방법 A: GitHub 연결 (추천)

코드를 GitHub에 올려 두면, 고칠 때마다 자동으로 다시 배포된다.

1. GitHub에 저장소를 만들고 이 폴더를 올린다(`qr/`, `node_modules/`, `dist/`는 `.gitignore`).
2. <https://vercel.com> 로그인 → **Add New… → Project** → 그 저장소 **Import**.
3. 설정 확인 후 **Deploy**:

   | 항목 | 값 |
   | --- | --- |
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm ci` |
   | Node.js Version | 20.x 이상 |
   | Environment Variables | **없음** (API 키를 쓰지 않는다) |

4. 배포 주소(`https://프로젝트이름.vercel.app`)가 나온다. **Settings → Domains**에서 기억하기 쉬운 이름으로 바꿀 수 있다(예: `climate-lab-4.vercel.app`).
5. 이후에는 `main` 브랜치에 올릴 때마다 자동 배포. 다른 브랜치에 올리면 미리보기 주소가 따로 생겨 수업용 주소에 영향 없이 확인할 수 있다.

### 6.2 방법 B: 명령어로 바로 배포

GitHub 없이 선생님 컴퓨터에서 바로 올릴 때:

```bash
npx vercel login
```

```bash
npx vercel
```

(처음 한 번: 질문에 기본값으로 답하면 Vite 설정을 알아서 찾는다. 미리보기 주소가 나온다.)

```bash
npx vercel --prod
```

(수업용 주소에 반영)

### 6.3 vercel.json

해시 이동(`#/lab`)을 쓰므로 주소 다시 쓰기(rewrite)는 필요 없다. 캐시만 정한다.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(index.html|sw.js|manifest.webmanifest)",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    }
  ]
}
```

### 6.4 배포 뒤 할 일

- [ ] 반별 QR 만들기: `npm run qr -- https://배포주소` → `qr/1반.png` … (주소 끝에 `?class=1` 등이 붙어 반이 미리 골라짐)
- [ ] 반별 패들렛에 접속 주소와 "내 기록 코드" 칸 만들기
- [ ] 교사 크롬북·전자칠판에서 6.1의 주소로 리허설(M4)
- [ ] 수업 직전에 고친 내용을 배포했다면, 학생 크롬북에서 한 번 새로고침해 새 버전을 받게 하기(오프라인 저장 때문에 이전 버전이 보일 수 있음)

### 6.5 json만 고쳐서 다시 배포하기 (교사용)

1. `src/data/*.json` 수정(data.md 8장)
2. `npm run check:data`
3. 방법 A: GitHub에 올리기(웹에서 파일 바로 고쳐도 됨) → 자동 배포 / 방법 B: `npx vercel --prod`

## 7. 테스트 목록 요약

| 종류 | 무엇을 | 언제 |
| --- | --- | --- |
| 데이터 검사 | data.md 10장 1~6 | 매 커밋, 배포 전 |
| 문구 검사 | 하드코딩 한글, 금지어 | 매 커밋 |
| 단위 테스트 | 저장 키 분리, 내보내기 왕복, 잠금 조건, 노트 덮어쓰기, 수조 배치 ↔ 상태 일치, 완성 글 규칙, 자기 점검 | 매 커밋 |
| 화면 검사 | 1366×630 스크롤 없음, 1920×1080 큰 글자 모드 | M4, M6 |
| 실기기 리허설 | 크롬북 터치·카메라, 전자칠판, 학교 와이파이, 오프라인, 인쇄 | 11/13, 11/27 |

## 8. 작업 진행 방법

역할 분담·파일 담당·브랜치 규칙은 **`AGENTS.md`**에 있다(11/5 결정). 요약:

| 담당 | 맡는 일 |
| --- | --- |
| Claude Opus | 기본 코딩·조율: 공용 코드, M2 ③, M5 ⑦, 검토 반영·합치기·배포 |
| GPT 6.1 | 병행 코딩: M3 ④, M4 배포 도구, Opus 작업 검토 |
| Codex | 그림·애셋: `docs/asset-requests.md` 주문서 |

### 8.1 GPT 6.1에게 붙여 넣을 요청문 (M3)

```text
goranipark/climate-lab 저장소에서 작업해 줘.
AGENTS.md를 먼저 읽고, 역할 분담표의 "GPT 6.1" 줄과 파일 담당표를 지켜 줘.
todo.md의 M3(④ 영향 탐사 카드)를 구현해 줘. 참고: concept.md 5.2, design.md 2.5·5.6·6.1, data.md 5장.
- 최신 main에서 gpt/m3-cards 브랜치를 만들어.
- 화면은 src/features/cards/CardsTab.tsx에서 시작하고, 기록 동작은 src/store/slices/cards.ts(CARDS_FLIP 등)와 공용 UPSERT_NOTE·REMOVE_NOTE를 써.
- 카드 그림은 Codex가 public/images/cards/에 따로 넣는다. image가 빈칸이면 기본 그림을 보여 주고, 경로가 있으면 <img>로 보여 줘.
- 문구는 src/data/cards.json에서만 가져오고, 주석은 한국어로.
- 공용 파일(src/types, src/store/*.ts, App.tsx, app.css 등)을 바꿔야 하면 고치지 말고 PR 설명에 요청으로 적어.
- npm run check를 통과시키고, 1366×630 스크린샷을 붙여 PR을 열어 줘.
```

### 8.2 검토와 합치기

- PR 하나 = 마일스톤 하나(또는 애셋 묶음 하나). `npm run check` 통과 + 1366×630 스크린샷 필수.
- Opus 작업은 GPT 6.1이, GPT 6.1 작업은 Opus가 검토한다. Codex 애셋은 Opus가 화면에 붙여 본 뒤 검토한다.
- 교사 승인 후 `main`에 합친다. 수업 주(11/16~20)에는 수업 시간 밖에서만 합친다.

## 9. 수업 피드백 (리허설·4~5차시에 채우기)

| 날짜 | 반 | 문제 | 고칠 곳 | 반영 |
| --- | --- | --- | --- | --- |
| | | | | |
