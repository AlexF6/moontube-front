// src/app/features/dashboard/admin/episodes-tab/episodes-tab.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EpisodesService } from '../../../../core/services/episodes.service';
import { ContentsService } from '../../../../core/services/contents.service';
import type { Content, ContentList } from '../../../../models/content.model';
import { Episode, EpisodeList, EpisodeCreate, EpisodeUpdate } from '../../../../models/episode.model';

interface QueryParams {
  content_id: string | null;
  season: number | null;
  ep: number | null;
  q_title: string | null;
  min_duration: number | null;
  max_duration: number | null;
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

  // State signals
  error = signal<string | null>(null);
  items = signal<EpisodeList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  editOpen = signal<boolean>(false);
  
  // Query and form signals
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
    this.contentItems().forEach(content => {
      map.set(content.id, content.title);
    });
    return map;
  });

  newEpisode = signal<EpisodeCreate>({
    content_id: '',
    season_number: 1,
    episode_number: 1,
    title: '',
    duration_minutes: 0,
    release_date: '',
    video_url: ''
  });

  editing = signal<Episode | null>(null);

  async ngOnInit() {
    await this.loadContent();
    await this.loadEpisodes();
  }

  private async loadContent() {
    try {
      this.isContentLoading.set(true);
      const content = await this.contentsService.getContents({}).toPromise();
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
      
      const response = await this.episodesService.getEpisodes(this.query()).toPromise();
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
      if (!this.newEpisode().content_id || !this.newEpisode().title) {
        this.error.set('Content and Title are required');
        return;
      }

      if (this.newEpisode().season_number < 1 || this.newEpisode().episode_number < 1) {
        this.error.set('Season and Episode numbers must be at least 1');
        return;
      }
      
      await this.episodesService.createEpisode(this.newEpisode()).toPromise();
      
      // Reset form
      this.newEpisode.set({
        content_id: '',
        season_number: 1,
        episode_number: 1,
        title: '',
        duration_minutes: 0,
        release_date: '',
        video_url: ''
      });
      
      this.loadEpisodes();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(episodeId: string) {
    try {
      this.error.set(null);
      const episode = await this.episodesService.getEpisode(episodeId).toPromise();
      this.editing.set(episode || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.error.set(null);
      const editingEpisode = this.editing();
      
      if (!editingEpisode?.id) return;

      const updateData: EpisodeUpdate = {
        season_number: editingEpisode.season_number,
        episode_number: editingEpisode.episode_number,
        title: editingEpisode.title,
        duration_minutes: editingEpisode.duration_minutes,
        release_date: editingEpisode.release_date,
        video_url: editingEpisode.video_url
      };

      await this.episodesService.updateEpisode(editingEpisode.id, updateData).toPromise();
      
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadEpisodes();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(episodeId: string) {
    if (!confirm('Are you sure you want to delete this episode?')) {
      return;
    }

    try {
      this.error.set(null);
      await this.episodesService.deleteEpisode(episodeId).toPromise();
      this.loadEpisodes();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  applyFilters() {
    this.query().offset = 0;
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

  clearError() {
    this.error.set(null);
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