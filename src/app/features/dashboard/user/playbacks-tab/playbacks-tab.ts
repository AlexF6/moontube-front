// src/app/features/dashboard/user/playbacks/playbacks-tab.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PlaybacksService } from '../../../../core/services/playbacks.service';
import type { PlaybackListItem } from '../../../../models/playback.model';

@Component({
  selector: 'app-playbacks-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playbacks-tab.html'
})
export class PlaybacksTabComponent implements OnInit {
  private svc = inject(PlaybacksService);

  playbacks = signal<PlaybackListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  completedFilter = signal<'ALL' | 'YES' | 'NO'>('ALL');
  deviceFilter = signal<string>('');
  limit = signal(50);
  offset = signal(0);

  totalShown = computed(() => this.playbacks().length);

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const completed =
        this.completedFilter() === 'ALL' ? null :
        this.completedFilter() === 'YES' ? true : false;

      const list = await firstValueFrom(
        this.svc.getMyPlaybacks({
          completed,
          device: this.deviceFilter() || null,
          limit: this.limit(),
          offset: this.offset()
        })
      );
      this.playbacks.set(list ?? []);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to load playbacks');
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(): void {
    this.offset.set(0);
    this.load();
  }

  onCompletedChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'ALL' | 'YES' | 'NO';
    this.completedFilter.set(value);
    this.onFilterChange();
  }

  async markAsCompleted(playbackId: string): Promise<void> {
    try {
      await firstValueFrom(this.svc.markPlaybackCompleted(playbackId));
      // Reload the list to reflect changes
      this.load();
    } catch (e) {
      console.error('Failed to mark playback as completed:', e);
      this.error.set('Failed to update playback');
    }
  }

  async deletePlayback(playbackId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this playback record?')) {
      return;
    }

    try {
      await firstValueFrom(this.svc.deleteMyPlayback(playbackId));
      // Remove from local list instead of reloading
      this.playbacks.update(list => list.filter(pb => pb.id !== playbackId));
    } catch (e) {
      console.error('Failed to delete playback:', e);
      this.error.set('Failed to delete playback');
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