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
import { LabTab } from './features/lab/LabTab';
import { CardsTab } from './features/cards/CardsTab';
import { WriteTab } from './features/write/WriteTab';
import { IssueCard } from './features/game/IssueCard';
import { BadgePopup } from './features/game/BadgePopup';
import { MissionBriefing } from './features/game/Mission';
import { ResearcherModal } from './features/game/ResearcherModal';
import type { MissionId } from './types/data';
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
  const [dialog, setDialog] = useState<'export' | 'import' | 'researcher' | null>(null);
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

  // 처음 시작한 학생은 연구원증부터 (교사 시연 모드는 건너뜀)
  if (!record.game.avatar && !isTeacher(record)) return <IssueCard />;

  // 지금 화면의 미션: ③은 단계별, ④⑦은 탭별
  const missionId: MissionId = tab === 'lab' ? (`lab-${record.ui.labStep}` as MissionId) : tab;
  const missionReady = tab !== 'write' || writeOpen;

  return (
    <div className="app">
      <TopBar tab={tab} onTab={setTab} large={large} onToggleLarge={onToggleLarge} onMenu={onMenu} onResearcher={() => setDialog('researcher')} />
      <div className={`app-body ${tab === 'write' && writeOpen ? 'notes-hidden' : notesCollapsed ? 'notes-off' : ''}`}>
        <main className="content" id="content">
          <TabContent tab={tab} />
        </main>
        {/* ⑦에서는 근거 노트를 글쓰기 화면 왼쪽에 넓게 보여 주므로 오른쪽 패널은 숨긴다 */}
        {!(tab === 'write' && writeOpen) && (
          <NotesPanel collapsed={notesCollapsed} onToggle={() => setNotesCollapsed((v) => !v)} overlay={large && !notesCollapsed} />
        )}
      </div>
      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {dialog === 'researcher' && <ResearcherModal onClose={() => setDialog(null)} />}
      {!dialog && missionReady && !isTeacher(record) && <MissionBriefing key={missionId} id={missionId} />}
      <BadgePopup />
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

/** 탭 본문. 각 탭 화면은 features 폴더의 LabTab·CardsTab·WriteTab에서 만든다 */
function TabContent({ tab }: { tab: TabId }) {
  const { record } = useRecord();
  if (tab === 'write' && !isWriteUnlocked(record)) {
    const c = collectedCardCounts(record);
    // 이미 ⑦을 열었거나 글을 쓴 적이 있는데 카드를 빼서 다시 잠긴 경우는 다른 안내 (쓴 글은 그대로 둔다)
    const wasOpen = record.game.briefed.includes('write') || Object.values(record.writing.fields).some((v) => v.trim().length > 0);
    return (
      <section className="panel panel-center">
        <Lock aria-hidden size={40} />
        <p className="subheading">{wasOpen ? config.unlock.write.relockedNotice : config.unlock.write.lockedMessage}</p>
        <p>{fill(cards.labels.progress, { life: c.life, env: c.env })}</p>
      </section>
    );
  }
  if (tab === 'lab') return <LabTab />;
  if (tab === 'cards') return <CardsTab />;
  return <WriteTab />;
}
