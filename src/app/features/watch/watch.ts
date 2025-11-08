// src/app/features/watch/watch.ts
import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoPlayerPlyr } from '../../shared/components/video-player/video-player';
import { ContentsService } from '../../core/services/contents.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { ProfilesService } from '../../core/services/profiles.service';
import { PlaybacksService } from '../../core/services/playbacks.service';
import type { Content, ContentList } from '../../models/content.model';
import { AuthService } from '../../core/auth.service';
import { firstValueFrom } from 'rxjs';
import { AuthUiService } from '../../core/auth-ui.service';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [VideoPlayerPlyr],
  templateUrl: './watch.html',
})
export class Watch implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contentsService = inject(ContentsService);
  private watchlist = inject(WatchlistService);
  private profiles = inject(ProfilesService);
  private playbacks = inject(PlaybacksService);
  private auth = inject(AuthService);
  private authUi = inject(AuthUiService);
  private sanitizer = inject(DomSanitizer);

  // ---- state
  private startedOnce = false;
  private tick?: any;
  private videoRef: HTMLVideoElement | null = null;
  private _cleanup?: () => void;

  readonly isGuest = computed(() => !this.auth.user());
  readonly playbackId = signal<string | null>(null);
  readonly videoId = signal<string | null>(null);
  readonly videoUrl = signal<SafeResourceUrl | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly expandedDesc = signal(false);
  readonly relatedLoading = signal(true);

  // Watchlist state
  readonly inWatchlist = signal<boolean | null>(null);
  readonly savingWatchlist = signal<boolean>(false);

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

  // ----- Invitados: progreso local -----
  private localProgressKey(contentId: string) {
    return `guest_progress:${contentId}`;
  }
  private loadGuestProgress(contentId: string): number | null {
    const raw = localStorage.getItem(this.localProgressKey(contentId));
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  private saveGuestProgress(contentId: string, seconds: number) {
    localStorage.setItem(this.localProgressKey(contentId), String(Math.max(0, Math.floor(seconds))));
  }

  // ================= LIFECYCLE =================
  async ngOnInit() {
    await this.waitAuthReady();
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadById(id || null);
  }

  private async loadById(id: string | null) {
    this.resetPlaybackState();
    this.videoId.set(id);
    this.loading.set(true);
    this.error.set(null);
    this.inWatchlist.set(null);
    this.relatedLoading.set(true);

    if (!id) {
      this.loading.set(false);
      this.relatedLoading.set(false);
      this.error.set('Video ID not found');
      return;
    }

    try {
      const content = await firstValueFrom(this.contentsService.getSmartContent(id));
      this.video.set(content);

      if (content.video_url) {
        this.videoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(content.video_url as any));
      } else {
        this.videoUrl.set(null);
      }

      if (!this.isGuest()) {
        if (!this.profiles.hasLoadedOnce?.() && !this.profiles.loading?.()) {
          this.profiles.loadMyProfiles();
        }
        await this.checkWatchlist();
      } else {
        this.inWatchlist.set(false);
      }

      this.loadRelatedVideos();
    } catch (e: any) {
      console.error('Failed to load video', e);
      this.error.set(e?.error?.detail || 'Failed to load video');
      this.relatedVideos.set([]);
      this.relatedLoading.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  // 👉 usado por el template en el botón "Try Again"
  retry() {
    this.error.set(null);
    const id = this.videoId();
    void this.loadById(id ?? null);
  }

  private async waitAuthReady(): Promise<void> {
    while (this.auth.isLoading()) {
      await new Promise(r => setTimeout(r, 40));
    }
  }

  // ================= PLAYER HOOKS =================
  onPlayerReady(video: HTMLVideoElement) {
    if (this.startedOnce) return;
    this.startedOnce = true;
    this.videoRef = video;

    const contentId = this.videoId();
    if (!contentId) return;

    if (this.isGuest()) {
      const saved = this.loadGuestProgress(contentId);
      if (saved && video.readyState > 0) {
        try { video.currentTime = saved; } catch {}
      } else {
        const onLoaded = () => {
          const s = this.loadGuestProgress(contentId);
          if (s) { try { video.currentTime = s; } catch {} }
          video.removeEventListener('loadedmetadata', onLoaded);
        };
        video.addEventListener('loadedmetadata', onLoaded);
      }

      const onTime = () => this.saveGuestProgress(contentId, video.currentTime || 0);
      const onEnded = () => this.saveGuestProgress(contentId, video.duration || video.currentTime || 0);
      video.addEventListener('timeupdate', onTime);
      video.addEventListener('ended', onEnded);

      this._cleanup = () => {
        video.removeEventListener('timeupdate', onTime);
        video.removeEventListener('ended', onEnded);
      };
      return;
    }

    const activePid = this.profiles.activeId();
    if (!activePid) return;

    const device = (navigator.userAgent || 'unknown').toLowerCase().slice(0, 200);

    this.playbacks.startMyPlayback({
      profile_id: activePid,
      content_id: contentId,
      device
    }).subscribe({
      next: (pb) => {
        this.playbackId.set(pb.id);

        const send = () => {
          const id = this.playbackId();
          if (!id) return;
          const current = Math.floor(video.currentTime || 0);
          const duration = Math.floor(video.duration || 0) || null;

          this.playbacks.updateMyPlayback(id, {
            progress_seconds: current,
            duration_seconds: duration ?? undefined
          }).subscribe({ error: () => {} });
        };

        this.tick = setInterval(send, 3000);

        const onTime = () => send();
        video.addEventListener('timeupdate', onTime);

        const onEnded = () => {
          const id = this.playbackId();
          if (!id) return;
          this.playbacks.updateMyPlayback(id, {
            progress_seconds: Math.floor(video.duration || 0),
            duration_seconds: Math.floor(video.duration || 0),
            completed: true
          }).subscribe({ complete: () => {} });
        };
        video.addEventListener('ended', onEnded);

        this._cleanup = () => {
          video.removeEventListener('timeupdate', onTime);
          video.removeEventListener('ended', onEnded);
          if (this.tick) { clearInterval(this.tick); this.tick = undefined; }
        };
      },
      error: (e) => console.error('startMyPlayback failed', e)
    });
  }

  onPlayerPosition(evt: { current: number; duration: number }) {
    if (this.isGuest()) {
      const id = this.videoId();
      if (id) this.saveGuestProgress(id, evt.current);
      return;
    }
    const id = this.playbackId();
    if (!id) return;
    this.playbacks.updateMyPlayback(id, {
      progress_seconds: Math.max(0, evt.current|0),
      duration_seconds: evt.duration > 0 ? evt.duration|0 : undefined
    }).subscribe({ error: () => {} });
  }

  onPlayerEnded(evt: { current: number; duration: number }) {
    if (this.isGuest()) {
      const id = this.videoId();
      if (id) this.saveGuestProgress(id, evt.duration || evt.current || 0);
      return;
    }
    const id = this.playbackId();
    if (!id) return;
    this.playbacks.updateMyPlayback(id, {
      progress_seconds: (evt.duration && evt.duration > 0) ? evt.duration|0 : (evt.current|0),
      duration_seconds: evt.duration > 0 ? evt.duration|0 : undefined,
      completed: true
    }).subscribe({ error: () => {} });
  }

  ngOnDestroy() {
    if (this._cleanup) this._cleanup();

    const id = this.playbackId();
    if (id && this.videoRef && !this.isGuest()) {
      const current = Math.floor(this.videoRef.currentTime || 0);
      const duration = Number.isFinite(this.videoRef.duration) ? Math.floor(this.videoRef.duration) : undefined;
      this.playbacks.updateMyPlayback(id, {
        progress_seconds: current,
        duration_seconds: duration
      }).subscribe({ error: () => {} });
    }
  }

  private resetPlaybackState() {
    if (this._cleanup) this._cleanup();
    this.startedOnce = false;
    this.playbackId.set(null);
    this.videoRef = null;
  }

  // ================= DATA LOADERS =================
  private async checkWatchlist() {
    const contentId = this.videoId();
    if (!contentId) { this.inWatchlist.set(false); return; }
    const pid = this.profiles.activeId() ?? undefined;
    this.watchlist.contains(contentId, pid).subscribe({
      next: (isIn) => this.inWatchlist.set(isIn),
      error: () => this.inWatchlist.set(false),
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
      error: () => {
        this.relatedVideos.set([]);
        this.relatedLoading.set(false);
      }
    });
  }

  // ================= UI HELPERS =================
  navigateToVideo(id: string) {
    if (!id) return;
    // navegamos y recargamos el estado del componente
    this.router.navigate(['/watch', id]).then(() => {
      void this.loadById(id);
    });
  }

  getThumbnail(video: ContentList, index: number): string {
    return video.thumbnail || this.fallbackThumbnails[index % this.fallbackThumbnails.length];
    // (si tu API puede devolver undefined, ya cubrimos con fallback)
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

  toggleWatchlist() {
    const contentId = this.videoId();
    if (!contentId || this.savingWatchlist()) return;

    // 🚪 Requiere login: si es invitado, abre modal de login y termina
    if (this.isGuest()) {
      this.authUi.openLogin();
      return;
    }

    const activePid = this.profiles.activeId() ?? undefined;

    // Si hay múltiples perfiles y no hay uno activo, pide seleccionar
    if (!activePid && this.profiles.hasMultiple()) {
      this.inWatchlist.set(false);
      return;
    }

    this.savingWatchlist.set(true);

    if (!this.inWatchlist()) {
      // ➕ Add
      this.watchlist.createMyWatchlist({
        content_id: contentId,
        profile_id: activePid,
      }).subscribe({
        next: () => { this.inWatchlist.set(true); this.savingWatchlist.set(false); },
        error: (err) => { console.error('Add to watchlist failed', err); this.savingWatchlist.set(false); }
      });
    } else {
      // 🗑️ Remove — necesita perfil activo
      if (!activePid) { this.savingWatchlist.set(false); return; }
      this.watchlist.deleteMyByPair(activePid, contentId).subscribe({
        next: () => { this.inWatchlist.set(false); this.savingWatchlist.set(false); },
        error: (err) => { console.error('Remove from watchlist failed', err); this.savingWatchlist.set(false); }
      });
    }
  }
}
