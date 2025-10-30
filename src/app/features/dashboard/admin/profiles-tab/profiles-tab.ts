import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ProfilesService } from '../../../../core/services/profiles.service';
import { UsersService } from '../../../../core/services/users.service';
import type { User } from '../../../../models/user.model';
import {
  Profile,
  ProfileList,
  ProfileCreate,
  ProfileUpdate,
} from '../../../../models/profile.model';

interface QueryParams {
  user_id: string | null;
  q: string | null;
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-profiles-tab',
  templateUrl: './profiles-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ProfilesTabComponent implements OnInit {
  private profilesService = inject(ProfilesService);
  private usersService = inject(UsersService);

  // State signals
  error = signal<string | null>(null);
  items = signal<ProfileList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  editOpen = signal<boolean>(false);

  // Query and form signals
  query = signal<QueryParams>({
    user_id: null,
    q: null,
    limit: 50,
    offset: 0,
  });

  users = signal<User[]>([]);
  isUsersLoading = signal<boolean>(false);

  // Computed
  userNameMap = computed(() => {
    const map = new Map<string, string>();
    this.users().forEach((user) => {
      map.set(user.id, `${user.name} (${user.email})`);
    });
    return map;
  });

  // Creation form
  newProfile = signal<ProfileCreate>({
    user_id: '',
    name: '',
    avatar: null,
    maturity_rating: null,
  });

  canCreate = computed(() => {
    const p = this.newProfile();
    const name = (p.name ?? '').trim();
    return !!p.user_id && name.length > 0;
  });

  // Editing
  editing = signal<Profile | null>(null);

  // ---------- Lifecycle ----------
  async ngOnInit() {
    await Promise.all([this.loadUsers(), this.loadProfiles()]);
  }

  // ---------- Handlers used by the template (no arrow funcs in template) ----------
  onQueryChange<K extends keyof QueryParams>(key: K, value: QueryParams[K]) {
    this.query.update((q) => ({ ...q, [key]: value }));
  }

  onNewProfileChange<K extends keyof ProfileCreate>(
    key: K,
    value: ProfileCreate[K]
  ) {
    this.newProfile.update((p) => ({ ...p, [key]: value }));
  }

  applyFilters() {
    this.query.update((q) => ({ ...q, offset: 0 }));
    this.loadProfiles();
  }

  resetFilters() {
    this.query.set({ user_id: null, q: null, limit: 50, offset: 0 });
    this.loadProfiles();
  }

  clearError() {
    this.error.set(null);
  }

  // ---------- Data ----------
  private async loadUsers() {
    try {
      this.isUsersLoading.set(true);
      const users = await firstValueFrom(this.usersService.list());
      this.users.set(users ?? []);
    } catch (err: any) {
      this.error.set('Failed to load users: ' + this.getErrorMessage(err));
    } finally {
      this.isUsersLoading.set(false);
    }
  }

  async loadProfiles() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(
        this.profilesService.getProfiles(this.query())
      );
      this.items.set(response ?? []);
      this.total.set(response?.length ?? 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  // ---------- Create ----------
  async create() {
    if (!this.canCreate()) {
      this.error.set('Please select a user and enter a profile name');
      return;
    }
    try {
      this.isCreating.set(true);
      this.error.set(null);

      const payload = this.newProfile();
      const body: ProfileCreate = {
        ...payload,
        avatar: payload.avatar === '' ? null : payload.avatar,
        maturity_rating:
          (payload.maturity_rating as any) === '' ? null : payload.maturity_rating,
      };

      await firstValueFrom(this.profilesService.createProfile(body));

      this.newProfile.set({
        user_id: '',
        name: '',
        avatar: null,
        maturity_rating: null,
      });

      await this.loadProfiles();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isCreating.set(false);
    }
  }

  // ---------- Edit ----------
  async openEdit(profileId: string) {
    try {
      this.error.set(null);
      const profile = await firstValueFrom(
        this.profilesService.getProfile(profileId)
      );
      this.editing.set(profile ?? null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.isUpdating.set(true);
      this.error.set(null);
      const editingProfile = this.editing();
      if (!editingProfile?.id) return;

      const updateData: ProfileUpdate = {
        name: editingProfile.name,
        avatar:
          (editingProfile.avatar as any) === '' ? null : editingProfile.avatar,
        maturity_rating:
          (editingProfile.maturity_rating as any) === ''
            ? null
            : editingProfile.maturity_rating,
      };

      await firstValueFrom(
        this.profilesService.updateProfile(editingProfile.id, updateData)
      );

      this.editOpen.set(false);
      this.editing.set(null);
      await this.loadProfiles();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isUpdating.set(false);
    }
  }

  // ---------- Delete ----------
  async remove(profileId: string) {
    if (
      !confirm(
        'Are you sure you want to delete this profile? This action cannot be undone.'
      )
    ) {
      return;
    }
    try {
      this.error.set(null);
      await firstValueFrom(this.profilesService.deleteProfile(profileId));
      await this.loadProfiles();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  // ---------- Utils ----------
  getUserName(userId: string): string {
    return this.userNameMap().get(userId) || 'Unknown User';
  }

  getMaturityRatingDescription(rating: string | null): string {
    switch (rating) {
      case 'G':
        return 'General Audience';
      case 'PG':
        return 'Parental Guidance';
      case 'PG-13':
        return 'Parents Strongly Cautioned';
      case 'R':
        return 'Restricted';
      case 'NC-17':
        return 'Adults Only';
      default:
        return 'Not specified';
    }
  }

  getMaturityRatingColor(rating: string | null): string {
    switch (rating) {
      case 'G':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'PG':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'PG-13':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'R':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case 'NC-17':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.detail) {
      if (Array.isArray(error.error.detail)) {
        return error.error.detail.map((d: any) => d.msg).join(', ');
      }
      return error.error.detail;
    }
    return error?.message || 'An unexpected error occurred';
  }
}
