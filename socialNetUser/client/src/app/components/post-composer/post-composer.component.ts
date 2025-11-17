import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-post-composer-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.scss'
})
export class PostComposerComponent implements OnInit {
  #fb = inject(FormBuilder);
  #api = inject(ApiService);
  #userState = inject(UserStateService);
  #router = inject(Router);

  message = '';
  stateMessage = '';
  loading = false;

  form = this.#fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(4)]]
  });

  async ngOnInit(): Promise<void> {
    if (!this.activeUser) {
      await this.#router.navigate(['/login']);
    }
  }

  get activeUser() {
    return this.#userState.snapshot;
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.activeUser) {
      this.form.markAllAsTouched();
      this.stateMessage = 'Авторизуйтесь и заполните текст новости.';
      return;
    }
    try {
      this.loading = true;
      await this.#api.createPost(this.activeUser.id, this.form.value.content!).toPromise();
      this.stateMessage = 'Новость опубликована!';
      this.form.reset();
      this.#router.navigate(['/feed']);
    } catch (error) {
      console.error(error);
      this.stateMessage = 'Не удалось опубликовать новость.';
    } finally {
      this.loading = false;
    }
  }
}
