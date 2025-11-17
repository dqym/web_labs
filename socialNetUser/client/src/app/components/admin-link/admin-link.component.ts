import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-admin-link',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-link.component.html',
  styleUrl: './admin-link.component.scss'
})
export class AdminLinkComponent {
  #userState = inject(UserStateService);

  get user() {
    return this.#userState.snapshot;
  }

  openModule(): void {
    if (!this.user?.isAdmin) {
      return;
    }
    window?.open('https://localhost:8443/', '_blank');
  }
}
