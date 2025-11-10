// src/app/features/dashboard/user/profiles-tab/profiles-tab.ts
import { Component, OnInit, WritableSignal, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { AuthService } from '../../../../core/auth.service';
import type {
  Profile,
  ProfileCreate,
  ProfileCreateMe,
  ProfileList,
  ProfileUpdate,
} from '../../../../models/profile.model';

type Maturity = { value: string; label: string };

@Component({
  selector: 'app-profiles-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profiles-tab.html',
})
export class ProfilesTabComponent implements OnInit {
  private profilesSvc = inject(ProfilesService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  // UI state
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  // Cap (manténlo sincronizado con el backend)
  readonly MAX_PROFILES_PER_USER = 2;

  // Derivados usando el servicio
  readonly profiles = computed(() => this.profilesSvc.profiles());
  readonly canCreateMore = computed(() => this.profiles().length < this.MAX_PROFILES_PER_USER);

  // Forms
  newProfile: WritableSignal<ProfileCreate> = signal<ProfileCreate>({
    user_id: '',            // ignorado en /me
    name: '',
    avatar: null,
    maturity_rating: 'G',
  });

  editProfile: WritableSignal<Partial<Profile> & { id: string }> = signal({
    id: '',
    created_by: '',
    updated_by: null,
    created_at: '',
    updated_at: null,
    user_id: '',
    name: '',
    avatar: null,
    maturity_rating: 'G',
  });

  maturityRatings: Maturity[] = [
    { value: 'G', label: 'G — General Audience' },
    { value: 'PG', label: 'PG — Parental Guidance' },
    { value: 'PG-13', label: 'PG-13 — Parents Strongly Cautioned' },
    { value: 'R', label: 'R — Restricted' },
    { value: 'NC-17', label: 'NC-17 — Adults Only' },
  ];

  ngOnInit(): void {
    this.loadProfiles();
  }

  // ------- Load list -------
  private loadProfiles(): void {
    this.loading.set(true);
    this.error.set(null);

    this.profilesSvc.loadMyProfiles(true);
    // El propio servicio maneja loading interno; aquí solo apagamos el spinner local
    // cuando termine el tick
    queueMicrotask(() => this.loading.set(false));
  }

  // ------- Create -------
  openCreateModal(): void {
    if (!this.canCreateMore()) {
      this.error.set(`You can only have ${this.MAX_PROFILES_PER_USER} profiles.`);
      return;
    }
    this.newProfile.set({
      user_id: '', name: '', avatar: null, maturity_rating: 'G',
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void { this.showCreateModal.set(false); }

  setNew<K extends keyof ProfileCreate>(key: K, value: ProfileCreate[K]): void {
    this.newProfile.update((prev) => ({ ...prev, [key]: value }));
  }

  createProfile(): void {
    if (!this.canCreateMore()) {
      this.error.set(`You can only have ${this.MAX_PROFILES_PER_USER} profiles.`);
      return;
    }
    const { name, avatar, maturity_rating } = this.newProfile();
    const body: ProfileCreateMe = {
      name,
      avatar: avatar === '' ? null : avatar,
      maturity_rating: maturity_rating === '' ? null : maturity_rating,
    };

    this.loading.set(true);
    this.profilesSvc.createMyProfile(body).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loading.set(false);
        // No llames loadProfiles(); el servicio ya sincronizó y disparó signals
      },
      error: (err) => {
        if (err?.status === 403 && /limit|maximum/i.test(err?.error?.detail ?? '')) {
          this.error.set(`You can only have ${this.MAX_PROFILES_PER_USER} profiles.`);
        } else {
          this.error.set(err?.error?.detail || 'Failed to create profile.');
        }
        this.loading.set(false);
      },
    });
  }

  // ------- Edit / Update -------
  openEditModal(p: ProfileList): void {
    this.editProfile.set({
      id: p.id,
      created_by: '',
      updated_by: null,
      created_at: '',
      updated_at: null,
      user_id: p.user_id,
      name: p.name,
      avatar: p.avatar,
      maturity_rating: p.maturity_rating,
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void { this.showEditModal.set(false); }

  setEdit<K extends keyof ProfileUpdate>(key: K, value: ProfileUpdate[K]): void {
    this.editProfile.update((prev) => ({ ...prev, [key]: value }));
  }

  updateProfile(): void {
    const current = this.editProfile();
    const patch: ProfileUpdate = {
      name: current.name,
      avatar: current.avatar === '' ? null : (current.avatar ?? null),
      maturity_rating: current.maturity_rating === '' ? null : (current.maturity_rating ?? null),
    };

    this.loading.set(true);
    this.profilesSvc.updateMyProfile(current.id!, patch).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to update profile.');
        this.loading.set(false);
      },
    });
  }

  // ------- Delete -------
  deleteProfile(p: ProfileList): void {
    if (!confirm(`Delete profile "${p.name}"?`)) return;

    this.loading.set(true);
    this.profilesSvc.deleteMyProfile(p.id).subscribe({
      next: () => { this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to delete profile.');
        this.loading.set(false);
      },
    });
  }

  // ------- UI helpers -------
  formatDate(d: string | null): string {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleString();
  }

  getMaturityRatingLabel(value: string | null): string {
    if (!value) return '—';
    return this.maturityRatings.find((r) => r.value === value)?.label ?? value;
  }

  getDefaultAvatar(name: string): SafeHtml {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <rect width="100%" height="100%" rx="8" fill="#374151"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-size="24" font-family="Inter, system-ui, sans-serif" fill="#F9FAFB">
          ${initials || '?'}
        </text>
      </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
