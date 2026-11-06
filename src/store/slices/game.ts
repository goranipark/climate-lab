// 게임 요소 기록 동작 (담당: Opus): 연구원증 발급, 배지 알림, 미션 브리핑
import type { StudentRecord } from '../../types/record';

export type GameAction =
  | { type: 'GAME_ISSUE_CARD'; avatar: string; now?: string }
  | { type: 'GAME_BADGES_SEEN'; ids: string[] }
  | { type: 'GAME_BADGES_PLACED'; ids: string[] }
  | { type: 'GAME_BRIEFED'; missionId: string };

export function gameReducer(state: StudentRecord, action: GameAction): StudentRecord {
  const g = state.game;
  switch (action.type) {
    case 'GAME_ISSUE_CARD':
      // 처음 발급한 날은 그대로 두고 동료만 바꾼다
      return { ...state, game: { ...g, avatar: action.avatar, issuedAt: g.issuedAt ?? action.now ?? new Date().toISOString() } };
    case 'GAME_BADGES_SEEN': {
      const add = action.ids.filter((id) => !g.badgesSeen.includes(id));
      if (add.length === 0) return state;
      return { ...state, game: { ...g, badgesSeen: [...g.badgesSeen, ...add] } };
    }
    case 'GAME_BADGES_PLACED': {
      const add = action.ids.filter((id) => !g.badgesPlaced.includes(id));
      if (add.length === 0) return state;
      return { ...state, game: { ...g, badgesPlaced: [...g.badgesPlaced, ...add] } };
    }
    case 'GAME_BRIEFED':
      if (g.briefed.includes(action.missionId)) return state;
      return { ...state, game: { ...g, briefed: [...g.briefed, action.missionId] } };
    default:
      return state;
  }
}
