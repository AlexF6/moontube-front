// src/app/shared/components/video-grid/video-grid.ts
import { Component, Input, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

import { VideoCard } from '../video-card/video-card';
import { ContentsService } from '../../../core/services/contents.service';
import type { ContentList } from '../../../models/content.model';

type GridQuery = {
  q?: string;
  type_q?: 'MOVIE' | 'SERIES' | 'VIDEOS' | null;
  genre_q?: string;
  year_from?: number | null;
  year_to?: number | null;
  min_duration_seconds?: number | null;
  max_duration_seconds?: number | null;
  age_rating?: string | null;
  order_by?: 'created_at' | 'title' | 'release_year';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

const DEFAULT_QUERY: GridQuery = {
  type_q: 'VIDEOS',
  order_by: 'created_at',
  order_dir: 'desc',
  limit: 24,
  offset: 0,
};

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [VideoCard, RouterLink],
  templateUrl: './video-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoGrid {
  private contents = inject(ContentsService);

  private _query = signal<GridQuery>(DEFAULT_QUERY);
  @Input() set query(value: GridQuery | undefined) {
    this._query.set({ ...DEFAULT_QUERY, ...(value ?? {}) });
  }

  readonly items = signal<ContentList[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly hasItems = computed(() => this.items().length > 0);
  readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);
  readonly showContent = computed(() => this.hasItems() && !this.loading() && !this.error());

  // Preprocesado para la vista (marca LCP en el primer card)
  readonly processedVideos = computed(() =>
    this.items().map((video, index) => ({
      ...video,
      thumbnail: this.getThumbnail(video, index),
      duration: this.formatDuration(video.duration_seconds),
      route: ['/watch', video.id],
      width: 640,
      height: 360,
      isLcp: index === 0, // ← SOLO el primero
    }))
  );

  private readonly fallbackThumbnails = [
    'https://picsum.photos/seed/video1/640/360',
    'https://picsum.photos/seed/video2/640/360',
    'https://picsum.photos/seed/video3/640/360',
    'https://picsum.photos/seed/video4/640/360',
    'https://picsum.photos/seed/video5/640/360',
    'https://picsum.photos/seed/video6/640/360',
  ];

  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  constructor() {
    effect(() => {
      const q = this._query();
      this.fetch(q);
    });
  }

  private fetch(q: GridQuery) {
    this.loading.set(true);
    this.error.set(null);

    this.contents
      .getSmartContents(q)
      .pipe(
        catchError((err) => {
          const detail =
            err?.error?.detail ??
            (typeof err?.message === 'string' ? err.message : 'Unable to load videos.');
          this.error.set(detail);
          return of<ContentList[]>([]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((rows) => this.items.set(rows ?? []));
  }

  private getThumbnail(video: ContentList, index: number): string {
    const v: any = video;
    const cand = v.thumbnail ?? v.poster ?? '';
    return cand || this.fallbackThumbnails[index % this.fallbackThumbnails.length];
  }

  private formatDuration(seconds?: number | null): string {
    const s = Math.max(0, Number(seconds ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`;
  }

  retry() {
    this.fetch(this._query());
  }
}
