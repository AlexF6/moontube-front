import { Component, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

type RelatedVideo = {
  id: string;
  title: string;
  channel: string;
  views: string;
  age: string;
  duration: string;
  thumbnail: string;
};

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [CommonModule, RouterLink, NgOptimizedImage],
  templateUrl: './watch.html',
})
export class Watch {
  // Datos del video actual
  title = signal('Black Panther Highlight');
  views = signal('4');
  age = signal('hace 2 horas');

  toggleDescriptionExpansion(): void {
    this.expandedDesc.update(v => !v);
  }
  // Autor / canal
  author = signal({
    name: 'Ayush Kumar Gupta',
    handle: '@curator2',
    avatar: 'https://i.pravatar.cc/80?img=12',
    subscribers: 4,
    isSubscribed: false,
  });

  // Estado UI
  liked = signal(false);
  savingToPlaylist = signal(false);
  expandedDesc = signal(false);

  // Descripción
  description =
    `Tremble Before bast\n\n` +
    `Este highlight fue grabado en 1440p60. Config: RX 6800, R5 5600.`

  // Sugeridos
  relatedVideos: RelatedVideo[] = [
    {
      id: 'yt-001',
      title: 'Ichigo and Aizen v Yhwach — Bleach Manga Animation.mp4',
      channel: 'curator',
      views: '302',
      age: 'hace 3 meses',
      duration: '0:23',
      thumbnail: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'yt-002',
      title: '“I’m myself” — Soccer manga AMV (edit)',
      channel: 'tester',
      views: '273',
      age: 'hace 3 meses',
      duration: '0:12',
      thumbnail: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'yt-003',
      title: 'Sky Whale — cinematic loop',
      channel: 'looped',
      views: '1.1k',
      age: 'hace 1 mes',
      duration: '2:01',
      thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop',
    },
  ];

  // Helpers
  shortDescription = computed(() => {
    const s = this.description;
    if (!s) return '';
    const max = 160;
    return s.length > max ? s.slice(0, max).trimEnd() + '…' : s;
  });

  toggleLike() { this.liked.update(v => !v); }
  toggleSubscribe() {
    this.author.update(a => ({ ...a, isSubscribed: !a.isSubscribed }));
  }
  addToPlaylist() {
    this.savingToPlaylist.set(true);
    setTimeout(() => this.savingToPlaylist.set(false), 1200); // demo
  }
}
