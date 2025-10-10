import { Component, signal, HostListener, effect } from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { VideoGrid } from './shared/components/video-grid/video-grid';
import { Header } from './shared/components/header/header';
import { UiStateService } from "../app/core/ui-state.service";
import { Login } from './features/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ Sidebar, VideoGrid, Header ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  isSidebarOpen = false;
  isDesktop = window.innerWidth >= 768;

  constructor(public ui: UiStateService) {
    effect(() => {
      if (this.ui.isSidebarOpen()) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
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
