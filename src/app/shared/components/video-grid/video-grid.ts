// src/app/shared/components/video-grid/video-grid.ts
import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

import { VideoCard } from '../video-card/video-card';
import { ContentsService } from '../../../core/services/contents.service';
import type { ContentList } from '../../../models/content.model';

type GridQuery = {
  q?: string;
  type_q?: 'MOVIE' | 'SERIES' | 'VIDEOS' | null;
  genre_q?: string;
  year_from?: number | null;
  year_to?: number | null;
  min_duration?: number | null;
  max_duration?: number | null;
  age_rating?: string | null;
  order_by?: 'created_at' | 'title' | 'release_year';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [VideoCard, RouterLink],
  templateUrl: './video-grid.html',
})
export class VideoGrid {
  private contents = inject(ContentsService);

  /** Optional filters; defaults show latest VIDEOS */
  @Input() query: GridQuery = { 
    type_q: 'VIDEOS', 
    order_by: 'created_at', 
    order_dir: 'desc', 
    limit: 24 
  };

  /** State */
  readonly items = signal<ContentList[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  /** Derived State */
  readonly hasItems = computed(() => this.items().length > 0);
  readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);
  readonly showContent = computed(() => this.hasItems() && !this.loading() && !this.error());

  // Pre-processed videos with metadata - O(n) computation
  readonly processedVideos = computed(() => 
    this.items().map((video, index) => ({
      ...video,
      thumbnail: this.getThumbnail(video, index),
      duration: this.formatDuration(video.duration_minutes),
      route: ['/watch', video.id]
    }))
  );

  // Fallback thumbnails - optimized array
  private readonly fallbackThumbnails = [
    'https://pic.bittopup.com/apiUpload/88feb06a212a7d8b536313cb63a55a2a.jpg',
    'https://c4.wallpaperflare.com/wallpaper/336/629/188/kafka-honkai-star-rail-blade-honkai-star-rail-honkai-star-rail-hd-wallpaper-preview.jpg',
    'https://picsum.photos/seed/video3/640/360',
    'https://picsum.photos/seed/video4/640/360',
    'https://picsum.photos/seed/video5/640/360',
    'https://picsum.photos/seed/video6/640/360',
  ];

  // Skeleton items - pre-defined array
  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  constructor() {
    effect(() => {
      this.fetch();
    });
  }

  private fetch() {
    this.loading.set(true);
    this.error.set(null);

    this.contents
      .getContents(this.query)
      .pipe(
        tap(() => console.log('Fetching videos...')),
        catchError((err) => {
          console.error('getContents failed', err);
          this.error.set('Unable to load videos. Please check your connection.');
          return of<ContentList[]>([]);
        })
      )
      .subscribe((rows) => {
        this.items.set(rows ?? []);
        this.loading.set(false);
      });
  }

  // O(1) thumbnail selection
  private getThumbnail(video: ContentList, index: number): string {
    return video.thumbnail || this.fallbackThumbnails[index % this.fallbackThumbnails.length];
  }

  // O(1) duration formatting
  private formatDuration(minutes: number | undefined): string {
    if (!minutes) return '00:00';
    
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}` 
      : `${mins.toString().padStart(2, '0')}:00`;
  }

  // Manual retry
  retry() {
    this.fetch();
  }
}