import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from '../../../../core/services/payments.service';
import { Payment, PaymentStatus } from '../../../../models/payment.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payments-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments-tab.html'
})
export class PaymentsTabComponent implements OnInit {
  private paymentsService = inject(PaymentsService);
  public readonly PaymentStatus = PaymentStatus;

  payments = signal<Payment[]>([]);
  total = signal(0);
  hasMore = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedStatus = signal<PaymentStatus | 'ALL'>('ALL');

  readonly statusOptions = [
    { value: 'ALL', label: 'All Payments' },
    { value: PaymentStatus.PENDING, label: 'Pending' },
    { value: PaymentStatus.PAID, label: 'Paid' },
    { value: PaymentStatus.FAILED, label: 'Failed' },
    { value: PaymentStatus.REFUNDED, label: 'Refunded' }
  ];

  ngOnInit(): void {
    this.loadPayments();
  }

  async loadPayments(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const status = this.selectedStatus() === 'ALL' ? null : (this.selectedStatus() as PaymentStatus);
      const res = await firstValueFrom(
        this.paymentsService.listMine({ status_q: status, limit: 20, offset: 0 })
      );
      const normalized = (res.payments ?? []).map(p => ({ ...p, amount: Number(p.amount) }));
      this.payments.set(normalized);
      this.total.set(res.total ?? 0);
      this.hasMore.set(!!res.has_more);
    } catch (err) {
      this.error.set('Failed to load payment history');
      console.error('Error loading payments:', err);
    } finally {
      this.loading.set(false);
    }
  }

  shortId(v: unknown): string {
    return typeof v === 'string' && v.length >= 8 ? v.slice(-8) :
           typeof v === 'string' ? v : '—';
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value as PaymentStatus | 'ALL');
    this.loadPayments();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount ?? 0);
  }

  getStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-green-100 text-green-800';
      case PaymentStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.FAILED: return 'bg-red-100 text-red-800';
      case PaymentStatus.REFUNDED: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return '✓';
      case PaymentStatus.PENDING: return '⏳';
      case PaymentStatus.FAILED: return '✗';
      case PaymentStatus.REFUNDED: return '↩';
      default: return '•';
    }
  }

  hasProvider(payment: Payment): boolean {
    return !!payment.provider?.trim();
  }

  hasExternalId(payment: Payment): boolean {
    return !!payment.external_id?.trim();
  }
}
