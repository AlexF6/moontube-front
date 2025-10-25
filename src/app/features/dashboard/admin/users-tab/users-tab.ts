import { Component, OnInit, WritableSignal, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users.service';
import type { User } from '../../../../models/user.model';

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
  isLoading = signal(false);
  error = signal<string|null>(null);
  users = signal<User[]>([]);
  totalUsers = computed(() => this.users().length);

  isEditModalOpen: WritableSignal<boolean> = signal(false);
  isPasswordModalOpen: WritableSignal<boolean> = signal(false);
  editingUser: WritableSignal<User | null> = signal(null);

  // Query parameters
  query = signal<QueryParams>({
    q: null,
    include_deleted: false,
    only_active: false,
    limit: 50,
    offset: 0
  });

  newUser = { name: '', email: '', password: '', is_admin: false, active: true };
  newPassword = '';

  constructor(private usersSvc: UsersService) {}
  
  ngOnInit() { this.load(); }

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

  create() {
    const { name, email, password } = this.newUser;
    if (!name || !email || !password) { 
      this.error.set('Please fill all required fields'); 
      return; 
    }
    this.isLoading.set(true);
    this.usersSvc.create(this.newUser).subscribe({
      next: (user) => { 
        this.users.update(u => [...u, user]); 
        this.newUser = { name:'', email:'', password:'', is_admin:false, active:true }; 
        this.isLoading.set(false); 
        this.load(); // Reload to get updated list with proper ordering
      },
      error: (e) => { 
        this.error.set(this.getErrorMessage(e)); 
        this.isLoading.set(false); 
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
    const patch = { name: user.name, email: user.email, active: user.active, is_admin: user.is_admin };
    this.usersSvc.update(user.id, patch).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.closeEditModal(); 
        this.isLoading.set(false);
      },
      error: (e) => { 
        this.error.set(this.getErrorMessage(e)); 
        this.isLoading.set(false); 
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
    this.usersSvc.setPassword(user.id, this.newPassword).subscribe({
      next: () => {
        this.closePasswordModal();
        this.isLoading.set(false);
        this.error.set(null);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
      }
    });
  }

  toggleActive(user: User) {
    this.usersSvc.update(user.id, { active: !user.active }).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
      },
      error: (e) => this.error.set(this.getErrorMessage(e))
    });
  }

  restore(user: User) {
    if (!confirm('Are you sure you want to restore this user?')) return;
    this.isLoading.set(true);
    this.usersSvc.restore(user.id).subscribe({
      next: (restored) => {
        this.users.update(list => list.map(u => u.id === restored.id ? restored : u));
        this.isLoading.set(false);
      },
      error: (e) => {
        this.error.set(this.getErrorMessage(e));
        this.isLoading.set(false);
      }
    });
  }

  remove(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersSvc.delete(id).subscribe({
      next: () => this.users.update(list => list.filter(u => u.id !== id)),
      error: (e) => this.error.set(this.getErrorMessage(e))
    });
  }

  applyFilters() {
    this.query().offset = 0;
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

  formatDate(d: string) { 
    return new Date(d).toLocaleDateString(); 
  }

  clearError() { 
    this.error.set(null); 
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