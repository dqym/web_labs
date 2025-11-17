import { Routes } from '@angular/router';
import { AdminLinkComponent } from './components/admin-link/admin-link.component';
import { FeedPageComponent } from './components/feed-page/feed-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { PostComposerComponent } from './components/post-composer/post-composer.component';
import { RegistrationPageComponent } from './components/registration-page/registration-page.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'register', component: RegistrationPageComponent },
	{ path: 'feed', component: FeedPageComponent },
	{ path: 'post', component: PostComposerComponent },
	{ path: 'admin', component: AdminLinkComponent },
	{ path: '**', redirectTo: 'login' }
];
