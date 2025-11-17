import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { FriendsPanelComponent } from '../friends-panel/friends-panel.component';
import { MessageCenterComponent } from '../message-center/message-center.component';
import { PostFeedComponent } from '../post-feed/post-feed.component';
import { Message, Post, SocialUser } from '../../models/social.models';
import { ApiService } from '../../services/api.service';
import { RealTimeService } from '../../services/realtime.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, PostFeedComponent, FriendsPanelComponent, MessageCenterComponent],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss'
})
export class FeedPageComponent implements OnInit {
  #api = inject(ApiService);
  #realtime = inject(RealTimeService);
  #userState = inject(UserStateService);
  #router = inject(Router);

  posts: Post[] = [];
  messages: Message[] = [];
  allUsers: SocialUser[] = [];
  authorMap: Record<string, SocialUser> = {};
  messageThreads: Record<string, Message[]> = {};
  activeTab: 'news' | 'friends' | 'messages' = 'news';

  peerId: string | null = null;
  loadingFeed = false;
  loadingMessages = false;
  loadingFriends = false;

  constructor() {
    this.#userState.activeUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => {
        if (!user) {
          this.posts = [];
          this.messages = [];
          this.peerId = null;
          this.activeTab = 'news';
          this.messageThreads = {};
          return;
        }
        if (this.peerId && !user.friends.includes(this.peerId)) {
          this.peerId = null;
        }
        this.refreshFeed();
        if (this.peerId) {
          this.refreshMessages();
        }
      });

    this.#realtime.post$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.refreshFeed());

    this.#realtime.message$
      .pipe(takeUntilDestroyed())
      .subscribe((message) => {
        if (!this.#isMessageForActiveUser(message)) {
          return;
        }

        const peerId = this.#derivePeerId(message);
        if (!peerId) {
          return;
        }

        this.#upsertThread(peerId, message);

        if (!this.peerId) {
          this.peerId = peerId;
        }

        if (this.peerId === peerId) {
          this.messages = [...(this.messageThreads[peerId] ?? [])];
        }
      });

    this.#realtime.friends$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.#loadUsers());

    this.#realtime.user$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.#handleNewUser(user));

    this.#realtime.refresh$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.refreshFeed();
        this.refreshMessages();
      });
  }

  async ngOnInit(): Promise<void> {
    await this.#loadUsers();
    if (!this.activeUser) {
      await this.#router.navigate(['/login']);
    }
  }

  get activeUser(): SocialUser | null {
    return this.#userState.snapshot;
  }

  get friendUsers(): SocialUser[] {
    const ids = this.activeUser?.friends ?? [];
    return ids.map((id) => this.authorMap[id]).filter(Boolean) as SocialUser[];
  }

  async refreshFeed(): Promise<void> {
    if (!this.activeUser) {
      return;
    }
    this.loadingFeed = true;
    try {
      const feed = await firstValueFrom(this.#api.getFeed(this.activeUser.id));
      this.posts = feed.posts;
      this.authorMap[feed.user.id] = feed.user;
      feed.posts.forEach((post) => {
        if (!this.authorMap[post.authorId]) {
          const author = this.allUsers.find((user) => user.id === post.authorId);
          if (author) {
            this.authorMap[author.id] = author;
          }
        }
      });
    } finally {
      this.loadingFeed = false;
    }
  }

  async refreshMessages(): Promise<void> {
    if (!this.activeUser || !this.peerId) {
      return;
    }
    this.loadingMessages = true;
    try {
      const response = await firstValueFrom(this.#api.getMessages(this.activeUser.id, this.peerId));
      this.messageThreads = {
        ...this.messageThreads,
        [this.peerId]: response.messages
      };
      this.messages = [...response.messages];
    } finally {
      this.loadingMessages = false;
    }
  }

  async onAddFriend(friendId: string): Promise<void> {
    if (!this.activeUser) {
      return;
    }
    this.loadingFriends = true;
    try {
      const updated = await firstValueFrom(this.#api.addFriend(this.activeUser.id, friendId));
      await this.#loadUsers(updated.id);
      this.#userState.setActiveUser(updated);
      this.peerId = friendId;
      this.messages = [...(this.messageThreads[friendId] ?? [])];
      await this.refreshMessages();
    } finally {
      this.loadingFriends = false;
    }
  }

  async onRemoveFriend(friendId: string): Promise<void> {
    if (!this.activeUser) {
      return;
    }
    this.loadingFriends = true;
    try {
      await firstValueFrom(this.#api.removeFriend(this.activeUser.id, friendId));
      await this.#loadUsers(this.activeUser.id);
      const refreshed = this.allUsers.find((user) => user.id === this.activeUser?.id);
      if (refreshed) {
        this.#userState.setActiveUser(refreshed);
      }
      if (this.peerId === friendId) {
        this.peerId = null;
        this.messages = [];
      }
      this.#clearThread(friendId);
      await this.refreshMessages();
    } finally {
      this.loadingFriends = false;
    }
  }

  onPeerChange(peerId: string): void {
    if (this.peerId === peerId && this.messages.length === (this.messageThreads[peerId]?.length ?? 0)) {
      return;
    }
    this.peerId = peerId;
    this.messages = [...(this.messageThreads[peerId] ?? [])];
    this.refreshMessages();
  }

  async onSendMessage(payload: { toUserId: string; content: string }): Promise<void> {
    if (!this.activeUser) {
      return;
    }
    this.loadingMessages = true;
    try {
      await firstValueFrom(this.#api.sendMessage(this.activeUser.id, payload.toUserId, payload.content));
      await this.refreshMessages();
    } finally {
      this.loadingMessages = false;
    }
  }

  setTab(tab: 'news' | 'friends' | 'messages'): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    if (tab === 'messages') {
      if (!this.peerId && this.friendUsers.length) {
        this.peerId = this.friendUsers[0].id;
      }
      if (this.peerId) {
        this.messages = [...(this.messageThreads[this.peerId] ?? [])];
        this.refreshMessages();
      }
    }
  }

  #isMessageForActiveUser(message: Message): boolean {
    const activeId = this.activeUser?.id;
    if (!activeId) {
      return false;
    }
    return message.toUserId === activeId || message.fromUserId === activeId;
  }

  #derivePeerId(message: Message): string | null {
    const activeId = this.activeUser?.id;
    if (!activeId) {
      return null;
    }
    return message.fromUserId === activeId ? message.toUserId : message.fromUserId;
  }

  #upsertThread(peerId: string, message: Message): void {
    const thread = this.messageThreads[peerId] ?? [];
    const existingIndex = thread.findIndex((item) => item.id === message.id);
    let next: Message[];
    if (existingIndex > -1) {
      next = [...thread];
      next[existingIndex] = message;
    } else {
      next = [...thread, message];
    }
    next = next.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    this.messageThreads = {
      ...this.messageThreads,
      [peerId]: next
    };
  }

  #clearThread(peerId: string): void {
    if (!(peerId in this.messageThreads)) {
      return;
    }
    const { [peerId]: _removed, ...rest } = this.messageThreads;
    this.messageThreads = rest;
  }

  async #loadUsers(selectUserId?: string): Promise<void> {
    const users = await firstValueFrom(this.#api.getUsers());
    this.allUsers = users;
    this.authorMap = users.reduce<Record<string, SocialUser>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
    const targetId = selectUserId ?? this.activeUser?.id;
    if (targetId) {
      const found = users.find((user) => user.id === targetId);
      if (found) {
        this.#userState.setActiveUser(found);
      } else if (!selectUserId) {
        this.#userState.clear();
      }
    }
  }

  #handleNewUser(user: SocialUser): void {
    const exists = this.allUsers.some((existing) => existing.id === user.id);
    if (exists) {
      return;
    }
    this.allUsers = [...this.allUsers, user];
    this.authorMap = { ...this.authorMap, [user.id]: user };
  }
}
