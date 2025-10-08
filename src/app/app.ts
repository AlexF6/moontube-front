import { Component, signal } from '@angular/core';
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
  protected readonly title = signal('moontube');
}
