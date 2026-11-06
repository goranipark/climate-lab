// 실제 앱과 노트를 함께 사용하여 카드 담기·빼기·잠금·복원 흐름을 확인한다.
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import App from '../../App';
import data from '../../data/cards.json';
import { config, game } from '../../types/data';
import { loadRecord } from '../../store/storage';

// jsdom에는 없는 네이티브 대화상자의 열림 상태만 보충한다.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});

beforeEach(() => { window.location.hash = ''; });

// 학생으로 시작하여 카드 탭을 연다.
function start() {
  render(<App />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } });
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0], { target: { value: '12' } });
  fireEvent.change(inputs[1], { target: { value: 'Kim' } });
  fireEvent.click(screen.getByRole('button', { name: config.ui.start.startButton }));
  // 게임 요소(연구원증·미션 브리핑)를 지나 카드 탭으로
  fireEvent.click(screen.getByRole('button', { name: game.ui.issueButton }));
  fireEvent.click(screen.getByRole('button', { name: game.ui.briefingStart }));
  fireEvent.click(screen.getByRole('button', { name: config.ui.tabs.cards }));
  fireEvent.click(screen.getByRole('button', { name: game.ui.briefingStart }));
}

// 격자에서 카드를 열어 뒷면을 읽는다.
function openCard(title: string) {
  fireEvent.click(screen.getByRole('button', { name: title }));
  return within(screen.getByRole('dialog'));
}

// 대화상자를 닫아 격자로 돌아간다.
function closeCard() {
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: data.ui.close }));
}

it('생활과 환경을 담으면 열리고 노트에서 빼면 체크와 잠금이 함께 바뀐다', async () => {
  start();
  const region = within(screen.getByRole('region', { name: data.ui.title }));
  expect(region.getAllByRole('article')).toHaveLength(11);
  expect(region.getAllByRole('img', { name: data.ui.unread })).toHaveLength(11);
  let detail = openCard(data.cards[0].title);
  expect(detail.getByText(data.cards[0].what, { exact: false })).toBeInTheDocument();
  fireEvent.change(detail.getByRole('textbox'), { target: { value: '건강을 지켜야 해요' } });
  fireEvent.click(detail.getByRole('button', { name: data.labels.collectLabel }));
  expect(detail.getByRole('button', { name: data.labels.collectedLabel })).toBeInTheDocument();
  closeCard();
  detail = openCard(data.cards[8].title);
  fireEvent.click(detail.getByRole('button', { name: data.labels.collectLabel }));
  expect(screen.getByText(config.unlock.write.unlockedToast)).toBeInTheDocument();
  closeCard();
  expect(region.getAllByLabelText(data.labels.collectedLabel)).toHaveLength(2);
  const notes = within(screen.getByRole('complementary', { name: config.ui.notes.title }));
  expect(notes.getByText('건강을 지켜야 해요')).toBeInTheDocument();
  fireEvent.click(notes.getAllByRole('button', { name: config.ui.notes.remove })[0]);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: config.ui.common.confirm }));
  await waitFor(() => expect(region.getAllByLabelText(data.labels.collectedLabel)).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: config.ui.tabs.write }));
  expect(screen.getByRole('status')).toHaveTextContent(config.unlock.write.lockedMessage);
});

it('지역 기록은 다섯 글자부터 담을 수 있고 생활 진행 수와 잠금을 바꾸지 않는다', () => {
  start();
  const detail = openCard(data.localCard.title);
  expect(detail.getByRole('button', { name: data.labels.collectLabel })).toBeDisabled();
  const link = detail.getByRole('link', { name: data.localCard.linkLabel });
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  fireEvent.change(detail.getByRole('textbox'), { target: { value: '    짧음    ' } });
  expect(detail.getByRole('button', { name: data.labels.collectLabel })).toBeDisabled();
  fireEvent.change(detail.getByRole('textbox'), { target: { value: '폭염이 늘어나요' } });
  fireEvent.click(detail.getByRole('button', { name: data.labels.collectLabel }));
  closeCard();
  expect(screen.getByText('생활 0장 · 환경 0장 담음')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: config.ui.tabs.write }));
  expect(screen.getByRole('status')).toHaveTextContent(config.unlock.write.lockedMessage);
});

it('필터·뒤집기·입력 수정이 기록과 맞물리고 담은 카드에서도 빼기가 된다', () => {
  start();
  const region = within(screen.getByRole('region', { name: data.ui.title }));
  fireEvent.click(region.getByRole('button', { name: data.ui.env }));
  expect(region.getAllByRole('article')).toHaveLength(5);
  let detail = openCard(data.cards[8].title);
  fireEvent.click(detail.getByRole('button', { name: data.ui.flip }));
  expect(detail.queryByRole('button', { name: data.labels.collectLabel })).not.toBeInTheDocument();
  fireEvent.click(detail.getAllByRole('button', { name: data.ui.flip })[0]);
  fireEvent.click(detail.getByRole('button', { name: data.labels.collectLabel }));
  fireEvent.change(detail.getByRole('textbox'), { target: { value: '꽃과 벌을 살펴봐요' } });
  closeCard();
  fireEvent.click(region.getByRole('button', { name: data.labels.filterCollected }));
  expect(region.getAllByRole('article')).toHaveLength(1);
  detail = openCard(data.cards[8].title);
  expect(detail.getByRole('textbox')).toHaveValue('꽃과 벌을 살펴봐요');
  fireEvent.click(detail.getByRole('button', { name: data.labels.collectedLabel }));
  closeCard();
  expect(region.queryAllByRole('article')).toHaveLength(0);
  expect(region.getByText(data.ui.empty)).toBeInTheDocument();
  // 학생 바꾸기로 저장을 강제하고 읽음·메모가 유지되는지 확인한다.
  fireEvent.click(screen.getByRole('button', { name: config.ui.topbar.menu }));
  fireEvent.click(screen.getByRole('menuitem', { name: config.ui.menu.switch }));
  const saved = loadRecord({ class: 3, number: 12 });
  expect(saved?.cards.flipped).toContain(data.cards[8].id);
  expect(saved?.cards.myNotes[data.cards[8].id]).toBe('꽃과 벌을 살펴봐요');
  expect(saved?.notes).toHaveLength(0);
});

it('그림 경로와 최근 사례·출처 쌍이 있을 때만 해당 내용을 보여 준다', () => {
  const card = data.cards[0];
  const original = { ...card };
  try {
    card.image = '/images/cards/test.svg';
    card.recentExample = '최근에 관찰한 변화';
    card.recentSourceText = '';
    start();
    expect(screen.getByAltText(card.imageAlt)).toHaveAttribute('src', card.image);
    let detail = openCard(card.title);
    expect(detail.queryByText(card.recentExample, { exact: false })).not.toBeInTheDocument();
    closeCard();
    card.recentSourceText = '관찰 기록';
    detail = openCard(card.title);
    expect(detail.getByText(card.recentExample, { exact: false })).toBeInTheDocument();
    expect(detail.getByText(card.recentSourceText)).toBeInTheDocument();
  } finally {
    Object.assign(card, original);
  }
});
