// sidebar.ts
import { Component, HostListener, inject, computed } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { UiStateService } from "../../../core/ui-state.service";
import { AuthService } from "../../../core/auth.service";
import { AuthUiService } from "../../../core/auth-ui.service";
import { ProfilesService } from "../../../core/services/profiles.service";

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
  public profiles = inject(ProfilesService);

  constructor(public ui: UiStateService) {}

  isDesktop = window.innerWidth >= 768;
  @HostListener("window:resize") onResize() { this.isDesktop = window.innerWidth >= 768; }

  // ✅ La sesión está lista cuando initialized() es true
  readonly sessionReady = computed(() => this.authService.initialized());

  // ✅ Si no hay usuario, perfiles "ready" por definición; si hay, deben haberse cargado al menos 1 vez
  readonly profilesReady = computed(() => {
    const hasUser = !!this.authService.user();
    if (!hasUser) return true;
    const loadedOnce = this.profiles.hasLoadedOnce?.() ?? (this.profiles.profiles().length > 0);
    return loadedOnce && !this.profiles.loading();
  });

  // 🚫 Bloqueo maestro
  readonly blockSidebar = computed(() => !this.sessionReady() || !this.profilesReady());

  get user() { return this.authService.user(); }

  isActiveExact(path: string) { return this.router.url === path; }
  isActiveStartsWith(prefix: string) { return this.router.url.startsWith(prefix); }

  private closeIfMobile() { if (!this.isDesktop) this.ui.close(); }

  navigateToDashboard() {
    if (this.blockSidebar()) return; // 🔒
    const user = this.authService.user();
    if (user) {
      this.router.navigate([user.is_admin ? "/dashboard/admin" : "/dashboard/user"]);
      this.closeIfMobile();
    } else {
      this.authUi.openLogin();
      this.closeIfMobile();
    }
  }

  navigateToWatchlist() {
    if (this.blockSidebar()) return; // 🔒
    const user = this.authService.user();
    if (user) {
      this.router.navigate(["/watchlists"]);
      this.closeIfMobile();
    } else {
      this.authUi.openLogin();
      this.closeIfMobile();
    }
  }

  navigateToSubscriptions() {
    if (this.blockSidebar()) return; // 🔒
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
