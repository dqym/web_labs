import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Post, SocialUser } from '../../models/social.models';
import { NewItemHighlightDirective } from '../../directives/new-item-highlight.directive';

@Component({
  selector: 'app-post-feed',
  standalone: true,
  imports: [CommonModule, DatePipe, NewItemHighlightDirective],
  templateUrl: './post-feed.component.html',
  styleUrl: './post-feed.component.scss'
})
export class PostFeedComponent {
  @Input() posts: Post[] = [];
  @Input() authorMap: Partial<Record<string, SocialUser>> = {};
  @Input() loading = false;
  @Output() refresh = new EventEmitter<void>();

  trackByPostId(_: number, post: Post): string {
    return post.id;
  }
}
