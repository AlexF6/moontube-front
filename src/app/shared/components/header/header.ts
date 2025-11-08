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
    // Debounce de búsqueda
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.updateUrl(q));

    // ⛳️ Ya no dispares loadMyProfiles aquí; lo hace SessionBootstrapService.
    // Mantén solo el efecto que reacciona al cambio del perfil activo:
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
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) searchInput.focus();
  }

  // Profile switcher handlers
  toggleProfileMenu() {
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

  chooseProfile(id: string) {
    if (this.switchingProfile()) return;
    this.switchingProfile.set(true);
    this.profileMenuOpen.set(false);

    try {
      this.profiles.setActiveProfile(id); // sync

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

  private refreshProfileData(profileId: string) {
    // Hook para refrescar data dependiente de perfil
  }

  // Navigation
  goHome() {
    this.router.navigate(['/']);
    this.ui.close();
  }

  getProfileColor(index: number): string {
    return this.profileColors[index % this.profileColors.length] || 'bg-gradient-to-br from-zinc-600 to-zinc-700';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    // Cerrar UI y menús antes de salir
    this.profileMenuOpen.set(false);
    this.ui.close();

    this.auth.logout().subscribe({
      next: () => {
        this.profiles.reset();
        // Redirige fuera de rutas protegidas/permisos
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.profiles.reset();
        this.router.navigateByUrl('/');
      }
    });
  }
}
