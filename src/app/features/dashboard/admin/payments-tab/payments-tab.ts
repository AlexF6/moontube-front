import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../../../core/services/payments.service';
import type { Payment } from '../../../../models/payment.model';

@Component({ selector:'app-payments-tab', standalone:true, imports:[CommonModule], templateUrl:'./payments-tab.html' })
export class PaymentsTabComponent implements OnInit {
  isLoading = signal(false); error = signal<string|null>(null); payments = signal<Payment[]>([]);
  constructor(private svc: PaymentsService){}
  ngOnInit(){ this.load(); }
  load(){ this.isLoading.set(true); this.svc.list().subscribe({ next:p=>{ this.payments.set(p); this.isLoading.set(false); }, error:()=>{ this.error.set('Failed to load payments'); this.isLoading.set(false);} }); }
  fmt(amount: string, currency='USD'){ return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(parseFloat(amount)); }
  fmtDate(d?: string | null){ return d ? new Date(d).toLocaleDateString() : 'N/A'; }
}