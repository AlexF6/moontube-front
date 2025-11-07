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
  thumbnail?: string;
  progressPct?: number;
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

  private contentCache = new Map<string, Content>();
  private episodeCache = new Map<string, Episode>();

  readonly completedFilter = signal<'all' | 'true' | 'false'>('all');
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
          offset: 0,
          completed: this.completedFilter() === 'all' ? null : this.completedFilter() === 'true'
        })
      );

      const normalized = (list ?? []).map(pb => ({
        ...pb,
        progressPct: this.computeProgressPct(pb.progress_seconds, pb.duration_seconds),
      }));

      this.playbacks.set(normalized);
      await this.loadTitlesForPlaybacks(normalized);

      // Update with titles and thumbnails
      this.playbacks.update(current =>
        current.map(pb => ({
          ...pb,
          contentTitle: pb.content_id ? this.getTitleFromCache(pb.content_id, this.contentCache) : undefined,
          episodeTitle: pb.episode_id ? this.getTitleFromCache(pb.episode_id, this.episodeCache) : undefined,
          thumbnail: this.getThumbnailForPlayback(pb)
        }))
      );
    } catch (e: any) {
      console.error(e);
      const detail = e?.error?.detail;
      this.error.set(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Failed to load playbacks');
    } finally {
      this.loading.set(false);
    }
  }

  onChangeCompletedFilter(v: 'all' | 'true' | 'false') {
    this.completedFilter.set(v);
    void this.load();
  }

  private async loadTitlesForPlaybacks(playbacks: PlaybackWithTitles[]): Promise<void> {
    const contentIds = new Set<string>();
    const episodeIds = new Set<string>();

    for (const pb of playbacks) {
      if (pb.content_id) contentIds.add(pb.content_id);
      if (pb.episode_id) episodeIds.add(pb.episode_id);
    }

    // Parallel loading
    await Promise.all([
      this.loadContents(Array.from(contentIds)),
      this.loadEpisodes(Array.from(episodeIds))
    ]);
  }

  private async loadContents(contentIds: string[]): Promise<void> {
    const tasks = contentIds
      .filter(id => !this.contentCache.has(id))
      .map(async contentId => {
        try {
          const content = await firstValueFrom(this.contentsSvc.getMyContent(contentId));
          this.contentCache.set(contentId, content);
        } catch (error) {
          console.warn(`Failed to load content ${contentId}:`, error);
        }
      });

    await Promise.all(tasks);
  }

  private async loadEpisodes(episodeIds: string[]): Promise<void> {
    const tasks = episodeIds
      .filter(id => !this.episodeCache.has(id))
      .map(async episodeId => {
        try {
          const episode = await firstValueFrom(this.episodesSvc.getMyEpisode(episodeId));
          this.episodeCache.set(episodeId, episode);
        } catch (error) {
          console.warn(`Failed to load episode ${episodeId}:`, error);
        }
      });

    await Promise.all(tasks);
  }

  private getTitleFromCache(id: string, cache: Map<string, { title?: string }>): string {
    return cache.get(id)?.title || this.shortId(id);
  }

  private getThumbnailForPlayback(pb: PlaybackListItem): string | undefined {
    // Always use content thumbnail since episodes don't have thumbnails
    const content = this.contentCache.get(pb.content_id);
    return content?.thumbnail;
  }

  // Episode number helper for thumbnail badge
  getEpisodeNumber(episodeId: string): string {
    const episode = this.episodeCache.get(episodeId);
    if (episode) {
      return `${episode.season_number || 1}x${episode.episode_number?.toString().padStart(2, '0') || '01'}`;
    }
    return 'E';
  }

  // Device name shortening
  shortenDeviceName(device?: string | null): string {
    if (!device) return '—';
    
    // Common device patterns
    const patterns = [
      // iPhone patterns
      /(iPhone\s*(?:Pro|Plus)?\s*\w*)/i,
      /(iPad\s*(?:Pro|Air|Mini)?\s*\w*)/i,
      /(MacBook\s*(?:Pro|Air)?\s*\w*)/i,
      /(Android\s*\w*)/i,
      /(Windows\s*\w*)/i,
      // Browser patterns
      /(Chrome|Firefox|Safari|Edge)\s*\w*/i,
      // Generic fallback - take first 2 words
      /^(\w+\s+\w+)/,
    ];

    for (const pattern of patterns) {
      const match = device.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Ultimate fallback: first 15 chars
    return device.length > 15 ? device.substring(0, 15) + '...' : device;
  }

  // Relative time formatting for better UX
  formatRelativeTime(dateString?: string | null): string {
    if (!dateString) return '—';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffHours / 24;

      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return this.formatDate(dateString);
    }
  }

  async markAsCompleted(playbackId: string): Promise<void> {
    const currentPlaybacks = this.playbacks();
    const idx = currentPlaybacks.findIndex(p => p.id === playbackId);
    if (idx === -1) return;

    // Optimistic update
    const prev = currentPlaybacks[idx];
    const nowISO = new Date().toISOString();

    this.playbacks.update(list => {
      const copy = [...list];
      copy[idx] = {
        ...copy[idx],
        completed: true,
        ended_at: copy[idx].ended_at ?? nowISO
      };
      return copy;
    });

    try {
      const updated = await firstValueFrom(this.playbacksSvc.markPlaybackCompleted(playbackId));
      // Synchronize (in case backend adjusted timestamps or fields)
      this.playbacks.update(list => {
        const copy = [...list];
        copy[idx] = {
          ...copy[idx],
          completed: updated.completed,
          ended_at: updated.ended_at ?? copy[idx].ended_at,
          progress_seconds: updated.progress_seconds,
          duration_seconds: updated.duration_seconds,
          progressPct: this.computeProgressPct(updated.progress_seconds, updated.duration_seconds),
        };
        return copy;
      });
    } catch (e) {
      console.error('Failed to mark playback as completed:', e);
      this.error.set('Failed to update playback');
      // Rollback
      this.playbacks.update(list => {
        const copy = [...list];
        copy[idx] = { ...prev };
        return copy;
      });
    }
  }

  async deletePlayback(playbackId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this playback record?')) return;

    // Optimistic removal
    const prev = this.playbacks();
    this.playbacks.set(prev.filter(pb => pb.id !== playbackId));

    try {
      await firstValueFrom(this.playbacksSvc.deleteMyPlayback(playbackId));
    } catch (e) {
      console.error('Failed to delete playback:', e);
      this.error.set('Failed to delete playback');
      // Rollback
      this.playbacks.set(prev);
    }
  }

  // UI Helpers
  shortId(v: unknown): string {
    return typeof v === 'string' && v.length >= 8 ? v.slice(-8) :
           typeof v === 'string' ? v : '—';
  }

  formatDate(dt?: string | null): string {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleDateString() + ' ' + new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  progressPercent(p?: number | null, d?: number | null): number {
    return this.computeProgressPct(p, d);
  }

  private computeProgressPct(progress?: number | null, duration?: number | null): number {
    const prog = Math.max(0, Number(progress ?? 0));
    const dur = Number(duration ?? 0);
    if (!dur || dur <= 0) {
      // Without duration: soft approximation (30 min = 1800s) to not break UI
      return Math.min(100, Math.floor((prog / 1800) * 100));
    }
    return Math.min(100, Math.floor((prog / dur) * 100));
  }
}