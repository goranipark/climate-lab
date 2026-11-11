// 화면 흐름 테스트: 시작 화면 → 메인 화면, 잠긴 탭 안내
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { config, game } from '../types/data';

function startAs(classNo: string, number: string, name: string) {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: classNo } });
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0], { target: { value: number } });
  fireEvent.change(inputs[1], { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: config.ui.start.startButton }));
}

/** 연구원증을 받고 첫 미션 브리핑을 닫는다 */
function issueCard() {
  fireEvent.click(screen.getByRole('button', { name: game.ui.issueButton }));
  fireEvent.click(screen.getByRole('button', { name: game.ui.briefingStart }));
}

describe('시작 화면', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('입력이 빠지면 안내가 나오고 시작되지 않는다', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: config.ui.start.startButton }));
    expect(screen.getByRole('alert')).toHaveTextContent(config.ui.start.errors.class);
  });

  it('처음 시작하면 연구원증 발급 → 연구소장 첫 미션이 나온다', () => {
    render(<App />);
    startAs('3', '12', 'Kim');
    expect(screen.getByText(game.ui.issueTitle)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: game.ui.issueButton }));
    expect(screen.getByRole('dialog', { name: game.missions['lab-predict'].title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: game.ui.briefingStart }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('반·번호·이름을 넣으면 메인 화면과 근거 노트가 보인다', () => {
    render(<App />);
    startAs('3', '12', 'Kim');
    issueCard();
    expect(screen.getByRole('button', { name: config.ui.tabs.lab })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: config.ui.notes.title })).toBeInTheDocument();
    expect(screen.getByText(config.ui.notes.empty)).toBeInTheDocument();
  });

  it('⑦ 탭은 잠겨 있고 누르면 안내가 뜬다', () => {
    render(<App />);
    startAs('3', '12', 'Kim');
    issueCard();
    fireEvent.click(screen.getByRole('button', { name: config.ui.tabs.write }));
    expect(screen.getByRole('status')).toHaveTextContent(config.unlock.write.lockedMessage);
    expect(window.location.hash).not.toBe('#/write');
  });

  it('학생을 바꾸면 이전 학생의 탭 해시가 초기화되어 새 학생의 기본 탭이 열린다', () => {
    render(<App />);
    startAs('3', '12', 'Kim');
    issueCard();
    fireEvent.click(screen.getByRole('button', { name: config.ui.tabs.cards }));
    fireEvent.click(screen.getByRole('button', { name: game.ui.briefingStart }));
    expect(window.location.hash).toBe('#/cards');

    fireEvent.click(screen.getByRole('button', { name: config.ui.topbar.menu }));
    fireEvent.click(screen.getByRole('menuitem', { name: config.ui.menu.switch }));
    expect(window.location.hash).toBe('');

    startAs('3', '15', 'Lee');
    issueCard();
    expect(window.location.hash).toBe('#/lab');
  });
});
