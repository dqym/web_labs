import { DestroyRef, Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, Post, SocialUser } from '../models/social.models';
import { UserStateService } from './user-state.service';

@Injectable({ providedIn: 'root' })
export class RealTimeService {
  #userState = inject(UserStateService);
  #destroyRef = inject(DestroyRef);
  #socket?: Socket;

  #post$ = new Subject<Post>();
  #message$ = new Subject<Message>();
  #friends$ = new Subject<SocialUser>();
  #user$ = new Subject<SocialUser>();
  #refresh$ = new Subject<void>();

  readonly post$ = this.#post$.asObservable();
  readonly message$ = this.#message$.asObservable();
  readonly friends$ = this.#friends$.asObservable();
  readonly user$ = this.#user$.asObservable();
  readonly refresh$ = this.#refresh$.asObservable();

  constructor() {
    this.#userState.activeUser$.subscribe((user) => {
      if (user) {
        this.#connect(user.id);
      }
    });

    this.#destroyRef.onDestroy(() => {
      this.#socket?.disconnect();
    });
  }

  #connect(userId: string): void {
    if (!this.#socket) {
      this.#socket = io(environment.socketUrl, {
        transports: ['websocket']
      });
      this.#socket.on('post:new', (post: Post) => this.#post$.next(post));
      this.#socket.on('message:new', (message: Message) => this.#message$.next(message));
  this.#socket.on('friends:updated', (user: SocialUser) => this.#friends$.next(user));
  this.#socket.on('user:new', (user: SocialUser) => this.#user$.next(user));
      this.#socket.on('data:refresh', () => this.#refresh$.next());
    }
    this.#socket.emit('joinUser', { userId });
  }
}
