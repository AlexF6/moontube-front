import { Component, ElementRef, Input, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import * as Plyr from 'plyr'; 
import Hls from 'hls.js';
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

  private player: any; 
  private hls?: Hls;

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
    
    this.player = new PlyrConstructor(this.videoEl.nativeElement, this.options);
    
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
  }

  ngOnDestroy() {
    this.player?.destroy();
    this.hls?.destroy();
  }
}