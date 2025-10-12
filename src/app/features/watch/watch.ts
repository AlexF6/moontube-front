import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { VideoPlayerPlyr } from '../../shared/components/video-player/video-player';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, VideoPlayerPlyr],
  templateUrl: './watch.html',
})
export class Watch {
  private route = inject(ActivatedRoute);

  readonly videoId = signal<string | null>(this.route.snapshot.paramMap.get('id'));

  readonly src = 'https://www.w3schools.com/html/mov_bbb.mp4';
  readonly poster = '';
  readonly captionsSrc = '';

  readonly views = signal('1.2M');
  readonly age = signal('hace 2 semanas');
  readonly liked = signal(false);
  readonly savingToPlaylist = signal(false);
  readonly expandedDesc = signal(false);

  readonly title = computed(() => `Reproduciendo video #${this.videoId()}`);
  readonly shortDescription = computed(() => {
    const text = this.description;
    const max = 160;
    return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
  });

  readonly author = signal({
    avatar:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=300&auto=format&fit=crop',
    name: 'Moontube Channel',
    handle: '@moontube',
    subscribers: '12.3K',
    isSubscribed: false,
  });

  readonly relatedVideos = [
    {
      id: 'abc123',
      title: 'Cómo crear un reproductor con HLS y Angular',
      thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
      duration: '12:34',
      channel: 'DevTube',
      views: '98K',
      age: '3 días',
    },
    {
      id: 'xyz789',
      title: 'Tailwind + Angular: diseño tipo YouTube',
      thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
      duration: '8:05',
      channel: 'UI Snacks',
      views: '54K',
      age: '1 semana',
    },
  ];

  description = `En este video probamos el reproductor con controles tipo Plyr y soporte para HLS.
Incluye atajos de teclado, captions y estilos con Tailwind.`;

  toggleLike() {
    this.liked.set(!this.liked());
  }

  addToPlaylist() {
    if (this.savingToPlaylist()) return;
    this.savingToPlaylist.set(true);
    setTimeout(() => this.savingToPlaylist.set(false), 900);
  }

  toggleSubscribe() {
    this.author.update(a => ({ ...a, isSubscribed: !a.isSubscribed }));
  }

  toggleDescriptionExpansion() {
    this.expandedDesc.set(!this.expandedDesc());
  }
}
