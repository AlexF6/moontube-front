// src/app/shared/components/video-card/video-card.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './video-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCard {
  @Input() thumbnail = '';     // URL base (ideal: .webp / .avif si tienes)
  @Input() title = '';
  @Input() duration = '';

  // Datos opcionales (por ahora no usados en la plantilla)
  @Input() channelAvatar = '';
  @Input() channelName = '';
  @Input() views = '';
  @Input() date = '';

  // Tamaño intrínseco (16:9) — evita CLS
  @Input() width = 640;
  @Input() height = 360;

  // Marca SOLO el card candidato a LCP
  @Input() isLcp = false;

  imageLoaded = false;
  imageError = false;

  onImageLoad()  { this.imageLoaded = true; }
  onImageError() { this.imageError = true; }

  // srcset/sizes responsivos (ajusta a tu grid real)
  srcset(base: string) {
    return [
      `${base}?w=320 320w`,
      `${base}?w=480 480w`,
      `${base}?w=640 640w`,
      `${base}?w=960 960w`,
      `${base}?w=1280 1280w`,
    ].join(', ');
  }

  sizes = '(min-width:1024px) 25vw, (min-width:640px) 33vw, 100vw';
}
