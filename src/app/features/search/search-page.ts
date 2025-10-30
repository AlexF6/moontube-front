// src/app/features/search/search-page.ts
import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { VideoGrid } from '../../shared/components/video-grid/video-grid';

@Component({
  standalone: true,
  selector: 'app-search-page',
  imports: [CommonModule, VideoGrid], // ← include VideoGrid
  templateUrl: './search-page.html'
})
export class SearchPageComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  q = signal<string>('');

  // default grid (tune as you like)
  readonly defaultGridQuery = {
    type_q: 'VIDEOS' as const,
    order_by: 'created_at' as const,
    order_dir: 'desc' as const,
    limit: 24,
    offset: 0,
  };

  readonly paramMapSig = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap
  });

  constructor() {
    // keep your realtime query updates
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => this.updateSearchQuery(query));

    effect(() => {
      const pm = this.paramMapSig();
      const query = (pm.get('q') ?? '').trim();
      this.q.set(query);
    });
  }

  updateSearchQuery(query: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
