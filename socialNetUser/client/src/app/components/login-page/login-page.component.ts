import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements OnInit {
  #fb = inject(FormBuilder);
  #api = inject(ApiService);
  #router = inject(Router);
  #userState = inject(UserStateService);

  loading = false;
  error = '';

  form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  ngOnInit(): void {
    const active = this.#userState.snapshot;
    if (active) {
      void this.#router.navigate(['/feed']);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      this.loading = true;
      this.error = '';
      const { email, password } = this.form.getRawValue();
      const user = await firstValueFrom(this.#api.login(email, password));
      this.#userState.setActiveUser(user);
      await this.#router.navigate(['/feed']);
    } catch (error) {
      console.error(error);
      this.error = 'Неверный email или пароль.';
    } finally {
      this.loading = false;
    }
  }
}
