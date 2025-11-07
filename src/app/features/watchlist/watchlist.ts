// src/app/features/watchlist/watchlist.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WatchlistService } from '../../core/services/watchlist.service';
import { ProfilesService } from '../../core/services/profiles.service';
import { ContentsService } from '../../core/services/contents.service';

import type { WatchlistList } from '../../models/watchlist.model';
import type { ProfileList } from '../../models/profile.model';
import type { ContentList } from '../../models/content.model';

import { forkJoin, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

interface Filters {
  content_id: string;
  added_from: string;
  added_to: string;
  limit: number;
  offset: number;
}

type GroupRow = { profile: ProfileList; items: WatchlistList[] };

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist.html',
})
export class WatchlistComponent implements OnInit {
  private watchlistSvc = inject(WatchlistService);
  private profilesSvc = inject(ProfilesService);
  private contentsSvc = inject(ContentsService);

  // ------------ State ------------
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  contentTitles = signal<Map<string, string>>(new Map()); // O(1) lookup

  viewMode = signal<'grouped' | 'single'>('grouped');
  profiles = signal<ProfileList[]>([]);
  selectedProfileId = signal<string | 'all'>('all');
  groupedRows = signal<GroupRow[]>([]);
  watchlists = signal<WatchlistList[]>([]);

  // Filtros
  filters = signal<Filters>({
    content_id: '',
    added_from: '',
    added_to: '',
    limit: 50,
    offset: 0
  });

  // Computed properties - O(1) after initial computation
  readonly hasProfiles = computed(() => this.profiles().length > 0);
  
  readonly allGroupsEmpty = computed(() => {
    const rows = this.groupedRows();
    return !rows.length || rows.every(g => !g.items.length);
  });

  readonly hasPreviousPage = computed(() => this.filters().offset > 0);
  
  readonly hasNextPage = computed(() => {
    if (this.viewMode() === 'single') {
      return this.watchlists().length === this.filters().limit;
    }
    return this.groupedRows().some(g => g.items.length === this.filters().limit);
  });

  readonly headerTitle = computed(() => 
    this.viewMode() === 'grouped' ? 'My Watchlist by Profile' : 'My Watchlist'
  );

  readonly headerDescription = computed(() =>
    this.viewMode() === 'grouped'
      ? 'Browse your watchlist organized per profile'
      : 'Filter your watchlist by a specific profile or all'
  );

  // NEW: Profile name mapping for O(1) lookups
  readonly profileNames = computed(() => {
    const map = new Map<string, string>();
    this.profiles().forEach(profile => {
      map.set(profile.id, profile.name);
    });
    return map;
  });

  ngOnInit(): void {
    this.loadProfilesAndData();
  }

  // ------------ Content Titles (Optimized) ------------
  private async loadContentTitles(contentIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(contentIds)].filter(id => 
      id && !this.contentTitles().has(id)
    );

    if (!uniqueIds.length) return;

    try {
      // Load all contents at once and filter
      const allContents = await firstValueFrom(
        this.contentsSvc.getSmartContents({ limit: 100, offset: 0 })
      );

      const titleMap = new Map<string, string>();
      allContents.forEach(content => {
        if (uniqueIds.includes(content.id)) {
          titleMap.set(content.id, content.title);
        }
      });

      this.contentTitles.update(current => new Map([...current, ...titleMap]));
    } catch (error) {
      console.error('Failed to load content titles:', error);
    }
  }

  getContentTitle(contentId: string): string {
    return this.contentTitles().get(contentId) || this.shortId(contentId);
  }

  // NEW: Get profile name by ID
  getProfileName(profileId: string): string {
    return this.profileNames().get(profileId) || this.shortId(profileId);
  }

  // ------------ Data Loading ------------
  private async loadProfilesAndData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.profilesSvc.loadMyProfiles(true);
      await this.waitForProfiles();
      
      const list = this.profilesSvc.profiles();
      this.profiles.set(list ?? []);

      if (this.viewMode() === 'grouped') {
        await this.loadGrouped();
      } else {
        await this.loadSingle();
      }
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to load profiles or watchlist.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadGrouped(): Promise<void> {
    const profiles = this.profiles();
    if (!profiles.length) {
      this.groupedRows.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const base = this.baseParams();
      const calls = profiles.map(p => 
        this.watchlistSvc.getMyWatchlists({ ...base, profile_id: p.id })
      );

      const results = await firstValueFrom(
        profiles.length ? forkJoin(calls) : of([])
      ) as WatchlistList[][];

      const rows: GroupRow[] = profiles.map((p, idx) => ({
        profile: p,
        items: results[idx] ?? []
      }));

      this.groupedRows.set(rows);

      // Load content titles for all items
      const allContentIds = rows.flatMap(group => 
        group.items.map(item => item.content_id)
      );
      await this.loadContentTitles(allContentIds);

    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to load watchlist by profile.');
      this.groupedRows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadSingle(): Promise<void> {
    const pid = this.selectedProfileId();
    const base = this.baseParams();

    if (!pid || pid === 'all') {
      await this.loadGrouped();
      const flat = this.groupedRows().flatMap(g => g.items);
      this.watchlists.set(flat);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const rows = await firstValueFrom(
        this.watchlistSvc.getMyWatchlists({ ...base, profile_id: pid })
      );
      this.watchlists.set(rows ?? []);

      const contentIds = rows.map(item => item.content_id);
      await this.loadContentTitles(contentIds);

    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to load watchlist.');
      this.watchlists.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private baseParams() {
    const f = this.filters();
    const params: any = {};
    
    // Only add defined filters
    Object.entries(f).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    
    return params;
  }

  // ------------ UI Actions ------------
  async toggleViewMode(mode: 'grouped' | 'single'): Promise<void> {
    if (this.viewMode() === mode) return;
    
    this.viewMode.set(mode);
    this.filters.update(prev => ({ ...prev, offset: 0 }));
    
    if (mode === 'grouped') {
      await this.loadGrouped();
    } else {
      await this.loadSingle();
    }
  }

  async onChangeProfile(profileId: string | 'all'): Promise<void> {
    this.selectedProfileId.set(profileId);
    this.filters.update(prev => ({ ...prev, offset: 0 }));
    await this.loadSingle();
  }

  // ------------ Delete (Only remaining action) ------------
  async deleteWatchlist(w: WatchlistList): Promise<void> {
    if (!confirm(`Are you sure you want to remove this item from your watchlist?`)) return;

    this.loading.set(true);

    try {
      await firstValueFrom(this.watchlistSvc.deleteMyWatchlist(w.id));
      
      if (this.viewMode() === 'grouped') {
        await this.loadGrouped();
      } else {
        await this.loadSingle();
      }
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to delete watchlist item.');
    } finally {
      this.loading.set(false);
    }
  }

  // ------------ Pagination ------------
  async nextPage(): Promise<void> {
    this.filters.update(prev => ({ 
      ...prev, 
      offset: prev.offset + prev.limit 
    }));
    
    if (this.viewMode() === 'grouped') {
      await this.loadGrouped();
    } else {
      await this.loadSingle();
    }
  }

  async previousPage(): Promise<void> {
    this.filters.update(prev => ({ 
      ...prev, 
      offset: Math.max(0, prev.offset - prev.limit) 
    }));
    
    if (this.viewMode() === 'grouped') {
      await this.loadGrouped();
    } else {
      await this.loadSingle();
    }
  }

  // ------------ Helpers ------------
  private waitForProfiles(timeout = 2000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkProfiles = () => {
        const profiles = this.profilesSvc.profiles();
        
        if (profiles?.length) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkProfiles, 100);
        }
      };
      
      checkProfiles();
    });
  }

  shortId(id: string): string {
    return id ? `${id.substring(0, 8)}...` : '';
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '—' : date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}