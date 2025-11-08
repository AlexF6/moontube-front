import { Component, signal, HostListener, effect, inject } from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { Header } from './shared/components/header/header';
import { RouterOutlet } from '@angular/router';
import { UiStateService } from "../app/core/ui-state.service";
import { AuthUiService } from "../app/core/auth-ui.service";
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { SessionBootstrapService } from './core/session-bootstrap.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Header, RouterOutlet, Login, Register],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  private _bootstrap = inject(SessionBootstrapService);

  isSidebarOpen = false;
  isDesktop = window.innerWidth >= 768;

  constructor(public ui: UiStateService, public authUi: AuthUiService) {
    effect(() => {
      const block = this.ui.isSidebarOpen() || this.authUi.isLoginOpen() || this.authUi.isRegisterOpen();
      document.body.classList.toggle('overflow-hidden', block);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 768;
    this.isSidebarOpen = this.isDesktop;
  }

  ngOnInit() { this.isSidebarOpen = this.isDesktop; }

  protected readonly title = signal('moontube');
}
