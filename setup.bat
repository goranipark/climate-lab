@echo off
chcp 65001 >nul
rem 기후변화 탐사 연구소 - 로컬 실행 스크립트 (윈도우)
rem 사용법: setup.bat          -> 개발 서버 실행
rem         setup.bat preview  -> 배포본과 같게 빌드한 뒤 미리보기
setlocal

rem 스크립트가 있는 폴더(프로젝트 맨 위)로 이동
cd /d "%~dp0"

set MODE=%1
if "%MODE%"=="" set MODE=dev

rem 1. Node.js 확인
where node >nul 2>nul
if errorlevel 1 (
  echo [안내] Node.js가 없어요. https://nodejs.org 에서 LTS^(20 이상^)를 설치한 뒤 다시 실행해 주세요.
  pause
  exit /b 1
)
for /f %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 20 (
  echo [안내] Node.js 버전이 너무 오래됐어요. 20 이상으로 업데이트해 주세요.
  pause
  exit /b 1
)
echo [1/4] Node.js 확인 완료

rem 2. package.json 확인 (M0 작업 뒤부터 있음)
if not exist package.json (
  echo [안내] package.json이 아직 없어요. todo.md M0^(프로젝트 준비^)가 끝난 뒤 실행해 주세요.
  pause
  exit /b 1
)

rem 3. 패키지 설치
echo [2/4] 패키지 설치
if exist package-lock.json (
  call npm ci || goto :fail
) else (
  call npm install || goto :fail
)

rem 4. 데이터(json) 검사
echo [3/4] 데이터 검사
call npm run check:data || goto :fail

rem 5. 실행
if /i "%MODE%"=="preview" (
  echo [4/4] 빌드 후 미리보기 ^(주소: http://localhost:4173^)
  call npm run build || goto :fail
  call npm run preview
) else (
  echo [4/4] 개발 서버 실행 ^(주소: http://localhost:5173^)
  call npm run dev
)
exit /b 0

:fail
echo [오류] 위의 메시지를 확인해 주세요.
pause
exit /b 1
