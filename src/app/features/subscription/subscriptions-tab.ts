// src/app/features/subscription/subscriptions-tab.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import { SubscriptionListItem, SubscriptionStatus } from '../../models/subscription.model';
import { PlansService } from '../../core/services/plans.service';
import { PlanList } from '../../models/plan.model';
import { firstValueFrom } from 'rxjs';

type SubGroup = {
  planId: string;
  current: SubscriptionListItem | null;   // suscripción más reciente de ese plan
  history: SubscriptionListItem[];        // resto (canceladas/anteriores)
};

@Component({
  selector: 'app-subscriptions-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriptions-tab.html'
})
export class SubscriptionsTabComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);
  private plansService = inject(PlansService);

  plans = signal<PlanList[]>([]);
  planById = computed(() => {
    const map = new Map<string, PlanList>();
    for (const p of this.plans()) map.set(p.id, p);
    return map;
  });

  subscriptions = signal<SubscriptionListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedStatus = signal<SubscriptionStatus | 'ALL'>('ALL');
  processingAction = signal<string | null>(null);

  // === NUEVO: Agrupación por plan ===
  groupedByPlan = computed<SubGroup[]>(() => {
    const src = this.subscriptions();
    const byPlan = new Map<string, SubscriptionListItem[]>();

    for (const s of src) {
      const arr = byPlan.get(s.plan_id) ?? [];
      arr.push(s);
      byPlan.set(s.plan_id, arr);
    }

    const groups: SubGroup[] = [];
    for (const [planId, list] of byPlan) {
      // Ordena por start_date (más reciente primero). Ajusta si usas created_at.
      list.sort((a, b) => {
        const ta = new Date(a.start_date ?? 0).getTime();
        const tb = new Date(b.start_date ?? 0).getTime();
        return tb - ta;
      });

      groups.push({
        planId,
        current: list[0] ?? null,
        history: list.slice(1)
      });
    }

    // Orden opcional por nombre de plan
    return groups.sort((a, b) => this.planName(a.planId).localeCompare(this.planName(b.planId)));
  });

  readonly statusOptions = [
    { value: 'ALL', label: 'All Subscriptions' },
    { value: SubscriptionStatus.ACTIVE, label: 'Active' },
    { value: SubscriptionStatus.CANCELED, label: 'Canceled' },
    { value: SubscriptionStatus.PAST_DUE, label: 'Past Due' }
  ] as const;

  async ngOnInit(): Promise<void> {
    this.loadSubscriptions();
    try {
      const res = await firstValueFrom(this.plansService.listMe());
      this.plans.set(res);
    } catch (err) {
      console.error('Error loading plans:', err);
      this.error.set('Failed to load plans');
    }
  }

  planName = (id: string) => this.planById().get(id)?.name ?? id.slice(-8);

  async loadSubscriptions(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const status =
        this.selectedStatus() === 'ALL'
          ? undefined
          : (this.selectedStatus() as SubscriptionStatus);

      const subscriptions = await firstValueFrom(this.subscriptionsService.getMySubscriptions(status));
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
    if (!confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) return;

    this.processingAction.set(`cancel-${subscription.id}`);
    try {
      await firstValueFrom(this.subscriptionsService.cancelMy(subscription.id));
      this.loadSubscriptions(); // Refresh the list
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to cancel subscription');
      console.error('Error canceling subscription:', err);
    } finally {
      this.processingAction.set(null);
    }
  }

  async reactivateSubscription(subscription: SubscriptionListItem): Promise<void> {
    if (!confirm('Are you sure you want to reactivate this subscription?')) return;

    this.processingAction.set(`reactivate-${subscription.id}`);
    try {
      await firstValueFrom(this.subscriptionsService.reactivateMy(subscription.id));
      this.loadSubscriptions(); // Refresh the list
    } catch (err: any) {
      this.error.set(err?.error?.detail || 'Failed to reactivate subscription');
      console.error('Error reactivating subscription:', err);
    } finally {
      this.processingAction.set(null);
    }
  }

  // === NUEVO: helper para validar si ya hay una activa en el plan ===
  hasActiveForPlan = (planId: string) =>
    this.subscriptions().some(s => s.plan_id === planId && s.status === SubscriptionStatus.ACTIVE);

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
  }

  getStatusBadgeClass(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case SubscriptionStatus.CANCELED:
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case SubscriptionStatus.PAST_DUE:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  }

  isActive(s: SubscriptionListItem): boolean {
    return s.status === SubscriptionStatus.ACTIVE;
  }

  isCanceled(s: SubscriptionListItem): boolean {
    return s.status === SubscriptionStatus.CANCELED;
  }

  isProcessing(subscriptionId: string, action: string): boolean {
    return this.processingAction() === `${action}-${subscriptionId}`;
  }
}
