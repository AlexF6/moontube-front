import { Component, signal, HostListener } from '@angular/core';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { VideoGrid } from './shared/components/video-grid/video-grid';
import { Header } from './shared/components/header/header';
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
