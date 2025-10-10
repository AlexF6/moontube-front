import { Component, signal, HostListener, effect } from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { Header } from './shared/components/header/header';
import { RouterOutlet } from '@angular/router';
import { UiStateService } from "../app/core/ui-state.service";
import { AuthUiService } from "../app/core/auth-ui.service";
import { Login } from './features/login/login';
import { Register } from './features/register/register';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ Sidebar, Header, RouterOutlet, Login, Register ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
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
