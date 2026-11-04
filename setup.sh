#!/usr/bin/env bash
# 기후변화 탐사 연구소 — 로컬 실행 스크립트 (맥·리눅스·크롬북 리눅스)
# 사용법: ./setup.sh          → 개발 서버 실행
#         ./setup.sh preview  → 배포본과 같게 빌드한 뒤 미리보기
set -euo pipefail

# 스크립트가 있는 폴더(프로젝트 맨 위)로 이동
cd "$(dirname "$0")"

MODE="${1:-dev}"
NEED_NODE=20

# 1. Node.js 확인
if ! command -v node >/dev/null 2>&1; then
  echo "[안내] Node.js가 없어요. https://nodejs.org 에서 LTS(${NEED_NODE} 이상)를 설치한 뒤 다시 실행해 주세요."
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt "$NEED_NODE" ]; then
  echo "[안내] Node.js $(node -v) 는 너무 오래됐어요. ${NEED_NODE} 이상으로 업데이트해 주세요."
  exit 1
fi
echo "[1/4] Node.js $(node -v) 확인"

# 2. package.json 확인 (M0 작업 뒤부터 있음)
if [ ! -f package.json ]; then
  echo "[안내] package.json이 아직 없어요. todo.md M0(프로젝트 준비)가 끝난 뒤 실행해 주세요."
  exit 1
fi

# 3. 패키지 설치: 잠금 파일이 있으면 그대로(npm ci), 없으면 새로 설치
echo "[2/4] 패키지 설치"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# 4. 데이터(json) 검사
echo "[3/4] 데이터 검사"
npm run check:data

# 5. 실행
if [ "$MODE" = "preview" ]; then
  echo "[4/4] 빌드 후 미리보기 (주소: http://localhost:4173)"
  npm run build
  npm run preview
else
  echo "[4/4] 개발 서버 실행 (주소: http://localhost:5173)"
  npm run dev
fi
