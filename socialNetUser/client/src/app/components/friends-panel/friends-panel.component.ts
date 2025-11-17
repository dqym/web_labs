import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SocialUser } from '../../models/social.models';

@Component({
  selector: 'app-friends-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './friends-panel.component.html',
  styleUrl: './friends-panel.component.scss'
})
export class FriendsPanelComponent {
  @Input() currentUser: SocialUser | null = null;
  @Input() allUsers: SocialUser[] = [];
  @Input() userMap: Partial<Record<string, SocialUser>> = {};
  @Input() loading = false;
  @Output() addFriend = new EventEmitter<string>();
  @Output() removeFriend = new EventEmitter<string>();

  friendControl = new FormControl<string>('');

  get availableUsers(): SocialUser[] {
    if (!this.currentUser) {
      return [];
    }
    const excluded = new Set([this.currentUser.id, ...this.currentUser.friends]);
    return this.allUsers.filter((user) => !excluded.has(user.id));
  }

  onAdd(): void {
    const friendId = this.friendControl.value;
    if (friendId) {
      this.addFriend.emit(friendId);
      this.friendControl.reset();
    }
  }
}
