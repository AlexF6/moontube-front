// src/app/features/dashboard/user/profiles-tab/profiles-tab.component.ts
import { Component, OnInit, WritableSignal, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { AuthService } from '../../../../core/auth.service';
import type { Profile, ProfileCreate, ProfileList, ProfileUpdate } from '../../../../models/profile.model';

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
  profiles: WritableSignal<ProfileList[]> = signal<ProfileList[]>([]);

  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  // Forms (signals with immutable updates)
  newProfile: WritableSignal<ProfileCreate> = signal<ProfileCreate>({
    user_id: '', // set on openCreateModal using current user id
    name: '',
    avatar: '',
    maturity_rating: 'G',
  });

  editProfile: WritableSignal<Profile & { id: string }> = signal<any>({
    id: '',
    created_by: '',
    updated_by: null,
    created_at: '',
    updated_at: null,
    user_id: '',
    name: '',
    avatar: '',
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

    const user = this.auth.user?.();
    const isAdmin = !!user?.is_admin;

    (isAdmin
      ? this.profilesSvc.getProfiles({ user_id: user?.id ?? null, limit: 50, offset: 0 })
      : this.profilesSvc.getMyProfiles()
    ).subscribe({
      next: (rows) => { this.profiles.set(rows ?? []); this.loading.set(false); },
      error: (err) => {
        const msg = err?.status === 403
          ? 'You do not have permission to list profiles.'
          : err?.error?.detail || 'Failed to load profiles.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  // ------- Create -------
  openCreateModal(): void {
    const u = this.auth.user?.();
    const isAdmin = !!u?.is_admin;

    this.newProfile.set({
      user_id: isAdmin ? (u?.id ?? '') : '',   // ignored by /me endpoint
      name: '',
      avatar: '',
      maturity_rating: 'G',
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  setNew<K extends keyof ProfileCreate>(key: K, value: ProfileCreate[K]): void {
    this.newProfile.update((prev) => ({ ...prev, [key]: value }));
  }

  createProfile(): void {
    const u = this.auth.user?.();
    const isAdmin = !!u?.is_admin;

    this.loading.set(true);

    if (isAdmin) {
      const payload = this.newProfile(); // needs user_id
      if (!payload.user_id) {
        this.error.set('Missing user id to create profile.');
        this.loading.set(false);
        return;
      }
      this.profilesSvc.createProfile(payload).subscribe({
        next: () => { this.showCreateModal.set(false); this.loadProfiles(); },
        error: (err) => { this.error.set(err?.error?.detail || 'Failed to create profile.'); this.loading.set(false); },
      });
    } else {
      const { name, avatar, maturity_rating } = this.newProfile();
      this.profilesSvc.createMyProfile({ name, avatar, maturity_rating }).subscribe({
        next: () => { this.showCreateModal.set(false); this.loadProfiles(); },
        error: (err) => { this.error.set(err?.error?.detail || 'Failed to create profile.'); this.loading.set(false); },
      });
    }
  }

  // ------- Edit / Update -------
  openEditModal(p: ProfileList): void {
    const u = this.auth.user?.();
    const isAdmin = !!u?.is_admin;

    if (!isAdmin) {
      // Non-admin: we don’t call admin GET. Use list data directly.
      this.editProfile.set({
        id: p.id,
        created_by: '',
        updated_by: null,
        user_id: p.user_id,
        name: p.name,
        avatar: p.avatar,
        maturity_rating: p.maturity_rating,
      } as any);
      this.showEditModal.set(true);
      return;
    }

    // Admin: can fetch full profile
    this.loading.set(true);
    this.profilesSvc.getProfile(p.id).subscribe({
      next: (full) => {
        this.editProfile.set(full as any);
        this.showEditModal.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        // Fallback: still allow editing with list item
        this.editProfile.set({
          id: p.id,
          created_by: '',
          updated_by: null,
          user_id: p.user_id,
          name: p.name,
          avatar: p.avatar,
          maturity_rating: p.maturity_rating,
        } as any);
        this.showEditModal.set(true);
        this.loading.set(false);
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  setEdit<K extends keyof ProfileUpdate>(key: K, value: ProfileUpdate[K]): void {
    this.editProfile.update((prev) => ({ ...prev, [key]: value } as any));
  }

  updateProfile(): void {
    const u = this.auth.user?.();
    const isAdmin = !!u?.is_admin;

    const current = this.editProfile();
    const patch: ProfileUpdate = {
      name: current.name,
      avatar: current.avatar,
      maturity_rating: current.maturity_rating,
    };

    this.loading.set(true);

    (isAdmin
      ? this.profilesSvc.updateProfile(current.id, patch)
      : this.profilesSvc.updateMyProfile(current.id, patch)
    ).subscribe({
      next: () => { this.showEditModal.set(false); this.loadProfiles(); },
      error: (err) => { this.error.set(err?.error?.detail || 'Failed to update profile.'); this.loading.set(false); },
    });
  }

  // ------- Delete -------
  deleteProfile(p: ProfileList): void {
    if (!confirm(`Delete profile "${p.name}"?`)) return;

    const u = this.auth.user?.();
    const isAdmin = !!u?.is_admin;

    this.loading.set(true);

    (isAdmin
      ? this.profilesSvc.deleteProfile(p.id)
      : this.profilesSvc.deleteMyProfile(p.id)
    ).subscribe({
      next: () => this.loadProfiles(),
      error: (err) => { this.error.set(err?.error?.detail || 'Failed to delete profile.'); this.loading.set(false); },
    });
  }

  // ------- UI helpers -------
  formatDate(d: string | null): string {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d; // show raw if invalid
    return date.toLocaleString(); // or toLocaleDateString() if you prefer only date
  }

  getMaturityRatingLabel(value: string): string {
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
