// 앱 전체 틀: 시작 화면 ↔ 메인 화면(상단 바 + 탭 본문 + 근거 노트)
import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { cards, config, type TabId } from './types/data';
import type { StudentRecord } from './types/record';
import { fill } from './lib/template';
import { useHashTab } from './lib/hashRoute';
import { FeedbackProvider, useFeedback } from './components/Feedback';
import { TopBar, type MenuAction } from './components/TopBar';
import { ExportDialog, ImportDialog } from './components/RecordDialogs';
import { StartScreen } from './features/start/StartScreen';
import { NotesPanel } from './features/notes/NotesPanel';
import { RecordProvider, useRecord } from './store/RecordContext';
import { collectedCardCounts, isTeacher, isWriteUnlocked } from './store/selectors';
import { deleteRecord, loadUiPrefs, saveRecord, saveUiPrefs } from './store/storage';

export default function App() {
  return (
    <FeedbackProvider>
      <Root />
    </FeedbackProvider>
  );
}

/** 학생을 고르기 전에는 시작 화면, 고른 뒤에는 메인 화면 */
function Root() {
  const [record, setRecord] = useState<StudentRecord | null>(null);
  // 같은 학생 기록을 새로 불러오면 Provider를 새로 만들기 위한 번호
  const [session, setSession] = useState(0);
  const [large, setLarge] = useState(() => loadUiPrefs().size === 'large');

  // 큰 글자 모드: <html data-size="large">
  useEffect(() => {
    document.documentElement.dataset.size = large ? 'large' : 'normal';
    saveUiPrefs({ size: large ? 'large' : 'normal' });
  }, [large]);

  function start(r: StudentRecord) {
    setRecord(r);
    setSession((n) => n + 1);
  }

  if (!record) return <StartScreen onStart={start} />;

  return (
    <RecordProvider key={session} initial={record}>
      <Main
        large={large}
        onToggleLarge={() => setLarge((v) => !v)}
        onSignOut={() => setRecord(null)}
        onReplace={(r) => {
          saveRecord(r);
          start(r);
        }}
      />
    </RecordProvider>
  );
}

interface MainProps {
  large: boolean;
  onToggleLarge: () => void;
  onSignOut: () => void;
  onReplace: (r: StudentRecord) => void;
}

function Main({ large, onToggleLarge, onSignOut, onReplace }: MainProps) {
  const { record, dispatch, flush } = useRecord();
  const { toast, confirm } = useFeedback();
  const [tab, setTab] = useHashTab(record.ui.tab);
  const [dialog, setDialog] = useState<'export' | 'import' | null>(null);
  // 큰 글자 모드에서는 노트가 접힌 상태로 시작
  const [notesCollapsed, setNotesCollapsed] = useState(large);
  const writeOpen = isWriteUnlocked(record);
  const wasOpen = useRef(writeOpen);

  useEffect(() => setNotesCollapsed(large), [large]);

  // 지금 탭을 기록에 남겨 다음에 같은 탭을 연다
  useEffect(() => {
    if (record.ui.tab !== tab) dispatch({ type: 'SET_TAB', tab });
  }, [tab, record.ui.tab, dispatch]);

  // ⑦이 처음 열리는 순간 알림
  useEffect(() => {
    if (!wasOpen.current && writeOpen && !isTeacher(record)) toast(config.unlock.write.unlockedToast);
    wasOpen.current = writeOpen;
  }, [writeOpen, record, toast]);

  async function onMenu(action: MenuAction) {
    const s = record.student;
    if (action === 'export') setDialog('export');
    if (action === 'import') setDialog('import');
    if (action === 'switch') {
      flush();
      onSignOut();
    }
    if (action === 'delete') {
      if (!(await confirm(fill(config.messages.deleteConfirm1, { class: s.class, number: s.number })))) return;
      if (!(await confirm(config.messages.deleteConfirm2))) return;
      deleteRecord(s);
      onSignOut();
    }
  }

  return (
    <div className="app">
      <TopBar tab={tab} onTab={setTab} large={large} onToggleLarge={onToggleLarge} onMenu={onMenu} />
      <div className={`app-body ${notesCollapsed ? 'notes-off' : ''}`}>
        <main className="content" id="content">
          <TabContent tab={tab} />
        </main>
        <NotesPanel collapsed={notesCollapsed} onToggle={() => setNotesCollapsed((v) => !v)} overlay={large && !notesCollapsed} />
      </div>
      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {dialog === 'import' && (
        <ImportDialog
          onClose={() => setDialog(null)}
          onLoaded={(r) => {
            setDialog(null);
            toast(config.ui.import.done);
            onReplace(r);
          }}
        />
      )}
    </div>
  );
}

/** 탭 본문. M2(③)·M3(④)·M5(⑦)에서 실제 화면으로 바뀐다 */
function TabContent({ tab }: { tab: TabId }) {
  const { record } = useRecord();
  if (tab === 'write' && !isWriteUnlocked(record)) {
    const c = collectedCardCounts(record);
    return (
      <section className="panel panel-center">
        <Lock aria-hidden size={40} />
        <p className="subheading">{config.unlock.write.lockedMessage}</p>
        <p>{fill(cards.labels.progress, { life: c.life, env: c.env })}</p>
      </section>
    );
  }
  const milestone = { lab: 2, cards: 3, write: 5 }[tab];
  return (
    <section className="panel panel-center">
      <h1 className="heading">{config.ui.tabs[tab]}</h1>
      <p>{fill(config.ui.placeholder, { milestone })}</p>
    </section>
  );
}
