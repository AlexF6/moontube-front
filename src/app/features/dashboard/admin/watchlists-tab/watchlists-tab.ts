import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WatchlistService } from '../../../../core/services/watchlist.service';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { ContentsService } from '../../../../core/services/contents.service';
import type { Profile, ProfileList } from '../../../../models/profile.model';
import type { Content, ContentList } from '../../../../models/content.model';
import { Watchlist, WatchlistList, WatchlistCreate, WatchlistUpdate } from '../../../../models/watchlist.model';
import { firstValueFrom } from 'rxjs';

interface QueryParams {
  profile_id: string | null;
  content_id: string | null;
  added_from: string | null;
  added_to: string | null;
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-watchlists-tab',
  templateUrl: './watchlists-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class WatchlistsTabComponent implements OnInit {
  private watchlistService = inject(WatchlistService);
  private profilesService = inject(ProfilesService);
  private contentService = inject(ContentsService);

  // State
  error = signal<string | null>(null);
  items = signal<WatchlistList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  editOpen = signal<boolean>(false);

  // Query + form
  query = signal<QueryParams>({
    profile_id: null,
    content_id: null,
    added_from: null,
    added_to: null,
    limit: 50,
    offset: 0
  });

  profiles = signal<ProfileList[]>([]);
  contentItems = signal<ContentList[]>([]);
  isProfilesLoading = signal<boolean>(false);
  isContentLoading = signal<boolean>(false);

  // Maps
  profileNameMap = computed(() => {
    const map = new Map<string, string>();
    this.profiles().forEach(p => map.set(p.id, p.name));
    return map;
  });

  contentTitleMap = computed(() => {
    const map = new Map<string, string>();
    this.contentItems().forEach(c => map.set(c.id, c.title));
    return map;
  });

  contentThumbnailMap = computed(() => {
    const map = new Map<string, string>();
    this.contentItems().forEach(c => map.set(c.id, c.thumbnail || ''));
    return map;
  });

  newWatchlist = signal<WatchlistCreate>({
    profile_id: '',
    content_id: ''
  });

  canCreate = computed(() => {
    const w = this.newWatchlist();
    return !!w.profile_id && !!w.content_id;
  });

  editing = signal<Watchlist | null>(null);

  // ---------- Lifecycle ----------
  async ngOnInit() {
    await Promise.all([
      this.loadProfiles(),
      this.loadContent(),
      this.loadWatchlists()
    ]);
  }

  // ---------- Template handlers (no arrow funcs in template) ----------
  onQueryChange<K extends keyof QueryParams>(key: K, value: QueryParams[K]) {
    this.query.update(q => ({ ...q, [key]: value }));
  }

  onNewWatchlistChange<K extends keyof WatchlistCreate>(key: K, value: WatchlistCreate[K]) {
    this.newWatchlist.update(w => ({ ...w, [key]: value }));
  }

  applyFilters() {
    this.query.update(q => ({ ...q, offset: 0 }));
    this.loadWatchlists();
  }

  resetFilters() {
    this.query.set({
      profile_id: null,
      content_id: null,
      added_from: null,
      added_to: null,
      limit: 50,
      offset: 0
    });
    this.loadWatchlists();
  }

  clearError() {
    this.error.set(null);
  }

  // ---------- Data ----------
  private async loadProfiles() {
    try {
      this.isProfilesLoading.set(true);
      const profiles = await firstValueFrom(this.profilesService.getProfiles({} as any));
      this.profiles.set(profiles || []);
    } catch (err: any) {
      this.error.set('Failed to load profiles: ' + this.getErrorMessage(err));
    } finally {
      this.isProfilesLoading.set(false);
    }
  }

  private async loadContent() {
    try {
      this.isContentLoading.set(true);
      const content = await firstValueFrom(this.contentService.getContents({} as any));
      this.contentItems.set(content || []);
    } catch (err: any) {
      this.error.set('Failed to load content: ' + this.getErrorMessage(err));
    } finally {
      this.isContentLoading.set(false);
    }
  }

  async loadWatchlists() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(this.watchlistService.getWatchlists(this.query()));
      this.items.set(response || []);
      this.total.set(response?.length || 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  // ---------- Create ----------
  async create() {
    if (!this.canCreate()) {
      this.error.set('Please select both profile and content');
      return;
    }
    try {
      this.isCreating.set(true);
      this.error.set(null);

      await firstValueFrom(this.watchlistService.createWatchlist(this.newWatchlist()));

      this.newWatchlist.set({ profile_id: '', content_id: '' });
      await this.loadWatchlists();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isCreating.set(false);
    }
  }

  // ---------- Edit ----------
  async openEdit(watchlistId: string) {
    try {
      this.error.set(null);
      const watchlist = await firstValueFrom(this.watchlistService.getWatchlist(watchlistId));
      this.editing.set(watchlist || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.isUpdating.set(true);
      this.error.set(null);
      const editingWatchlist = this.editing();
      if (!editingWatchlist?.id) return;

      const updateData: WatchlistUpdate = {
        profile_id: editingWatchlist.profile_id,
        content_id: editingWatchlist.content_id
      };

      await firstValueFrom(this.watchlistService.updateWatchlist(editingWatchlist.id, updateData));
      this.editOpen.set(false);
      this.editing.set(null);
      await this.loadWatchlists();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isUpdating.set(false);
    }
  }

  // ---------- Delete ----------
  async remove(watchlistId: string) {
    if (!confirm('Are you sure you want to delete this watchlist item? This action cannot be undone.')) {
      return;
    }
    try {
      this.error.set(null);
      await firstValueFrom(this.watchlistService.deleteWatchlist(watchlistId));
      await this.loadWatchlists();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  // ---------- Utils ----------
  getProfileName(profileId: string): string {
    return this.profileNameMap().get(profileId) || 'Unknown Profile';
  }

  getContentTitle(contentId: string): string {
    return this.contentTitleMap().get(contentId) || 'Unknown Content';
  }

  getContentThumbnail(contentId: string): string {
    return this.contentThumbnailMap().get(contentId) || '';
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
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
