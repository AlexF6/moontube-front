// src/app/features/dashboard/admin/playbacks-tab/playbacks-tab.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaybacksService } from '../../../../core/services/playbacks.service';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { ContentsService } from '../../../../core/services/contents.service';
import { EpisodesService } from '../../../../core/services/episodes.service';
import type { Profile, ProfileList } from '../../../../models/profile.model';
import type { Content, ContentList } from '../../../../models/content.model';
import type { Episode, EpisodeList } from '../../../../models/episode.model';
import { Playback, PlaybackList, PlaybackCreate, PlaybackUpdate } from '../../../../models/playback.model';

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
  imports: [CommonModule, FormsModule]
})
export class PlaybacksTabComponent implements OnInit {
  private playbacksService = inject(PlaybacksService);
  private profilesService = inject(ProfilesService);
  private contentsService = inject(ContentsService);
  private episodesService = inject(EpisodesService);

  // State signals
  error = signal<string | null>(null);
  items = signal<PlaybackList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  editOpen = signal<boolean>(false);
  
  // Query and form signals
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
    offset: 0
  });

  profiles = signal<ProfileList[]>([]);
  contentItems = signal<ContentList[]>([]);
  episodes = signal<EpisodeList[]>([]);
  isProfilesLoading = signal<boolean>(false);
  isContentLoading = signal<boolean>(false);
  isEpisodesLoading = signal<boolean>(false);

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

  episodeTitleMap = computed(() => {
    const map = new Map<string, string>();
    this.episodes().forEach(episode => {
      map.set(episode.id, `${episode.title} (S${episode.season_number}E${episode.episode_number})`);
    });
    return map;
  });

  newPlayback = signal<PlaybackCreate>({
    profile_id: '',
    content_id: '',
    episode_id: '',
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    progress_seconds: 0,
    completed: false,
    device: ''
  });

  editing = signal<Playback | null>(null);

  async ngOnInit() {
    await this.loadProfiles();
    await this.loadContent();
    await this.loadEpisodes();
    await this.loadPlaybacks();
  }

  private async loadProfiles() {
    try {
      this.isProfilesLoading.set(true);
      const profiles = await this.profilesService.getProfiles({}).toPromise();
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
      const content = await this.contentsService.getContents({}).toPromise();
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
      const episodes = await this.episodesService.getEpisodes({}).toPromise();
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
      
      const response = await this.playbacksService.getPlaybacks(this.query()).toPromise();
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
      if (!this.newPlayback().profile_id || !this.newPlayback().content_id || !this.newPlayback().episode_id) {
        this.error.set('Profile, Content, and Episode are required');
        return;
      }

      if (this.newPlayback().progress_seconds < 0) {
        this.error.set('Progress seconds cannot be negative');
        return;
      }
      
      await this.playbacksService.createPlayback(this.newPlayback()).toPromise();
      
      // Reset form
      this.newPlayback.set({
        profile_id: '',
        content_id: '',
        episode_id: '',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        progress_seconds: 0,
        completed: false,
        device: ''
      });
      
      this.loadPlaybacks();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(playbackId: string) {
    try {
      this.error.set(null);
      const playback = await this.playbacksService.getPlayback(playbackId).toPromise();
      this.editing.set(playback || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.error.set(null);
      const editingPlayback = this.editing();
      
      if (!editingPlayback?.id) return;

      const updateData: PlaybackUpdate = {
        ended_at: editingPlayback.ended_at,
        progress_seconds: editingPlayback.progress_seconds,
        completed: editingPlayback.completed,
        device: editingPlayback.device
      };

      await this.playbacksService.updatePlayback(editingPlayback.id, updateData).toPromise();
      
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadPlaybacks();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(playbackId: string) {
    if (!confirm('Are you sure you want to delete this playback record?')) {
      return;
    }

    try {
      this.error.set(null);
      await this.playbacksService.deletePlayback(playbackId).toPromise();
      this.loadPlaybacks();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  applyFilters() {
    this.query().offset = 0;
    this.loadPlaybacks();
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
      offset: 0
    });
    this.loadPlaybacks();
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

  getEpisodeTitle(episodeId: string): string {
    return this.episodeTitleMap().get(episodeId) || 'Unknown Episode';
  }

  formatProgress(progressSeconds: number): string {
    const hours = Math.floor(progressSeconds / 3600);
    const minutes = Math.floor((progressSeconds % 3600) / 60);
    const seconds = progressSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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