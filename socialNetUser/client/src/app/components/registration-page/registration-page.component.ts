import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SocialUser } from '../../models/social.models';
import { ApiService } from '../../services/api.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss'
})
export class RegistrationPageComponent implements OnInit {
  #fb = inject(FormBuilder);
  #api = inject(ApiService);
  #router = inject(Router);
  #userState = inject(UserStateService);

  users: SocialUser[] = [];
  loading = false;
  status = '';

  registrationForm = this.#fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    photoUrl: [''],
    isAdmin: [false]
  });

  photoForm = this.#fb.nonNullable.group({
    photoUrl: ['', Validators.required]
  });

  get activeUser() {
    return this.#userState.snapshot;
  }

  async ngOnInit(): Promise<void> {
    await this.#loadUsers();
  }

  async submit(): Promise<void> {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }
    try {
      this.loading = true;
      const payload = this.registrationForm.getRawValue();
      const created = await firstValueFrom(this.#api.registerUser(payload));
      this.status = 'Пользователь зарегистрирован!';
      this.registrationForm.reset({ isAdmin: false });
      await this.#loadUsers(created.id);
      this.#userState.setActiveUser(created);
      this.#router.navigate(['/feed']);
    } catch (error) {
      console.error(error);
      this.status = 'Ошибка при регистрации.';
    } finally {
      this.loading = false;
    }
  }

  async updatePhoto(): Promise<void> {
    if (!this.photoForm.valid || !this.activeUser) {
      return;
    }
    try {
      this.loading = true;
      const updated = await firstValueFrom(
        this.#api.updatePhoto(this.activeUser.id, this.photoForm.value.photoUrl!)
      );
      this.status = 'Фото обновлено!';
      await this.#loadUsers(updated.id);
      this.#userState.setActiveUser(updated);
    } catch (error) {
      console.error(error);
      this.status = 'Не удалось обновить фото.';
    } finally {
      this.loading = false;
    }
  }

  async removePhoto(): Promise<void> {
    if (!this.activeUser) {
      return;
    }
    try {
      this.loading = true;
      await firstValueFrom(this.#api.removePhoto(this.activeUser.id));
      this.status = 'Фото удалено.';
      await this.#loadUsers(this.activeUser.id);
      const refreshed = this.users.find((u) => u.id === this.activeUser?.id);
      if (refreshed) {
        this.#userState.setActiveUser(refreshed);
      }
    } catch (error) {
      console.error(error);
      this.status = 'Не удалось удалить фото.';
    } finally {
      this.loading = false;
    }
  }

  trackByUserId(_: number, user: SocialUser): string {
    return user.id;
  }

  async #loadUsers(selectUserId?: string): Promise<void> {
    const loaded = await firstValueFrom(this.#api.getUsers());
    this.users = loaded;
    if (selectUserId) {
      const found = loaded.find((user) => user.id === selectUserId);
      if (found) {
        this.#userState.setActiveUser(found);
      }
    }
  }
}
