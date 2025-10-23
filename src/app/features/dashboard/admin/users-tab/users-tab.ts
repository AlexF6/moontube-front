import { Component, OnInit, WritableSignal, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/services/users.service';
import type { User } from '../../../../models/user.model';

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
  editingUser: WritableSignal<User | null> = signal(null);

  newUser = { name: '', email: '', password: '', is_admin: false, active: true };

  constructor(private usersSvc: UsersService) {}
  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.usersSvc.list().subscribe({
      next: (res) => { this.users.set(res); this.isLoading.set(false); },
      error: () => { this.error.set('Failed to load users'); this.isLoading.set(false); }
    });
  }

  create() {
    const { name, email, password } = this.newUser;
    if (!name || !email || !password) { this.error.set('Please fill all required fields'); return; }
    this.isLoading.set(true);
    this.usersSvc.create(this.newUser).subscribe({
      next: (user) => { this.users.update(u => [...u, user]); this.newUser = { name:'', email:'', password:'', is_admin:false, active:true }; this.isLoading.set(false); },
      error: (e) => { this.error.set(e.error?.detail || 'Failed to create user'); this.isLoading.set(false); }
    });
  }

  openEditModal(user: User) { this.editingUser.set({ ...user }); this.isEditModalOpen.set(true); }
  closeEditModal() { this.isEditModalOpen.set(false); this.editingUser.set(null); }

  saveEdits() {
    const user = this.editingUser(); if (!user) return;
    this.isLoading.set(true);
    const patch = { name: user.name, email: user.email, active: user.active, is_admin: user.is_admin };
    this.usersSvc.update(user.id, patch).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.closeEditModal(); this.isLoading.set(false);
      },
      error: (e) => { this.error.set(e.error?.detail || 'Failed to update user'); this.isLoading.set(false); }
    });
  }

  toggleActive(user: User) {
    this.usersSvc.update(user.id, { active: !user.active }).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
      },
      error: () => this.error.set('Failed to update user')
    });
  }

  remove(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersSvc.delete(id).subscribe({
      next: () => this.users.update(list => list.filter(u => u.id !== id)),
      error: () => this.error.set('Failed to delete user')
    });
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString(); }
  clearError() { this.error.set(null); }
}