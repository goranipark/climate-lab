// src/data/*.json 구조 타입과 불러오기
// 화면 문구는 모두 이 파일에서 내보내는 객체를 통해 가져온다.
import configJson from '../data/config.json';
import sourcesJson from '../data/sources.json';
import labJson from '../data/lab.json';
import cardsJson from '../data/cards.json';
import writingJson from '../data/writing.json';
import gameJson from '../data/game.json';

/** 영역: 생활 / 환경 / 실험 / 우리 지역 */
export type Area = 'life' | 'env' | 'exp' | 'local';
/** 모형 id */
export type ModelId = 'island' | 'house' | 'tree';
/** 잠김 상태 id */
export type StateId = 'none' | 'partial' | 'full';
/** 탭 id */
export type TabId = 'lab' | 'cards' | 'write';

export interface AreaInfo {
  label: string;
  icon: string;
  hint: string;
}

export interface Config {
  app: { name: string; unit: string; dataVersion: number };
  student: {
    classCount: number;
    maxNumber: number;
    nameMinLength: number;
    nameMaxLength: number;
    teacherOption: { enabled: boolean; label: string };
  };
  storage: {
    prefix: string;
    studentKey: string;
    photoKey: string;
    lastKey: string;
    uiKey: string;
    teacherKey: string;
    exportCodePrefix: string;
    photoMaxSide: number;
    photoJpegQuality: number;
  };
  areas: Record<Area, AreaInfo>;
  phenomena: Record<'temperature' | 'precipitation', { label: string; examples: string[] }>;
  unlock: {
    write: {
      lifeCards: number;
      envCards: number;
      countLocalCard: boolean;
      lockedMessage: string;
      unlockedToast: string;
      relockedNotice: string;
    };
  };
  messages: Record<
    | 'existingRecord'
    | 'exportGuide'
    | 'exportPhotoNotice'
    | 'importConfirm'
    | 'importError'
    | 'storageFull'
    | 'deleteConfirm1'
    | 'deleteConfirm2'
    | 'noteAdded'
    | 'noteReplaced',
    string
  >;
  ui: {
    tabs: Record<TabId, string>;
    start: {
      classLabel: string;
      classOption: string;
      classPlaceholder: string;
      numberLabel: string;
      nameLabel: string;
      namePlaceholder: string;
      startButton: string;
      importToggle: string;
      errors: { class: string; number: string; name: string };
    };
    topbar: { student: string; teacher: string; bigText: string; menu: string };
    menu: { export: string; import: string; switch: string; delete: string; unsaved: string };
    export: { title: string; copy: string; copied: string };
    import: { title: string; placeholder: string; button: string; done: string };
    notes: {
      title: string;
      filterAll: string;
      empty: string;
      collapse: string;
      expand: string;
      remove: string;
      removeConfirm: string;
      more: string;
      less: string;
      sources: Record<NoteSourceKey, string>;
    };
    locked: { write: string };
    placeholder: string;
    common: { confirm: string; cancel: string; close: string; next: string; prev: string };
  };
  bannedWords: { words: string[] };
}

export type NoteSourceKey = 'lab-record' | 'lab-summary' | 'card' | 'local';

export interface Source {
  id: string;
  short: string;
  detail: string;
}

export interface Fact {
  id: string;
  text: string;
  sourceIds: string[];
}

export interface SimLevel {
  cup: number;
  water: number;
  dryLand: number;
  states: Record<ModelId, StateId>;
  bubble: string;
}

export interface LabData {
  notice: string;
  models: { id: ModelId; label: string }[];
  states: { id: StateId; label: string; predictLabel: string }[];
  steps: { id: 'predict' | 'experiment' | 'compare' | 'real' | 'summary'; label: string; title: string }[];
  ui: {
    stepLocked: Record<'experiment' | 'compare' | 'real' | 'summary', string>;
    nextStep: string;
    predictDone: string;
    recordTitle: string;
    recordWaiting: string;
    pastRecords: string;
    collectRow: string;
    modelCol: string;
    sameMark: string;
    diffMark: string;
    photoPick: string;
    photoRemove: string;
    prevScene: string;
    nextScene: string;
    factsTitle: string;
    summarySaved: string;
    tankLabel: string;
    cupLabel: string;
    modelButton: string;
    replayCup: string;
  };
  predict: {
    question: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    reasonMinLength: number;
    submitLabel: string;
    lockedNotice: string;
  };
  experiment: {
    guide: Record<'observeBefore' | 'pour' | 'observe' | 'record' | 'done', string>;
    rows: { cup: number; label: string }[];
    columns: ModelId[];
    observationLabel: string;
    observationPlaceholder: string;
    noteTemplate: string;
    closeUp: { label: string; scale: number; closeLabel: string };
    pourLabel: string;
    pourLocked: string;
    dropHint: string;
    resetLabel: string;
    resetConfirm: string;
    mismatchHint: string;
    finishLabel: string;
  };
  simulation: {
    dryLandLabel: string;
    levels: SimLevel[];
    changeSticker: Record<'partial' | 'full', string>;
    liveTemplate: string;
  };
  compare: {
    title: string;
    predictLabel: string;
    resultLabel: string;
    question: string;
    options: { id: 'same' | 'different'; label: string }[];
    diffLabel: string;
    diffPlaceholder: string;
    replayLabel: string;
    classroom: {
      checkLabel: string;
      photoLabel: string;
      photoNotice: string;
      memoLabel: string;
      memoPlaceholder: string;
    };
  };
  real: {
    toggle: { model: string; real: string };
    imageLabel: string;
    whatLabel: string;
    whoLabel: string;
    scenes: {
      id: string;
      title: string;
      image: string;
      imageAlt: string;
      what: string;
      who: string;
      whoArea: Area;
      factIds: string[];
    }[];
    commonFactIds: string[];
  };
  facts: Fact[];
  summary: {
    prefix: string;
    minLength: number;
    sentences: { id: 's1' | 's2'; area: Area; hint: string; placeholder: string }[];
    saveLabel: string;
    noteTemplate: string;
    closing: string;
  };
}

export interface ImpactCard {
  id: string;
  area: 'life' | 'env';
  phenomenon: 'temperature' | 'precipitation' | null;
  title: string;
  question: string;
  what: string;
  who: string;
  example: string;
  sourceIds: string[];
  recentExample: string;
  recentSourceText: string;
  image: string;
  imageAlt: string;
}

export interface CardsData {
  labels: Record<
    | 'filterAll'
    | 'filterCollected'
    | 'whatLabel'
    | 'whoLabel'
    | 'exampleLabel'
    | 'recentLabel'
    | 'myNoteLabel'
    | 'myNotePlaceholder'
    | 'collectLabel'
    | 'collectedLabel'
    | 'readFirst'
    | 'progress',
    string
  >;
  noteTemplate: string;
  cards: ImpactCard[];
  localCard: {
    id: string;
    area: 'local';
    title: string;
    body: string;
    guide: string;
    linkLabel: string;
    url: string;
    inputPrefix: string;
    inputPlaceholder: string;
    inputMinLength: number;
    noteTemplate: string;
    sourceIds: string[];
    image: string;
    imageAlt: string;
  };
  closing: string;
}

export interface WritingField {
  id: 'life' | 'env' | 'exp' | 'extra';
  area: Area | null;
  label: string;
  placeholder: string;
  prefix?: string;
  suggestFrom: { areas?: Area[]; kinds?: string[] };
  required: boolean;
}

export interface WritingData {
  title: string;
  guide: string;
  noLabNotice: string;
  frame: ({ type: 'text'; text: string } | { type: 'field'; fieldId: WritingField['id'] })[];
  fields: WritingField[];
  compose: { sentenceTemplates: Record<WritingField['id'], string>; joiner: string };
  selfCheck: {
    buttonLabel: string;
    items: {
      id: string;
      fieldId: WritingField['id'];
      area: Area;
      label: string;
      minLength: number;
      okText: string;
      missingText: string;
    }[];
    allOkText: string;
    allOkWithExtraText: string;
    unchangedImportText: string;
  };
  output: Record<'printLabel' | 'copyLabel' | 'copiedToast' | 'printHeader' | 'copyTemplate' | 'printTooLong', string>;
  teacherExample: Record<WritingField['id'], string>;
  closing: string;
}

/** 게임 요소 색 이름 (토큰과 연결) */
export type GameColor = 'life' | 'env' | 'exp' | 'water' | 'attn' | 'land';

export interface Badge {
  id: string;
  icon: string;
  color: GameColor;
  title: string;
  how: string;
}

export interface GameData {
  directorName: string;
  ui: Record<
    | 'cardTitle' | 'issueTitle' | 'issueGuide' | 'issueButton' | 'issuedLabel' | 'classLabel' | 'signLabel'
    | 'openCard' | 'badgesTitle' | 'badgeCount' | 'badgeLocked' | 'badgeHow' | 'newBadge' | 'missionLabel'
    | 'briefingStart' | 'close' | 'caseTitle' | 'caseHint' | 'slotEmpty' | 'newBadgeHint' | 'completeTitle'
    | 'completeText' | 'showPicture' | 'showBadges' | 'puzzleGuide',
    string
  >;
  avatars: { id: string; icon: string; label: string; color: GameColor }[];
  missions: Record<MissionId, { title: string; short: string; text: string }>;
  badges: Badge[];
  puzzle: { title: string; image: string; alt: string };
}

export type MissionId = 'lab-predict' | 'lab-experiment' | 'lab-compare' | 'lab-real' | 'lab-summary' | 'cards' | 'write';

// json을 타입에 맞춰 내보낸다 (구조 검사는 scripts/check-data.mjs가 함께 맡는다)
export const config = configJson as unknown as Config;
export const sources = (sourcesJson as unknown as { sources: Source[] }).sources;
export const lab = labJson as unknown as LabData;
export const cards = cardsJson as unknown as CardsData;
export const writing = writingJson as unknown as WritingData;
export const game = gameJson as unknown as GameData;

/** 출처 id로 출처 찾기 */
export function findSource(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}
