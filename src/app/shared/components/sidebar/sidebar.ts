import { Component, HostListener, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";

import { UiStateService } from "../../../core/ui-state.service";
import { AuthService } from "../../../core/auth.service";
import { AuthUiService } from "../../../core/auth-ui.service";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./sidebar.html"
})
export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);
  private authUi = inject(AuthUiService);

  constructor(public ui: UiStateService) {}

  isDesktop = window.innerWidth >= 768;

  @HostListener("window:resize")
  onResize() {
    this.isDesktop = window.innerWidth >= 768;
  }

  get user() {
    return this.authService.user();
  }

  /** Helpers to decide active UI (so "Home" isn't always active) */
  isActiveExact(path: string): boolean {
    return this.router.url === path;
  }
  isActiveStartsWith(prefix: string): boolean {
    return this.router.url.startsWith(prefix);
  }

  /** Close the sidebar on mobile after navigating */
  private closeIfMobile() {
    if (!this.isDesktop) this.ui.close();
  }

  /** Guarded navigations (open login if needed) */
  navigateToDashboard() {
    const user = this.authService.user();
    if (user) {
      this.router.navigate([user.is_admin ? "/dashboard/admin" : "/dashboard/user"]);
      this.closeIfMobile();
    } else {
      this.authUi.openLogin();
      this.closeIfMobile();
    }
  }

  navigateToPlaylist() {
    const user = this.authService.user();
    if (user) {
      this.router.navigate(["/playlists"]);
      this.closeIfMobile();
    } else {
      this.authUi.openLogin();
      this.closeIfMobile();
    }
  }

  navigateToSubscriptions() {
    const user = this.authService.user();
    if (user) {
      this.router.navigate(["/subscriptions"]);
      this.closeIfMobile();
    } else {
      this.authUi.openLogin();
      this.closeIfMobile();
    }
  }

  getDashboardLink(): string {
    const user = this.authService.user();
    return user?.is_admin ? "/dashboard/admin" : "/dashboard/user";
  }
}
