import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionsService } from '../../../../core/services/subscriptions.service';
import type { Subscription } from '../../../../models/subscription.model';

@Component({ selector:'app-subscriptions-tab', standalone:true, imports:[CommonModule], templateUrl:'./subscriptions-tab.html' })
export class SubscriptionsTabComponent implements OnInit {
  isLoading = signal(false); error = signal<string|null>(null); subscriptions = signal<Subscription[]>([]);
  constructor(private svc: SubscriptionsService){}
  ngOnInit(){ this.load(); }
  load(){ this.isLoading.set(true); this.svc.list().subscribe({next:s=>{this.subscriptions.set(s); this.isLoading.set(false);}, error:()=>{this.error.set('Failed to load subscriptions'); this.isLoading.set(false);} }); }
  cancel(id:string){ if(!confirm('Are you sure you want to cancel this subscription?')) return; this.svc.cancel(id).subscribe({ next: up => this.subscriptions.update(list => list.map(s => s.id===up.id? up : s)), error:()=> this.error.set('Failed to cancel subscription') }); }
  fmt(d:string) { return new Date(d).toLocaleDateString(); }
}