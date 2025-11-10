import {
  Component, signal, effect, inject, computed, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { Header } from './shared/components/header/header';
import { Router, RouterOutlet } from '@angular/router';
import { UiStateService } from './core/ui-state.service';
import { AuthUiService } from './core/auth-ui.service';
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { SessionBootstrapService } from './core/session-bootstrap.service';
import { AuthService } from './core/auth.service';
import { ProfilesService } from './core/services/profiles.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Header, RouterOutlet, Login, Register],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnDestroy {
  private readonly _bootstrap = inject(SessionBootstrapService);
  public readonly ui = inject(UiStateService);
  public readonly authUi = inject(AuthUiService);

  // ⬇️ añade estos inyectables para confirmar logout
  private readonly auth = inject(AuthService);
  private readonly profiles = inject(ProfilesService);
  private readonly router = inject(Router);

  // Layout
  private readonly mq = window.matchMedia('(min-width: 768px)');
  isDesktop = signal(this.mq.matches);
  isSidebarOpen = signal(this.mq.matches);

  // ⬇️ incluye logoutConfirm en el cómputo
  modalOpen = computed(() =>
    this.authUi.isLoginOpen() ||
    this.authUi.isRegisterOpen() ||
    this.authUi.isLogoutConfirmOpen()
  );

  private bodyLock = effect(() => {
    const block = this.ui.isSidebarOpen() || this.modalOpen();
    document.body.classList.toggle('overflow-hidden', block);
  });

  private mqListener = (e: MediaQueryListEvent) => {
    this.isDesktop.set(e.matches);
    this.isSidebarOpen.set(e.matches);
  };

  constructor() {
    this.mq.addEventListener('change', this.mqListener);
  }

  ngOnDestroy() {
    this.mq.removeEventListener('change', this.mqListener);
  }

  confirmLogoutGlobal() {
    this.auth.logout().subscribe({
      next: () => {
        this.authUi.closeLogoutConfirm();
        this.profiles.reset();
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.authUi.closeLogoutConfirm();
        this.profiles.reset();
        this.router.navigateByUrl('/');
      }
    });
  }

  protected readonly title = signal('moontube');
}
