import { _decorator } from 'cc';
import { BattleScene } from './BattleScene';

const { ccclass } = _decorator;

@ccclass('RogueliteBattleScene')
export class RogueliteBattleScene extends BattleScene {
  // Separate scene class for pve_roguelite battle layout.
  // It intentionally reuses BattleScene behavior while letting Cocos keep
  // a dedicated scene for roguelite-only boards, panels, and art later.
}
