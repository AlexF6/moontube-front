// src/app/features/dashboard/admin/users-tab/users-tab.ts
import { Component, OnInit, WritableSignal, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users.service';
import type { User, UserAdminCreate, UserAdminUpdate } from '../../../../models/user.model';

interface QueryParams {
  q: string | null;
  include_deleted: boolean;
  only_active: boolean;
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-tab.html'
})
export class UsersTabComponent implements OnInit {
  private usersSvc = inject(UsersService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  users = signal<User[]>([]);
  totalUsers = computed(() => this.users().length);
  processingAction = signal<string | null>(null);

  isEditModalOpen: WritableSignal<boolean> = signal(false);
  isPasswordModalOpen: WritableSignal<boolean> = signal(false);
  editingUser: WritableSignal<User | null> = signal(null);

  // Query parameters (as a single signal object)
  query = signal<QueryParams>({
    q: null,
    include_deleted: false,
    only_active: false,
    limit: 50,
    offset: 0
  });

  newUser: UserAdminCreate = { name: '', email: '', password: '', is_admin: false, active: true };
  newPassword = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.usersSvc.list(this.query()).subscribe({
      next: (res) => {
        this.users.set(res);
        this.isLoading.set(false);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
      }
    });
  }

  // Immutable updates for the query signal
  onQueryChange(patch: Partial<QueryParams>) {
    this.query.update(q => ({ ...q, ...patch }));
  }

  applyFilters() {
    this.query.update(q => ({ ...q, offset: 0 }));
    this.load();
  }

  resetFilters() {
    this.query.set({
      q: null,
      include_deleted: false,
      only_active: false,
      limit: 50,
      offset: 0
    });
    this.load();
  }

  create() {
    const { name, email, password } = this.newUser;
    if (!name || !email || !password) {
      this.error.set('Please fill all required fields');
      return;
    }
    this.isLoading.set(true);
    this.processingAction.set('create');
    
    this.usersSvc.create(this.newUser).subscribe({
      next: (user) => {
        this.users.update(u => [...u, user]);
        this.newUser = { name: '', email: '', password: '', is_admin: false, active: true };
        this.isLoading.set(false);
        this.processingAction.set(null);
        this.load(); // keep ordering consistent with backend sort
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
        this.processingAction.set(null);
      }
    });
  }

  openEditModal(user: User) {
    this.editingUser.set({ ...user });
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingUser.set(null);
  }

  openPasswordModal(user: User) {
    this.editingUser.set(user);
    this.newPassword = '';
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal() {
    this.isPasswordModalOpen.set(false);
    this.editingUser.set(null);
    this.newPassword = '';
  }

  saveEdits() {
    const user = this.editingUser();
    if (!user) return;

    this.isLoading.set(true);
    this.processingAction.set(`edit-${user.id}`);
    
    const patch: UserAdminUpdate = {
      name: user.name,
      email: user.email,
      active: user.active,
      is_admin: user.is_admin,
    };

    this.usersSvc.update(user.id, patch).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.closeEditModal();
        this.isLoading.set(false);
        this.processingAction.set(null);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
        this.processingAction.set(null);
      }
    });
  }

  setPassword() {
    const user = this.editingUser();
    if (!user || !this.newPassword) {
      this.error.set('Password is required');
      return;
    }

    this.isLoading.set(true);
    this.processingAction.set(`password-${user.id}`);

    this.usersSvc.setPassword(user.id, this.newPassword).subscribe({
      next: () => {
        this.closePasswordModal();
        this.isLoading.set(false);
        this.error.set(null);
        this.processingAction.set(null);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
        this.processingAction.set(null);
      }
    });
  }

  toggleActive(user: User) {
    this.processingAction.set(`toggle-${user.id}`);
    
    this.usersSvc.update(user.id, { active: !user.active }).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.processingAction.set(null);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.processingAction.set(null);
      }
    });
  }

  restore(user: User) {
    if (!confirm('Are you sure you want to restore this user?')) return;
    this.isLoading.set(true);
    this.processingAction.set(`restore-${user.id}`);

    this.usersSvc.restore(user.id).subscribe({
      next: (restored) => {
        this.users.update(list => list.map(u => u.id === restored.id ? restored : u));
        this.isLoading.set(false);
        this.processingAction.set(null);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
        this.processingAction.set(null);
      }
    });
  }

  remove(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.processingAction.set(`delete-${id}`);

    this.usersSvc.delete(id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== id));
        this.processingAction.set(null);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.processingAction.set(null);
      }
    });
  }

  formatDate(d: string) {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  clearError() {
    this.error.set(null);
  }

  isProcessing(userId: string, action: string): boolean {
    return this.processingAction() === `${action}-${userId}`;
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