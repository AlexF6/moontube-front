import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EpisodesService } from '../../../../core/services/episodes.service';
import { ContentsService } from '../../../../core/services/contents.service';
import type { ContentList } from '../../../../models/content.model';
import { Episode, EpisodeList, EpisodeCreate, EpisodeUpdate } from '../../../../models/episode.model';
import { firstValueFrom } from 'rxjs';

interface QueryParams {
  content_id: string | null;
  season: number | null;
  ep: number | null;
  q_title: string | null;
  min_duration: number | null; // seconds
  max_duration: number | null; // seconds
  year_from: number | null;
  year_to: number | null;
  order_by: 'season' | 'episode' | 'title' | 'created_at' | 'release_date';
  order_dir: 'asc' | 'desc';
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-episodes-tab',
  templateUrl: './episodes-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EpisodesTabComponent implements OnInit {
  private episodesService = inject(EpisodesService);
  private contentsService = inject(ContentsService);

  error = signal<string | null>(null);
  items = signal<EpisodeList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  editOpen = signal<boolean>(false);

  query = signal<QueryParams>({
    content_id: null,
    season: null,
    ep: null,
    q_title: null,
    min_duration: null,
    max_duration: null,
    year_from: null,
    year_to: null,
    order_by: 'created_at',
    order_dir: 'desc',
    limit: 50,
    offset: 0
  });

  contentItems = signal<ContentList[]>([]);
  isContentLoading = signal<boolean>(false);

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

  newEpisode = signal<EpisodeCreate>({
    content_id: '',
    season_number: 1,
    episode_number: 1,
    title: '',
    duration_seconds: null,
    release_date: null,
    video_url: null
  });

  canCreate = computed(() => {
    const e = this.newEpisode();
    return !!e.content_id && !!e.title?.trim()
      && e.season_number >= 1 && e.episode_number >= 1;
  });

  editing = signal<Episode | null>(null);

  async ngOnInit() {
    await Promise.all([this.loadContent(), this.loadEpisodes()]);
  }

  // ---------- SAFE BIND HELPERS ----------
  onQueryChange<K extends keyof QueryParams>(key: K, value: QueryParams[K]) {
    this.query.update(q => ({ ...q, [key]: value }));
  }
  onNewEpisodeChange<K extends keyof EpisodeCreate>(key: K, value: EpisodeCreate[K]) {
    this.newEpisode.update(e => ({ ...e, [key]: value }));
  }

  // ---------- LOADERS ----------
  private async loadContent() {
    try {
      this.isContentLoading.set(true);
      const content = await firstValueFrom(this.contentsService.getContents({} as any));
      this.contentItems.set(content || []);
    } catch (err: any) {
      this.error.set('Failed to load content: ' + this.getErrorMessage(err));
    } finally {
      this.isContentLoading.set(false);
    }
  }

  async loadEpisodes() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(this.episodesService.getEpisodes(this.query()));
      this.items.set(response || []);
      this.total.set(response?.length || 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  // ---------- FORMATTERS ----------
  formatDuration(seconds: number | null): string {
    if (!seconds || seconds < 1) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  }

  getEpisodeNumber(e: EpisodeList): string {
    return `S${e.season_number.toString().padStart(2, '0')}E${e.episode_number.toString().padStart(2, '0')}`;
  }

  getContentTitle(id: string): string {
    return this.contentTitleMap().get(id) || 'Unknown Content';
  }
  getContentThumbnail(id: string): string {
    return this.contentThumbnailMap().get(id) || '';
  }

  // ---------- MUTATIONS ----------
  private sanitizeCreatePayload(src: EpisodeCreate): EpisodeCreate {
    return {
      content_id: src.content_id,
      season_number: src.season_number,
      episode_number: src.episode_number,
      title: src.title.trim(),
      duration_seconds: src.duration_seconds && src.duration_seconds >= 1 ? src.duration_seconds : undefined,
      release_date: src.release_date && src.release_date !== '' ? src.release_date : undefined,
      video_url: src.video_url && src.video_url.trim() !== '' ? src.video_url.trim() : undefined
    };
  }

  private sanitizeUpdatePayload(src: Episode): EpisodeUpdate {
    return {
      season_number: src.season_number,
      episode_number: src.episode_number,
      title: src.title?.trim() || undefined,
      duration_seconds: src.duration_seconds && src.duration_seconds >= 1 ? src.duration_seconds : undefined,
      release_date: src.release_date && src.release_date !== '' ? src.release_date : undefined,
      video_url: src.video_url && src.video_url.trim() !== '' ? src.video_url.trim() : undefined
    };
  }

  async create() {
    if (!this.canCreate()) {
      this.error.set('Please fill all required fields with valid values');
      return;
    }
    try {
      this.isCreating.set(true);
      this.error.set(null);
      await firstValueFrom(this.episodesService.createEpisode(this.sanitizeCreatePayload(this.newEpisode())));
      this.newEpisode.set({
        content_id: '',
        season_number: 1,
        episode_number: 1,
        title: '',
        duration_seconds: null,
        release_date: null,
        video_url: null
      });
      await this.loadEpisodes();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isCreating.set(false);
    }
  }

  async openEdit(id: string) {
    try {
      this.error.set(null);
      const ep = await firstValueFrom(this.episodesService.getEpisode(id));
      this.editing.set(ep || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    const ep = this.editing();
    if (!ep?.id) return;
    try {
      this.isUpdating.set(true);
      this.error.set(null);
      await firstValueFrom(this.episodesService.updateEpisode(ep.id, this.sanitizeUpdatePayload(ep)));
      this.editOpen.set(false);
      this.editing.set(null);
      await this.loadEpisodes();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isUpdating.set(false);
    }
  }

  async remove(id: string) {
    if (!confirm('Are you sure you want to delete this episode? This action cannot be undone.')) return;
    try {
      this.error.set(null);
      await firstValueFrom(this.episodesService.deleteEpisode(id));
      await this.loadEpisodes();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  // ---------- FILTER ACTIONS ----------
  applyFilters() {
    this.query.update(q => ({ ...q, offset: 0 }));
    this.loadEpisodes();
  }

  resetFilters() {
    this.query.set({
      content_id: null,
      season: null,
      ep: null,
      q_title: null,
      min_duration: null,
      max_duration: null,
      year_from: null,
      year_to: null,
      order_by: 'created_at',
      order_dir: 'desc',
      limit: 50,
      offset: 0
    });
    this.loadEpisodes();
  }

  // ---------- MISC ----------
  clearError() { this.error.set(null); }

  private getErrorMessage(error: any): string {
    if (error?.error?.detail) {
      if (Array.isArray(error.error.detail)) return error.error.detail.map((d: any) => d.msg).join(', ');
      return error.error.detail;
    }
    return error?.message || 'An unexpected error occurred';
  }
}
