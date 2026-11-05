// 탭 본문 진입점. M3에서 실제 화면으로 바꾼다. App.tsx는 이 컴포넌트만 부른다.
import { config } from '../../types/data';
import { fill } from '../../lib/template';

export function CardsTab() {
  return (
    <section className="panel panel-center">
      <h1 className="heading">{config.ui.tabs.cards}</h1>
      <p>{fill(config.ui.placeholder, { milestone: 3 })}</p>
    </section>
  );
}
