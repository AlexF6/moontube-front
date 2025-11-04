// src/app/features/watch/watch.ts
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoPlayerPlyr } from '../../shared/components/video-player/video-player';
import { ContentsService } from '../../core/services/contents.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { ProfilesService } from '../../core/services/profiles.service'; // ⬅️ NEW
import type { Content, ContentList } from '../../models/content.model';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [VideoPlayerPlyr],
  templateUrl: './watch.html',
})
export class Watch implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contentsService = inject(ContentsService);
  private watchlist = inject(WatchlistService);
  private profiles = inject(ProfilesService); // ⬅️ NEW
  private sanitizer = inject(DomSanitizer);

  // State
  readonly videoId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly expandedDesc = signal(false);
  readonly relatedLoading = signal(true);

  // Watchlist state
  readonly inWatchlist = signal<boolean | null>(null); // null = loading/unknown
  readonly savingWatchlist = signal<boolean>(false);

  // If user has multiple profiles and none is active, we’ll ask them to set it in header
  readonly needsActiveProfile = computed(() =>
    this.inWatchlist() === false &&
    this.profiles.hasMultiple() &&
    !this.profiles.activeId()
  );

  // Video data
  readonly video = signal<Content | null>(null);
  readonly relatedVideos = signal<ContentList[]>([]);

  // Derived state
  readonly title = computed(() => this.video()?.title || 'Loading...');
  readonly description = computed(() => this.video()?.description || '');
  readonly shortDescription = computed(() => {
    const text = this.description();
    const max = 160;
    return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
  });
  readonly shouldShowExpand = computed(() => this.description().length > this.shortDescription().length);
  readonly hasRelatedVideos = computed(() => this.relatedVideos().length > 0);

  readonly watchlistButtonText = computed(() => {
    if (this.savingWatchlist()) return '⏳ Saving...';
    if (this.inWatchlist() === null) return 'Checking...';
    return this.inWatchlist() ? '✓ In My List' : '+ Add to My List';
  });

  readonly watchlistButtonClass = computed(() => {
    if (this.inWatchlist() === null) {
      return 'bg-zinc-700 border-zinc-600 text-zinc-400 cursor-not-allowed';
    }
    return this.inWatchlist()
      ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
      : 'bg-transparent border-zinc-600 text-white hover:border-zinc-400';
  });

  readonly isWatchlistButtonDisabled = computed(() =>
    this.savingWatchlist() || this.inWatchlist() === null
  );

  // Fallback thumbnails
  private readonly fallbackThumbnails = [
    'https://pic.bittopup.com/apiUpload/88feb06a212a7d8b536313cb63a55a2a.jpg',
    'https://c4.wallpaperflare.com/wallpaper/336/629/188/kafka-honkai-star-rail-blade-honkai-star-rail-honkai-star-rail-hd-wallpaper-preview.jpg',
    'https://picsum.photos/seed/video3/640/360',
    'https://picsum.photos/seed/video4/640/360',
    'https://picsum.photos/seed/video5/640/360',
    'https://picsum.photos/seed/video6/640/360',
  ];

  // Video source analysis
  readonly videoSource = computed(() => {
    const url = this.video()?.video_url || '';
    if (!url) return 'none';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/i)) return 'direct';
    if (url.includes('embed') || url.includes('player')) return 'embed';
    return 'unknown';
  });

  // Extract YouTube/Vimeo IDs
  readonly youTubeId = computed(() => {
    const url = this.video()?.video_url || '';
    if (this.videoSource() !== 'youtube') return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  });

  readonly vimeoId = computed(() => {
    const url = this.video()?.video_url || '';
    if (this.videoSource() !== 'vimeo') return null;
    const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  });

  // Safe embed URLs
  readonly youTubeEmbedUrl = computed((): SafeResourceUrl | null => {
    const id = this.youTubeId();
    if (!id) return null;
    const url = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly vimeoEmbedUrl = computed((): SafeResourceUrl | null => {
    const id = this.vimeoId();
    if (!id) return null;
    const url = `https://player.vimeo.com/video/${id}?autoplay=0&title=0&byline=0&portrait=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly safeVideoUrl = computed((): SafeResourceUrl | null => {
    const url = this.video()?.video_url;
    if (!url) return null;
    if (this.videoSource() === 'embed') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return null;
  });

  ngOnInit() {
    // If header didn’t already, you can still call it here safely (no-op if loaded)
    this.profiles.loadMyProfiles();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.videoId.set(id);
      this.loadVideo();
    });
  }

  private loadVideo() {
    const id = this.videoId();
    if (!id) {
      this.error.set('Video ID not found');
      this.loading.set(false);
      this.relatedLoading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.inWatchlist.set(null); // checking…

    this.contentsService.getSmartContent(id).subscribe({
      next: (video) => {
        this.video.set(video);
        this.loading.set(false);
        this.loadRelatedVideos();
        this.checkWatchlist(); // after video loaded
      },
      error: (err) => {
        console.error('Failed to load video:', err);
        this.error.set('Failed to load video. Please try again.');
        this.loading.set(false);
        this.relatedLoading.set(false);
        this.inWatchlist.set(false);
      }
    });
  }

  private loadRelatedVideos() {
    this.relatedLoading.set(true);
    this.contentsService.getSmartContents({
      type_q: 'VIDEOS',
      limit: 12,
      order_by: 'created_at',
      order_dir: 'desc'
    }).subscribe({
      next: (videos) => {
        const currentVideoId = this.videoId();
        const filtered = videos.filter(v => v.id !== currentVideoId).slice(0, 6);
        this.relatedVideos.set(filtered);
        this.relatedLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load related videos:', err);
        this.relatedVideos.set([]);
        this.relatedLoading.set(false);
      }
    });
  }

  private checkWatchlist() {
    const contentId = this.videoId();
    if (!contentId) {
      this.inWatchlist.set(false);
      return;
    }
    // Prefer the active profile if set; falls back to any profile (rare)
    const pid = this.profiles.activeId() ?? undefined;
    this.watchlist.contains(contentId, pid).subscribe({
      next: (isIn) => this.inWatchlist.set(isIn),
      error: () => this.inWatchlist.set(false),
    });
  }

  // Navigation helper
  navigateToVideo(videoId: string) {
    this.router.navigate(['/watch', videoId]);
  }

  // Helpers
  getThumbnail(video: ContentList, index: number): string {
    return video.thumbnail || this.fallbackThumbnails[index % this.fallbackThumbnails.length];
  }

  formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
      : `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  toggleDescriptionExpansion() {
    this.expandedDesc.set(!this.expandedDesc());
  }

  retry() {
    this.loadVideo();
  }

  // Watchlist actions
  toggleWatchlist() {
    const contentId = this.videoId();
    if (!contentId || this.savingWatchlist() || this.inWatchlist() === null) return;

    const activePid = this.profiles.activeId() ?? undefined;

    // If there are multiple profiles and none is active, ask the user to set it in header
    if (!activePid && this.profiles.hasMultiple()) {
      // Surface a tiny hint – the template renders a message
      this.inWatchlist.set(false);
      return;
    }

    this.savingWatchlist.set(true);

    if (!this.inWatchlist()) {
      // ➕ Add (backend will pick the only profile if user has 1; otherwise we pass activePid)
      this.watchlist.createMyWatchlist({
        content_id: contentId,
        profile_id: activePid, // can be undefined if user has 1 profile
      }).subscribe({
        next: () => { this.inWatchlist.set(true); this.savingWatchlist.set(false); },
        error: (err) => {
          console.error('Add to watchlist failed', err);
          this.savingWatchlist.set(false);
        }
      });
    } else {
      // 🗑️ Remove — we REQUIRE active profile to know which pair to delete
      if (!activePid) {
        this.savingWatchlist.set(false);
        return;
      }
      this.watchlist.deleteMyByPair(activePid, contentId).subscribe({
        next: () => { this.inWatchlist.set(false); this.savingWatchlist.set(false); },
        error: (err) => {
          console.error('Remove from watchlist failed', err);
          this.savingWatchlist.set(false);
        }
      });
    }
  }
}
