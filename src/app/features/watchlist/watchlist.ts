// src/app/features/watchlist/watchlist.ts
import { Component, OnInit, WritableSignal, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WatchlistService } from '../../core/services/watchlist.service';
import { AuthService } from '../../core/auth.service';
import { ProfilesService } from '../../core/services/profiles.service';

import type { Watchlist, WatchlistList, WatchlistUpdate } from '../../models/watchlist.model';
import type { ProfileList } from '../../models/profile.model';

import { forkJoin, of, firstValueFrom } from 'rxjs';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.html',
})
export class WatchlistComponent implements OnInit {
  private watchlistSvc = inject(WatchlistService);
  private profilesSvc = inject(ProfilesService);
  private auth = inject(AuthService);

  // ------------ State base ------------
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Modo de visualización
  // - grouped: secciones por perfil
  // - single: selector de un perfil y lista plana
  viewMode = signal<'grouped' | 'single'>('grouped');

  // Perfiles del usuario (solo /me)
  profiles = signal<ProfileList[]>([]);
  selectedProfileId = signal<string | 'all'>('all');

  // Datos agrupados (grouped)
  groupedRows = signal<GroupRow[]>([]);

  // Lista plana (single)
  watchlists: WritableSignal<WatchlistList[]> = signal<WatchlistList[]>([]);

  // UI secundaria
  showEditModal = signal<boolean>(false);
  processingAction = signal<string | null>(null);

  // Forms edición
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

  // Filtros comunes (se aplican a ambos modos)
  filters: WritableSignal<Filters> = signal<Filters>({
    content_id: '',
    added_from: '',
    added_to: '',
    limit: 50,
    offset: 0
  });

  readonly allGroupsEmpty = computed(() => {
    const rows = this.groupedRows();
    if (!rows || rows.length === 0) return true; // si no hay grupos, consid. vacío
    return rows.every(g => (g?.items?.length ?? 0) === 0);
  });

  // Derivados
  readonly hasProfiles = computed(() => this.profiles().length > 0);

  ngOnInit(): void {
    this.loadProfilesAndData();
  }

  // ------------ Loaders ------------
  private async loadProfilesAndData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Asegúrate de tener los perfiles en memoria
      // (si ya están cargados por el Header/otro sitio, no hace daño)
      this.profilesSvc.loadMyProfiles(true);
      // Espera breve a que el servicio los deje listos (no bloqueante fuerte).
      // Alternativa determinista: lee directamente del endpoint aquí.
      // Para simplicidad: intentamos leerlos del servicio tras un pequeño delay.
      await new Promise((r) => setTimeout(r, 50));

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

  private async loadGrouped() {
    const rows: GroupRow[] = [];
    const base = this.baseParams();

    const profiles = this.profiles();
    if (!profiles.length) {
      this.groupedRows.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const calls = profiles.map(p => {
        const params = { ...base, profile_id: p.id };
        return this.watchlistSvc.getMyWatchlists(params);
      });

      const results = await firstValueFrom(
        (profiles.length ? forkJoin(calls) : of([])) as any
      ) as WatchlistList[][];

      profiles.forEach((p, idx) => {
        rows.push({ profile: p, items: results[idx] ?? [] });
      });

      this.groupedRows.set(rows);
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to load watchlist by profile.');
      this.groupedRows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadSingle() {
    const base = this.baseParams();

    // Si "all", mostramos TODO combinado (no recomendado si quieres estrictamente separar)
    // Por la solicitud, el modo single usualmente usa un perfil específico:
    const pid = this.selectedProfileId();
    if (!pid || pid === 'all') {
      // Combina todo
      await this.loadGrouped(); // ya carga por perfil
      // Aplana para mostrar en modo single "all"
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
    if (f.content_id) params.content_id = f.content_id;
    if (f.added_from) params.added_from = f.added_from;
    if (f.added_to) params.added_to = f.added_to;
    if (f.limit) params.limit = f.limit;
    if (f.offset) params.offset = f.offset;
    return params;
  }

  // ------------ Cambios de UI ------------
  async toggleViewMode(mode: 'grouped' | 'single') {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    // Reset de paginación al cambiar modo
    this.filters.update(prev => ({ ...prev, offset: 0 }));
    if (mode === 'grouped') {
      await this.loadGrouped();
    } else {
      await this.loadSingle();
    }
  }

  async onChangeProfile(profileId: string | 'all') {
    this.selectedProfileId.set(profileId);
    // Reset offset
    this.filters.update(prev => ({ ...prev, offset: 0 }));
    await this.loadSingle();
  }

  // ------------ Edit / Update ------------
  openEditModal(w: WatchlistList): void {
    this.editWatchlist.set({
      id: w.id,
      created_by: '',
      updated_by: null,
      created_at: w.added_at ?? '',
      updated_at: null,
      profile_id: w.profile_id,
      content_id: w.content_id,
      added_at: w.added_at ?? '',
    } as any);
    this.showEditModal.set(true);
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

    // /me endpoint
    this.watchlistSvc.updateMyWatchlist(current.id, patch).subscribe({
      next: () => {
        this.showEditModal.set(false);
        // Refresca según modo
        if (this.viewMode() === 'grouped') {
          this.loadGrouped();
        } else {
          this.loadSingle();
        }
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

  // ------------ Delete ------------
  deleteWatchlist(w: WatchlistList): void {
    if (!confirm(`Are you sure you want to remove this item from your watchlist?`)) return;

    this.loading.set(true);
    this.processingAction.set(`delete-${w.id}`);

    // /me endpoint
    this.watchlistSvc.deleteMyWatchlist(w.id).subscribe({
      next: () => {
        if (this.viewMode() === 'grouped') {
          this.loadGrouped();
        } else {
          this.loadSingle();
        }
        this.processingAction.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to delete watchlist item.');
        this.loading.set(false);
        this.processingAction.set(null);
      },
    });
  }

  // ------------ Pagination ------------
  async nextPage(): Promise<void> {
    this.filters.update(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    if (this.viewMode() === 'grouped') {
      await this.loadGrouped();
    } else {
      await this.loadSingle();
    }
  }

  async previousPage(): Promise<void> {
    this.filters.update(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    if (this.viewMode() === 'grouped') {
      await this.loadGrouped();
    } else {
      await this.loadSingle();
    }
  }

  // ------------ UI helpers ------------
  get hasPreviousPage(): boolean {
    return this.filters().offset > 0;
  }

  // Nota: en modo grouped, hasNextPage es “verdadero” si cualquier sección llenó el límite.
  get hasNextPage(): boolean {
    if (this.viewMode() === 'single') {
      return this.watchlists().length === this.filters().limit;
    }
    // grouped
    return this.groupedRows().some(g => g.items.length === this.filters().limit);
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

  getHeaderTitle(): string {
    return this.viewMode() === 'grouped' ? 'My Watchlist by Profile' : 'My Watchlist';
  }

  getHeaderDescription(): string {
    return this.viewMode() === 'grouped'
      ? 'Browse your watchlist organized per profile'
      : 'Filter your watchlist by a specific profile or all';
  }

  isProcessing(itemId: string, action: string): boolean {
    return this.processingAction() === `${action}-${itemId}`;
  }
  
}
