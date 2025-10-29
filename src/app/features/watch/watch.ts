// src/app/features/watch/watch.ts
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoPlayerPlyr } from '../../shared/components/video-player/video-player';
import { ContentsService } from '../../core/services/contents.service';
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
  private sanitizer = inject(DomSanitizer);

  // State
  readonly videoId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly expandedDesc = signal(false);
  readonly relatedLoading = signal(true);

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
  
  readonly shouldShowExpand = computed(() => 
    this.description().length > this.shortDescription().length
  );

  readonly hasRelatedVideos = computed(() => this.relatedVideos().length > 0);

  // Fallback thumbnails for related videos
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
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    
    if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/i)) {
      return 'direct';
    }
    
    if (url.includes('embed') || url.includes('player')) {
      return 'embed';
    }
    
    return 'unknown';
  });

  // Extract YouTube video ID
  readonly youTubeId = computed(() => {
    const url = this.video()?.video_url || '';
    if (this.videoSource() !== 'youtube') return null;
    
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  });

  // Extract Vimeo video ID
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

  // For direct video files and other embed URLs
  readonly safeVideoUrl = computed((): SafeResourceUrl | null => {
    const url = this.video()?.video_url;
    if (!url) return null;
    
    if (this.videoSource() === 'embed') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    
    return null;
  });

  ngOnInit() {
    // Subscribe to route parameter changes
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

    this.contentsService.getSmartContent(id).subscribe({
      next: (video) => {
        this.video.set(video);
        this.loading.set(false);
        this.loadRelatedVideos();
      },
      error: (err) => {
        console.error('Failed to load video:', err);
        this.error.set('Failed to load video. Please try again.');
        this.loading.set(false);
        this.relatedLoading.set(false);
      }
    });
  }

  private loadRelatedVideos() {
    this.relatedLoading.set(true);

    // ✅ Cambiado a smart (o getPublicContents)
    this.contentsService.getSmartContents({
      type_q: 'VIDEOS',
      limit: 12,
      order_by: 'created_at',
      order_dir: 'desc'
    }).subscribe({
      next: (videos) => {
        const currentVideoId = this.videoId();
        const filteredVideos = videos
          .filter(video => video.id !== currentVideoId)
          .slice(0, 6);

        this.relatedVideos.set(filteredVideos);
        this.relatedLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load related videos:', err);
        this.relatedVideos.set([]);
        this.relatedLoading.set(false);
      }
    });
  }

  // Navigation helper
  navigateToVideo(videoId: string) {
    this.router.navigate(['/watch', videoId]);
  }

  // Helper methods for template
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
}