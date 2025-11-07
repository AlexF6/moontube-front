import { Component, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { UiStateService } from "../../../core/ui-state.service";
import { AuthUiService } from "../../../core/auth-ui.service";
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ProfilesService } from '../../../core/services/profiles.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ["./header.scss"]
})
export class Header implements OnDestroy {
  // Services
  public ui = inject(UiStateService);
  public authUi = inject(AuthUiService);
  public auth = inject(AuthService);
  private router = inject(Router);
  public profiles = inject(ProfilesService);

  // Search state
  query = '';
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // UI State
  readonly profileMenuOpen = signal(false);
  readonly searchFocused = signal(false);
  readonly hasMultipleProfiles = computed(() => this.profiles.profiles().length > 1);
  
  // Loading states
  readonly profilesLoading = computed(() => this.profiles.loading());
  readonly profilesError = computed(() => this.profiles.error());

  // Profile switching state
  readonly switchingProfile = signal(false);

  // Active profile display
  readonly activeProfileInitial = computed(() => {
    const active = this.profiles.active();
    return active?.name?.charAt(0)?.toUpperCase() || 'U';
  });

  // Profile colors for consistent avatars
  private readonly profileColors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
  ];

  readonly activeProfileColor = computed(() => {
    const profiles = this.profiles.profiles();
    const activeIndex = profiles.findIndex(p => p.id === this.profiles.activeId());
    return this.profileColors[activeIndex % this.profileColors.length] || 'bg-gradient-to-br from-zinc-600 to-zinc-700';
  });

  constructor() {
    // Debounce de búsqueda (igual que antes)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.updateUrl(q));

    // ❌ Quita este if (es frágil):
    // if (this.auth.user()) {
    //   this.profiles.loadMyProfiles();
    // }

    // ✅ Reacciona cuando user() cambia a autenticado:
    effect(() => {
      const u = this.auth.user();
      if (u && !this.profiles.loading() && !this.profiles.hasLoadedOnce?.()) {
        this.profiles.loadMyProfiles();
      }
    });

    // Mantén tu effect para cambios de perfil
    effect(() => {
      const activeProfile = this.profiles.active();
      const activeId = this.profiles.activeId();
      if (activeProfile && activeId) {
        this.refreshProfileData(activeId);
      }
    });
  }

  // Search handlers
  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this.searchSubject.next(value);
  }

  onSearch() {
    this.searchSubject.next(this.query);
    this.ui.close();
    this.searchFocused.set(false);
  }

  onSearchFocus() {
    this.searchFocused.set(true);
  }

  onSearchBlur() {
    // Small delay to allow clicks on clear/search buttons
    setTimeout(() => this.searchFocused.set(false), 150);
  }

  private updateUrl(query: string) {
    const q = query.trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q }, replaceUrl: true });
    } else {
      this.router.navigate(['/search']);
    }
  }

  clearSearch() {
    this.query = '';
    this.updateUrl('');
    // Focus back to input after clear
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) searchInput.focus();
  }

  // Profile switcher handlers
  toggleProfileMenu() {
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

async chooseProfile(id: string) {
  if (this.switchingProfile()) return;
  this.switchingProfile.set(true);
  this.profileMenuOpen.set(false);

  try {
    await this.profiles.setActiveProfile(id);
    
    // ✅ Navigate to current route to refresh data without full page reload
    const currentUrl = this.router.url.split('?')[0];
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
    
  } catch (error) {
    console.error('Failed to switch profile:', error);
  } finally {
    this.switchingProfile.set(false);
  }
}

  // Refresh profile-specific data when profile changes
  private refreshProfileData(profileId: string) {
    // Trigger any profile-specific data reloads here
    // For example, refresh watch history, recommendations, etc.
    // Example: this.watchHistoryService.refresh(profileId);
    // Example: this.recommendationsService.refresh(profileId);
  }

  // Navigation
  goHome() {
    this.router.navigate(['/']);
    this.ui.close();
  }

  // Profile avatar color
  getProfileColor(index: number): string {
    return this.profileColors[index % this.profileColors.length] || 'bg-gradient-to-br from-zinc-600 to-zinc-700';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.auth.logout().subscribe();
  }
}