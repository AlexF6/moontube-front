// src/app/shared/components/video-card/video-card.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [],
  templateUrl: './video-card.html',
})
export class VideoCard {
  @Input() thumbnail = '';
  @Input() duration = '';
  @Input() title = '';
  @Input() channelAvatar = '';
  @Input() channelName = '';
  @Input() views = '';
  @Input() date = '';

  imageLoaded = false;
  imageError = false;

  onImageLoad() { this.imageLoaded = true; }
  onImageError() { this.imageError = true; }
}
