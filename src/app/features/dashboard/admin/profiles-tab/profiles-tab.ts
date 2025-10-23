import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfilesService } from '../../../../core/services/profiles.service';
import type { Profile } from '../../../../models/profile.model';

@Component({ selector:'app-profiles-tab', standalone:true, imports:[CommonModule, FormsModule], templateUrl:'./profiles-tab.html' })
export class ProfilesTabComponent implements OnInit {
  isLoading = signal(false); error = signal<string|null>(null); profiles = signal<Profile[]>([]);
  newProfile: Partial<Profile> = { user_id:'', name:'', avatar:'', maturity_rating:'' };
  constructor(private svc: ProfilesService){}
  ngOnInit(){ this.load(); }
  load(){ this.isLoading.set(true); this.svc.list().subscribe({ next:p=>{ this.profiles.set(p); this.isLoading.set(false); }, error:()=>{ this.error.set('Failed to load profiles'); this.isLoading.set(false);} }); }
  create(){ if(!this.newProfile.user_id || !this.newProfile.name){ this.error.set('User ID and name are required'); return; } this.isLoading.set(true); this.svc.create(this.newProfile).subscribe({ next: pr => { this.profiles.update(list=>[...list, pr]); this.newProfile = { user_id:'', name:'', avatar:'', maturity_rating:'' }; this.isLoading.set(false); }, error:(e)=>{ this.error.set(e.error?.detail || 'Failed to create profile'); this.isLoading.set(false);} }); }
  remove(id:string){ if(!confirm('Are you sure you want to delete this profile?')) return; this.svc.delete(id).subscribe({ next:()=> this.profiles.update(list=> list.filter(p=> p.id!==id)), error:()=> this.error.set('Failed to delete profile') }); }
}