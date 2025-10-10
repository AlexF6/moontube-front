import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-video-card',
  standalone: true,
  templateUrl: './video-card.html',
})
export class VideoCard {
  @Input() thumbnail!: string;
  @Input() duration!: string;
  @Input() title!: string;
  @Input() channelAvatar!: string;
  @Input() channelName!: string;
  @Input() views!: string;
  @Input() date!: string;
}
