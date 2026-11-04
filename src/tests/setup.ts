// 테스트 공통 설정: DOM 검사 도우미 불러오기, 테스트마다 localStorage 비우기
import '@testing-library/jest-dom/vitest';

beforeEach(() => {
  window.localStorage.clear();
});
