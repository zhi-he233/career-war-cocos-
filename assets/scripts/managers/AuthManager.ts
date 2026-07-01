/**
 * AuthManager — REST API wrapper for authentication.
 *
 * Handles register, login, logout, and session check via the server's REST API.
 * Stores auth token in an httpOnly cookie (handled by the browser/server).
 * This is a plain TS class — not a Cocos Component — because it has no scene presence.
 */

// ── Types (mirrors server's PublicUser) ──

export interface PublicUser {
  id: string;
  username: string;
  nickname: string;
  displayName: string;
  avatar: string;
  tutorialCompleted: boolean;
  createdAt: string;
}

export interface AuthResult {
  ok: true;
  data: PublicUser;
}

export interface AuthError {
  ok: false;
  error: string;
}

export type AuthResponse = AuthResult | AuthError;

// ── Singleton ──

export class AuthManager {
  private static _instance: AuthManager;

  private _user: PublicUser | null = null;
  private _loading = true;
  private _initPromise: Promise<void> | null = null;
  private _serverUrl: string;

  private constructor(serverUrl: string) {
    this._serverUrl = serverUrl.replace(/\/$/, '');
  }

  static getInstance(serverUrl = 'http://localhost:3001'): AuthManager {
    if (!AuthManager._instance) {
      AuthManager._instance = new AuthManager(serverUrl);
    }
    return AuthManager._instance;
  }

  // ── Getters ──

  get user(): PublicUser | null { return this._user; }
  get isLoggedIn(): boolean { return this._user !== null; }
  get isLoading(): boolean { return this._loading; }
  get displayName(): string { return this._user?.username ?? ''; }

  // ── Init ──

  /** Check if the user already has a valid session cookie. Call once on startup. */
  async init(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._fetchMe();
    return this._initPromise;
  }

  // ── Public API ──

  async register(username: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${this._serverUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await this._readJsonSafely(res);
      if (!res.ok) {
        return { ok: false, error: this._errorMessage(data, `Register failed (${res.status})`) };
      }
      this._user = data as PublicUser;
      return { ok: true, data: data as PublicUser };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${this._serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await this._readJsonSafely(res);
      if (!res.ok) {
        return { ok: false, error: this._errorMessage(data, `Login failed (${res.status})`) };
      }
      this._user = data as PublicUser;
      return { ok: true, data: data as PublicUser };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this._serverUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      this._user = null;
    }
  }

  async updateProfile(
    patch: Partial<Pick<PublicUser, 'avatar'>> & { tutorialCompleted?: boolean },
  ): Promise<AuthResponse> {
    try {
      const res = await fetch(`${this._serverUrl}/api/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await this._readJsonSafely(res);
      if (!res.ok) {
        return { ok: false, error: this._errorMessage(data, `Update failed (${res.status})`) };
      }
      this._user = data as PublicUser;
      return { ok: true, data: data as PublicUser };
    } catch {
      return { ok: false, error: 'Network error' };
    }
  }

  async refreshCharacters(serverUrl?: string): Promise<unknown[]> {
    const url = (serverUrl ?? this._serverUrl).replace(/\/$/, '');
    try {
      const res = await fetch(`${url}/api/game/characters`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.characters)) return [];
      return data.characters;
    } catch {
      return [];
    }
  }

  // ── Private ──

  private async _fetchMe(): Promise<void> {
    try {
      const res = await fetch(`${this._serverUrl}/api/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this._user = data ?? null;
      }
    } catch {
      this._user = null;
    } finally {
      this._loading = false;
    }
  }

  private async _readJsonSafely(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private _errorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === 'object' && 'error' in data) {
      const err = (data as { error?: unknown }).error;
      if (typeof err === 'string' && err.trim()) return err;
    }
    return fallback;
  }
}
