import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocialUser } from '../models/social.models';

const SESSION_STORAGE_KEY = 'socialNetUser.session';
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

@Injectable({ providedIn: 'root' })
export class UserStateService {
  #activeUser = new BehaviorSubject<SocialUser | null>(null);
  #storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null;

  constructor() {
    this.#restoreFromStorage();
  }

  readonly activeUser$ = this.#activeUser.asObservable();

  setActiveUser(user: SocialUser): void {
    this.#activeUser.next(user);
    this.#persist(user);
  }

  clear(): void {
    if (this.#storage) {
      this.#storage.removeItem(SESSION_STORAGE_KEY);
    }
    this.#activeUser.next(null);
  }

  get snapshot(): SocialUser | null {
    return this.#activeUser.value;
  }

  #persist(user: SocialUser): void {
    if (!this.#storage) {
      return;
    }
    const payload = {
      user,
      expiresAt: Date.now() + SESSION_TTL_MS
    };
    this.#storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  }

  #restoreFromStorage(): void {
    if (!this.#storage) {
      return;
    }
    const raw = this.#storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const payload = JSON.parse(raw) as { user?: SocialUser; expiresAt?: number };
      if (!payload.user || !payload.expiresAt) {
        this.#storage.removeItem(SESSION_STORAGE_KEY);
        return;
      }
      if (payload.expiresAt > Date.now()) {
        this.#activeUser.next(payload.user);
      } else {
        this.#storage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      this.#storage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}
