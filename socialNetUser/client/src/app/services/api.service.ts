import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FeedResponse, Message, MessagesResponse, Post, SocialUser } from '../models/social.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  #http = inject(HttpClient);
  #baseUrl = environment.apiUrl;

  getUsers(): Observable<SocialUser[]> {
    return this.#http.get<SocialUser[]>(`${this.#baseUrl}/users`);
  }

  login(email: string, password: string): Observable<SocialUser> {
    return this.#http.post<SocialUser>(`${this.#baseUrl}/users/login`, { email, password });
  }

  registerUser(payload: Partial<SocialUser>): Observable<SocialUser> {
    return this.#http.post<SocialUser>(`${this.#baseUrl}/users/register`, payload);
  }

  updatePhoto(userId: string, photoUrl: string): Observable<SocialUser> {
    return this.#http.put<SocialUser>(`${this.#baseUrl}/users/${userId}/photo`, { photoUrl });
  }

  removePhoto(userId: string): Observable<void> {
    return this.#http.delete<void>(`${this.#baseUrl}/users/${userId}/photo`);
  }

  addFriend(userId: string, friendId: string): Observable<SocialUser> {
    return this.#http.post<SocialUser>(`${this.#baseUrl}/users/${userId}/friends`, { friendId });
  }

  removeFriend(userId: string, friendId: string): Observable<void> {
    return this.#http.delete<void>(`${this.#baseUrl}/users/${userId}/friends/${friendId}`);
  }

  getFeed(userId: string): Observable<FeedResponse> {
    return this.#http.get<FeedResponse>(`${this.#baseUrl}/posts/feed/${userId}`);
  }

  createPost(authorId: string, content: string): Observable<Post> {
    return this.#http.post<Post>(`${this.#baseUrl}/posts`, { authorId, content });
  }

  getMessages(userId: string, peerId?: string): Observable<MessagesResponse> {
    const params = new URLSearchParams({ userId });
    if (peerId) {
      params.append('peerId', peerId);
    }
    return this.#http.get<MessagesResponse>(`${this.#baseUrl}/messages?${params.toString()}`);
  }

  sendMessage(fromUserId: string, toUserId: string, content: string): Observable<Message> {
    return this.#http.post<Message>(`${this.#baseUrl}/messages`, {
      fromUserId,
      toUserId,
      content
    });
  }
}
