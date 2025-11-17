import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AutoScrollDirective } from '../../directives/auto-scroll.directive';
import { Message, SocialUser } from '../../models/social.models';

@Component({
  selector: 'app-message-center',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, AutoScrollDirective],
  templateUrl: './message-center.component.html',
  styleUrl: './message-center.component.scss'
})
export class MessageCenterComponent {
  @Input() currentUser: SocialUser | null = null;
  @Input() friendUsers: SocialUser[] = [];
  @Input() messages: Message[] = [];
  @Input() peerId: string | null = null;
  @Input() loading = false;

  @Output() peerChange = new EventEmitter<string>();
  @Output() sendMessage = new EventEmitter<{ toUserId: string; content: string }>();

  messageControl = new FormControl<string>('');

  onSelectPeer(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.peerChange.emit(value);
    }
  }

  onSend(): void {
    if (!this.messageControl.value || !this.peerId) {
      return;
    }
    this.sendMessage.emit({ toUserId: this.peerId, content: this.messageControl.value });
    this.messageControl.reset();
  }

  trackByMessageId(_: number, message: Message): string {
    return message.id;
  }
}
