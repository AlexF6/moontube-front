// src/app/features/dashboard/user/users-tab/user-tab.ts
import { Component, OnInit, WritableSignal, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users.service';
import type { User, UserMeUpdate, PasswordChange } from '../../../../models/user.model';

@Component({
  selector: 'app-user-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-tab.html',
})
export class UserTabComponent implements OnInit {
  private usersSvc = inject(UsersService);

  // UI state
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // User data
  user: WritableSignal<User | null> = signal<User | null>(null);

  // Modal states
  showEditModal = signal<boolean>(false);
  showPasswordModal = signal<boolean>(false);

  // Forms
  editProfile: WritableSignal<UserMeUpdate> = signal<UserMeUpdate>({
    name: '',
    email: '',
  });

  passwordChange: WritableSignal<PasswordChange & { confirm_new_password: string }> = signal({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  ngOnInit(): void {
    this.loadMyProfile();
  }

  // ------- Load profile -------
  private loadMyProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersSvc.getMe().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.detail || 'Failed to load profile.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  // ------- Edit Profile -------
  openEditModal(): void {
    const currentUser = this.user();
    if (!currentUser) return;

    this.editProfile.set({
      name: currentUser.name || '',
      email: currentUser.email || '',
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  setEdit<K extends keyof UserMeUpdate>(key: K, value: UserMeUpdate[K]): void {
    this.editProfile.update((prev) => ({ ...prev, [key]: value }));
  }

  updateProfile(): void {
    const patch = this.editProfile();
    
    // Basic validation
    if (!patch.name?.trim()) {
      this.error.set('Name is required');
      return;
    }

    if (!patch.email?.trim()) {
      this.error.set('Email is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.usersSvc.updateMe(patch).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.showEditModal.set(false);
        this.success.set('Profile updated successfully');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to update profile');
        this.loading.set(false);
      },
    });
  }

  // ------- Change Password -------
  openPasswordModal(): void {
    this.passwordChange.set({
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    });
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  setPassword<K extends keyof (PasswordChange & { confirm_new_password: string })>(
    key: K,
    value: (PasswordChange & { confirm_new_password: string })[K]
  ): void {
    this.passwordChange.update((prev) => ({ ...prev, [key]: value }));
  }

  changePassword(): void {
    const dto = this.passwordChange();
    
    // Validation
    if (!dto.current_password) {
      this.error.set('Current password is required');
      return;
    }

    if (!dto.new_password) {
      this.error.set('New password is required');
      return;
    }

    if (dto.new_password.length < 6) {
      this.error.set('New password must be at least 6 characters long');
      return;
    }

    if (dto.new_password !== dto.confirm_new_password) {
      this.error.set('New passwords do not match');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const passwordChangeDto: PasswordChange = {
      current_password: dto.current_password,
      new_password: dto.new_password,
    };

    this.usersSvc.changeMyPassword(passwordChangeDto).subscribe({
      next: () => {
        this.showPasswordModal.set(false);
        this.success.set('Password changed successfully');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to change password');
        this.loading.set(false);
      },
    });
  }

  // ------- UI helpers -------
  formatDate(d: string | null): string {
    if (!d) return 'Never';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleString();
  }

  clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }
}