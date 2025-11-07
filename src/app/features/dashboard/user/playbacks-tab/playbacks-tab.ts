// src/app/features/dashboard/user/playbacks/playbacks-tab.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PlaybacksService } from '../../../../core/services/playbacks.service';
import { ContentsService } from '../../../../core/services/contents.service';
import { EpisodesService } from '../../../../core/services/episodes.service';
import type { PlaybackListItem } from '../../../../models/playback.model';
import type { Content } from '../../../../models/content.model';
import type { Episode } from '../../../../models/episode.model';

interface PlaybackWithTitles extends PlaybackListItem {
  contentTitle?: string;
  episodeTitle?: string;
}

@Component({
  selector: 'app-playbacks-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playbacks-tab.html'
})
export class PlaybacksTabComponent implements OnInit {
  private playbacksSvc = inject(PlaybacksService);
  private contentsSvc = inject(ContentsService);
  private episodesSvc = inject(EpisodesService);

  playbacks = signal<PlaybackWithTitles[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // O(1) lookup caches
  private contentCache = new Map<string, Content>();
  private episodeCache = new Map<string, Episode>();

  totalShown = computed(() => this.playbacks().length);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const list = await firstValueFrom(
        this.playbacksSvc.getMyPlaybacks({
          limit: 50,
          offset: 0
        })
      );

      const playbacksWithTitles = list ?? [];
      this.playbacks.set(playbacksWithTitles);
      
      // Load titles efficiently
      await this.loadTitlesForPlaybacks(playbacksWithTitles);
    } catch (e: any) {
      console.error(e);
      const detail = e?.error?.detail;
      this.error.set(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Failed to load playbacks');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTitlesForPlaybacks(playbacks: PlaybackWithTitles[]): Promise<void> {
    const contentIds = new Set<string>();
    const episodeIds = new Set<string>();

    // O(n) collection of unique IDs
    for (const pb of playbacks) {
      if (pb.content_id) contentIds.add(pb.content_id);
      if (pb.episode_id) episodeIds.add(pb.episode_id);
    }

    // Parallel loading of content and episodes
    const [contentResults, episodeResults] = await Promise.all([
      this.loadContents(Array.from(contentIds)),
      this.loadEpisodes(Array.from(episodeIds))
    ]);

    // O(n) update of playbacks with titles
    this.playbacks.update(currentPlaybacks => 
      currentPlaybacks.map(pb => ({
        ...pb,
        contentTitle: pb.content_id ? this.getTitleFromCache(pb.content_id, this.contentCache) : undefined,
        episodeTitle: pb.episode_id ? this.getTitleFromCache(pb.episode_id, this.episodeCache) : undefined
      }))
    );
  }

  private async loadContents(contentIds: string[]): Promise<void> {
    const promises = contentIds
      .filter(id => !this.contentCache.has(id))
      .map(async contentId => {
        try {
          const content = await firstValueFrom(this.contentsSvc.getMyContent(contentId));
          this.contentCache.set(contentId, content);
        } catch (error) {
          console.warn(`Failed to load content ${contentId}:`, error);
        }
      });

    await Promise.all(promises);
  }

  private async loadEpisodes(episodeIds: string[]): Promise<void> {
    const promises = episodeIds
      .filter(id => !this.episodeCache.has(id))
      .map(async episodeId => {
        try {
          const episode = await firstValueFrom(this.episodesSvc.getMyEpisode(episodeId));
          this.episodeCache.set(episodeId, episode);
        } catch (error) {
          console.warn(`Failed to load episode ${episodeId}:`, error);
        }
      });

    await Promise.all(promises);
  }

  private getTitleFromCache(id: string, cache: Map<string, { title?: string }>): string {
    return cache.get(id)?.title || this.shortId(id);
  }

  async markAsCompleted(playbackId: string): Promise<void> {
    // O(1) lookup with Map (if we had one) but O(n) is acceptable for small lists
    const currentPlaybacks = this.playbacks();
    const playbackIndex = currentPlaybacks.findIndex(p => p.id === playbackId);
    
    if (playbackIndex === -1) return;

    // Optimistic update
    this.playbacks.update(list => {
      const copy = [...list];
      copy[playbackIndex] = { 
        ...copy[playbackIndex], 
        completed: true, 
        ended_at: new Date().toISOString() 
      };
      return copy;
    });

    try {
      await firstValueFrom(this.playbacksSvc.markPlaybackCompleted(playbackId));
    } catch (e) {
      console.error('Failed to mark playback as completed:', e);
      this.error.set('Failed to update playback');
      // Rollback
      this.playbacks.update(list => {
        const copy = [...list];
        copy[playbackIndex] = { 
          ...copy[playbackIndex], 
          completed: false,
          ended_at: currentPlaybacks[playbackIndex].ended_at
        };
        return copy;
      });
    }
  }

  async deletePlayback(playbackId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this playback record?')) return;

    // Optimistic removal - O(n) but necessary
    const previousPlaybacks = this.playbacks();
    this.playbacks.set(previousPlaybacks.filter(pb => pb.id !== playbackId));

    try {
      await firstValueFrom(this.playbacksSvc.deleteMyPlayback(playbackId));
    } catch (e) {
      console.error('Failed to delete playback:', e);
      this.error.set('Failed to delete playback');
      // Rollback
      this.playbacks.set(previousPlaybacks);
    }
  }

  shortId(v: unknown): string {
    return typeof v === 'string' && v.length >= 8 ? v.slice(-8) :
           typeof v === 'string' ? v : '—';
  }

  formatDate(dt?: string | null): string {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString();
    } catch {
      return dt;
    }
  }

  formatDuration(seconds?: number | null): string {
    const s = Math.max(0, Number(seconds ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`;
  }

  progressPercent(p?: number | null): number {
    return Math.min(100, Math.floor(((p ?? 0) / 1800) * 100));
  }
}