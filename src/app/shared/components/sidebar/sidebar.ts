import { Component, HostListener } from "@angular/core";
import { UiStateService } from '../../../core/ui-state.service';
import { RouterLink } from "@angular/router";
@Component({
  selector: "app-sidebar",
  imports: [RouterLink],
  standalone: true,
  templateUrl: "./sidebar.html"
})

export class Sidebar {
  constructor(public ui: UiStateService) {}
  isDesktop = window.innerWidth >= 768;
  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 768;
  }
}