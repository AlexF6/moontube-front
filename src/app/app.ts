import { Component, signal } from '@angular/core';
import { Home } from './features/home/home';
import { Sidebar } from './shared/components/sidebar/sidebar';
@Component({
  selector: 'app-root',
  imports: [Home, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('moontube');
}
