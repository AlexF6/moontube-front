import { Component } from '@angular/core';
import { VideoCard } from '../video-card/video-card';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [VideoCard, RouterLink],
  templateUrl: './video-grid.html',
})
export class VideoGrid {
  videos = [
    {
      id: 101,
      thumbnail: 'https://occ-0-8407-2218.1.nflxso.net/dnm/api/v6/E8vDc_W8CLv7-yMQu8KMEC7Rrr8/AAAABRKIQnGja8FW7HtFjgOF_TmYAR_dn3eeN2Cayj3Gm2kEhjSETNusxVJj712wh_n7reHNrt3Bt6_S_U7jF4h8ugUgeXYHpcqbzHxO.jpg?r=485',
      duration: '24:15',
      title: 'One Piece: La batalla en Egghead explicada',
      channelAvatar: 'https://picsum.photos/seed/avatar-anime1/36/36',
      channelName: 'OtakuWorld',
      views: '2.3M',
      date: 'hace 2 semanas'
    },
    {
      id: 102,
      thumbnail: 'https://i.ytimg.com/vi/gp9aY09li1s/maxresdefault.jpg',
      duration: '15:42',
      title: 'Zelda: Tears of the Kingdom - Secretos que no viste',
      channelAvatar: 'https://picsum.photos/seed/avatar-game1/36/36',
      channelName: 'GamerZone',
      views: '1.1M',
      date: 'hace 1 mes'
    },
    {
      id: 103,
      thumbnail: 'https://a.storyblok.com/f/178900/1920x1080/ca57399c91/jujutsu-kaisen-hidden-inventory-premature-death-the-movie.jpg/m/1200x0/filters:quality(95)format(webp)',
      duration: '10:05',
      title: 'Jujutsu Kaisen: El poder oculto de Gojo',
      channelAvatar: 'https://picsum.photos/seed/avatar-anime2/36/36',
      channelName: 'AnimeTalks',
      views: '750k',
      date: 'hace 3 semanas'
    },
    {
      id: 104,
      thumbnail: 'https://i.blogs.es/a47ba2/ffxvi-cabecera/1366_2000.jpeg',
      duration: '18:20',
      title: 'Final Fantasy XVI - Opinión sin spoilers',
      channelAvatar: 'https://picsum.photos/seed/avatar-game2/36/36',
      channelName: 'JRPG Corner',
      views: '890k',
      date: 'hace 2 meses'
    },
    {
      id: 105,
      thumbnail: 'https://www.tierragamer.com/wp-content/uploads/2020/06/Jiraiya_y_Naruto_Shippuden-1-1024x589.jpg',
      duration: '09:55',
      title: 'Los mejores openings de Naruto Shippuden',
      channelAvatar: 'https://picsum.photos/seed/avatar-anime3/36/36',
      channelName: 'AnimeVibes',
      views: '3.2M',
      date: 'hace 5 meses'
    },
    {
      id: 106,
      thumbnail: 'https://blog.latam.playstation.com/tachyon/sites/3/2025/08/bd23cc38fe144b44b2c73e4c07ed6373ee4d4c00.jpg?resize=1088%2C612&crop_strategy=smart',
      duration: '21:18',
      title: 'Top 10 juegos indie de 2025 que debes probar',
      channelAvatar: 'https://picsum.photos/seed/avatar-game3/36/36',
      channelName: 'IndieGamer',
      views: '640k',
      date: 'hace 1 semana'
    }
  ];
}