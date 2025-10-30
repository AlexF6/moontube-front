import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SubscriptionsService } from '../../../../core/services/subscriptions.service';
import { UsersService } from '../../../../core/services/users.service';
import { PlansService } from '../../../../core/services/plans.service';
import {
  Subscription,
  SubscriptionListItem,
  SubscriptionCreateAdmin,
  SubscriptionUpdateAdmin,
  SubscriptionQuery,
  SubscriptionStatus,
} from '../../../../models/subscription.model';
import type { User } from '../../../../models/user.model';
import type { PlanList } from '../../../../models/plan.model';

@Component({
  selector: 'app-subscriptions-tab',
  templateUrl: './subscriptions-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SubscriptionsTabComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);
  private usersService = inject(UsersService);
  private plansService = inject(PlansService);

  // State
  items = signal<SubscriptionListItem[]>([]);
  total = signal(0);
  isLoading = signal(false);
  isCreating = signal(false);
  isUpdating = signal(false);
  error = signal<string | null>(null);

  // Dropdown data
  users = signal<User[]>([]);
  plans = signal<PlanList[]>([]);

  // Forms
  newSubscription = signal<SubscriptionCreateAdmin>(this.getDefaultSubscription());
  editing = signal<SubscriptionListItem | null>(null);
  editOpen = signal(false);

  // Filters
  query = signal<SubscriptionQuery>({
    user_id: null,
    plan_id: null,
    status_q: null,
    active_only: false,
    start_from: null,
    start_to: null,
    limit: 50,
    offset: 0,
    order_by: 'created_at',
    order_dir: 'desc',
  });

  // Computed values
  activeCount = computed(() => 
    this.items().filter(item => item.status === SubscriptionStatus.ACTIVE).length
  );
  canceledCount = computed(() => 
    this.items().filter(item => item.status === SubscriptionStatus.CANCELED).length
  );
  pastDueCount = computed(() => 
    this.items().filter(item => item.status === SubscriptionStatus.PAST_DUE).length
  );

  async ngOnInit() {
    await Promise.all([
      this.loadUsers(),
      this.loadPlans(),
      this.loadSubscriptions()
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

  private async loadPlans() {
    try {
      const plans = (await this.plansService.list({}).toPromise()) as PlanList[] | undefined;
      this.plans.set(plans || []);
    } catch (err: any) {
      this.error.set('Failed to load plans');
    }
  }

  private getDefaultSubscription(): SubscriptionCreateAdmin {
    const today = new Date().toISOString().split('T')[0];
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const endDate = oneMonthLater.toISOString().split('T')[0];

    return {
      user_id: '',
      plan_id: '',
      status: SubscriptionStatus.ACTIVE,
      start_date: today,
      end_date: endDate,
      renews_at: endDate,
    };
  }

  async loadSubscriptions() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const subscriptions = await this.subscriptionsService.list(this.query()).toPromise();
      this.items.set(subscriptions || []);
      this.total.set(subscriptions?.length || 0);
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to load subscriptions');
    } finally {
      this.isLoading.set(false);
    }
  }

  async create() {
    if (!this.newSubscription().user_id || !this.newSubscription().plan_id) return;

    this.isCreating.set(true);
    this.error.set(null);

    try {
      await this.subscriptionsService.create(this.newSubscription()).toPromise();
      this.newSubscription.set(this.getDefaultSubscription());
      await this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to create subscription');
    } finally {
      this.isCreating.set(false);
    }
  }

  openEdit(subscription: SubscriptionListItem) {
    this.editing.set({ ...subscription });
    this.editOpen.set(true);
  }

  async saveEdits() {
    if (!this.editing()) return;

    this.isUpdating.set(true);
    this.error.set(null);

    try {
      const updateData: SubscriptionUpdateAdmin = {
        plan_id: this.editing()!.plan_id,
        status: this.editing()!.status,
        end_date: this.editing()!.end_date ?? null,
        renews_at: this.editing()!.renews_at ?? null,
        canceled_at: this.editing()!.canceled_at ?? null,
      };

      await this.subscriptionsService
        .update(this.editing()!.id, updateData)
        .toPromise();
      this.editOpen.set(false);
      this.editing.set(null);
      await this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to update subscription');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async cancelSubscription(id: string) {
    if (!confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) return;

    this.error.set(null);

    try {
      await this.subscriptionsService.cancel(id).toPromise();
      await this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to cancel subscription');
    }
  }

  async reactivateSubscription(id: string) {
    this.error.set(null);

    try {
      await this.subscriptionsService.reactivate(id).toPromise();
      await this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to reactivate subscription');
    }
  }

  applyFilters() {
    this.query().offset = 0;
    this.loadSubscriptions();
  }

  resetFilters() {
    this.query.set({
      user_id: null,
      plan_id: null,
      status_q: null,
      active_only: false,
      start_from: null,
      start_to: null,
      limit: 50,
      offset: 0,
      order_by: 'created_at',
      order_dir: 'desc',
    });
    this.loadSubscriptions();
  }

  clearError() {
    this.error.set(null);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  isActive(subscription: SubscriptionListItem): boolean {
    return subscription.status === SubscriptionStatus.ACTIVE;
  }

  getStatusColor(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case SubscriptionStatus.CANCELED:
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case SubscriptionStatus.PAST_DUE:
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  }

  getStatusBadge(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return '● Active';
      case SubscriptionStatus.CANCELED:
        return '● Canceled';
      case SubscriptionStatus.PAST_DUE:
        return '● Past Due';
      default:
        return '● Unknown';
    }
  }

  getUserName(userId: string): string {
    const user = this.users().find((u) => u.id === userId);
    return user ? (user.name || user.email) : 'Unknown User';
  }

  getPlanName(planId: string): string {
    const plan = this.plans().find((p) => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  }

  getDaysUntilRenewal(renewsAt: string | null): string {
    if (!renewsAt) return '—';
    const renewDate = new Date(renewsAt);
    const today = new Date();
    const diffTime = renewDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `in ${diffDays} days`;
  }
}