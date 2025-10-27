import { Component, HostListener, inject } from "@angular/core";
import { UiStateService } from '../../../core/ui-state.service';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/auth.service";
import { AuthUiService } from "../../../core/auth-ui.service";
@Component({
  selector: "app-sidebar",
  imports: [RouterLink],
  standalone: true,
  templateUrl: "./sidebar.html"
})

export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);
  private authUi = inject(AuthUiService);
  
  
  constructor(public ui: UiStateService) {}
  isDesktop = window.innerWidth >= 768;
  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 768;
  }

  get user() {
    return this.authService.user();
  }

  navigateToDashboard() {
    const user = this.authService.user();
    
    if (user) {
      // User is logged in - navigate to appropriate dashboard
      if (user.is_admin) {
        this.router.navigate(['/dashboard/admin']);
      } else {
        this.router.navigate(['/dashboard/user']);
      }
    } else {
      // User is not logged in - open login modal
      this.authUi.openLogin();
      this.ui.close(); // Close sidebar on mobile after clicking
    }
  }

  getDashboardLink(): string {
    const user = this.authService.user();
    return user?.is_admin ? '/dashboard/admin' : '/dashboard/user';
  }
}