import { Component } from '@angular/core';
import { VideoGrid } from '../../shared/components/video-grid/video-grid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [VideoGrid],
  template: `<app-video-grid></app-video-grid>`
})
export class Home {}
