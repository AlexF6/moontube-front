// src/app/features/dashboard/admin/playbacks-tab/playbacks-tab.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PlaybacksService } from '../../../../core/services/playbacks.service';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { ContentsService } from '../../../../core/services/contents.service';
import { EpisodesService } from '../../../../core/services/episodes.service';

import type { ProfileList } from '../../../../models/profile.model';
import type { ContentList } from '../../../../models/content.model';
import type { EpisodeList } from '../../../../models/episode.model';
import type { Playback, PlaybackCreate, PlaybackUpdate, PlaybackListItem } from '../../../../models/playback.model';

interface QueryParams {
  profile_id: string | null;
  content_id: string | null;
  episode_id: string | null;
  completed: boolean | null;
  device_q: string | null;
  started_from: string | null;
  started_to: string | null;
  ended_from: string | null;
  ended_to: string | null;
  min_progress: number | null;
  max_progress: number | null;
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-playbacks-tab',
  templateUrl: './playbacks-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class PlaybacksTabComponent implements OnInit {
  private playbacksService = inject(PlaybacksService);
  private profilesService = inject(ProfilesService);
  private contentsService = inject(ContentsService);
  private episodesService = inject(EpisodesService);

  // State signals
  error = signal<string | null>(null);
  items = signal<PlaybackListItem[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  editOpen = signal<boolean>(false);

  // Query & lists
  query = signal<QueryParams>({
    profile_id: null,
    content_id: null,
    episode_id: null,
    completed: null,
    device_q: null,
    started_from: null,
    started_to: null,
    ended_from: null,
    ended_to: null,
    min_progress: null,
    max_progress: null,
    limit: 50,
    offset: 0,
  });

  profiles = signal<ProfileList[]>([]);
  contentItems = signal<ContentList[]>([]);
  episodes = signal<EpisodeList[]>([]);
  isProfilesLoading = signal<boolean>(false);
  isContentLoading = signal<boolean>(false);
  isEpisodesLoading = signal<boolean>(false);

  // denormalized display maps
  profileNameMap = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.profiles()) map.set(p.id, p.name);
    return map;
  });

  contentTitleMap = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.contentItems()) map.set(c.id, c.title);
    return map;
  });

  episodeTitleMap = computed(() => {
    const map = new Map<string, string>();
    for (const e of this.episodes()) {
      map.set(e.id, `${e.title} (S${e.season_number}E${e.episode_number})`);
    }
    return map;
  });

  // Create form – match backend optional fields
  newPlayback = signal<PlaybackCreate>({
    profile_id: '',
    content_id: '',
    episode_id: null,
    started_at: undefined,
    ended_at: null,
    progress_seconds: 0,
    completed: false,
    device: null,
  });

  editing = signal<Playback | null>(null);

  async ngOnInit() {
    await Promise.all([this.loadProfiles(), this.loadContent(), this.loadEpisodes()]);
    await this.loadPlaybacks();
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
      const content = await firstValueFrom(this.contentsService.getContents({}));
      this.contentItems.set(content || []);
    } catch (err: any) {
      this.error.set('Failed to load content: ' + this.getErrorMessage(err));
    } finally {
      this.isContentLoading.set(false);
    }
  }

  private async loadEpisodes() {
    try {
      this.isEpisodesLoading.set(true);
      const episodes = await firstValueFrom(this.episodesService.getEpisodes({}));
      this.episodes.set(episodes || []);
    } catch (err: any) {
      this.error.set('Failed to load episodes: ' + this.getErrorMessage(err));
    } finally {
      this.isEpisodesLoading.set(false);
    }
  }

  async loadPlaybacks() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const list = await firstValueFrom(this.playbacksService.getPlaybacks(this.query()));
      this.items.set(list || []);
      this.total.set(list?.length ?? 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async create() {
    try {
      this.error.set(null);
      const np = this.newPlayback();

      // Required by backend
      if (!np.profile_id || !np.content_id) {
        this.error.set('Profile and Content are required');
        return;
      }
      if ((np.progress_seconds ?? 0) < 0) {
        this.error.set('Progress seconds cannot be negative');
        return;
      }

      await firstValueFrom(this.playbacksService.createPlayback(np));

      // Reset form to clean defaults
      this.newPlayback.set({
        profile_id: '',
        content_id: '',
        episode_id: null,
        started_at: undefined,
        ended_at: null,
        progress_seconds: 0,
        completed: false,
        device: null,
      });

      await this.loadPlaybacks();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(playbackId: string) {
    try {
      this.error.set(null);
      const playback = await firstValueFrom(this.playbacksService.getPlayback(playbackId));
      this.editing.set(playback || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.error.set(null);
      const pb = this.editing();
      if (!pb?.id) return;

      const updateData: PlaybackUpdate = {
        ended_at: pb.ended_at ?? null,
        progress_seconds: pb.progress_seconds,
        completed: pb.completed,
        device: pb.device ?? null,
      };

      await firstValueFrom(this.playbacksService.updatePlayback(pb.id, updateData));
      this.editOpen.set(false);
      this.editing.set(null);
      await this.loadPlaybacks();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(playbackId: string) {
    if (!confirm('Are you sure you want to delete this playback record?')) return;

    try {
      this.error.set(null);
      await firstValueFrom(this.playbacksService.deletePlayback(playbackId));
      await this.loadPlaybacks();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  applyFilters() {
    this.query.update((q) => ({ ...q, offset: 0 }));
    void this.loadPlaybacks();
  }

  resetFilters() {
    this.query.set({
      profile_id: null,
      content_id: null,
      episode_id: null,
      completed: null,
      device_q: null,
      started_from: null,
      started_to: null,
      ended_from: null,
      ended_to: null,
      min_progress: null,
      max_progress: null,
      limit: 50,
      offset: 0,
    });
    void this.loadPlaybacks();
  }

  clearError() {
    this.error.set(null);
  }

  getEpisodeTitle(episodeId?: string | null): string {
    if (!episodeId) return '—';
    return this.episodeTitleMap().get(episodeId) ?? 'Unknown Episode';
  }

  getProfileName(profileId?: string | null): string {
    if (!profileId) return '—';
    return this.profileNameMap().get(profileId) ?? 'Unknown Profile';
  }

  getContentTitle(contentId?: string | null): string {
    if (!contentId) return '—';
    return this.contentTitleMap().get(contentId) ?? 'Unknown Content';
  }

  formatProgress(progressSeconds: number): string {
    const s = progressSeconds ?? 0;
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
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
