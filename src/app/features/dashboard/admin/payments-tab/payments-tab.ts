// src/app/features/dashboard/admin/payments-tab/payments-tab.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentsService } from '../../../../core/services/payments.service';
import { UsersService } from '../../../../core/services/users.service';
import { SubscriptionsService } from '../../../../core/services/subscriptions.service';
import {
  Payment,
  PaymentCreate,
  PaymentUpdate,
  PaymentQuery,
  PaymentStatus
} from '../../../../models/payment.model';
import type { User } from '../../../../models/user.model';
import type { Subscription } from '../../../../models/subscription.model';

@Component({
  selector: 'app-payments-tab',
  templateUrl: './payments-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PaymentsTabComponent implements OnInit {
  private paymentsService = inject(PaymentsService);
  private usersService = inject(UsersService);
  private subscriptionsService = inject(SubscriptionsService);

  // State
  items = signal<Payment[]>([]);
  total = signal(0);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Dropdown data
  users = signal<User[]>([]);
  subscriptions = signal<Subscription[]>([]);
  
  // Forms
  newPayment = signal<PaymentCreate>(this.getDefaultPayment());
  editing = signal<Payment | null>(null);
  editOpen = signal(false);
  
  // Filters
  query = signal<PaymentQuery>({
    user_id: null,
    subscription_id: null,
    status_q: null,
    provider: null,
    external_id: null,
    created_from: null,
    created_to: null,
    paid_from: null,
    paid_to: null,
    amount_min: null,
    amount_max: null,
    limit: 50,
    offset: 0,
    order_by: 'created_at',
    order_dir: 'desc'
  });

  async ngOnInit() {
    await this.loadUsers();
    await this.loadSubscriptions();
    await this.loadPayments();
  }

  private async loadUsers() {
    try {
      const users = await this.usersService.list().toPromise();
      this.users.set(users || []);
    } catch (err: any) {
      this.error.set('Failed to load users');
    }
  }

  private async loadSubscriptions() {
    try {
      const subscriptions = await this.subscriptionsService.list({ limit: 1000 }).toPromise();
      this.subscriptions.set(subscriptions || []);
    } catch (err: any) {
      this.error.set('Failed to load subscriptions');
    }
  }

  private getDefaultPayment(): PaymentCreate {
    return {
      user_id: '',
      subscription_id: '',
      amount: 0,
      currency: 'USD',
      status: PaymentStatus.PENDING,
      provider: '',
      external_id: '',
      paid_at: null
    };
  }

  async loadPayments() {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const payments = await this.paymentsService.list(this.query()).toPromise();
      this.items.set(payments || []);
      this.total.set(payments?.length || 0);
    } catch (err: any) {
      this.error.set(err.error?.detail || 'Failed to load payments');
    } finally {
      this.isLoading.set(false);
    }
  }

  async create() {
    this.error.set(null);
    
    try {
      await this.paymentsService.create(this.newPayment()).toPromise();
      this.newPayment.set(this.getDefaultPayment());
      this.loadPayments();
    } catch (err: any) {
      this.error.set(err.error?.detail || 'Failed to create payment');
    }
  }

  openEdit(payment: Payment) {
    this.editing.set({ ...payment });
    this.editOpen.set(true);
  }

  async saveEdits() {
    if (!this.editing()) return;

    this.error.set(null);
    
    try {
      const updateData: PaymentUpdate = {
        amount: parseFloat(this.editing()!.amount),
        currency: this.editing()!.currency,
        status: this.editing()!.status,
        provider: this.editing()!.provider,
        external_id: this.editing()!.external_id,
        paid_at: this.editing()!.paid_at
      };

      await this.paymentsService.update(this.editing()!.id, updateData).toPromise();
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadPayments();
    } catch (err: any) {
      this.error.set(err.error?.detail || 'Failed to update payment');
    }
  }

  async deletePayment(id: string) {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;

    this.error.set(null);
    
    try {
      await this.paymentsService.delete(id).toPromise();
      this.loadPayments();
    } catch (err: any) {
      this.error.set(err.error?.detail || 'Failed to delete payment');
    }
  }

  applyFilters() {
    this.query().offset = 0;
    this.loadPayments();
  }

  resetFilters() {
    this.query.set({
      user_id: null,
      subscription_id: null,
      status_q: null,
      provider: null,
      external_id: null,
      created_from: null,
      created_to: null,
      paid_from: null,
      paid_to: null,
      amount_min: null,
      amount_max: null,
      limit: 50,
      offset: 0,
      order_by: 'created_at',
      order_dir: 'desc'
    });
    this.loadPayments();
  }

  clearError() {
    this.error.set(null);
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'text-green-400';
      case PaymentStatus.PENDING: return 'text-yellow-400';
      case PaymentStatus.FAILED: return 'text-red-400';
      case PaymentStatus.REFUNDED: return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }

  getUserName(userId: string): string {
    const user = this.users().find(u => u.id === userId);
    return user ? (user.name || user.email) : userId;
  }

  getSubscriptionInfo(subscriptionId: string): string {
    const subscription = this.subscriptions().find(s => s.id === subscriptionId);
    return subscription ? `${subscription.id.slice(0, 8)}...` : subscriptionId;
  }

  onUserChange(userId: string) {
    // When user changes, filter subscriptions for that user
    if (userId) {
      this.newPayment().subscription_id = '';
    }
  }
}