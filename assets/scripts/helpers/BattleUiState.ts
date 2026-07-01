/**
 * BattleUiState — manages visibility of battle dialogs, drawers, and panels.
 * Ported from Vue client's useBattleUiState.
 *
 * Usage: create one instance per battle session, pass to UI components.
 */

import type { Player, Room } from '../shared/types';

export class BattleUiState {
  /** Is the battle log drawer visible? */
  showBattleLog = false;
  /** Is the roguelite details panel visible? */
  showRogueliteDetails = false;
  /** Is the rule guide dialog visible? */
  showRuleGuide = false;
  /** ID of the player whose detail dialog is open (null = closed). */
  detailPlayerId: string | null = null;

  /** Get the player currently being inspected, if any. */
  getDetailPlayer(room: Room): Player | undefined {
    if (!this.detailPlayerId) return undefined;
    return room.players.find(p => p.id === this.detailPlayerId);
  }

  // ── Player detail ──

  openPlayerDetail(player: Player): void {
    this.detailPlayerId = player.id;
  }

  openPlayerDetailById(playerId: string): void {
    this.detailPlayerId = playerId;
  }

  closePlayerDetail(): void {
    this.detailPlayerId = null;
  }

  // ── Battle log ──

  toggleBattleLog(): void {
    this.showBattleLog = !this.showBattleLog;
  }

  closeBattleLog(): void {
    this.showBattleLog = false;
  }

  // ── Rule guide ──

  openRuleGuide(): void {
    this.showRuleGuide = true;
  }

  closeRuleGuide(): void {
    this.showRuleGuide = false;
  }

  // ── Roguelite details ──

  openRogueliteDetails(): void {
    this.showRogueliteDetails = true;
  }

  closeRogueliteDetails(): void {
    this.showRogueliteDetails = false;
  }

  // ── Reset ──

  reset(): void {
    this.showBattleLog = false;
    this.showRogueliteDetails = false;
    this.showRuleGuide = false;
    this.detailPlayerId = null;
  }
}
