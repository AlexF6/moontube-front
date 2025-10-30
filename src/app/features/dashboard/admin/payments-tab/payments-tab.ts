import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
  isCreating = signal(false);
  isUpdating = signal(false);
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

  // Computed values
  paidCount = computed(() => 
    this.items().filter(item => item.status === PaymentStatus.PAID).length
  );
  pendingCount = computed(() => 
    this.items().filter(item => item.status === PaymentStatus.PENDING).length
  );
  failedCount = computed(() => 
    this.items().filter(item => item.status === PaymentStatus.FAILED).length
  );
  refundedCount = computed(() => 
    this.items().filter(item => item.status === PaymentStatus.REFUNDED).length
  );
  totalAmount = computed(() => 
    this.items().reduce((sum, payment) => sum + payment.amount, 0)
  );

  async ngOnInit() {
    await Promise.all([
      this.loadUsers(),
      this.loadSubscriptions(),
      this.loadPayments()
    ]);
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
    if (!this.newPayment().user_id || !this.newPayment().subscription_id || !this.newPayment().amount || !this.newPayment().currency) return;

    this.isCreating.set(true);
    this.error.set(null);
    
    try {
      await this.paymentsService.create(this.newPayment()).toPromise();
      this.newPayment.set(this.getDefaultPayment());
      await this.loadPayments();
    } catch (err: any) {
      this.error.set(err.error?.detail || 'Failed to create payment');
    } finally {
      this.isCreating.set(false);
    }
  }

  openEdit(payment: Payment) {
    this.editing.set({ ...payment });
    this.editOpen.set(true);
  }

  async saveEdits() {
    if (!this.editing()) return;

    this.isUpdating.set(true);
    this.error.set(null);

    try {
      const updateData: PaymentUpdate = {
        amount: this.editing()!.amount,                 
        currency: this.editing()!.currency,
        status: this.editing()!.status,
        provider: this.editing()!.provider ?? undefined,
        external_id: this.editing()!.external_id ?? undefined,
        paid_at: this.editing()!.paid_at
      };

      await this.paymentsService.update(this.editing()!.id, updateData).toPromise();
      this.editOpen.set(false);
      this.editing.set(null);
      await this.loadPayments();
    } catch (err: any) {
      this.error.set(err.error?.detail || 'Failed to update payment');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async deletePayment(id: string) {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;

    this.error.set(null);
    
    try {
      await this.paymentsService.delete(id).toPromise();
      await this.loadPayments();
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

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case PaymentStatus.PENDING: return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case PaymentStatus.FAILED: return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case PaymentStatus.REFUNDED: return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  }

  getStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return '✓';
      case PaymentStatus.PENDING: return '⏱';
      case PaymentStatus.FAILED: return '✕';
      case PaymentStatus.REFUNDED: return '↩';
      default: return '?';
    }
  }

  getUserName(userId: string): string {
    const user = this.users().find(u => u.id === userId);
    return user ? (user.name || user.email) : 'Unknown User';
  }

  getSubscriptionInfo(subscriptionId: string): string {
    const subscription = this.subscriptions().find(s => s.id === subscriptionId);
    return subscription ? `${subscription.id.slice(0, 8)}...` : subscriptionId;
  }

  getUserSubscriptions(userId: string): Subscription[] {
    if (!userId) return this.subscriptions();
    return this.subscriptions().filter(s => s.user_id === userId);
  }

  onUserChange(userId: string) {
    // When user changes, reset subscription selection
    this.newPayment().subscription_id = '';
  }
}