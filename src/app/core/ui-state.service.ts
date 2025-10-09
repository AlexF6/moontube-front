import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  isSidebarOpen = signal(false);

  toggle() {
    this.isSidebarOpen.update(open => !open);
  }

  close() {
    this.isSidebarOpen.set(false);
  }
}
