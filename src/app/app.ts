import {
  Component, signal, effect, inject, computed, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { Header } from './shared/components/header/header';
import { RouterOutlet } from '@angular/router';
import { UiStateService } from './core/ui-state.service';
import { AuthUiService } from './core/auth-ui.service';
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { SessionBootstrapService } from './core/session-bootstrap.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Header, RouterOutlet, Login, Register],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnDestroy {
  private readonly _bootstrap = inject(SessionBootstrapService); // dispara bootstrap
  public readonly ui = inject(UiStateService);
  public readonly authUi = inject(AuthUiService);

  // Estado de layout
  private readonly mq = window.matchMedia('(min-width: 768px)');
  isDesktop = signal(this.mq.matches);
  isSidebarOpen = signal(this.mq.matches);

  // Evita repetir condiciones en la vista
  modalOpen = computed(() => this.authUi.isLoginOpen() || this.authUi.isRegisterOpen());

  // Bloquea scroll del body cuando hay overlay/sidebar abiertos
  private bodyLock = effect(() => {
    const block = this.ui.isSidebarOpen() || this.modalOpen();
    document.body.classList.toggle('overflow-hidden', block);
  });

  // Suscripción a media query (mejor que window:resize)
  private mqListener = (e: MediaQueryListEvent) => {
    this.isDesktop.set(e.matches);
    this.isSidebarOpen.set(e.matches);
  };

  constructor() {
    // Escucha cambios de breakpoint
    this.mq.addEventListener('change', this.mqListener);
  }

  ngOnDestroy() {
    this.mq.removeEventListener('change', this.mqListener);
  }

  protected readonly title = signal('moontube');
}
