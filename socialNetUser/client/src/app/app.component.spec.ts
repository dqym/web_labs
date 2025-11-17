import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { SocialUser } from './models/social.models';
import { ApiService } from './services/api.service';
import { RealTimeService } from './services/realtime.service';
import { UserStateService } from './services/user-state.service';
import { AppComponent } from './app.component';

class ApiServiceStub {
  getUsers() {
    return of([]);
  }
}

class UserStateServiceStub {
  #state = new BehaviorSubject<SocialUser | null>(null);
  activeUser$ = this.#state.asObservable();

  get snapshot() {
    return this.#state.value;
  }

  setActiveUser(user: SocialUser): void {
    this.#state.next(user);
  }

  clear(): void {
    this.#state.next(null);
  }
}

class RealTimeServiceStub {
  refresh$ = new Subject<void>();
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
			{ provide: ApiService, useClass: ApiServiceStub },
			{ provide: UserStateService, useClass: UserStateServiceStub },
			{ provide: RealTimeService, useClass: RealTimeServiceStub }
		]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should expose the application title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('SocialNet User');
  });

  it('should render the hero headline', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Добро пожаловать!');
  });
});
