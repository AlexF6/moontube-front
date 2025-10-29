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

  userNameMap = computed(() => {
    const map = new Map<string, string>();
    this.users().forEach((user) => {
      map.set(user.id, `${user.name} (${user.email})`);
    });
    return map;
  });

  newProfile = signal<ProfileCreate>({
    user_id: '',
    name: '',
    avatar: null,
    maturity_rating: null,
  });

  editing = signal<Profile | null>(null);

  async ngOnInit() {
    await this.loadUsers();
    await this.loadProfiles();
  }

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

  async create() {
    try {
      this.error.set(null);

      const payload = this.newProfile();

      // Validate required fields
      if (!payload.user_id || !payload.name) {
        this.error.set('User and Profile Name are required');
        return;
      }

      // Normaliza strings vacíos -> null
      const body: ProfileCreate = {
        ...payload,
        avatar: payload.avatar === '' ? null : payload.avatar,
        maturity_rating:
          payload.maturity_rating === '' ? null : payload.maturity_rating,
      };

      await firstValueFrom(this.profilesService.createProfile(body));

      // Reset form
      this.newProfile.set({
        user_id: '',
        name: '',
        avatar: null,
        maturity_rating: null,
      });

      this.loadProfiles();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

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
      this.error.set(null);
      const editingProfile = this.editing();

      if (!editingProfile?.id) return;

      const updateData: ProfileUpdate = {
        name: editingProfile.name,
        avatar: editingProfile.avatar === '' ? null : editingProfile.avatar,
        maturity_rating:
          editingProfile.maturity_rating === ''
            ? null
            : editingProfile.maturity_rating,
      };

      await firstValueFrom(
        this.profilesService.updateProfile(editingProfile.id, updateData)
      );

      this.editOpen.set(false);
      this.editing.set(null);
      this.loadProfiles();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(profileId: string) {
    if (!confirm('Are you sure you want to delete this profile?')) {
      return;
    }

    try {
      this.error.set(null);
      await firstValueFrom(this.profilesService.deleteProfile(profileId));
      this.loadProfiles();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  applyFilters() {
    this.query.update((q) => ({ ...q, offset: 0 }));
    this.loadProfiles();
  }

  resetFilters() {
    this.query.set({
      user_id: null,
      q: null,
      limit: 50,
      offset: 0,
    });
    this.loadProfiles();
  }

  clearError() {
    this.error.set(null);
  }

  getUserName(userId: string): string {
    return this.userNameMap().get(userId) || 'Unknown User';
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
