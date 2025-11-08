// src/app/features/dashboard/user/playbacks/playbacks-tab.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PlaybacksService } from '../../../../core/services/playbacks.service';
import { ContentsService } from '../../../../core/services/contents.service';
import { EpisodesService } from '../../../../core/services/episodes.service';
import { ProfilesService } from '../../../../core/services/profiles.service'; // ⬅️ NEW
import type { PlaybackListItem } from '../../../../models/playback.model';
import type { Content } from '../../../../models/content.model';
import type { Episode } from '../../../../models/episode.model';
import type { ProfileList } from '../../../../models/profile.model';

interface PlaybackWithTitles extends PlaybackListItem {
  contentTitle?: string;
  episodeTitle?: string;
  thumbnail?: string;
  progressPct?: number;
}

type GroupRow = { profile: ProfileList; items: PlaybackWithTitles[] };

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
  private profilesSvc = inject(ProfilesService); // ⬅️ NEW

  playbacks = signal<PlaybackWithTitles[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // perfiles + modo
  profiles = signal<ProfileList[]>([]);
  viewMode = signal<'grouped' | 'single'>('grouped');
  selectedProfileId = signal<string | 'all'>('all');

  private contentCache = new Map<string, Content>();
  private episodeCache = new Map<string, Episode>();

  readonly completedFilter = signal<'all' | 'true' | 'false'>('all');
  totalShown = computed(() => this.playbacks().length);

  // agrupación por perfil para el modo grouped
  groupedByProfile = computed<GroupRow[]>(() => {
    if (this.viewMode() !== 'grouped') return [];
    const byId = new Map<string, PlaybackWithTitles[]>();
    for (const pb of this.playbacks()) {
      const arr = byId.get(pb.profile_id) ?? [];
      arr.push(pb);
      byId.set(pb.profile_id, arr);
    }
    const rows: GroupRow[] = [];
    for (const p of this.profiles()) {
      rows.push({ profile: p, items: byId.get(p.id) ?? [] });
    }
    // puede ordenar por cantidad o nombre si quieres
    return rows;
  });

  async ngOnInit(): Promise<void> {
    await this.loadProfilesOnce();
    // default: si hay activeId, úsalo para single
    const active = this.profilesSvc.activeId();
    if (active) this.selectedProfileId.set(active);
    await this.load();
  }

  private async loadProfilesOnce(): Promise<void> {
    if (!this.profilesSvc.hasLoadedOnce()) {
      this.profilesSvc.loadMyProfiles();
      // espera pasiva a que termine
      await new Promise<void>(res => {
        const t = setInterval(() => {
          if (!this.profilesSvc.loading()) {
            clearInterval(t); res();
          }
        }, 50);
      });
    }
    this.profiles.set(this.profilesSvc.profiles());
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // filtra por perfil sólo cuando estás en single y != 'all'
      const profile_id =
        this.viewMode() === 'single' && this.selectedProfileId() !== 'all'
          ? (this.selectedProfileId() as string)
          : null;

      const list = await firstValueFrom(
        this.playbacksSvc.getMyPlaybacks({
          limit: 50,
          offset: 0,
          profile_id, // ⬅️ NEW: el backend debe aceptar profile_id en /me/playbacks
          completed:
            this.completedFilter() === 'all'
              ? null
              : this.completedFilter() === 'true'
        })
      );

      const normalized = (list ?? []).map(pb => ({
        ...pb,
        progressPct: this.computeProgressPct(pb.progress_seconds, pb.duration_seconds),
      }));

      this.playbacks.set(normalized);
      await this.loadTitlesForPlaybacks(normalized);

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

  async onChangeView(mode: 'grouped' | 'single') {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    await this.load();
  }

  async onChangeProfile(id: 'all' | string) {
    this.selectedProfileId.set(id);
    if (this.viewMode() === 'single') {
      await this.load();
    }
  }

  // ===== títulos/episodios =====
  private async loadTitlesForPlaybacks(playbacks: PlaybackWithTitles[]): Promise<void> {
    const contentIds = new Set<string>();
    const episodeIds = new Set<string>();

    for (const pb of playbacks) {
      if (pb.content_id) contentIds.add(pb.content_id);
      if (pb.episode_id) episodeIds.add(pb.episode_id);
    }

    await Promise.all([
      this.loadContents([...contentIds]),
      this.loadEpisodes([...episodeIds])
    ]);
  }

  private async loadContents(ids: string[]): Promise<void> {
    const tasks = ids.filter(id => !this.contentCache.has(id)).map(async id => {
      try {
        const content = await firstValueFrom(this.contentsSvc.getMyContent(id));
        this.contentCache.set(id, content);
      } catch (e) { console.warn('content', id, e); }
    });
    await Promise.all(tasks);
  }

  private async loadEpisodes(ids: string[]): Promise<void> {
    const tasks = ids.filter(id => !this.episodeCache.has(id)).map(async id => {
      try {
        const ep = await firstValueFrom(this.episodesSvc.getMyEpisode(id));
        this.episodeCache.set(id, ep);
      } catch (e) { console.warn('episode', id, e); }
    });
    await Promise.all(tasks);
  }

  private getTitleFromCache(id: string, cache: Map<string, { title?: string }>): string {
    return cache.get(id)?.title || this.shortId(id);
  }

  private getThumbnailForPlayback(pb: PlaybackListItem): string | undefined {
    const content = this.contentCache.get(pb.content_id);
    return content?.thumbnail;
  }

  getEpisodeNumber(episodeId: string): string {
    const episode = this.episodeCache.get(episodeId);
    if (episode) {
      return `${episode.season_number || 1}x${episode.episode_number?.toString().padStart(2, '0') || '01'}`;
    }
    return 'E';
  }

  shortenDeviceName(device?: string | null): string {
    if (!device) return '—';
    const patterns = [
      /(iPhone\s*(?:Pro|Plus)?\s*\w*)/i,
      /(iPad\s*(?:Pro|Air|Mini)?\s*\w*)/i,
      /(MacBook\s*(?:Pro|Air)?\s*\w*)/i,
      /(Android\s*\w*)/i,
      /(Windows\s*\w*)/i,
      /(Chrome|Firefox|Safari|Edge)\s*\w*/i,
      /^(\w+\s+\w+)/,
    ];
    for (const p of patterns) {
      const m = device.match(p);
      if (m && m[1]) return m[1].trim();
    }
    return device.length > 15 ? device.substring(0, 15) + '...' : device;
  }

  formatRelativeTime(dateString?: string | null): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffH = diffMs / 3_600_000;
      const diffD = diffH / 24;
      if (diffH < 1) return `${Math.floor(diffMs / 60000)}m ago`;
      if (diffH < 24) return `${Math.floor(diffH)}h ago`;
      if (diffD < 7) return `${Math.floor(diffD)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return this.formatDate(dateString);
    }
  }

  async markAsCompleted(playbackId: string): Promise<void> {
    const current = this.playbacks();
    const idx = current.findIndex(p => p.id === playbackId);
    if (idx === -1) return;

    const prev = current[idx];
    const nowISO = new Date().toISOString();

    this.playbacks.update(list => {
      const copy = [...list];
      copy[idx] = { ...copy[idx], completed: true, ended_at: copy[idx].ended_at ?? nowISO };
      return copy;
    });

    try {
      const updated = await firstValueFrom(this.playbacksSvc.markPlaybackCompleted(playbackId));
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
      this.error.set('Failed to update playback');
      this.playbacks.update(list => { const copy = [...list]; copy[idx] = { ...prev }; return copy; });
    }
  }

  async deletePlayback(playbackId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this playback record?')) return;
    const prev = this.playbacks();
    this.playbacks.set(prev.filter(pb => pb.id !== playbackId));
    try { await firstValueFrom(this.playbacksSvc.deleteMyPlayback(playbackId)); }
    catch (e) { this.error.set('Failed to delete playback'); this.playbacks.set(prev); }
  }

  shortId(v: unknown): string {
    return typeof v === 'string' && v.length >= 8 ? v.slice(-8) : typeof v === 'string' ? v : '—';
  }

  formatDate(dt?: string | null): string {
    if (!dt) return '—';
    try { const d = new Date(dt); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
    catch { return String(dt); }
  }

  formatDuration(seconds?: number | null): string {
    const s = Math.max(0, Number(seconds ?? 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600)/60), sec = s % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m}:${sec.toString().padStart(2,'0')}`;
  }

  progressPercent(p?: number | null, d?: number | null): number {
    return this.computeProgressPct(p, d);
  }

  private computeProgressPct(progress?: number | null, duration?: number | null): number {
    const prog = Math.max(0, Number(progress ?? 0));
    const dur = Number(duration ?? 0);
    if (!dur || dur <= 0) return Math.min(100, Math.floor((prog / 1800) * 100));
    return Math.min(100, Math.floor((prog / dur) * 100));
  }
}
