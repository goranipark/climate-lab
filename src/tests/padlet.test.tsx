// 패들렛 올리기 테스트: 글 모양, 반별 주소, 복사 후 새 탭 열기
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { config } from '../types/data';
import { createEmptyRecord } from '../types/record';
import { RecordProvider } from '../store/RecordContext';
import { FeedbackProvider } from '../components/Feedback';
import { PadletShare, padletDate, padletText } from '../components/PadletShare';

function renderAs(classNo: number | 'teacher', text: string) {
  const r = createEmptyRecord({ class: classNo, number: 12, name: 'K' });
  return render(
    <FeedbackProvider>
      <RecordProvider initial={r}>
        <PadletShare tag="lab" text={text} />
      </RecordProvider>
    </FeedbackProvider>,
  );
}

describe('패들렛 올리기', () => {
  it('글 맨 앞에 날짜와 활동 이름이 붙는다', () => {
    const d = new Date(2026, 10, 17);
    expect(padletDate(d)).toBe('11.17');
    expect(padletText('lab', ' 해수면이 상승하면 집이 잠겨요 ', d)).toBe(`[11.17 ${config.padlet.tags.lab}]\n해수면이 상승하면 집이 잠겨요`);
  });

  it('모든 반에 패들렛 주소가 있다', () => {
    for (let n = 1; n <= config.student.classCount; n++) expect(config.padlet.urls[String(n)]).toMatch(/^https:\/\/padlet\.com\//);
  });

  it('누르면 글을 복사하고 그 반 패들렛을 새 탭으로 연다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderAs(3, 'x');
    fireEvent.click(screen.getByRole('button', { name: config.padlet.button }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(config.padlet.urls['3'], '_blank', 'noopener'));
    expect(writeText.mock.calls[0][0]).toContain(config.padlet.tags.lab);
  });

  it('교사 시연 모드와 빈 글에서는 꺼져 있다', () => {
    renderAs('teacher', 'x');
    expect(screen.getByRole('button', { name: config.padlet.button })).toBeDisabled();
  });
});
