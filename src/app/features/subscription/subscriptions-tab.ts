import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import { SubscriptionListItem, SubscriptionStatus } from '../../models/subscription.model';

@Component({
  selector: 'app-subscriptions-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriptions-tab.html'
})
export class SubscriptionsTabComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);

  subscriptions = signal<SubscriptionListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedStatus = signal<SubscriptionStatus | 'ALL'>('ALL');

  readonly statusOptions = [
    { value: 'ALL', label: 'All Subscriptions' },
    { value: SubscriptionStatus.ACTIVE, label: 'Active' },
    { value: SubscriptionStatus.CANCELED, label: 'Canceled' },
    { value: SubscriptionStatus.PAST_DUE, label: 'Past Due' }
  ] as const;

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  async loadSubscriptions(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const status =
        this.selectedStatus() === 'ALL'
          ? undefined
          : (this.selectedStatus() as SubscriptionStatus);

      const subscriptions = await this.subscriptionsService
        .getMySubscriptions(status)
        .toPromise();

      this.subscriptions.set(subscriptions || []);
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to load subscriptions');
      console.error('Error loading subscriptions:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value as SubscriptionStatus | 'ALL');
    this.loadSubscriptions();
  }

  async cancelSubscription(subscription: SubscriptionListItem): Promise<void> {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      await this.subscriptionsService.cancelMy(subscription.id).toPromise();
      this.loadSubscriptions(); // Refresh the list
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to cancel subscription');
      console.error('Error canceling subscription:', err);
    }
  }

  async reactivateSubscription(subscription: SubscriptionListItem): Promise<void> {
    if (!confirm('Are you sure you want to reactivate this subscription?')) return;

    try {
      await this.subscriptionsService.reactivateMy(subscription.id).toPromise();
      this.loadSubscriptions(); // Refresh the list
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to reactivate subscription');
      console.error('Error reactivating subscription:', err);
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  getStatusBadgeClass(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SubscriptionStatus.CANCELED:
        return 'bg-red-100 text-red-800';
      case SubscriptionStatus.PAST_DUE:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  isActive(s: SubscriptionListItem): boolean {
    return s.status === SubscriptionStatus.ACTIVE;
  }

  isCanceled(s: SubscriptionListItem): boolean {
    return s.status === SubscriptionStatus.CANCELED;
  }
}
