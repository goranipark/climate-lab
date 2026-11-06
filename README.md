# 기후변화 탐사 연구소

4학년 과학 4단원 「기후변화와 우리 생활」 수업용 웹앱입니다. 서버·DB·API 키 없이 정적 사이트(React + Vite)로 만들고 GitHub Pages에 배포합니다.

## 문서 (읽는 순서)

1. [concept.md](concept.md) — 1차 제작 범위(③ 해수면 실험실, ④ 영향 탐사 카드, ⑦ 서술 연습, 근거 노트)의 화면 흐름과 기능
2. [design.md](design.md) — 크롬북 1366×768 레이아웃, 생활/환경 색 체계, 수조 일러스트 규칙, 큰 글자 모드
3. [data.md](data.md) + [`src/data/`](src/data) — 카드·실험·서술 틀 내용과 학생 기록 구조
4. [todo.md](todo.md) — 구현 순서와 담당, 로컬 실행, GitHub Pages 배포

배포 주소: https://goranipark.github.io/climate-lab/

## 작업 규칙

- [AGENTS.md](AGENTS.md) — 역할 분담(Claude Opus · GPT 6.1 · Codex), 파일 담당, 브랜치·PR 규칙
- [docs/asset-requests.md](docs/asset-requests.md) — Codex 그림 주문서

## 로컬 실행

`todo.md` M0(프로젝트 준비)이 끝난 뒤부터 동작합니다.

```bash
./setup.sh
```

윈도우는 `setup.bat`을 실행합니다.
