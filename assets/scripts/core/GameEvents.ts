export const GameEvents = {
  RoomUpdated: 'game:room-updated',
  RoomPhaseChanged: 'game:room-phase-changed',
  NetworkConnected: 'game:network-connected',
  NetworkDisconnected: 'game:network-disconnected',
  NetworkError: 'game:network-error',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];
