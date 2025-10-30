// src/app/features/watchlist/watchlist.ts
import { Component, OnInit, WritableSignal, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WatchlistService } from '../../core/services/watchlist.service';
import { AuthService } from '../../core/auth.service';
import type { Watchlist, WatchlistList, WatchlistCreate, WatchlistUpdate } from '../../models/watchlist.model';

interface Filters {
  profile_id: string;
  content_id: string;
  added_from: string;
  added_to: string;
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.html',
})
export class WatchlistComponent implements OnInit {
  private watchlistSvc = inject(WatchlistService);
  private auth = inject(AuthService);

  // UI state
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  watchlists: WritableSignal<WatchlistList[]> = signal<WatchlistList[]>([]);

  showEditModal = signal<boolean>(false);
  processingAction = signal<string | null>(null);

  // User state
  isAdmin = signal<boolean>(false);

  // Forms (signals with immutable updates)
  editWatchlist: WritableSignal<Watchlist & { id: string }> = signal<any>({
    id: '',
    created_by: '',
    updated_by: null,
    created_at: '',
    updated_at: null,
    profile_id: '',
    content_id: '',
    added_at: '',
  });

  // Filter state - simplified for user view
  filters: WritableSignal<Filters> = signal<Filters>({
    profile_id: '',
    content_id: '',
    added_from: '',
    added_to: '',
    limit: 50,
    offset: 0
  });

  ngOnInit(): void {
    this.checkUserRole();
    this.loadWatchlists();
  }

  private checkUserRole(): void {
    const user = this.auth.user?.();
    this.isAdmin.set(!!user?.is_admin);
  }

  // ------- Load list -------
  private loadWatchlists(): void {
    this.loading.set(true);
    this.error.set(null);

    const currentFilters = this.filters();
    const params: any = {};

    // Add non-empty filters
    if (currentFilters.profile_id) params.profile_id = currentFilters.profile_id;
    if (currentFilters.content_id) params.content_id = currentFilters.content_id;
    if (currentFilters.added_from) params.added_from = currentFilters.added_from;
    if (currentFilters.added_to) params.added_to = currentFilters.added_to;
    if (currentFilters.limit) params.limit = currentFilters.limit;
    if (currentFilters.offset) params.offset = currentFilters.offset;

    const observable = this.isAdmin() 
      ? this.watchlistSvc.getWatchlists(params)
      : this.watchlistSvc.getMyWatchlists(params);

    observable.subscribe({
      next: (rows) => { 
        this.watchlists.set(rows ?? []); 
        this.loading.set(false); 
      },
      error: (err) => {
        const msg = err?.error?.detail || 'Failed to load watchlist items.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  // ------- Edit / Update -------
  openEditModal(w: WatchlistList): void {
    this.loading.set(true);
    
    const observable = this.isAdmin()
      ? this.watchlistSvc.getWatchlist(w.id)
      : this.watchlistSvc.getMyWatchlist(w.id);

    observable.subscribe({
      next: (full) => {
        this.editWatchlist.set(full as any);
        this.showEditModal.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        // Fallback: use list item data
        this.editWatchlist.set({
          id: w.id,
          created_by: '',
          updated_by: null,
          created_at: '',
          updated_at: null,
          profile_id: w.profile_id,
          content_id: w.content_id,
          added_at: w.added_at,
        } as any);
        this.showEditModal.set(true);
        this.loading.set(false);
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  setEdit<K extends keyof WatchlistUpdate>(key: K, value: WatchlistUpdate[K]): void {
    this.editWatchlist.update((prev) => ({ ...prev, [key]: value } as any));
  }

  updateWatchlist(): void {
    const current = this.editWatchlist();
    const patch: WatchlistUpdate = {
      profile_id: current.profile_id,
      content_id: current.content_id,
    };

    this.loading.set(true);
    this.processingAction.set(`edit-${current.id}`);

    const observable = this.isAdmin()
      ? this.watchlistSvc.updateWatchlist(current.id, patch)
      : this.watchlistSvc.updateMyWatchlist(current.id, patch);

    observable.subscribe({
      next: () => { 
        this.showEditModal.set(false); 
        this.loadWatchlists(); 
        this.processingAction.set(null);
      },
      error: (err) => { 
        if (err.status === 409) {
          this.error.set('This would create a duplicate watchlist item.');
        } else if (err.status === 404) {
          this.error.set('Profile, Content, or Watchlist item not found.');
        } else if (err.status === 403) {
          this.error.set('You do not have permission to modify this watchlist item.');
        } else {
          this.error.set(err?.error?.detail || 'Failed to update watchlist item.');
        }
        this.loading.set(false);
        this.processingAction.set(null);
      },
    });
  }

  // ------- Delete -------
  deleteWatchlist(w: WatchlistList): void {
    if (!confirm(`Are you sure you want to remove this item from your watchlist?`)) return;

    this.loading.set(true);
    this.processingAction.set(`delete-${w.id}`);

    const observable = this.isAdmin()
      ? this.watchlistSvc.deleteWatchlist(w.id)
      : this.watchlistSvc.deleteMyWatchlist(w.id);

    observable.subscribe({
      next: () => {
        this.loadWatchlists();
        this.processingAction.set(null);
      },
      error: (err) => { 
        this.error.set(err?.error?.detail || 'Failed to delete watchlist item.'); 
        this.loading.set(false);
        this.processingAction.set(null);
      },
    });
  }

  // ------- Pagination -------
  nextPage(): void {
    this.filters.update(prev => ({ 
      ...prev, 
      offset: prev.offset + prev.limit 
    }));
    this.loadWatchlists();
  }

  previousPage(): void {
    this.filters.update(prev => ({ 
      ...prev, 
      offset: Math.max(0, prev.offset - prev.limit) 
    }));
    this.loadWatchlists();
  }

  // ------- UI helpers -------
  get hasPreviousPage(): boolean {
    return this.filters().offset > 0;
  }

  get hasNextPage(): boolean {
    return this.watchlists().length === this.filters().limit;
  }

  shortId(id: string): string {
    return id ? `${id.substring(0, 8)}...` : '';
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get appropriate header text based on user role
  getHeaderTitle(): string {
    return 'My Watchlist';
  }

  getHeaderDescription(): string {
    return 'Manage your personal watchlist items';
  }

  isProcessing(itemId: string, action: string): boolean {
    return this.processingAction() === `${action}-${itemId}`;
  }
}