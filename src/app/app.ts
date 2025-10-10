import { Component, signal, HostListener, effect, inject } from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { VideoGrid } from './shared/components/video-grid/video-grid';
import { Header } from './shared/components/header/header';
import { UiStateService } from "../app/core/ui-state.service";
import { AuthUiService } from "../app/core/auth-ui.service";
import { Login } from './features/login/login';
import { Register } from './features/register/register';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ Sidebar, VideoGrid, Header, Login, Register ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  isSidebarOpen = false;
  isDesktop = window.innerWidth >= 768;

  constructor(public ui: UiStateService, public authUi: AuthUiService) {
    effect(() => {
      const block = this.ui.isSidebarOpen() || this.authUi.isLoginOpen();
      document.body.classList.toggle('overflow-hidden', block);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 768;
    this.isSidebarOpen = this.isDesktop;
  }

  ngOnInit() {
    this.isSidebarOpen = this.isDesktop;
  }
  protected readonly title = signal('moontube');
}
