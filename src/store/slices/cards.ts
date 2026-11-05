// ④ 영향 탐사 카드 기록 동작 (담당: 카드 화면 구현 담당)
// 카드를 노트에 담기·빼기는 공용 동작(UPSERT_NOTE, REMOVE_NOTE)을 쓴다.
import type { StudentRecord } from '../../types/record';

export type CardsAction =
  | { type: 'CARDS_FLIP'; cardId: string }
  | { type: 'CARDS_SET_MY_NOTE'; cardId: string; text: string }
  | { type: 'CARDS_SET_LOCAL_TEXT'; text: string };

export function cardsReducer(state: StudentRecord, action: CardsAction): StudentRecord {
  const now = new Date().toISOString();
  switch (action.type) {
    case 'CARDS_FLIP':
      // 뒷면을 본 카드 목록에 한 번만 넣는다 (담기 조건)
      if (state.cards.flipped.includes(action.cardId)) return state;
      return { ...state, updatedAt: now, cards: { ...state.cards, flipped: [...state.cards.flipped, action.cardId] } };
    case 'CARDS_SET_MY_NOTE':
      return { ...state, updatedAt: now, cards: { ...state.cards, myNotes: { ...state.cards.myNotes, [action.cardId]: action.text } } };
    case 'CARDS_SET_LOCAL_TEXT':
      return { ...state, updatedAt: now, cards: { ...state.cards, localText: action.text } };
    default:
      return state;
  }
}
