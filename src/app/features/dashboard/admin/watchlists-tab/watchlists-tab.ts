// src/app/features/dashboard/admin/watchlists-tab/watchlists-tab.ts
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

  // State signals
  error = signal<string | null>(null);
  items = signal<WatchlistList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  editOpen = signal<boolean>(false);
  
  // Query and form signals
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

  profileNameMap = computed(() => {
    const map = new Map<string, string>();
    this.profiles().forEach(profile => {
      map.set(profile.id, profile.name);
    });
    return map;
  });

  contentTitleMap = computed(() => {
    const map = new Map<string, string>();
    this.contentItems().forEach(content => {
      map.set(content.id, content.title);
    });
    return map;
  });

  newWatchlist = signal<WatchlistCreate>({
    profile_id: '',
    content_id: ''
  });

  editing = signal<Watchlist | null>(null);

  async ngOnInit() {
    await this.loadProfiles();
    await this.loadContent();
    await this.loadWatchlists();
  }

  private async loadProfiles() {
    try {
      this.isProfilesLoading.set(true);
      const profiles = await firstValueFrom(this.profilesService.getProfiles({}));
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
      
      // 💡 FIX: Use getContents for a list, and pass the required QueryParams.
      // An empty object `{}` is correct here to fetch content without filters.
      const content  = await firstValueFrom(this.contentService.getContents({}));
      
      // The type of 'content' is now ContentList[] | undefined
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

  async create() {
    try {
      this.error.set(null);
      
      // Validate required fields
      if (!this.newWatchlist().profile_id || !this.newWatchlist().content_id) {
        this.error.set('Profile and Content are required');
        return;
      }
      
      await this.watchlistService.createWatchlist(this.newWatchlist()).toPromise();
      
      // Reset form
      this.newWatchlist.set({
        profile_id: '',
        content_id: ''
      });
      
      this.loadWatchlists();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(watchlistId: string) {
    try {
      this.error.set(null);
      const watchlist = await this.watchlistService.getWatchlist(watchlistId).toPromise();
      this.editing.set(watchlist || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.error.set(null);
      const editingWatchlist = this.editing();
      
      if (!editingWatchlist?.id) return;

      const updateData: WatchlistUpdate = {
        profile_id: editingWatchlist.profile_id,
        content_id: editingWatchlist.content_id
      };

      await this.watchlistService.updateWatchlist(editingWatchlist.id, updateData).toPromise();
      
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadWatchlists();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(watchlistId: string) {
    if (!confirm('Are you sure you want to delete this watchlist item?')) {
      return;
    }

    try {
      this.error.set(null);
      await this.watchlistService.deleteWatchlist(watchlistId).toPromise();
      this.loadWatchlists();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  applyFilters() {
    this.query().offset = 0;
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

  getProfileName(profileId: string): string {
    return this.profileNameMap().get(profileId) || 'Unknown Profile';
  }

  getContentTitle(contentId: string): string {
    return this.contentTitleMap().get(contentId) || 'Unknown Content';
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