// 탭 본문 진입점. M5에서 실제 화면으로 바꾼다. App.tsx는 이 컴포넌트만 부른다.
import { config } from '../../types/data';
import { fill } from '../../lib/template';

export function WriteTab() {
  return (
    <section className="panel panel-center">
      <h1 className="heading">{config.ui.tabs.write}</h1>
      <p>{fill(config.ui.placeholder, { milestone: 5 })}</p>
    </section>
  );
}
