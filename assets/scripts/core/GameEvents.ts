export const GameEvents = {
  // Room / state
  RoomUpdated: 'game:room-updated',
  RoomPhaseChanged: 'game:room-phase-changed',
  StatusUpdated: 'game:status-updated',
  // Server → client events
  BattleLogAdded: 'game:battle-log-added',
  PlayerEmote: 'game:player-emote',
  GameOver: 'game:game-over',
  ErrorMessage: 'game:error-message',
  KickedFromRoom: 'game:kicked-from-room',
  CharactersUpdated: 'game:characters-updated',
  RoomListUpdated: 'game:room-list-updated',
  // UI
  ToastRequested: 'game:toast-requested',
  // Network lifecycle
  NetworkConnected: 'game:network-connected',
  NetworkDisconnected: 'game:network-disconnected',
  NetworkError: 'game:network-error',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];
