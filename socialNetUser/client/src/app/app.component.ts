import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SocialUser } from './models/social.models';
import { ApiService } from './services/api.service';
import { RealTimeService } from './services/realtime.service';
import { UserStateService } from './services/user-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  #api = inject(ApiService);
  #userState = inject(UserStateService);
  #realtime = inject(RealTimeService);
  #router = inject(Router);

  title = 'SocialNet User';
  users: SocialUser[] = [];
  loadingUsers = false;

  get activeUser() {
    return this.#userState.snapshot;
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
    this.#realtime.refresh$.subscribe(() => this.loadUsers());
  }

  async loadUsers(): Promise<void> {
    this.loadingUsers = true;
    try {
      const users = await firstValueFrom(this.#api.getUsers());
      this.users = users;
      const activeId = this.activeUser?.id;
      if (activeId) {
        const refreshed = users.find((user) => user.id === activeId);
        if (refreshed) {
          this.#userState.setActiveUser(refreshed);
        } else {
          this.#userState.clear();
        }
      }
    } finally {
      this.loadingUsers = false;
    }
  }

  async onLogout(): Promise<void> {
    this.#userState.clear();
    await this.#router.navigate(['/login']);
  }
}
