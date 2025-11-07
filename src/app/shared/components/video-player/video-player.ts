// src/app/shared/components/video-player/video-player.ts
import { Component, ElementRef, Input, ViewChild, OnDestroy, AfterViewInit, Output, EventEmitter } from '@angular/core';
import Hls from 'hls.js';
import * as Plyr from 'plyr'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
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
    <div class="bg-black/90 p-4 rounded-xl shadow-2xl">
      <div class="relative aspect-video">
        </div>

      @if (!src) {
        <div class="text-white/70 text-center mt-2">
          Please provide a 'src' URL for the video player.
        </div>
      }
    </div>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }
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
  private hls?: Hls;
  private timeUpdateHandler?: () => void;
  private pauseHandler?: () => void;
  private endedHandler?: () => void;
  private loadedMetaHandler?: () => void;

  private options: Plyr.Options = {
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

  ngAfterViewInit() {
    if (!this.src) {
      console.error('VideoPlayerPlyr requires a video source (src) input.');
      return;
    }

    const video = this.videoEl.nativeElement;

    if (this.src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        this.hls = new Hls({ enableWorker: true });
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

  private initPlyr() {
    const PlyrConstructor = (Plyr as any).default || Plyr;
    const video = this.videoEl.nativeElement;

    this.player = new PlyrConstructor(video, this.options);

    const emitPosition = () => {
      const current = Math.floor(video.currentTime || 0);
      const duration = isFinite(video.duration) ? Math.floor(video.duration) : 0;
      this.position.emit({ current, duration });
    };

    const throttle = (fn: () => void, ms: number) => {
      let last = 0;
      let scheduled = false;
      return () => {
        const now = Date.now();
        if (now - last >= ms) {
          last = now;
          fn();
        } else if (!scheduled) {
          scheduled = true;
          setTimeout(() => {
            scheduled = false;
            last = Date.now();
            fn();
          }, ms - (now - last));
        }
      };
    };

    this.timeUpdateHandler = throttle(emitPosition, 8000);
    this.pauseHandler = emitPosition;
    this.endedHandler = () => {
      emitPosition();
      const current = Math.floor(video.currentTime || 0);
      const duration = isFinite(video.duration) ? Math.floor(video.duration) : 0;
      this.ended.emit({ current, duration });
    };
    this.loadedMetaHandler = emitPosition;

    video.addEventListener('timeupdate', this.timeUpdateHandler);
    video.addEventListener('pause', this.pauseHandler);
    video.addEventListener('ended', this.endedHandler);
    video.addEventListener('loadedmetadata', this.loadedMetaHandler);

    this.ready.emit(video);
    
    if (this.hls) {
        this.player.on('qualitychange', (event: any) => {
            const quality = event.detail.quality;
            this.hls!.currentLevel = quality;
        });

        this.player.on('ready', () => {
            if (this.hls!.levels.length > 0) {
                 this.hls!.levels.forEach((level, index) => {
                    if (this.player.addQuality) {
                        this.player.addQuality({
                            value: index,
                            label: `${level.height}p`,
                            selected: index === this.hls!.currentLevel,
                        });
                    }
                });
            }
        });
    }
    this.ready.emit(this.videoEl.nativeElement);
  }

  ngOnDestroy() {
    const video = this.videoEl?.nativeElement;
    if (video) {
      if (this.timeUpdateHandler) video.removeEventListener('timeupdate', this.timeUpdateHandler);
      if (this.pauseHandler) video.removeEventListener('pause', this.pauseHandler);
      if (this.endedHandler) video.removeEventListener('ended', this.endedHandler);
      if (this.loadedMetaHandler) video.removeEventListener('loadedmetadata', this.loadedMetaHandler);
    }
    this.player?.destroy();
    this.hls?.destroy();
  }
}