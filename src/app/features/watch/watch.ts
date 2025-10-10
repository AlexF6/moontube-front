import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
interface Video {
  id: number;
  thumbnail: string;
  title: string;
  channel: string;
}

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './watch.html',
})
export class Watch {
  private route = inject(ActivatedRoute);
  videoId = this.route.snapshot.paramMap.get('id');
  title = `Reproduciendo video #${this.videoId}`;
  views = '1.2M';
  age = 'hace 2 semanas';

  relatedVideos: Video[] = [
    { id: 1, thumbnail: 'https://via.placeholder.com/160x90/FF5733/FFFFFF?text=Video+1', title: 'Angular New Features Explained', channel: 'Coding Guru' },
    { id: 2, thumbnail: 'https://via.placeholder.com/160x90/33C4FF/FFFFFF?text=Video+2', title: 'FastAPI for Backend Development', channel: 'Python Devs' },
    { id: 3, thumbnail: 'https://via.placeholder.com/160x90/33FF57/FFFFFF?text=Video+3', title: 'Tailwind CSS in 10 Minutes', channel: 'Frontend Master' },
  ];
}
