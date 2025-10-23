import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentsService } from '../../../../core/services/contents.service';
import type { Content } from '../../../../models/content.model';

@Component({ selector: 'app-content-tab', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './content-tab.html' })
export class ContentTabComponent implements OnInit {
  isLoading = signal(false); error = signal<string|null>(null); content = signal<Content[]>([]);
  newContent: Partial<Content> = { title:'', type:'MOVIE', description:'', release_year: new Date().getFullYear(), duration_minutes:0, age_rating:'PG', genres:'' };
  constructor(private svc: ContentsService) {}
  ngOnInit(){ this.load(); }
  load(){ this.isLoading.set(true); this.svc.list().subscribe({ next: c=>{this.content.set(c); this.isLoading.set(false);}, error:()=>{this.error.set('Failed to load content'); this.isLoading.set(false);} }); }
  create(){ if(!this.newContent.title){ this.error.set('Title is required'); return;} this.isLoading.set(true); this.svc.create(this.newContent).subscribe({ next: item=>{ this.content.update(list=>[...list, item]); this.newContent = { title:'', type:'MOVIE', description:'', release_year:new Date().getFullYear(), duration_minutes:0, age_rating:'PG', genres:'' }; this.isLoading.set(false); }, error:(e)=>{ this.error.set(e.error?.detail || 'Failed to create content'); this.isLoading.set(false);} }); }
  remove(id:string){ if(!confirm('Are you sure you want to delete this content?')) return; this.svc.delete(id).subscribe({ next:()=> this.content.update(list=> list.filter(i=> i.id!==id)), error:()=> this.error.set('Failed to delete content') }); }
}