import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlansService } from '../../../../core/services/plans.service';
import type { Plan } from '../../../../models/plan.model';

@Component({ selector:'app-plans-tab', standalone:true, imports:[CommonModule, FormsModule], templateUrl:'./plans-tab.html' })
export class PlansTabComponent implements OnInit {
  isLoading = signal(false); error = signal<string|null>(null); plans = signal<Plan[]>([]);
  newPlan: Partial<Plan> = { name:'', price:0, max_profiles:1, max_devices:1, video_quality:'HD' };
  constructor(private svc: PlansService){}
  ngOnInit(){ this.load(); }
  load(){ this.isLoading.set(true); this.svc.list().subscribe({next:p=>{this.plans.set(p); this.isLoading.set(false);}, error:()=>{this.error.set('Failed to load plans'); this.isLoading.set(false);} }); }
  create(){ if(!this.newPlan.name || Number(this.newPlan.price) <= 0){ this.error.set('Plan name and price are required'); return; } this.isLoading.set(true); this.svc.create(this.newPlan).subscribe({next:plan=>{ this.plans.update(pl=>[...pl, plan]); this.newPlan={ name:'', price:0, max_profiles:1, max_devices:1, video_quality:'HD'}; this.isLoading.set(false); }, error:(e)=>{ this.error.set(e.error?.detail || 'Failed to create plan'); this.isLoading.set(false);} }); }
  remove(id:string){ if(!confirm('Are you sure you want to delete this plan?')) return; this.svc.delete(id).subscribe({ next:()=> this.plans.update(pl=> pl.filter(p=> p.id!==id)), error:()=> this.error.set('Failed to delete plan') }); }
  fmt(amount: string|number, currency='USD'){ return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(typeof amount==='string'? parseFloat(amount): amount); }
}