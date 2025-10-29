import { Component, inject, signal, OnInit } from '@angular/core';
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

  async ngOnInit() {
    await this.loadUsers();
    await this.loadPlans();
    await this.loadSubscriptions();
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
      const plans = (await this.plansService.list({}).toPromise()) as
        | PlanList[]
        | undefined;
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
      status: SubscriptionStatus.ACTIVE, // backend defaults to ACTIVE if omitted; keeping explicit
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
    this.error.set(null);

    try {
      await this.subscriptionsService.create(this.newSubscription()).toPromise();
      this.newSubscription.set(this.getDefaultSubscription());
      this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to create subscription');
    }
  }

  openEdit(subscription: SubscriptionListItem) {
    this.editing.set({ ...subscription });
    this.editOpen.set(true);
  }

  async saveEdits() {
    if (!this.editing()) return;

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
      this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to update subscription');
    }
  }

  async cancelSubscription(id: string) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    this.error.set(null);

    try {
      await this.subscriptionsService.cancel(id).toPromise();
      this.loadSubscriptions();
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to cancel subscription');
    }
  }

  async reactivateSubscription(id: string) {
    this.error.set(null);

    try {
      await this.subscriptionsService.reactivate(id).toPromise();
      this.loadSubscriptions();
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
        return 'text-green-400';
      case SubscriptionStatus.CANCELED:
        return 'text-red-400';
      case SubscriptionStatus.PAST_DUE:
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  }

  getUserName(userId: string): string {
    const user = this.users().find((u) => u.id === userId);
    return user ? user.name || user.email : userId;
  }

  getPlanName(planId: string): string {
    const plan: PlanList | undefined = this.plans().find((p) => p.id === planId);
    return plan ? plan.name : planId;
  }
}
