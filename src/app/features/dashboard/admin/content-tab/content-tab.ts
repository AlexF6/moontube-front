// src/app/features/dashboard/admin/content-tab/content-tab.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentsService } from '../../../../core/services/contents.service';
import { Content, ContentList, ContentCreate, ContentUpdate } from '../../../../models/content.model';

interface QueryParams {
  q: string;
  type_q: 'MOVIE' | 'SERIES' | 'VIDEOS' | null; // Added VIDEOS
  genre_q: string;
  year_from: number | null;
  year_to: number | null;
  min_duration: number | null;
  max_duration: number | null;
  age_rating: string | null;
  order_by: 'created_at' | 'title' | 'release_year';
  order_dir: 'asc' | 'desc';
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-content-tab',
  templateUrl: './content-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ContentTabComponent implements OnInit {
  private contentsService = inject(ContentsService);

  // State signals
  error = signal<string | null>(null);
  items = signal<ContentList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  editOpen = signal<boolean>(false);
  
  // Query and form signals
  query = signal<QueryParams>({
    q: '',
    type_q: null,
    genre_q: '',
    year_from: null,
    year_to: null,
    min_duration: null,
    max_duration: null,
    age_rating: null,
    order_by: 'created_at',
    order_dir: 'desc',
    limit: 50,
    offset: 0
  });

  newContent = signal<ContentCreate>({
    title: '',
    type: 'MOVIE',
    description: '',
    release_year: new Date().getFullYear(),
    duration_minutes: 60,
    age_rating: '',
    genres: '',
    video_url: '' // Added video_url
  });

  editing = signal<Content | null>(null);

  ngOnInit() {
    this.loadContents();
  }

  async loadContents() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      const response = await this.contentsService.getContents(this.query()).toPromise();
      this.items.set(response || []);
      this.total.set(response?.length || 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async create() {
    try {
      this.error.set(null);
      await this.contentsService.createContent(this.newContent()).toPromise();
      
      // Reset form
      this.newContent.set({
        title: '',
        type: 'MOVIE',
        description: '',
        release_year: new Date().getFullYear(),
        duration_minutes: 60,
        age_rating: '',
        genres: '',
        video_url: '' // Added video_url
      });
      
      this.loadContents();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(contentId: string) {
    try {
      this.error.set(null);
      const content = await this.contentsService.getContent(contentId).toPromise();
      this.editing.set(content || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.error.set(null);
      const editingContent = this.editing();
      
      if (!editingContent?.id) return;

      const updateData: ContentUpdate = {
        title: editingContent.title,
        type: editingContent.type,
        description: editingContent.description,
        release_year: editingContent.release_year,
        duration_minutes: editingContent.duration_minutes,
        age_rating: editingContent.age_rating,
        genres: editingContent.genres,
        video_url: editingContent.video_url // Added video_url
      };

      await this.contentsService.updateContent(editingContent.id, updateData).toPromise();
      
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadContents();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(contentId: string) {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      this.error.set(null);
      await this.contentsService.deleteContent(contentId).toPromise();
      this.loadContents();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  applyFilters() {
    this.query().offset = 0;
    this.loadContents();
  }

  resetFilters() {
    this.query.set({
      q: '',
      type_q: null,
      genre_q: '',
      year_from: null,
      year_to: null,
      min_duration: null,
      max_duration: null,
      age_rating: null,
      order_by: 'created_at',
      order_dir: 'desc',
      limit: 50,
      offset: 0
    });
    this.loadContents();
  }

  clearError() {
    this.error.set(null);
  }

  formatGenres(genres: string): string {
    return genres || '-';
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.detail) {
      if (Array.isArray(error.error.detail)) {
        return error.error.detail.map((d: any) => d.msg).join(', ');
      }
      return error.error.detail;
    }
    return error?.message || 'An unexpected error occurred';
  }
}