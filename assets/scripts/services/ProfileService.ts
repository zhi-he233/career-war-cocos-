import { sys } from 'cc';
import type { Room } from '../shared/types';

const PROFILE_KEY = 'career-war-cocos-profile-v1';
const CLIENT_ID_KEY = 'career-war-cocos-client-id';
const PLAYER_ID_KEY = 'career-war-cocos-player-id';
const NICKNAME_KEY = 'career-war-cocos-nickname';

export interface ProfileAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface PlayerProfile {
  user: {
    clientId: string;
    playerId: string;
    nickname: string;
    title: string;
    favoriteCharacterId: string;
  };
  progress: {
    level: number;
    exp: number;
    expToNext: number;
    coins: number;
    rankTitle: string;
  };
  pvp: {
    wins: number;
    totalGames: number;
    winRate: number;
    streak: number;
    recentResults: Array<'win' | 'loss'>;
  };
  roguelite: {
    highestStage: number;
    bossesDefeated: number;
    maxSingleDamage: number;
    maxDamageTaken: number;
    maxHealing: number;
  };
  careers: {
    favoriteCareer: string;
    bestWinRateCareer: string;
    recentCareers: string[];
  };
  achievements: ProfileAchievement[];
  updatedAt: number;
}

const TITLES = [
  'New Roller',
  'Lucky Guest',
  'Career Challenger',
  'Dice Adept',
  'Arena Regular',
  'Tactical Master',
  'Unmatched Roller',
];

const CHARACTER_IDS = [
  'boxer',
  'gunslinger',
  'vampire',
  'paladin',
  'berserker',
  'war_knight',
  'crescent_moon',
  'fire_lord',
  'mountain_shield',
];

const ACHIEVEMENT_TEMPLATES: Omit<ProfileAchievement, 'unlocked' | 'progress'>[] = [
  { id: 'first_win', name: 'First Win', description: 'Win one PVP battle.', maxProgress: 1 },
  { id: 'ten_wins', name: 'Ten Wins', description: 'Win ten PVP battles.', maxProgress: 10 },
  { id: 'roguelite_5', name: 'Roguelite Explorer', description: 'Reach stage 5.', maxProgress: 5 },
  { id: 'roguelite_10', name: 'Roguelite Conqueror', description: 'Reach stage 10.', maxProgress: 10 },
  { id: 'three_streak', name: 'Three Streak', description: 'Reach a 3-win streak.', maxProgress: 3 },
  { id: 'damage_50', name: 'Heavy Hit', description: 'Deal 50+ damage in one action.' },
];

export class ProfileService {
  static loadProfile(payload?: { nickname?: string; clientId?: string; playerId?: string; room?: Room | null }): PlayerProfile {
    const stored = this.readStoredProfile();
    const nickname = payload?.nickname || stored?.user.nickname || sys.localStorage.getItem(NICKNAME_KEY) || 'Player';
    const clientId = payload?.clientId || stored?.user.clientId || sys.localStorage.getItem(CLIENT_ID_KEY) || 'unknown';
    const playerId = payload?.playerId || stored?.user.playerId || sys.localStorage.getItem(PLAYER_ID_KEY) || '';
    const profile = stored ?? this.createMockProfile(nickname, clientId, playerId);
    profile.user.nickname = nickname;
    profile.user.clientId = clientId;
    profile.user.playerId = playerId;
    this.mergeRoomSnapshot(profile, payload?.room ?? null);
    this.saveProfile(profile);
    return profile;
  }

  static saveProfile(profile: PlayerProfile): void {
    profile.updatedAt = Date.now();
    sys.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    sys.localStorage.setItem(NICKNAME_KEY, profile.user.nickname);
  }

  static resetLocalProfile(nickname = 'Player', clientId = 'unknown', playerId = ''): PlayerProfile {
    const profile = this.createMockProfile(nickname, clientId, playerId);
    this.saveProfile(profile);
    return profile;
  }

  private static readStoredProfile(): PlayerProfile | null {
    const raw = sys.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PlayerProfile;
      if (!parsed?.user || !parsed?.progress) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private static createMockProfile(nickname: string, clientId: string, playerId: string): PlayerProfile {
    const seed = this.seedFrom(`${nickname}:${clientId}`);
    const level = 1 + (seed % 15);
    const totalGames = seed % 50;
    const wins = Math.floor(totalGames * (0.35 + (seed % 35) / 100));
    const favoriteCareer = this.pick(CHARACTER_IDS, seed);
    const profile: PlayerProfile = {
      user: {
        clientId,
        playerId,
        nickname,
        title: this.pick(TITLES, seed),
        favoriteCharacterId: favoriteCareer,
      },
      progress: {
        level,
        exp: (seed % 100) * level,
        expToNext: 100 * level,
        coins: seed % 5000,
        rankTitle: this.pick(TITLES, seed + 1),
      },
      pvp: {
        wins,
        totalGames,
        winRate: totalGames > 0 ? wins / totalGames : 0,
        streak: (seed % 7) - 2,
        recentResults: Array.from({ length: Math.min(totalGames, 8) }, (_, index) => (seed + index) % 3 === 0 ? 'loss' : 'win'),
      },
      roguelite: {
        highestStage: 1 + (seed % 12),
        bossesDefeated: seed % 5,
        maxSingleDamage: 20 + (seed % 60),
        maxDamageTaken: 15 + (seed % 40),
        maxHealing: 10 + (seed % 35),
      },
      careers: {
        favoriteCareer,
        bestWinRateCareer: this.pick(CHARACTER_IDS, seed + 3),
        recentCareers: Array.from({ length: 4 }, (_, index) => this.pick(CHARACTER_IDS, seed + index * 7)),
      },
      achievements: [],
      updatedAt: Date.now(),
    };
    profile.achievements = this.createAchievements(profile);
    return profile;
  }

  private static mergeRoomSnapshot(profile: PlayerProfile, room: Room | null): void {
    if (!room) return;
    const localPlayer = room.players.find((player) => player.clientId === profile.user.clientId || player.id === profile.user.playerId);
    if (localPlayer?.characterId) {
      profile.user.favoriteCharacterId = localPlayer.characterId;
      profile.careers.favoriteCareer = localPlayer.characterId;
      profile.careers.recentCareers = [localPlayer.characterId, ...profile.careers.recentCareers.filter((id) => id !== localPlayer.characterId)].slice(0, 5);
    }
    if (room.roguelite) {
      profile.roguelite.highestStage = Math.max(profile.roguelite.highestStage, room.roguelite.stage);
    }
    profile.achievements = this.createAchievements(profile);
  }

  private static createAchievements(profile: PlayerProfile): ProfileAchievement[] {
    return ACHIEVEMENT_TEMPLATES.map((template) => {
      const progress = this.achievementProgress(template.id, profile);
      const unlocked = template.maxProgress ? progress >= template.maxProgress : progress > 0;
      return { ...template, unlocked, progress };
    });
  }

  private static achievementProgress(id: string, profile: PlayerProfile): number {
    if (id === 'first_win') return Math.min(profile.pvp.wins, 1);
    if (id === 'ten_wins') return Math.min(profile.pvp.wins, 10);
    if (id === 'roguelite_5') return Math.min(profile.roguelite.highestStage, 5);
    if (id === 'roguelite_10') return Math.min(profile.roguelite.highestStage, 10);
    if (id === 'three_streak') return Math.max(0, Math.min(profile.pvp.streak, 3));
    if (id === 'damage_50') return profile.roguelite.maxSingleDamage >= 50 ? 1 : 0;
    return 0;
  }

  private static seedFrom(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) & 0x7fffffff;
    }
    return hash;
  }

  private static pick<T>(items: readonly T[], seed: number): T {
    return items[Math.abs(seed) % items.length]!;
  }
}
