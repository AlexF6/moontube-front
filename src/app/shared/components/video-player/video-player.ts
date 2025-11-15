// src/app/shared/components/video-player/video-player.ts
import {
  Component, ElementRef, Input, ViewChild,
  OnDestroy, AfterViewInit, Output, EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="bg-black/90 p-4 rounded-xl shadow-2xl">
    <div class="relative aspect-video">
      <video #video
             playsinline
             preload="metadata"
             [poster]="poster"
             class="w-full h-full object-contain bg-black rounded-lg">
        @if (captionsSrc) {
          <track kind="captions"
                 [label]="captionsLabel || 'Subtitles'"
                 [src]="captionsSrc"
                 [srclang]="captionsLang || 'en'"
                 default>
        }
      </video>
    </div>

    @if (!src) {
      <div class="text-white/70 text-center mt-2">
        Please provide a 'src' URL for the video player.
      </div>
    }
  </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Inter', sans-serif; }
  `]
})
export class VideoPlayerPlyr implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) videoEl!: ElementRef<HTMLVideoElement>;

  @Input() src = '';
  @Input() poster = '';
  @Input() captionsSrc?: string;
  @Input() captionsLabel?: string;
  @Input() captionsLang?: string;

  @Output() ready = new EventEmitter<HTMLVideoElement>();
  @Output() position = new EventEmitter<{ current: number; duration: number }>();
  @Output() ended = new EventEmitter<{ current: number; duration: number }>();

  private player: any;
  private hls: any; // <- sin tipo para no requerir import top-level
  private timeUpdateHandler?: () => void;
  private pauseHandler?: () => void;
  private endedHandler?: () => void;
  private loadedMetaHandler?: () => void;

  private options: any = {
    controls: [
      'play', 'progress', 'current-time',
      'mute', 'volume',
      'captions', 'settings',
      'pip', 'airplay', 'fullscreen'
    ],
    settings: ['captions', 'quality', 'speed'],
    tooltips: { controls: true, seek: true },
    invertTime: true,
    keyboard: { focused: true, global: true }
  };

  async ngAfterViewInit() {
    if (!this.src) {
      console.error('VideoPlayerPlyr requires a video source (src) input.');
      return;
    }

    // CSS de Plyr on-demand (apunta al assets que copias en angular.json)
    await this.ensurePlyrCss('/assets/plyr.css');

    const video = this.videoEl.nativeElement;

    // HLS sólo si corresponde (import dinámico)
    if (this.src.endsWith('.m3u8')) {
      const { default: Hls } = await import('hls.js');
      if (Hls.isSupported()) {
        this.hls = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
        });
        this.hls.loadSource(this.src);
        this.hls.attachMedia(video);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => this.initPlyr());
      } else if ((video as any).canPlayType('application/vnd.apple.mpegurl')) {
        video.src = this.src;
        this.initPlyr();
      } else {
        console.warn('HLS no soportado en este navegador. Inicializando Plyr sin HLS.');
        this.initPlyr();
      }
    } else {
      video.src = this.src;
      this.initPlyr();
    }
  }

  private async initPlyr() {
    const PlyrModule = await import('plyr');
    const PlyrCtor: any = (PlyrModule as any).default ?? PlyrModule;

    const video = this.videoEl.nativeElement;
    this.player = new PlyrCtor(video, this.options);

    const emitPosition = () => {
      const current = Math.floor(video.currentTime || 0);
      const duration = Number.isFinite(video.duration) ? Math.floor(video.duration) : 0;
      this.position.emit({ current, duration });
    };

    const throttle = (fn: () => void, ms: number) => {
      let last = 0, scheduled = false;
      return () => {
        const now = Date.now();
        if (now - last >= ms) { last = now; fn(); }
        else if (!scheduled) {
          scheduled = true;
          setTimeout(() => { scheduled = false; last = Date.now(); fn(); }, ms - (now - last));
        }
      };
    };

    this.timeUpdateHandler = throttle(emitPosition, 9000);
    this.pauseHandler = emitPosition;
    this.endedHandler = () => {
      emitPosition();
      const current = Math.floor(video.currentTime || 0);
      const duration = Number.isFinite(video.duration) ? Math.floor(video.duration) : 0;
      this.ended.emit({ current, duration });
    };
    this.loadedMetaHandler = emitPosition;

    video.addEventListener('timeupdate', this.timeUpdateHandler as EventListener, { passive: true });
    video.addEventListener('pause', this.pauseHandler as EventListener, { passive: true });
    video.addEventListener('ended', this.endedHandler as EventListener, { passive: true });
    video.addEventListener('loadedmetadata', this.loadedMetaHandler as EventListener, { passive: true });

    this.ready.emit(video);
  }

  // Inyecta <link> al CSS de Plyr empaquetado en /assets
  private cssPromise: Promise<void> | null = null;
  private ensurePlyrCss(href: string): Promise<void> {
    if (this.cssPromise) return this.cssPromise;

    this.cssPromise = new Promise<void>((resolve, reject) => {
      const id = 'plyr-css-link';
      const existing = document.getElementById(id) as HTMLLinkElement | null;
      if (existing) {
        if ((existing as any)._loaded) { resolve(); return; }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Plyr CSS (existing)')), { once: true });
        return;
      }

      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;

      link.addEventListener('load', () => {
        (link as any)._loaded = true;
        resolve();
      }, { once: true });

      link.addEventListener('error', () =>
        reject(new Error(`Failed to load Plyr CSS from ${href}`)),
        { once: true }
      );

      document.head.appendChild(link);
    });

    return this.cssPromise;
  }

  ngOnDestroy() {
    const video = this.videoEl?.nativeElement;
    if (video) {
      if (this.timeUpdateHandler) video.removeEventListener('timeupdate', this.timeUpdateHandler as EventListener);
      if (this.pauseHandler) video.removeEventListener('pause', this.pauseHandler as EventListener);
      if (this.endedHandler) video.removeEventListener('ended', this.endedHandler as EventListener);
      if (this.loadedMetaHandler) video.removeEventListener('loadedmetadata', this.loadedMetaHandler as EventListener);
    }
    this.player?.destroy?.();
    this.hls?.destroy?.();
  }
}
