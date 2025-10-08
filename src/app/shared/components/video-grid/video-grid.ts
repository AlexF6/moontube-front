import { Component } from '@angular/core';
import { VideoCard } from '../video-card/video-card';
@Component({
  selector: 'video-grid',
  standalone: true,
  imports: [VideoCard],
  templateUrl: './video-grid.html',
})
export class VideoGrid {
}